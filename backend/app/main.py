import logging
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.db import engine
from app.routers import ajustes, auth, ordenes, pagos, productos

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(title="SINERGIA API", docs_url="/v1/docs", openapi_url="/v1/openapi.json")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origenes,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Toda la API vive bajo /v1 (mismo patrón que Hubu).
v1 = APIRouter(prefix="/v1")
for modulo in (auth, productos, ordenes, pagos, ajustes):
    v1.include_router(modulo.router)
app.include_router(v1)

# Fotos de productos: son públicas (las ve cualquiera en la tienda).
Path(settings.media_dir).mkdir(parents=True, exist_ok=True)
app.mount("/v1/media", StaticFiles(directory=settings.media_dir), name="media")


@app.get("/health")
async def health() -> dict[str, str]:
    """Lo usa el HEALTHCHECK de Docker: responde ok solo si la base contesta."""
    async with engine.connect() as conn:
        await conn.execute(text("select 1"))
    return {"status": "ok"}
