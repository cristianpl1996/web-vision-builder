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


async def orden_creada(orden: Orden) -> None:
    pago = (
        "<p>Para completar tu compra, termina el pago con Mercado Pago.</p>"
        if orden.metodo_pago == "mercadopago"
        else "<p>Te escribiremos por WhatsApp para confirmar el pago y el envío.</p>"
    )
    boton = ("Pagar ahora", orden.pago_url) if orden.metodo_pago == "mercadopago" and orden.pago_url else None
    await correo.enviar(
        orden.email,
        f"Recibimos tu pedido {orden.numero}",
        correo.plantilla(f"Pedido {orden.numero}", pago + correo.resumen_orden(orden), boton),
    )
    await correo.enviar(
        await _correo_avisos(),
        f"Nueva orden {orden.numero} · {correo.pesos(orden.total)}",
        correo.plantilla(
            f"Nueva orden {orden.numero}",
            f"<p>{escape(orden.direccion.get('fullName', ''))} · {escape(orden.email)} · "
            f"pago: {escape(orden.metodo_pago)}</p>" + correo.resumen_orden(orden),
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
        f"Pago recibido {orden.numero} · {correo.pesos(orden.total)}",
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
