import asyncio

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app import modelos  # noqa: F401 — registra las tablas en Base.metadata para autogenerate
from app.config import settings
from app.db import Base

target_metadata = Base.metadata


def _migrar(conn) -> None:
    context.configure(connection=conn, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


async def _en_linea() -> None:
    engine = create_async_engine(settings.database_url)
    async with engine.connect() as conn:
        await conn.run_sync(_migrar)
    await engine.dispose()


asyncio.run(_en_linea())
