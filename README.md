# SINERGIA by BOTICAN

Tienda en línea de SINERGIA (CBD + CBG + terpenos, uso veterinario).

| Carpeta | Qué es |
|---|---|
| `frontend/` | La web: React + Vite + Tailwind. Landing, tienda, cuenta y checkout. |
| `backend/` | La API: FastAPI + SQLAlchemy + Postgres. Cuentas, productos, órdenes y pagos. |
| `docs/` | Diseños y planes. |

```sh
cp .env.example .env
docker compose up -d --build   # web en http://localhost:8090 · API en http://localhost:8000/v1/docs
```

Las reglas del proyecto están en `CLAUDE.md`; cómo se trabaja, en `CONTRIBUTING.md`.
