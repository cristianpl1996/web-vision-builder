#!/usr/bin/env bash
set -e

echo "[entrypoint] Aplicando migraciones (alembic upgrade head)..."
alembic upgrade head

echo "[entrypoint] Catálogo inicial (solo si no hay productos)..."
python -m app.semilla

# --proxy-headers: detrás de Caddy (que termina el TLS) el backend recibe HTTP plano.
# Rangos privados y no "*": con "*" uvicorn confía en el X-Forwarded-For que pone el cliente.
echo "[entrypoint] Arrancando uvicorn en 0.0.0.0:8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 \
    --workers "${WEB_CONCURRENCY:-2}" \
    --proxy-headers --forwarded-allow-ips "127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
