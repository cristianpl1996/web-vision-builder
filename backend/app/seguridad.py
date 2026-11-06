"""Contraseñas, JWT y las dependencias que protegen las rutas.

Un solo dueño para «¿quién es y qué puede hacer?»: `usuario_actual`, `solo_panel` (admin o
superadmin) y `solo_superadmin` (Ajustes).
Ninguna ruta decide permisos a mano.
"""

import hashlib
from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.modelos import Usuario

_bearer = HTTPBearer(auto_error=False)
_ALG = "HS256"


def hashear(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def coincide(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def _huella(usuario: Usuario) -> str:
    """Cambia cuando cambia la contraseña: un enlace de recuperación usado ya no vuelve a servir."""
    return hashlib.sha256(usuario.password_hash.encode()).hexdigest()[:16]


def crear_token(usuario: Usuario, tipo: str = "acceso", minutos: int | None = None) -> str:
    ahora = datetime.now(UTC)
    datos = {
        "sub": str(usuario.id),
        "tipo": tipo,
        "v": usuario.version_sesion or 0,
        "iat": ahora,
        "exp": ahora + timedelta(minutes=minutos or settings.jwt_minutos),
    }
    if tipo == "restablecer":
        datos["huella"] = _huella(usuario)
    return jwt.encode(datos, settings.jwt_secret, algorithm=_ALG)


def leer_token(token: str, tipo: str) -> dict:
    """Decodifica y exige el tipo: un enlace de verificación no sirve como sesión ni al revés."""
    try:
        datos = jwt.decode(token, settings.jwt_secret, algorithms=[_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "El enlace o la sesión no es válida o ya venció.") from None
    if datos.get("tipo") != tipo:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "El enlace o la sesión no es válida.")
    return datos


def token_de_restablecer_valido(datos: dict, usuario: Usuario) -> bool:
    return datos.get("huella") == _huella(usuario)


def cerrar_sesiones(usuario: Usuario) -> None:
    """Todo JWT emitido hasta ahora deja de servir (quien llama hace commit y emite uno nuevo)."""
    usuario.version_sesion = (usuario.version_sesion or 0) + 1


def _sesion_revocada(datos: dict, usuario: Usuario) -> bool:
    return datos.get("v") != (usuario.version_sesion or 0)


Db = Annotated[AsyncSession, Depends(get_db)]


async def usuario_actual(
    cred: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Db,
) -> Usuario:
    if cred is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Inicia sesión para continuar.")
    datos = leer_token(cred.credentials, "acceso")
    usuario = await db.get(Usuario, int(datos["sub"]))
    if usuario is None or _sesion_revocada(datos, usuario):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tu sesión terminó. Inicia sesión de nuevo.")
    return usuario


Actual = Annotated[Usuario, Depends(usuario_actual)]


# cliente: compra · admin: órdenes y productos · superadmin: además Ajustes (credenciales, cobro, correo).
ROLES = ("cliente", "admin", "superadmin")
ROLES_PANEL = ("admin", "superadmin")


async def solo_panel(usuario: Actual) -> Usuario:
    if usuario.rol not in ROLES_PANEL:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permiso para esto.")
    return usuario


async def solo_superadmin(usuario: Actual) -> Usuario:
    if usuario.rol != "superadmin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo el superadmin puede hacer esto.")
    return usuario


Admin = Annotated[Usuario, Depends(solo_panel)]
Superadmin = Annotated[Usuario, Depends(solo_superadmin)]
