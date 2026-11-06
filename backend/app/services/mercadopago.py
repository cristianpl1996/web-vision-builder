"""Mercado Pago, Checkout Pro.

Flujo: la orden crea una «preferencia» y el cliente paga en el checkout de MP. El pago
se confirma por DOS caminos que terminan en `aplicar_pago` (idempotente):
  1. el webhook firmado que MP manda a `/v1/pagos/webhook/mercadopago`;
  2. al volver a la tienda, `buscar_pagos_de_orden` (sirve aunque MP no alcance el webhook,
     p. ej. en localhost).
En los dos casos el pago se LEE de la API de MP con el Access Token: nunca se confía en lo
que diga el navegador ni el cuerpo del webhook. Además se exige monto y moneda exactos (los de la orden: MXN o USD).
"""

import hashlib
import hmac
import logging

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.modelos import Orden, OrdenEvento, Pago
from app.services import avisos, ordenes

log = logging.getLogger(__name__)
API = "https://api.mercadopago.com"


class MercadoPagoError(Exception):
    pass


def _cabeceras(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


async def crear_preferencia(access_token: str, orden: Orden) -> str:
    """Devuelve la URL del checkout de MP para esta orden."""
    items = [
        {
            "id": str(lin.producto_id or ""),
            "title": lin.nombre,
            "quantity": lin.cantidad,
            "unit_price": lin.precio,
            "currency_id": orden.moneda,
        }
        for lin in orden.lineas
    ]
    if orden.envio:
        items.append(
            {"id": "envio", "title": "Envío", "quantity": 1, "unit_price": orden.envio, "currency_id": orden.moneda}
        )
    base = settings.app_url.rstrip("/")
    cuerpo = {
        "items": items,
        "external_reference": str(orden.id),
        "payer": {"email": orden.email},
        "back_urls": {
            "success": f"{base}/pedido/{orden.id}?pago=aprobado",
            "pending": f"{base}/pedido/{orden.id}?pago=pendiente",
            "failure": f"{base}/pedido/{orden.id}?pago=rechazado",
        },
        "statement_descriptor": "SINERGIA",
        "metadata": {"orden": orden.numero},
    }
    # MP rechaza auto_return con back_urls que no son https (localhost).
    if base.startswith("https://"):
        cuerpo["auto_return"] = "approved"
    if settings.webhook_url_publica:
        cuerpo["notification_url"] = settings.webhook_url_publica.rstrip("/") + "/v1/pagos/webhook/mercadopago"
    async with httpx.AsyncClient(timeout=20) as cliente:
        r = await cliente.post(f"{API}/checkout/preferences", json=cuerpo, headers=_cabeceras(access_token))
    if r.status_code >= 300:
        log.error("Mercado Pago rechazó la preferencia de %s: %s %s", orden.numero, r.status_code, r.text[:500])
        raise MercadoPagoError("No pudimos iniciar el pago con Mercado Pago. Intenta de nuevo en un momento.")
    datos = r.json()
    # Con credenciales de prueba (TEST-...) se usa el checkout de pruebas.
    if access_token.startswith("TEST-") and datos.get("sandbox_init_point"):
        return datos["sandbox_init_point"]
    return datos["init_point"]


async def obtener_pago(access_token: str, pago_id: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as cliente:
        r = await cliente.get(f"{API}/v1/payments/{pago_id}", headers=_cabeceras(access_token))
    if r.status_code >= 300:
        raise MercadoPagoError(f"Mercado Pago no devolvió el pago {pago_id} ({r.status_code}).")
    return r.json()


async def buscar_pagos_de_orden(access_token: str, orden_id: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=20) as cliente:
        r = await cliente.get(
            f"{API}/v1/payments/search",
            params={"external_reference": str(orden_id), "sort": "date_created", "criteria": "desc"},
            headers=_cabeceras(access_token),
        )
    if r.status_code >= 300:
        raise MercadoPagoError(f"No se pudieron consultar los pagos de la orden {orden_id} ({r.status_code}).")
    return r.json().get("results", [])


def firma_valida(secreto: str, x_signature: str, x_request_id: str, data_id: str) -> bool:
    """Valida la cabecera `x-signature` de MP (`ts=...,v1=...`) según su documentación:
    HMAC-SHA256 de `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` con la clave secreta."""
    partes = dict(p.strip().split("=", 1) for p in (x_signature or "").split(",") if "=" in p)
    ts, v1 = partes.get("ts"), partes.get("v1")
    if not ts or not v1:
        return False
    data_id = data_id.lower() if data_id.isalnum() else data_id
    manifiesto = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    esperado = hmac.new(secreto.encode(), manifiesto.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(esperado, v1)


async def aplicar_pago(db: AsyncSession, pago: dict) -> Orden | None:
    """Registra el pago (una vez por id de MP) y, si está aprobado por el monto exacto, marca la
    orden como pagada. Devuelve la orden SOLO si en esta llamada pasó a pagada (para avisar)."""
    try:
        orden_id = int(pago.get("external_reference") or 0)
    except ValueError:
        return None
    orden = await db.get(Orden, orden_id)
    if orden is None:
        log.warning("Pago %s de MP con referencia desconocida %r", pago.get("id"), pago.get("external_reference"))
        return None

    externo_id = str(pago["id"])
    registro = await db.scalar(select(Pago).where(Pago.externo_id == externo_id))
    estado_mp = pago.get("status", "")
    monto = float(pago.get("transaction_amount") or 0)
    if registro is None:
        registro = Pago(
            orden_id=orden.id, proveedor="mercadopago", externo_id=externo_id, estado=estado_mp, monto=monto
        )
        db.add(registro)
    registro.estado = estado_mp
    registro.monto = monto
    registro.datos = {k: pago.get(k) for k in ("status", "status_detail", "payment_method_id", "date_approved")}

    paso_a_pagada = no_coincide = False
    if estado_mp == "approved" and orden.estado == "pendiente_pago":
        if pago.get("currency_id") == orden.moneda and abs(monto - orden.total) < 0.01:
            ordenes.cambiar_estado(orden, "pagada", por="mercadopago", nota=f"Pago {externo_id} aprobado")
            paso_a_pagada = True
        else:
            # Monto o moneda distintos: NO se marca pagada; queda en el historial y se avisa.
            no_coincide = True
            orden.eventos.append(
                OrdenEvento(
                    estado=orden.estado,
                    por="mercadopago",
                    nota=f"Pago {externo_id} aprobado por {monto} {pago.get('currency_id')}: no coincide con el total.",
                )
            )
    await db.commit()
    if no_coincide:
        await avisos.pago_no_coincide(orden, monto, str(pago.get("currency_id")))
    return orden if paso_a_pagada else None
