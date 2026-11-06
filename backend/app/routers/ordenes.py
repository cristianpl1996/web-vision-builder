"""Órdenes del cliente y del panel (admin y superadmin). Las reglas viven en services/ordenes.py."""

import asyncio
import logging
import secrets
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select

from app import schemas
from app.config import settings
from app.modelos import Orden, OrdenEvento, Usuario
from app.seguridad import Actual, Admin, Db
from app.services import ajustes, archivos, avisos, mercadopago, ordenes

log = logging.getLogger(__name__)
router = APIRouter(tags=["ordenes"])


@router.get("/tienda", response_model=schemas.TiendaConfig)
async def config_tienda(db: Db):
    """Lo que la tienda necesita saber: formas de pago activas, envío y monedas."""
    a = await ajustes.leer_todos(db)
    formas = ajustes.formas_de_pago(a)
    # Dólares solo si hay con qué cobrarlos (transferencia, o Mercado Pago que acepte USD).
    usd = formas["transferencia"] or formas["mercadopago_usd"]
    return schemas.TiendaConfig(
        mercadopago=formas["mercadopago"],
        mercadopagoUsd=formas["mercadopago_usd"],
        transferencia=formas["transferencia"],
        transferInfo=a["transferencia_datos"] if formas["transferencia"] else "",
        shippingCost=max(0, ajustes.entero(a["envio_costo"], 0) or 0),
        freeShippingFrom=ajustes.entero(a["envio_gratis_desde"]),
        usdRate=ajustes.tipo_cambio(a["tipo_cambio_usd"]) if usd else None,
    )


def _metodo_disponible(a: dict[str, str], metodo: str, moneda: str) -> None:
    formas = ajustes.formas_de_pago(a)
    if metodo == "transferencia":
        if not formas["transferencia"]:
            raise HTTPException(status.HTTP_409_CONFLICT, "El pago por transferencia no está disponible.")
        return
    if not formas["mercadopago"]:
        raise HTTPException(status.HTTP_409_CONFLICT, "El pago con Mercado Pago no está disponible en este momento.")
    if moneda == "USD" and not formas["mercadopago_usd"]:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Mercado Pago no recibe pagos en dólares en esta tienda. Paga en pesos o por transferencia.",
        )


async def _orden_del_cliente(db, orden_id: int, u: Usuario) -> Orden:
    o = await db.get(Orden, orden_id)
    # 404 y no 403: no se revela que la orden existe si no es tuya.
    if o is None or o.usuario_id != u.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontramos este pedido.")
    return o


@router.post("/ordenes", response_model=schemas.OrdenCreada, status_code=201)
async def crear(datos: schemas.OrdenIn, u: Actual, db: Db, tareas: BackgroundTasks):
    a = await ajustes.leer_todos(db)
    _metodo_disponible(a, datos.paymentMethod, datos.currency)
    orden = await ordenes.crear(
        db,
        u,
        [(i.productId, i.quantity) for i in datos.items],
        datos.address.model_dump(),
        datos.paymentMethod,
        datos.notes.strip(),
        datos.currency,
    )
    if orden.metodo_pago == "mercadopago":
        try:
            orden.pago_url = await mercadopago.crear_preferencia(a["mp_access_token"], orden)
            await db.commit()
        except mercadopago.MercadoPagoError as e:
            # La orden queda creada y pendiente: el cliente puede reintentar el pago desde su pedido.
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from None
    tareas.add_task(avisos.orden_creada, orden)
    return schemas.OrdenCreada(order=schemas.OrdenOut.de(orden), paymentUrl=orden.pago_url)


@router.get("/ordenes", response_model=list[schemas.OrdenOut])
async def mis_ordenes(u: Actual, db: Db):
    q = select(Orden).where(Orden.usuario_id == u.id).order_by(Orden.creado_en.desc())
    return [schemas.OrdenOut.de(o) for o in (await db.scalars(q)).all()]


@router.get("/ordenes/{orden_id}", response_model=schemas.OrdenOut)
async def mi_orden(orden_id: int, u: Actual, db: Db):
    return schemas.OrdenOut.de(await _orden_del_cliente(db, orden_id, u))


@router.post("/ordenes/{orden_id}/pago", response_model=schemas.OrdenCreada)
async def reintentar_pago(orden_id: int, u: Actual, db: Db):
    """Genera de nuevo el enlace de Mercado Pago de una orden que sigue pendiente."""
    o = await _orden_del_cliente(db, orden_id, u)
    if o.estado != "pendiente_pago":
        raise HTTPException(status.HTTP_409_CONFLICT, "Este pedido ya no está pendiente de pago.")
    a = await ajustes.leer_todos(db)
    _metodo_disponible(a, "mercadopago", o.moneda)
    try:
        o.pago_url = await mercadopago.crear_preferencia(a["mp_access_token"], o)
    except mercadopago.MercadoPagoError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from None
    o.metodo_pago = "mercadopago"
    await db.commit()
    return schemas.OrdenCreada(order=schemas.OrdenOut.de(o), paymentUrl=o.pago_url)


@router.post("/ordenes/{orden_id}/verificar-pago", response_model=schemas.OrdenOut)
async def verificar_pago(orden_id: int, u: Actual, db: Db, tareas: BackgroundTasks):
    """Al volver de Mercado Pago: consulta la API de MP (no confía en los parámetros de la URL)."""
    o = await _orden_del_cliente(db, orden_id, u)
    token = (await ajustes.leer_todos(db))["mp_access_token"]
    if o.estado == "pendiente_pago" and token:
        try:
            for pago in await mercadopago.buscar_pagos_de_orden(token, o.id):
                pagada = await mercadopago.aplicar_pago(db, pago)
                if pagada:
                    tareas.add_task(avisos.orden_pagada, pagada)
        except mercadopago.MercadoPagoError:
            log.exception("No se pudo verificar el pago de la orden %s", o.id)
        await db.refresh(o)
    return schemas.OrdenOut.de(o)


MAX_COMPROBANTE = 8 * 1024 * 1024


def _entregar_comprobante(o: Orden) -> FileResponse:
    if not o.comprobante:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Este pedido no tiene comprobante.")
    ruta = Path(settings.comprobantes_dir) / o.comprobante
    if not ruta.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontramos el archivo del comprobante.")
    ext = o.comprobante.rsplit(".", 1)[-1]
    return FileResponse(ruta, media_type=archivos.TIPOS[ext], filename=f"comprobante-{o.numero}.{ext}")


@router.post("/ordenes/{orden_id}/comprobante", response_model=schemas.OrdenOut)
async def subir_comprobante(orden_id: int, archivo: UploadFile, u: Actual, db: Db, tareas: BackgroundTasks):
    """Pago por transferencia: el cliente sube su comprobante y el panel lo revisa y marca «pagada».
    Sirve también para cambiar a transferencia un pedido que iba a pagarse con Mercado Pago."""
    o = await _orden_del_cliente(db, orden_id, u)
    if o.estado != "pendiente_pago":
        raise HTTPException(status.HTTP_409_CONFLICT, "Este pedido ya no está pendiente de pago.")
    _metodo_disponible(await ajustes.leer_todos(db), "transferencia", o.moneda)
    contenido = await archivo.read(MAX_COMPROBANTE + 1)
    if len(contenido) > MAX_COMPROBANTE:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "El comprobante pesa más de 8 MB.")
    ext = archivos.tipo_comprobante(contenido[:16])
    if ext is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Sube una foto (JPG, PNG o WebP) o un PDF.")
    anterior = o.comprobante
    o.comprobante = f"{o.numero}-{secrets.token_hex(8)}.{ext}"
    await asyncio.to_thread(archivos.guardar, settings.comprobantes_dir, o.comprobante, contenido)
    o.comprobante_en = datetime.now(UTC)
    o.metodo_pago = "transferencia"
    o.eventos.append(OrdenEvento(estado=o.estado, nota="Comprobante de pago enviado", por="cliente"))
    await db.commit()
    await asyncio.to_thread(archivos.borrar, settings.comprobantes_dir, anterior)
    tareas.add_task(avisos.comprobante_recibido, o)
    return schemas.OrdenOut.de(o)


@router.get("/ordenes/{orden_id}/comprobante")
async def ver_mi_comprobante(orden_id: int, u: Actual, db: Db):
    return _entregar_comprobante(await _orden_del_cliente(db, orden_id, u))


# ── Administración ──────────────────────────────────────────────────────────


@router.get("/admin/ordenes", response_model=schemas.PaginaOrdenes)
async def admin_listar(
    _: Admin,
    db: Db,
    estado: str | None = None,
    buscar: str | None = Query(default=None, max_length=100),
    desde: date | None = None,
    hasta: date | None = None,
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=25, ge=1, le=100),
):
    q = select(Orden)
    if estado:
        q = q.where(Orden.estado == estado)
    if buscar:
        patron = f"%{buscar.strip()}%"
        q = q.join(Usuario).where(
            or_(Orden.numero.ilike(patron), Orden.email.ilike(patron), Usuario.nombre.ilike(patron))
        )
    if desde:
        q = q.where(Orden.creado_en >= datetime.combine(desde, time.min))
    if hasta:
        q = q.where(Orden.creado_en < datetime.combine(hasta + timedelta(days=1), time.min))
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    filas = await db.scalars(q.order_by(Orden.creado_en.desc()).offset((pagina - 1) * por_pagina).limit(por_pagina))
    return schemas.PaginaOrdenes(items=[schemas.OrdenOut.de(o) for o in filas.all()], total=total or 0)


@router.get("/admin/ordenes/{orden_id}", response_model=schemas.OrdenOut)
async def admin_detalle(orden_id: int, _: Admin, db: Db):
    o = await db.get(Orden, orden_id)
    if o is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada.")
    return schemas.OrdenOut.de(o)


@router.patch("/admin/ordenes/{orden_id}/estado", response_model=schemas.OrdenOut)
async def admin_cambiar_estado(
    orden_id: int, cambio: schemas.CambioEstado, admin: Admin, db: Db, tareas: BackgroundTasks
):
    o = await db.get(Orden, orden_id)
    if o is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada.")
    if cambio.carrier is not None:
        o.transportista = cambio.carrier.strip() or None
    if cambio.tracking is not None:
        o.guia = cambio.tracking.strip() or None
    anterior = o.estado
    ordenes.cambiar_estado(o, cambio.status, por=f"admin:{admin.email}", nota=cambio.note.strip())
    await db.commit()
    if o.estado != anterior and (aviso := avisos.POR_ESTADO.get(o.estado)):
        tareas.add_task(aviso, o)
    return schemas.OrdenOut.de(o)


@router.get("/admin/ordenes/{orden_id}/comprobante")
async def admin_comprobante(orden_id: int, _: Admin, db: Db):
    o = await db.get(Orden, orden_id)
    if o is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada.")
    return _entregar_comprobante(o)
