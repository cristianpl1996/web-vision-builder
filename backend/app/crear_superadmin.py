"""Crea (o asciende) un superadmin. No hay forma de hacerlo desde la web, a propósito.

docker compose exec backend python -m app.crear_superadmin admin@ejemplo.com "Contrasena123"
"""

import asyncio
import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.modelos import Usuario
from app.schemas import _password_valido
from app.seguridad import hashear


async def main(email: str, password: str) -> None:
    _password_valido(password)
    email = email.strip().lower()
    async with SessionLocal() as db:
        u = await db.scalar(select(Usuario).where(Usuario.email == email))
        if u is None:
            u = Usuario(email=email, nombre="Admin", apellidos="SINERGIA", direcciones=[], password_hash="")
            db.add(u)
        u.password_hash = hashear(password)
        u.rol = "superadmin"
        u.email_verificado = True
        await db.commit()
    print(f"Listo: {email} es superadmin.")  # noqa: T201 — salida de un comando de consola


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Uso: python -m app.crear_superadmin <correo> <contraseña>")
    asyncio.run(main(sys.argv[1], sys.argv[2]))
