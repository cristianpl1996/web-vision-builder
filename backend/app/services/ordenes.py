"""Reglas de las órdenes. Un solo dueño para: cuánto cuesta, qué estados existen y qué
transiciones se permiten. Las rutas del cliente, del admin y de Mercado Pago pasan por aquí.
"""

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


async def costo_envio(db: AsyncSession, subtotal: int) -> int:
    a = await ajustes.leer_todos(db)
    gratis_desde = ajustes.entero(a["envio_gratis_desde"])
    if gratis_desde is not None and subtotal >= gratis_desde:
        return 0
    return max(0, ajustes.entero(a["envio_costo"], 0) or 0)


async def cotizar(db: AsyncSession, items: list[tuple[int, int]]) -> tuple[list[OrdenLinea], int, int]:
    """Precio decidido por el SERVIDOR desde ids y cantidades. Devuelve (líneas, subtotal, envío)."""
    if not items:
        raise ErrorOrden("Tu carrito está vacío.")
    cantidades: dict[int, int] = {}
    for producto_id, cantidad in items:
        if not 1 <= cantidad <= MAX_CANTIDAD:
            raise ErrorOrden(f"La cantidad de cada producto debe estar entre 1 y {MAX_CANTIDAD}.")
        cantidades[producto_id] = cantidades.get(producto_id, 0) + cantidad
    productos = {p.id: p for p in (await db.scalars(select(Producto).where(Producto.id.in_(cantidades)))).all()}
    lineas = []
    for producto_id, cantidad in cantidades.items():
        p = productos.get(producto_id)
        if p is None or p.estado not in COMPRABLES:
            raise ErrorOrden("Uno de los productos de tu carrito ya no está disponible.")
        if p.precio is None:
            raise ErrorOrden(f"{p.nombre} se vende por WhatsApp: escríbenos para comprarlo.")
        imagen = p.fotos[0].archivo if p.fotos else None
        lineas.append(OrdenLinea(producto_id=p.id, nombre=p.nombre, precio=p.precio, cantidad=cantidad, imagen=imagen))
    subtotal = sum(lin.precio * lin.cantidad for lin in lineas)
    return lineas, subtotal, await costo_envio(db, subtotal)


async def crear(
    db: AsyncSession, usuario: Usuario, items: list[tuple[int, int]], direccion: dict, metodo_pago: str, notas: str
) -> Orden:
    lineas, subtotal, envio = await cotizar(db, items)
    orden = Orden(
        numero="",
        usuario_id=usuario.id,
        email=usuario.email,
        direccion=direccion,
        notas=notas,
        subtotal=subtotal,
        envio=envio,
        total=subtotal + envio,
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
