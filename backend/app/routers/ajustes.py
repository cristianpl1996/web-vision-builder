"""Admin › Ajustes: credenciales de Mercado Pago, SMTP, envío y correo de avisos."""

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from app.seguridad import Admin, Db
from app.services import ajustes, correo

router = APIRouter(tags=["ajustes"])


class Prueba(BaseModel):
    email: EmailStr


@router.get("/admin/ajustes")
async def leer(_: Admin, db: Db) -> dict[str, str | bool]:
    """Los secretos salen como true/false (configurado), nunca su valor."""
    return await ajustes.para_panel(db)


@router.put("/admin/ajustes")
async def guardar(cambios: dict[str, str], _: Admin, db: Db) -> dict[str, str | bool]:
    await ajustes.guardar(db, cambios)
    return await ajustes.para_panel(db)


@router.post("/admin/ajustes/probar-correo")
async def probar_correo(datos: Prueba, _: Admin) -> dict[str, str | bool]:
    ok, mensaje = await correo.probar(datos.email)
    return {"ok": ok, "message": mensaje}
