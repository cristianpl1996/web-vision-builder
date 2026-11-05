# Etapa de build: las dependencias van a un venv que la imagen final copia entero.
FROM python:3.12-slim AS builder
RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH
RUN pip install --no-cache-dir -U "pip>=26.2"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Imagen final. curl: lo usa el HEALTHCHECK. Sin libpq: asyncpg habla con Postgres por su cuenta.
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /opt/venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH
COPY . .
# Usuario no-root; /data/media es donde se guardarán las fotos de productos (volumen).
RUN useradd -m appuser && mkdir -p /data/media && chown -R appuser /app /data/media \
    && chmod +x docker-entrypoint.sh
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
