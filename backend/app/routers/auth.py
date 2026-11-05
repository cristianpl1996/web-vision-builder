"""Cuentas: registro, sesión, verificación de correo, recuperar contraseña y perfil."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from sqlalchemy import select

from app import schemas
from app.modelos import Usuario
from app.seguridad import (
    Actual,
    Db,
    cerrar_sesiones,
    coincide,
    crear_token,
    hashear,
    leer_token,
    token_de_restablecer_valido,
)
from app.services import avisos

router = APIRouter(tags=["cuentas"])

MAX_INTENTOS = 5
BLOQUEO = timedelta(minutes=15)
# Hash real para comparar aunque el correo no exista: así el tiempo de respuesta no
# delata qué correos tienen cuenta.
_HASH_SEÑUELO = hashear("señuelo-para-tiempo-constante1")


def _sesion(usuario: Usuario) -> schemas.Sesion:
    return schemas.Sesion(token=crear_token(usuario), user=schemas.UsuarioOut.de(usuario))


def _enviar_verificacion(tareas: BackgroundTasks, u: Usuario) -> None:
    tareas.add_task(avisos.verificar_correo, u.email, u.nombre, crear_token(u, "verificar", minutos=48 * 60))


@router.post("/auth/registro", response_model=schemas.Sesion, status_code=201)
async def registro(datos: schemas.Registro, db: Db, tareas: BackgroundTasks):
    email = datos.email.lower()
    if await db.scalar(select(Usuario.id).where(Usuario.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una cuenta con este correo. Inicia sesión.")
    u = Usuario(
        email=email,
        nombre=datos.firstName.strip(),
        apellidos=datos.lastName.strip(),
        telefono=datos.phone,
        password_hash=hashear(datos.password),
        direcciones=[],
    )
    db.add(u)
    await db.commit()
    _enviar_verificacion(tareas, u)
    return _sesion(u)


@router.post("/auth/login", response_model=schemas.Sesion)
async def login(datos: schemas.Login, db: Db):
    u = await db.scalar(select(Usuario).where(Usuario.email == datos.email.lower()))
    ahora = datetime.now(UTC)
    if u and u.bloqueado_hasta and u.bloqueado_hasta.replace(tzinfo=UTC) > ahora:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Demasiados intentos. Espera 15 minutos o restablece tu contraseña."
        )
    if u is None:
        coincide(datos.password, _HASH_SEÑUELO)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos.")
    if not coincide(datos.password, u.password_hash):
        u.intentos_fallidos += 1
        if u.intentos_fallidos >= MAX_INTENTOS:
            u.bloqueado_hasta = ahora + BLOQUEO
            u.intentos_fallidos = 0
        await db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos.")
    u.intentos_fallidos = 0
    u.bloqueado_hasta = None
    await db.commit()
    return _sesion(u)


@router.post("/auth/verificar", response_model=schemas.UsuarioOut)
async def verificar(datos: schemas.Token, db: Db):
    info = leer_token(datos.token, "verificar")
    u = await db.get(Usuario, int(info["sub"]))
    if u is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La cuenta ya no existe.")
    u.email_verificado = True
    await db.commit()
    return schemas.UsuarioOut.de(u)


@router.post("/auth/reenviar-verificacion", status_code=204)
async def reenviar_verificacion(u: Actual, tareas: BackgroundTasks):
    if not u.email_verificado:
        _enviar_verificacion(tareas, u)


@router.post("/auth/olvide", status_code=204)
async def olvide(datos: schemas.Olvide, db: Db, tareas: BackgroundTasks):
    """Responde igual exista o no la cuenta: no se revela qué correos están registrados."""
    u = await db.scalar(select(Usuario).where(Usuario.email == datos.email.lower()))
    if u:
        tareas.add_task(avisos.restablecer_password, u.email, u.nombre, crear_token(u, "restablecer", minutos=60))


@router.post("/auth/restablecer", response_model=schemas.Sesion)
async def restablecer(datos: schemas.Restablecer, db: Db):
    info = leer_token(datos.token, "restablecer")
    u = await db.get(Usuario, int(info["sub"]))
    if u is None or not token_de_restablecer_valido(info, u):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Este enlace ya se usó o venció. Pide uno nuevo.")
    u.password_hash = hashear(datos.password)
    u.email_verificado = True  # abrió un enlace que llegó a su correo
    u.intentos_fallidos = 0
    u.bloqueado_hasta = None
    cerrar_sesiones(u)
    await db.commit()
    return _sesion(u)


@router.get("/me", response_model=schemas.UsuarioOut)
async def me(u: Actual):
    return schemas.UsuarioOut.de(u)


@router.patch("/me", response_model=schemas.UsuarioOut)
async def editar_perfil(cambios: schemas.PerfilCambios, u: Actual, db: Db):
    if cambios.firstName is not None:
        u.nombre = cambios.firstName.strip()
    if cambios.lastName is not None:
        u.apellidos = cambios.lastName.strip()
    if cambios.phone is not None:
        u.telefono = cambios.phone
    if cambios.addresses is not None:
        u.direcciones = [d.model_dump() for d in cambios.addresses]
    await db.commit()
    return schemas.UsuarioOut.de(u)


@router.post("/me/password", response_model=schemas.Sesion)
async def cambiar_password(datos: schemas.CambiarPassword, u: Actual, db: Db):
    if not coincide(datos.actual, u.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual no es correcta.")
    u.password_hash = hashear(datos.nueva)
    cerrar_sesiones(u)  # cierra las otras sesiones; esta sigue con el token nuevo
    await db.commit()
    return _sesion(u)
