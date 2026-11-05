from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Toda la configuración sale del entorno (.env en local, variables del hosting en producción)."""

    # Desde la máquina se lee el .env de la raíz del repo; en Docker llegan como variables de entorno.
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "postgresql+asyncpg://sinergia:sinergia@localhost:5433/sinergia"
    jwt_secret: str  # obligatorio: sin él la API no arranca (ver .env.example)
    jwt_minutos: int = 60 * 24 * 7
    # Orígenes del navegador que pueden llamar a la API (el dev server de Vite en local).
    cors_origenes: list[str] = ["http://localhost:8080", "http://localhost:8081", "http://localhost:8090"]


settings = Settings()
