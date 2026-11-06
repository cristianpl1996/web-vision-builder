"""Correos de la tienda (verificación, recuperar contraseña, órdenes y avisos a BOTICAN).

Se envían DESPUÉS de guardar (BackgroundTasks de FastAPI): un correo que falla no
deshace una orden ni un registro, y queda en el log. El SMTP sale de Admin › Ajustes y,
si no hay, del `.env` (en desarrollo, Mailpit). Sin ninguno, el correo se imprime en el
log (mismo criterio que Hubu).
"""

import asyncio
import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr, parseaddr
from html import escape

from app.config import settings
from app.db import SessionLocal
from app.services import ajustes

log = logging.getLogger(__name__)
VERDE = "#1f5a3e"


async def _config_smtp() -> dict:
    async with SessionLocal() as db:
        a = await ajustes.leer_todos(db)
    if a["smtp_host"]:
        return {
            "host": a["smtp_host"],
            "port": ajustes.entero(a["smtp_port"], 587),
            "usuario": a["smtp_usuario"],
            "password": a["smtp_password"],
            "remitente": a["smtp_remitente"] or settings.smtp_remitente,
            "tls": ajustes.entero(a["smtp_port"], 587) != 25,
        }
    return {
        "host": settings.smtp_host,
        "port": settings.smtp_port,
        "usuario": settings.smtp_usuario,
        "password": settings.smtp_password,
        "remitente": settings.smtp_remitente,
        "tls": settings.smtp_tls,
    }


def _enviar_smtp(cfg: dict, para: str, asunto: str, html: str) -> None:
    nombre, direccion = parseaddr(cfg["remitente"])
    msg = EmailMessage()
    msg["From"] = formataddr((nombre or "SINERGIA", direccion))
    msg["To"] = para
    msg["Subject"] = asunto
    msg.set_content("Abre este correo en un cliente que muestre HTML.")
    msg.add_alternative(html, subtype="html")
    if cfg["port"] == 465:
        servidor = smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=20)
    else:
        servidor = smtplib.SMTP(cfg["host"], cfg["port"], timeout=20)
    with servidor as s:
        if cfg["tls"] and cfg["port"] != 465:
            s.starttls()
        if cfg["usuario"]:
            s.login(cfg["usuario"], cfg["password"])
        s.send_message(msg)


async def enviar(para: str, asunto: str, html: str) -> bool:
    """Nunca lanza: un correo caído no tumba la acción que lo disparó."""
    if not para:
        return False
    cfg = await _config_smtp()
    if not cfg["host"]:
        log.warning("[CORREO SIMULADO — configura SMTP en Admin › Ajustes]\nPara: %s\nAsunto: %s", para, asunto)
        return False
    try:
        await asyncio.to_thread(_enviar_smtp, cfg, para, asunto, html)
        return True
    except Exception:
        log.exception("No se pudo enviar el correo «%s» a %s", asunto, para)
        return False


async def probar(para: str) -> tuple[bool, str]:
    """Para el botón «Enviar correo de prueba» de Ajustes: aquí SÍ se devuelve el error."""
    cfg = await _config_smtp()
    if not cfg["host"]:
        return False, "No hay servidor SMTP configurado."
    try:
        await asyncio.to_thread(
            _enviar_smtp,
            cfg,
            para,
            "Prueba de correo · SINERGIA",
            plantilla("Correo de prueba", "<p>Si lees esto, el correo de la tienda está bien configurado.</p>"),
        )
        return True, "Correo de prueba enviado."
    except Exception as e:  # noqa: BLE001 — se muestra al admin para que corrija la configuración
        return False, f"No se pudo enviar: {e}"


# ── Plantillas ──────────────────────────────────────────────────────────────


def plantilla(titulo: str, cuerpo: str, boton: tuple[str, str] | None = None) -> str:
    cta = ""
    if boton:
        texto, url = boton
        cta = (
            f'<p style="margin:28px 0 8px"><a href="{escape(url)}" style="background:{VERDE};color:#fff;'
            'padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">'
            f"{escape(texto)}</a></p>"
        )
    return f"""<!doctype html><html>
<body style="margin:0;background:#f6f4ee;font-family:Arial,sans-serif;color:#1d2a23">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:4px;color:{VERDE}">SINERGIA</div>
  <div style="font-size:11px;letter-spacing:2px;color:#6b7b72;margin-bottom:24px">CBD + CBG &amp; TERPENOS</div>
  <div style="background:#fff;border-radius:16px;padding:28px 24px">
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 16px">{escape(titulo)}</h1>
    <div style="font-size:15px;line-height:1.6">{cuerpo}</div>{cta}
  </div>
  <p style="font-size:12px;color:#6b7b72;margin-top:20px">SINERGIA by BOTICAN · Uso veterinario.</p>
</div></body></html>"""


def dinero(valor: int, moneda: str = "MXN") -> str:
    return f"${valor:,.0f} {moneda}"


def resumen_orden(orden) -> str:
    filas = "".join(
        f'<tr><td style="padding:6px 0">{escape(lin.nombre)} × {lin.cantidad}</td>'
        f'<td style="padding:6px 0;text-align:right">{dinero(lin.precio * lin.cantidad, orden.moneda)}</td></tr>'
        for lin in orden.lineas
    )
    envio = "Gratis" if orden.envio == 0 else dinero(orden.envio, orden.moneda)
    total = dinero(orden.total, orden.moneda)
    return (
        f'<table style="width:100%;border-collapse:collapse;font-size:14px">{filas}'
        f'<tr><td style="padding:6px 0;color:#6b7b72">Envío</td><td style="text-align:right">{envio}</td></tr>'
        f'<tr><td style="padding:10px 0;font-weight:bold;border-top:1px solid #e6e1d6">Total</td>'
        f'<td style="text-align:right;font-weight:bold;border-top:1px solid #e6e1d6">{total}</td></tr>'
        "</table>"
    )
