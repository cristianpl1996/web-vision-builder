"""Deja la tienda lista para probar: usuarios de cada rol, catálogo con fotos y precios, y ajustes.

    docker compose exec backend python -m app.sembrar                     # contraseña de desarrollo
    docker compose exec backend python -m app.sembrar --password "Otra2026"

Se puede correr las veces que quieras:
- Usuarios: crea o actualiza superadmin@, admin@ y cliente@sinergia.local con su rol y la contraseña.
- Catálogo: solo si la tabla de productos está vacía (las 5 presentaciones con sus fotos y
  precios de referencia, más 3 «Próximamente»). Si ya hay productos, no se tocan.
- Ajustes (solo en desarrollo): llena con valores de EJEMPLO los que nunca se guardaron (envío,
  tipo de cambio y correo de avisos). Las credenciales de Mercado Pago y SMTP NO se siembran.

En producción (APP_URL con https) exige `--password` (la de desarrollo es pública) y no toca
los ajustes: envío, monedas y correos los configura BOTICAN en Admin › Ajustes.
"""

import argparse
import asyncio
import sys

from sqlalchemy import select

from app import semilla
from app.config import settings
from app.db import SessionLocal
from app.modelos import Ajuste, Usuario
from app.schemas import _password_valido
from app.seguridad import hashear
from app.services import ajustes

PASSWORD_DESARROLLO = "Sinergia2026"  # noqa: S105 — solo desarrollo; en producción se exige --password

DIRECCION_PRUEBA = {
    "fullName": "Cliente de Prueba",
    "phone": "5512345678",
    "street": "Av. Insurgentes Sur",
    "extNumber": "123",
    "intNumber": "",
    "neighborhood": "Roma Norte",
    "postalCode": "06700",
    "city": "Cuauhtémoc",
    "state": "Ciudad de México",
    "references": "",
}

# correo, nombre, apellidos, rol, direcciones
USUARIOS = [
    ("superadmin@sinergia.local", "Super", "Admin", "superadmin", []),
    ("admin@sinergia.local", "Admin", "Tienda", "admin", []),
    ("cliente@sinergia.local", "Cliente", "de Prueba", "cliente", [DIRECCION_PRUEBA]),
]

# Valores de EJEMPLO solo para desarrollo (no son datos de BOTICAN): se ajustan en Admin › Ajustes.
AJUSTES_EJEMPLO = {
    "envio_costo": "149",
    "envio_gratis_desde": "3000",
    "tipo_cambio_usd": "18.50",
    "correo_avisos": "superadmin@sinergia.local",
}


async def _usuarios(password: str) -> None:
    async with SessionLocal() as db:
        for email, nombre, apellidos, rol, direcciones in USUARIOS:
            u = await db.scalar(select(Usuario).where(Usuario.email == email))
            if u is None:
                u = Usuario(email=email, nombre=nombre, apellidos=apellidos, direcciones=direcciones, password_hash="")
                db.add(u)
            u.password_hash = hashear(password)
            u.rol = rol
            u.email_verificado = True
            u.intentos_fallidos = 0
            u.bloqueado_hasta = None
        await db.commit()


async def _ajustes() -> list[str]:
    """Solo los que NUNCA se guardaron: un envío en 0 puesto a propósito no se pisa."""
    async with SessionLocal() as db:
        guardados = set((await db.scalars(select(Ajuste.clave))).all())
        nuevos = {k: v for k, v in AJUSTES_EJEMPLO.items() if k not in guardados}
        if nuevos:
            await ajustes.guardar(db, nuevos)
        return list(nuevos)


async def main(password: str, produccion: bool = False) -> None:
    await _usuarios(password)
    catalogo = await semilla.sembrar()
    # En producción no se inventan envío, tipo de cambio ni correos: se configuran en Ajustes.
    llenados = [] if produccion else await _ajustes()
    salida = [
        "Semilla lista.",
        "",
        "Usuarios (contraseña: la que pasaste o la de desarrollo):",
        *(f"  {rol:<11} {email}" for email, _, _, rol, _ in USUARIOS),
        "",
        "Catálogo: "
        + (
            "5 presentaciones con fotos y precios + 3 «Próximamente»."
            if catalogo
            else "ya tenía productos, no se tocó."
        ),
        "Ajustes de ejemplo: " + (", ".join(llenados) if llenados else "ninguno (producción o ya configurados)."),
        "Mercado Pago y SMTP: cárgalos en Admin › Ajustes con la cuenta superadmin.",
    ]
    print("\n".join(salida))  # noqa: T201 — salida de un comando de consola


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Precarga usuarios, catálogo y ajustes de SINERGIA.")
    parser.add_argument("--password", help=f"Contraseña de los 3 usuarios (por defecto {PASSWORD_DESARROLLO}).")
    args = parser.parse_args()
    produccion = settings.app_url.startswith("https://")
    if args.password is None and produccion:
        sys.exit("En producción pasa una contraseña propia: python -m app.sembrar --password '...'")
    password = args.password or PASSWORD_DESARROLLO
    try:
        _password_valido(password)
    except ValueError as e:
        sys.exit(str(e))
    asyncio.run(main(password, produccion))
