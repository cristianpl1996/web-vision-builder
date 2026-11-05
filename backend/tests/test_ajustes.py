from sqlalchemy import select

from app.db import SessionLocal
from app.modelos import Ajuste
from tests.conftest import auth


async def test_los_secretos_se_guardan_cifrados_y_no_salen(api, admin):
    r = await api.put(
        "/v1/admin/ajustes",
        json={"mp_access_token": "APP_USR-secreto", "mp_public_key": "APP_USR-publica", "clave_rara": "x"},
        headers=auth(admin),
    )
    assert r.status_code == 200
    panel = r.json()
    assert panel["mp_access_token"] is True  # configurado, sin mostrar el valor
    assert panel["mp_public_key"] == "APP_USR-publica"
    assert "clave_rara" not in panel

    async with SessionLocal() as db:
        guardado = (await db.scalars(select(Ajuste).where(Ajuste.clave == "mp_access_token"))).one().valor
    assert "secreto" not in guardado

    # Guardar el formulario sin reescribir el secreto no lo borra; «__borrar__» sí.
    r = await api.put("/v1/admin/ajustes", json={"mp_access_token": "", "envio_costo": "99"}, headers=auth(admin))
    assert r.json()["mp_access_token"] is True and r.json()["envio_costo"] == "99"
    r = await api.put("/v1/admin/ajustes", json={"mp_access_token": "__borrar__"}, headers=auth(admin))
    assert r.json()["mp_access_token"] is False


async def test_probar_correo_sin_smtp_lo_dice(api, admin):
    r = await api.post("/v1/admin/ajustes/probar-correo", json={"email": "a@b.com"}, headers=auth(admin))
    assert r.json() == {"ok": False, "message": "No hay servidor SMTP configurado."}
