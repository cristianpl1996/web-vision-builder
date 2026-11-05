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

Las pantallas nunca llaman a `fetch`: usan `frontend/src/services/*` (auth, orders,
store, admin) sobre `lib/api.ts`. El catálogo llega de `/v1/productos` por
`context/CatalogContext.tsx`; no hay productos escritos en el código.

## Backend por capas
- `app/routers/` — HTTP: auth, validar la entrada, forma de la respuesta.
  `auth` (cuentas), `productos` (tienda + admin + fotos), `ordenes` (cliente + admin),
  `pagos` (webhook de Mercado Pago), `ajustes` (Admin › Ajustes).
- `app/services/` — las reglas, una pregunta = un dueño:
  `ordenes` (precio, envío, estados y transiciones), `mercadopago` (preferencia, firma,
  `aplicar_pago` idempotente), `ajustes` (configuración y secretos cifrados con Fernet),
  `correo` (SMTP) y `avisos` (qué correo sale en cada momento).
- `app/seguridad.py` — contraseñas (bcrypt), JWT y las dependencias `Actual` / `Admin`.
  Toda ruta de admin recibe `_: Admin`; ninguna decide permisos a mano.
- `app/modelos.py` (tablas), `app/schemas.py` (entrada/salida), `migrations/` (Alembic),
  `app/semilla/` (catálogo inicial, solo si la tabla está vacía).

## Mercado Pago
Checkout Pro. Las credenciales se cargan en **Admin › Ajustes** (cifradas): Access Token,
Public Key y la clave secreta del webhook. El pago se confirma por el webhook
`/v1/pagos/webhook/mercadopago` (firma `x-signature` verificada) y, al volver a la tienda,
consultando la API de MP (`/ordenes/{id}/verificar-pago`). En los dos casos el pago se LEE
de la API de MP y se exige monto y moneda exactos. En producción hay que poner
`WEBHOOK_URL_PUBLICA` (https) y registrar esa URL en el panel de Mercado Pago.

## Superadmin
No se crea desde la web: `docker compose exec backend python -m app.crear_superadmin <correo> <contraseña>`.

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
docker compose up -d --build                 # todo en http://localhost:8090
docker compose --profile dev up -d --build   # + Vite con recarga (5174) y Mailpit (8025)
```
- Backend: `cd backend && uv venv --python 3.12 .venv && uv pip install -p .venv -r requirements.txt`,
  luego `.venv/Scripts/python -m pytest` (Windows) con la base de compose arriba
  (Postgres en `localhost:5433`). Los tests usan su propia base, `sinergia_test`, que
  crean y vacían solos; Mercado Pago y el correo se simulan.
  Lint: `uvx ruff@0.16.7 check . && uvx ruff@0.16.7 format --check .`
- Frontend: `cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run build`.
- Migraciones: `cd backend && .venv/Scripts/alembic revision --autogenerate -m "..."`;
  el contenedor aplica `alembic upgrade head` al arrancar.

## Puertos en desarrollo
Postgres `5433` (para no chocar con otro Postgres local), API `8000`, web en Docker
`8090`, Vite en Docker `5174` (perfil `dev`), Mailpit `8025` (perfil `dev`: ahí llegan
TODOS los correos en desarrollo). `npm run dev` fuera de Docker usa `8080` o el siguiente
libre y manda `/v1` a `localhost:8000`.
