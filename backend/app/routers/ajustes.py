"""Admin › Ajustes: credenciales de Mercado Pago, SMTP, envío, monedas y correo de avisos."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.seguridad import Db, Superadmin
from app.services import ajustes, correo

router = APIRouter(tags=["ajustes"])


class Prueba(BaseModel):
    email: EmailStr


@router.get("/admin/ajustes")
async def leer(_: Superadmin, db: Db) -> dict[str, str | bool]:
    """Los secretos salen como true/false (configurado), nunca su valor."""
    return await ajustes.para_panel(db)


@router.put("/admin/ajustes")
async def guardar(cambios: dict[str, str], _: Superadmin, db: Db) -> dict[str, str | bool]:
    tc = cambios.get("tipo_cambio_usd", "").strip()
    if tc and ajustes.tipo_cambio(tc) is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "El tipo de cambio debe ser un número entre 1 y 1000, p. ej. 18.50."
        )
    formas = ajustes.formas_de_pago(ajustes.con_cambios(await ajustes.leer_todos(db), cambios))
    if not (formas["mercadopago"] or formas["transferencia"]):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "Deja al menos una forma de pago activa: transferencia, o Mercado Pago encendido y con credenciales.",
        )
    await ajustes.guardar(db, cambios)
    return await ajustes.para_panel(db)


@router.post("/admin/ajustes/probar-correo")
async def probar_correo(datos: Prueba, _: Superadmin) -> dict[str, str | bool]:
    ok, mensaje = await correo.probar(datos.email)
    return {"ok": ok, "message": mensaje}
