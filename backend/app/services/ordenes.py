"""Reglas de las órdenes. Un solo dueño para: cuánto cuesta, qué estados existen y qué
transiciones se permiten. Las rutas del cliente, del admin y de Mercado Pago pasan por aquí.
"""

import math

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos import Orden, OrdenEvento, OrdenLinea, Producto, Usuario
from app.services import ajustes

ESTADOS = ("pendiente_pago", "pagada", "preparando", "enviada", "entregada", "cancelada")

# estado actual → estados a los que puede pasar
TRANSICIONES: dict[str, tuple[str, ...]] = {
    "pendiente_pago": ("pagada", "cancelada"),
    "pagada": ("preparando", "enviada", "cancelada"),
    "preparando": ("enviada", "cancelada"),
    "enviada": ("entregada",),
    "entregada": (),
    "cancelada": (),
}

COMPRABLES = ("publicado",)
MAX_CANTIDAD = 20


class ErrorOrden(HTTPException):
    def __init__(self, detalle: str):
        super().__init__(status.HTTP_422_UNPROCESSABLE_CONTENT, detalle)


MONEDAS = ("MXN", "USD")


def convertir(pesos: int, tipo_cambio: float | None) -> int:
    """Pesos → moneda de la orden. Sin tipo de cambio son pesos; en dólares, enteros redondeados
    hacia arriba (el frontend usa la misma regla solo para mostrar: el precio lo decide aquí)."""
    if tipo_cambio is None:
        return pesos
    return math.ceil(round(pesos / tipo_cambio, 6))


async def cotizar(
    db: AsyncSession, items: list[tuple[int, int]], moneda: str = "MXN"
) -> tuple[list[OrdenLinea], int, int, float | None]:
    """Precio decidido por el SERVIDOR desde ids y cantidades, en la moneda pedida.
    Devuelve (líneas, subtotal, envío, tipo de cambio usado)."""
    if not items:
        raise ErrorOrden("Tu carrito está vacío.")
    a = await ajustes.leer_todos(db)
    tc = None
    if moneda == "USD":
        tc = ajustes.tipo_cambio(a["tipo_cambio_usd"])
        if tc is None:
            raise ErrorOrden("Por ahora no recibimos pagos en dólares. Elige pesos mexicanos.")
    elif moneda not in MONEDAS:
        raise ErrorOrden("Moneda no disponible.")
    cantidades: dict[int, int] = {}
    for producto_id, cantidad in items:
        if not 1 <= cantidad <= MAX_CANTIDAD:
            raise ErrorOrden(f"La cantidad de cada producto debe estar entre 1 y {MAX_CANTIDAD}.")
        cantidades[producto_id] = cantidades.get(producto_id, 0) + cantidad
    productos = {p.id: p for p in (await db.scalars(select(Producto).where(Producto.id.in_(cantidades)))).all()}
    lineas = []
    subtotal_pesos = 0
    for producto_id, cantidad in cantidades.items():
        p = productos.get(producto_id)
        if p is None or p.estado not in COMPRABLES:
            raise ErrorOrden("Uno de los productos de tu carrito ya no está disponible.")
        if p.precio is None:
            raise ErrorOrden(f"{p.nombre} se vende por WhatsApp: escríbenos para comprarlo.")
        imagen = p.fotos[0].archivo if p.fotos else None
        precio = convertir(p.precio, tc)
        lineas.append(OrdenLinea(producto_id=p.id, nombre=p.nombre, precio=precio, cantidad=cantidad, imagen=imagen))
        subtotal_pesos += p.precio * cantidad
    # El envío gratis se decide en pesos (como se configura en Ajustes), sea cual sea la moneda.
    gratis_desde = ajustes.entero(a["envio_gratis_desde"])
    if gratis_desde is not None and subtotal_pesos >= gratis_desde:
        envio_pesos = 0
    else:
        envio_pesos = max(0, ajustes.entero(a["envio_costo"], 0) or 0)
    subtotal = sum(lin.precio * lin.cantidad for lin in lineas)
    return lineas, subtotal, convertir(envio_pesos, tc), tc


async def crear(
    db: AsyncSession,
    usuario: Usuario,
    items: list[tuple[int, int]],
    direccion: dict,
    metodo_pago: str,
    notas: str,
    moneda: str = "MXN",
) -> Orden:
    lineas, subtotal, envio, tc = await cotizar(db, items, moneda)
    orden = Orden(
        numero="",
        usuario_id=usuario.id,
        email=usuario.email,
        direccion=direccion,
        notas=notas,
        subtotal=subtotal,
        envio=envio,
        total=subtotal + envio,
        moneda=moneda,
        tipo_cambio=tc,
        metodo_pago=metodo_pago,
        estado="pendiente_pago",
        lineas=lineas,
        eventos=[OrdenEvento(estado="pendiente_pago", nota="Orden creada", por="cliente")],
    )
    db.add(orden)
    await db.flush()  # asigna el id, del que sale el número legible
    orden.numero = f"SIN-{orden.id:06d}"
    await db.commit()
    await db.refresh(orden)
    return orden


def cambiar_estado(orden: Orden, nuevo: str, por: str, nota: str = "") -> None:
    """Valida la transición y deja el evento. Quien llama hace commit y avisa."""
    if nuevo == orden.estado:
        return
    if nuevo not in TRANSICIONES.get(orden.estado, ()):
        raise ErrorOrden(f"Una orden «{orden.estado}» no puede pasar a «{nuevo}».")
    if nuevo == "enviada" and not (orden.transportista and orden.guia):
        raise ErrorOrden("Para marcarla como enviada indica la paquetería y el número de guía.")
    orden.estado = nuevo
    orden.eventos.append(OrdenEvento(estado=nuevo, nota=nota, por=por))
