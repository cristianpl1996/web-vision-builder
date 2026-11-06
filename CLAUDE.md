# CLAUDE.md — SINERGIA

Tienda en línea de SINERGIA by BOTICAN (CBD + CBG + terpenos, uso veterinario para
perros y gatos), vendida en México en pesos (MXN) y, con tipo de cambio, en dólares (USD). Landing + catálogo + carrito + cuentas +
checkout + órdenes (en pesos MXN o dólares USD), y un panel de administración para órdenes y productos. Toda la UI va
en español de México y en lenguaje de cliente, nunca en términos técnicos.

## Arquitectura
`frontend/` (React + Vite + Tailwind + shadcn/ui) → Caddy sirve el estático y manda
`/v1/*` al `backend/` (FastAPI + SQLAlchemy async + Alembic) → Postgres.
Todo corre con `docker compose`. API bajo `/v1`, salud en `/health`, documentación
en `/v1/docs`. Auth = JWT (cliente, admin y superadmin son la misma tabla con un rol).

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
- `app/seguridad.py` — contraseñas (bcrypt), JWT y las dependencias `Actual` / `Admin` / `Superadmin`.
  Toda ruta de admin recibe `_: Admin` (o `_: Superadmin` en Ajustes); ninguna decide permisos a mano.
- `app/modelos.py` (tablas), `app/schemas.py` (entrada/salida), `migrations/` (Alembic),
  `app/semilla/` (catálogo inicial, solo si la tabla está vacía).

## Formas de pago
Dos, y se encienden o apagan en **Admin › Ajustes › Formas de pago** (el servidor exige que
quede al menos una; checkout, pedido, landing y pie muestran solo las activas):
- **Mercado Pago** (pasarela): el pago se confirma solo (abajo).
- **Transferencia o depósito con comprobante** (`metodo_pago = "transferencia"`): el pedido
  muestra los «Datos para transferencia» de Ajustes, el cliente sube su comprobante (foto o PDF,
  validado por contenido) en `/pedido/{id}`, al panel le llega un correo y el admin lo revisa y
  marca «Pagada». Los comprobantes son PRIVADOS: viven en `COMPROBANTES_DIR` (volumen propio,
  fuera de `/v1/media`) y solo los entrega la API al dueño del pedido y al panel.
- Un pedido pendiente puede cambiar de una a otra (reintentar con MP, o subir comprobante).
WhatsApp queda como canal de ayuda, no como forma de pago.

## Mercado Pago
Checkout Pro. Las credenciales se cargan en **Admin › Ajustes** (cifradas): Access Token,
Public Key y la clave secreta del webhook. El pago se confirma por el webhook
`/v1/pagos/webhook/mercadopago` (firma `x-signature` verificada) y, al volver a la tienda,
consultando la API de MP (`/ordenes/{id}/verificar-pago`). En los dos casos el pago se LEE
de la API de MP y se exige monto y moneda exactos. En producción hay que poner
`WEBHOOK_URL_PUBLICA` (https) y registrar esa URL en el panel de Mercado Pago.

## Roles y semilla
- `cliente` compra · `admin` maneja órdenes y productos · `superadmin` además Ajustes
  (credenciales de Mercado Pago, SMTP, envío y monedas). En el backend: `Admin` admite admin y
  superadmin; `Superadmin` solo superadmin (rutas de Ajustes).
- Ninguna cuenta del panel se crea desde la web.
  `docker compose exec backend python -m app.sembrar` deja los 3 usuarios de prueba
  (`superadmin@`, `admin@` y `cliente@sinergia.local`, contraseña `Sinergia2026`), el catálogo con fotos y
  precios (solo si está vacío) y ajustes de ejemplo (solo los vacíos). Se puede correr las veces que
  sea. En producción exige `--password` y no toca los ajustes (ahí no hay valores de ejemplo). Para un superadmin suelto: `python -m app.crear_superadmin`.

## Monedas
Los productos tienen su precio en pesos. Con «Tipo de cambio» en Admin › Ajustes, el cliente
elige MXN o USD (selector en la barra y en el checkout). El servidor convierte con
`services/ordenes.convertir` (dólares enteros, hacia arriba); el envío gratis se decide en pesos.
Cada orden guarda `moneda` y `tipo_cambio`. Mercado Pago cobra en la moneda de la orden; en USD
solo si se marca «Mi cuenta acepta dólares» (las cuentas de México cobran en pesos): si no,
los pedidos en dólares se pagan por transferencia.

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
  página de regreso del navegador. Una transferencia la confirma una persona del panel
  al revisar el comprobante: subir un comprobante NO marca la orden como pagada.
- **La orden guarda su copia** del nombre y el precio de cada producto al comprar:
  cambiar o borrar un producto no altera órdenes viejas.
- **Cada cliente ve solo lo suyo**; lo de administración exige admin o superadmin EN EL
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
- Frontend: `cd frontend && npm test && npx tsc -p tsconfig.app.json --noEmit && npm run build`.
  `npm test` (Vitest) fija que lo que la tienda muestra (conversión a dólares, envío, formas de
  pago) coincide con las reglas del backend: si cambias una, cambia las dos y sus pruebas.
- Migraciones: `cd backend && .venv/Scripts/alembic revision --autogenerate -m "..."`;
  el contenedor aplica `alembic upgrade head` al arrancar.

## Puertos en desarrollo
Postgres `5433` (para no chocar con otro Postgres local), API `8000`, web en Docker
`8090`, Vite en Docker `5174` (perfil `dev`), Mailpit `8025` (perfil `dev`: ahí llegan
TODOS los correos en desarrollo). `npm run dev` fuera de Docker usa `8080` o el siguiente
libre y manda `/v1` a `localhost:8000`.
