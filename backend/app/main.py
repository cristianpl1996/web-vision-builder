from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.db import engine

app = FastAPI(title="SINERGIA API", docs_url="/v1/docs", openapi_url="/v1/openapi.json")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origenes,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Toda la API vive bajo /v1 (mismo patrón que Hubu). Los módulos se cuelgan aquí.
v1 = APIRouter(prefix="/v1")
app.include_router(v1)


@app.get("/health")
async def health() -> dict[str, str]:
    """Lo usa el HEALTHCHECK de Docker: responde ok solo si la base contesta."""
    async with engine.connect() as conn:
        await conn.execute(text("select 1"))
    return {"status": "ok"}
