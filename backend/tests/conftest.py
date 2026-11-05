"""Los tests corren contra `sinergia_test` (el Postgres de docker compose, puerto 5433).

    docker compose up -d db && .venv/Scripts/python -m pytest

Antes de importar la app se fijan las variables: así `settings` nunca apunta a la base
de desarrollo. Cada test arranca con las tablas vacías. Los correos no salen: se guardan
en `correos` para poder leer los enlaces (verificar, restablecer).
"""

import os
import re
import tempfile

os.environ["DATABASE_URL"] = "postgresql+asyncpg://sinergia:sinergia@localhost:5433/sinergia_test"
os.environ["DB_SIN_POOL"] = "true"
os.environ["JWT_SECRET"] = "secreto-de-pruebas-con-mas-de-32-caracteres"
os.environ["MEDIA_DIR"] = tempfile.mkdtemp(prefix="sinergia-media-")
os.environ["SMTP_HOST"] = ""

import asyncpg  # noqa: E402
import httpx  # noqa: E402
import pytest  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import modelos  # noqa: E402
from app.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.services import correo  # noqa: E402


async def _crear_base_si_falta() -> None:
    conn = await asyncpg.connect("postgresql://sinergia:sinergia@localhost:5433/sinergia")
    try:
        if not await conn.fetchval("select 1 from pg_database where datname = 'sinergia_test'"):
            await conn.execute("create database sinergia_test")
    finally:
        await conn.close()


_esquema_listo = False


@pytest.fixture(autouse=True)
async def base_limpia():
    global _esquema_listo
    if not _esquema_listo:
        await _crear_base_si_falta()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        _esquema_listo = True
    tablas = ", ".join(t.name for t in Base.metadata.sorted_tables)
    async with engine.begin() as conn:
        await conn.execute(text(f"truncate {tablas} restart identity cascade"))
    yield


@pytest.fixture
def correos(monkeypatch) -> list[dict]:
    enviados: list[dict] = []

    async def falso(para, asunto, html):
        enviados.append({"para": para, "asunto": asunto, "html": html})
        return True

    monkeypatch.setattr(correo, "enviar", falso)
    return enviados


def enlace(correo_html: str, ruta: str) -> str:
    """Saca el token de un enlace del correo (p. ej. ruta='/verificar')."""
    return re.search(rf"{ruta}\?token=([\w\-.]+)", correo_html).group(1)


@pytest.fixture
async def api():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as cliente:
        yield cliente


async def registrar(api, email="ana@correo.com", password="Sinergia2026", **extra) -> dict:
    datos = {"firstName": "Ana", "lastName": "Ruiz", "email": email, "password": password, **extra}
    r = await api.post("/v1/auth/registro", json=datos)
    assert r.status_code == 201, r.text
    return r.json()


def auth(sesion: dict) -> dict:
    return {"Authorization": f"Bearer {sesion['token']}"}


async def hacer_superadmin(email: str) -> None:
    async with SessionLocal() as db:
        u = (await db.execute(text("select id from usuarios where email = :e"), {"e": email})).scalar_one()
        usuario = await db.get(modelos.Usuario, u)
        usuario.rol = "superadmin"
        await db.commit()


@pytest.fixture
async def admin(api) -> dict:
    sesion = await registrar(api, email="admin@sinergia.mx")
    await hacer_superadmin("admin@sinergia.mx")
    return sesion


async def crear_producto(api, admin_sesion, **campos) -> dict:
    datos = {"slug": "sinergia-750", "nombre": "SINERGIA 750 mg", "precio": 1590, "mg": 750, **campos}
    r = await api.post("/v1/admin/productos", json=datos, headers=auth(admin_sesion))
    assert r.status_code == 201, r.text
    return r.json()


DIRECCION = {
    "fullName": "Ana Ruiz",
    "phone": "5512345678",
    "street": "Av. Insurgentes Sur",
    "extNumber": "123",
    "neighborhood": "Roma Norte",
    "postalCode": "06700",
    "city": "Cuauhtémoc",
    "state": "Ciudad de México",
}
