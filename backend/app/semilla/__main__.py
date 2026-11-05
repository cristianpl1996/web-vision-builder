import asyncio

from app.semilla import sembrar

print("Catálogo inicial cargado." if asyncio.run(sembrar()) else "Ya había productos: no se tocó nada.")  # noqa: T201
