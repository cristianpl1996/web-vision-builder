from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Toda la configuración sale del entorno (.env en local, variables del hosting en producción).

    Lo que BOTICAN cambia sin tocar el servidor (Mercado Pago, SMTP, envío) vive en la
    tabla `ajustes` y se edita en Admin › Ajustes; lo de aquí es el respaldo.
    """

    # Desde la máquina se lee el .env de la raíz del repo; en Docker llegan como variables de entorno.
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "postgresql+asyncpg://sinergia:sinergia@localhost:5433/sinergia"
    # Sin pool de conexiones: lo usan los tests, donde cada test corre en su propio event loop.
    db_sin_pool: bool = False
    # Obligatorio y de 32+ caracteres (HS256): firma los JWT y cifra los secretos guardados.
    jwt_secret: str = Field(min_length=32)
    jwt_minutos: int = 60 * 24 * 7
    # URL pública de la web: enlaces de los correos y regreso desde Mercado Pago.
    app_url: str = "http://localhost:8090"
    # URL pública que Mercado Pago usa para el webhook. Vacía = no se manda (localhost no
    # es alcanzable desde MP; el pago igual se confirma al volver, consultando la API de MP).
    webhook_url_publica: str = ""
    # Orígenes del navegador que pueden llamar a la API.
    cors_origenes: list[str] = ["http://localhost:8080", "http://localhost:8081", "http://localhost:8090"]
    media_dir: str = "/data/media"

    # SMTP de respaldo (en desarrollo, Mailpit). Lo guardado en Admin › Ajustes manda sobre esto.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_usuario: str = ""
    smtp_password: str = ""
    smtp_remitente: str = "SINERGIA <no-responder@sinergia.local>"
    smtp_tls: bool = True


settings = Settings()
