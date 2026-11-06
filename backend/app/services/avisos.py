"""Qué correo sale en cada momento. Se llaman como BackgroundTasks, después del commit."""

from html import escape

from app.config import settings
from app.db import SessionLocal
from app.modelos import Orden
from app.services import ajustes, correo


def _url(path: str) -> str:
    return settings.app_url.rstrip("/") + path


async def _correo_avisos() -> str:
    async with SessionLocal() as db:
        return (await ajustes.leer_todos(db))["correo_avisos"]


async def verificar_correo(email: str, nombre: str, token: str) -> None:
    await correo.enviar(
        email,
        "Confirma tu correo · SINERGIA",
        correo.plantilla(
            f"Hola, {nombre}",
            "<p>Gracias por crear tu cuenta. Confirma tu correo para recibir los avisos de tus pedidos.</p>"
            "<p style='color:#6b7b72;font-size:13px'>El enlace vence en 48 horas.</p>",
            ("Confirmar mi correo", _url(f"/verificar?token={token}")),
        ),
    )


async def restablecer_password(email: str, nombre: str, token: str) -> None:
    await correo.enviar(
        email,
        "Restablece tu contraseña · SINERGIA",
        correo.plantilla(
            f"Hola, {nombre}",
            "<p>Recibimos una solicitud para cambiar tu contraseña. Si no fuiste tú, ignora este correo.</p>"
            "<p style='color:#6b7b72;font-size:13px'>El enlace vence en 1 hora y sirve una sola vez.</p>",
            ("Crear una contraseña nueva", _url(f"/restablecer?token={token}")),
        ),
    )


METODOS = {"mercadopago": "Mercado Pago", "transferencia": "Transferencia"}


async def orden_creada(orden: Orden) -> None:
    if orden.metodo_pago == "mercadopago":
        pago = "<p>Para completar tu compra, termina el pago con Mercado Pago.</p>"
        boton = ("Pagar ahora", orden.pago_url) if orden.pago_url else ("Ver mi pedido", _url(f"/pedido/{orden.id}"))
    else:
        pago = (
            "<p>Para completar tu compra, haz la transferencia por el total y sube tu comprobante en tu pedido. "
            "En cuanto lo revisemos, te confirmamos el pago.</p>"
        )
        boton = ("Ver datos de pago y subir comprobante", _url(f"/pedido/{orden.id}"))
    await correo.enviar(
        orden.email,
        f"Recibimos tu pedido {orden.numero}",
        correo.plantilla(f"Pedido {orden.numero}", pago + correo.resumen_orden(orden), boton),
    )
    await correo.enviar(
        await _correo_avisos(),
        f"Nueva orden {orden.numero} · {correo.dinero(orden.total, orden.moneda)}",
        correo.plantilla(
            f"Nueva orden {orden.numero}",
            f"<p>{escape(orden.direccion.get('fullName', ''))} · {escape(orden.email)} · "
            f"pago: {METODOS.get(orden.metodo_pago, orden.metodo_pago)}</p>" + correo.resumen_orden(orden),
            ("Ver en el panel", _url("/admin")),
        ),
    )


async def comprobante_recibido(orden: Orden) -> None:
    """Al panel: hay un comprobante por revisar. Al revisarlo, se marca la orden como «pagada»."""
    await correo.enviar(
        await _correo_avisos(),
        f"Comprobante de pago {orden.numero} · {correo.dinero(orden.total, orden.moneda)}",
        correo.plantilla(
            f"Comprobante de pago {orden.numero}",
            f"<p>{escape(orden.direccion.get('fullName', ''))} · {escape(orden.email)} subió su comprobante. "
            "Revísalo en el panel y, si el dinero ya llegó, marca la orden como «Pagada».</p>"
            + correo.resumen_orden(orden),
            ("Revisar en el panel", _url("/admin")),
        ),
    )


async def pago_no_coincide(orden: Orden, monto: float, moneda: str) -> None:
    """Mercado Pago aprobó un pago que no es por el total o la moneda de la orden: revisar a mano."""
    await correo.enviar(
        await _correo_avisos(),
        f"Revisar pago de {orden.numero}: no coincide con el total",
        correo.plantilla(
            f"Revisar pago {orden.numero}",
            f"<p>Mercado Pago aprobó un pago por <b>{monto:,.2f} {escape(moneda)}</b>, pero la orden es por "
            f"<b>{correo.dinero(orden.total, orden.moneda)}</b>. La orden sigue pendiente de pago: revísala en "
            "Mercado Pago y en el panel antes de despacharla.</p>",
            ("Ver en el panel", _url("/admin")),
        ),
    )


async def orden_pagada(orden: Orden) -> None:
    await correo.enviar(
        orden.email,
        f"Pago confirmado · {orden.numero}",
        correo.plantilla(
            "¡Pago confirmado!",
            "<p>Ya estamos preparando tu pedido. Te avisaremos cuando salga.</p>" + correo.resumen_orden(orden),
            ("Ver mi pedido", _url(f"/pedido/{orden.id}")),
        ),
    )
    await correo.enviar(
        await _correo_avisos(),
        f"Pago recibido {orden.numero} · {correo.dinero(orden.total, orden.moneda)}",
        correo.plantilla(
            f"Pago recibido {orden.numero}", correo.resumen_orden(orden), ("Ver en el panel", _url("/admin"))
        ),
    )


async def orden_enviada(orden: Orden) -> None:
    await correo.enviar(
        orden.email,
        f"Tu pedido {orden.numero} va en camino",
        correo.plantilla(
            "Tu pedido va en camino",
            f"<p>Paquetería: <b>{escape(orden.transportista or '')}</b><br>"
            f"Número de guía: <b>{escape(orden.guia or '')}</b></p>",
            ("Ver mi pedido", _url(f"/pedido/{orden.id}")),
        ),
    )


async def orden_entregada(orden: Orden) -> None:
    await correo.enviar(
        orden.email,
        f"Pedido {orden.numero} entregado",
        correo.plantilla(
            "Pedido entregado",
            "<p>Gracias por confiar en SINERGIA. Si tienes dudas, escríbenos por WhatsApp.</p>",
        ),
    )


async def orden_cancelada(orden: Orden) -> None:
    await correo.enviar(
        orden.email,
        f"Pedido {orden.numero} cancelado",
        correo.plantilla(
            "Pedido cancelado", "<p>Tu pedido fue cancelado. Si tienes dudas, escríbenos por WhatsApp.</p>"
        ),
    )


POR_ESTADO = {
    "pagada": orden_pagada,
    "enviada": orden_enviada,
    "entregada": orden_entregada,
    "cancelada": orden_cancelada,
}
