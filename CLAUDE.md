# CLAUDE.md — SINERGIA

Tienda en línea de SINERGIA by BOTICAN (CBD + CBG + terpenos, uso veterinario para
perros y gatos), vendida en México en MXN. Landing + catálogo + carrito + cuentas +
checkout + órdenes, y un panel de superadmin para órdenes y productos. Toda la UI va
en español de México y en lenguaje de cliente, nunca en términos técnicos.

## Arquitectura
`frontend/` (React + Vite + Tailwind + shadcn/ui) → Caddy sirve el estático y manda
`/v1/*` al `backend/` (FastAPI + SQLAlchemy async + Alembic) → Postgres.
Todo corre con `docker compose`. API bajo `/v1`, salud en `/health`, documentación
en `/v1/docs`. Auth = JWT (cliente y superadmin son la misma tabla con un rol).

El frontend nació sin backend: `frontend/src/services/{auth,orders,payments}.ts` son
INTERFACES con una implementación local (localStorage). El backend se conecta
reemplazando esa implementación por una que llama a la API, sin tocar pantallas.

## Guía por zona
- `docs/superpowers/specs/` — los diseños aprobados (qué y por qué) antes de código.
- `docs/superpowers/plans/` — los planes de implementación paso a paso.
- `frontend/CLAUDE.md` — marca, tokens de color, tipografía y reglas de contenido.
- `.claude/skills/juez/` — la revisión con criterio antes del merge.
- `CONTRIBUTING.md` — ramas, diseño antes de código, verificación y PR.

## Precedencia de instrucciones
Están activos ponytail (hook, en cada sesión) y superpowers (skills a demanda). Se
contradicen en dos puntos —entregar ya vs. diseñar antes, y una verificación vs. test
primero— así que manda esto:
- **Por defecto gana ponytail:** la solución más corta que funcione, sin andamiaje
  especulativo, con una verificación ejecutable por cada lógica no trivial.
- **Si invocas una skill de superpowers a mano** (`brainstorming`, `writing-plans`,
  `test-driven-development`), esa skill manda para esa tarea: diseño aprobado antes
  de escribir código, y test que falla primero.
- **Lo escrito en este archivo gana sobre las dos.**

## Los árbitros del código
| | Qué decide | Cuándo |
|---|---|---|
| **La máquina**: ESLint (frontend) y Ruff `0.16.7` (backend) | todo lo que una regla puede decidir | en cada edición de Claude (hook `PostToolUse`, `.claude/hooks/arbitro.mjs`) |
| **El juez**: skill `juez` (`/juez`, `/juez estructura`, `/juez bugs`) | si el cambio está bien PLANTEADO | con la rama lista, antes del merge |

- El hook sale con **2** si el archivo tocado tiene hallazgos (Claude los ve y los
  arregla en el mismo turno) y con **1** si no pudo medir (falta `npm install` o `uv`).
- `frontend/src/components/ui/` es shadcn copiado tal cual: el árbitro no lo mide.
- **Callar una regla se hace en el código y con motivo**
  (`# noqa: S105 — por qué`, `// eslint-disable-next-line <regla> -- por qué`).
- **Versión fija de Ruff** (`uvx ruff@0.16.7`): entre versiones cambian las reglas.

## Reglas del producto (no se negocian)
- **El precio lo decide el servidor.** El backend recalcula el total de cada orden
  desde los ids de producto y las cantidades. Nada que llegue del navegador cuenta
  como precio.
- **El pago lo confirma la pasarela** por webhook firmado e idempotente, nunca la
  página de regreso del navegador.
- **La orden guarda su copia** del nombre y el precio de cada producto al comprar:
  cambiar o borrar un producto no altera órdenes viejas.
- **Cada cliente ve solo lo suyo**; lo de administración exige superadmin EN EL
  BACKEND (esconder un botón no es control).
- **Nada inventado en el contenido.** Textos, beneficios, certificaciones y datos
  del producto salen de BOTICAN (landing anterior o lo que el doctor envía). Los
  precios de hoy son de referencia hasta que BOTICAN los confirme.
- **La cuenta se pide solo al finalizar la compra**: navegar y armar el carrito es libre.

## Correr el proyecto y los tests
```
cp .env.example .env
docker compose up -d --build            # todo en http://localhost:8090
# o, para desarrollar el frontend con recarga:
docker compose up -d db backend && cd frontend && npm install && npm run dev
```
- Backend: `cd backend && uv venv --python 3.12 .venv && uv pip install -p .venv -r requirements.txt`,
  luego `.venv/Scripts/python -m pytest` (Windows) con la base de compose arriba
  (Postgres en `localhost:5433`). Lint: `uvx ruff@0.16.7 check . && uvx ruff@0.16.7 format --check .`
- Frontend: `cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run build`.
- Migraciones: `cd backend && .venv/Scripts/alembic revision --autogenerate -m "..."`;
  el contenedor aplica `alembic upgrade head` al arrancar.

## Puertos en desarrollo
Postgres `5433` (para no chocar con otro Postgres local), API `8000`, web en Docker
`8090`, `npm run dev` en `8080` (o el siguiente libre). El dev server de Vite manda
`/v1` y `/health` a `localhost:8000`.
