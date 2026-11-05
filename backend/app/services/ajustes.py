"""Configuración que BOTICAN edita en Admin › Ajustes (Mercado Pago, SMTP, envío, avisos).

Los secretos se guardan cifrados con Fernet, derivando la llave del `JWT_SECRET` (mismo
criterio que `services/secretos.py` de Hubu): si se filtra la base sin el secreto, no se
pueden leer. Al responder al panel, los secretos nunca salen: solo «configurado sí/no».
"""

import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.modelos import Ajuste

# clave → (es_secreto, valor por defecto)
DEFINICION: dict[str, tuple[bool, str]] = {
    "mp_access_token": (True, ""),
    "mp_public_key": (False, ""),
    "mp_webhook_secret": (True, ""),
    "smtp_host": (False, ""),
    "smtp_port": (False, ""),
    "smtp_usuario": (False, ""),
    "smtp_password": (True, ""),
    "smtp_remitente": (False, ""),
    "envio_costo": (False, "0"),
    "envio_gratis_desde": (False, ""),
    "correo_avisos": (False, ""),
}
SECRETOS = frozenset(k for k, (secreto, _) in DEFINICION.items() if secreto)


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    llave = hashlib.sha256(settings.jwt_secret.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(llave))


async def leer_todos(db: AsyncSession) -> dict[str, str]:
    """Todos los ajustes ya descifrados (uso interno del servidor)."""
    filas = {a.clave: a.valor for a in (await db.scalars(select(Ajuste))).all()}
    valores = {}
    for clave, (secreto, defecto) in DEFINICION.items():
        valor = filas.get(clave, defecto)
        if secreto and valor:
            try:
                valor = _fernet().decrypt(valor.encode()).decode()
            except InvalidToken:  # cifrado con otro JWT_SECRET: se trata como no configurado
                valor = ""
        valores[clave] = valor
    return valores


async def guardar(db: AsyncSession, cambios: dict[str, str]) -> None:
    """Guarda solo las claves conocidas. Un secreto vacío NO borra el guardado (el panel no lo
    reenvía); para borrarlo se manda el texto especial «__borrar__»."""
    for clave, valor in cambios.items():
        if clave not in DEFINICION:
            continue
        valor = (valor or "").strip()
        if clave in SECRETOS:
            if not valor:
                continue
            if valor == "__borrar__":
                valor = ""
            else:
                valor = _fernet().encrypt(valor.encode()).decode()
        fila = await db.get(Ajuste, clave)
        if fila is None:
            db.add(Ajuste(clave=clave, valor=valor))
        else:
            fila.valor = valor
    await db.commit()


async def para_panel(db: AsyncSession) -> dict[str, str | bool]:
    """Lo que ve el panel: los secretos como booleano «configurado»."""
    valores = await leer_todos(db)
    return {k: (bool(v) if k in SECRETOS else v) for k, v in valores.items()}


def entero(valor: str, defecto: int | None = None) -> int | None:
    try:
        return int(str(valor).strip())
    except ValueError:
        return defecto
