# Diseño: backend de la tienda SINERGIA

**Estado:** borrador para aprobar · **Fecha:** 2026-11-05 · **Base:** la propuesta
enviada a BOTICAN (módulos 4 a 9) y los contratos que ya usa el frontend
(`frontend/src/services/{auth,orders,payments}.ts`).

## Problema
Hoy la tienda funciona solo en el navegador: cuentas, carrito y órdenes viven en
localStorage. Nadie en BOTICAN ve los pedidos (llegan por WhatsApp), no se puede cobrar
en línea y el catálogo está escrito en el código. La propuesta promete: cuentas reales,
órdenes para el cliente y el superadmin, pasarela de pago y un panel para administrar
productos (de SINERGIA y de cualquier otra línea).

## Qué se construye (en este orden)

### Fase 1 · Cuentas (módulo 4)
- `POST /v1/auth/registro`, `POST /v1/auth/login` → JWT. `GET /v1/me`, `PATCH /v1/me`.
- Tabla `usuarios`: email único (minúsculas), nombre, apellidos, celular, hash bcrypt,
  `rol` (`cliente` | `superadmin`), creado_en.
- Tabla `direcciones` (de un usuario): los campos que ya pide el checkout.
- El superadmin se crea con un comando (`python -m app.crear_superadmin`), no desde la web.

### Fase 2 · Catálogo y gestión de productos (módulos 2 y 9)
- `productos`: slug, nombre, línea/marca, descripción, categoría, ficha técnica (JSON
  clave→valor), estado (`publicado` | `oculto` | `agotado`), destacado, orden.
- `presentaciones` (variantes): producto, nombre («1500 mg»), mg, volumen, concentración,
  precio MXN (entero, centavos), precio anterior opcional, orden, «próximamente».
- `fotos`: producto, archivo, orden, principal. Se guardan en el volumen `media` y se
  sirven por `/v1/media/...`; se valida tipo (jpg/png/webp) y tamaño.
- Público: `GET /v1/productos`, `GET /v1/productos/{slug}`.
- Superadmin: CRUD de productos, presentaciones y fotos (subir, ordenar, principal),
  duplicar, ocultar, agotado, destacado.
- Migración de datos: carga inicial de las 5 presentaciones actuales + 3 «próximamente».
- El frontend deja `src/data/products.ts` y lee de la API.

### Fase 3 · Órdenes (módulos 5, 7 y 8)
- `POST /v1/ordenes`: recibe SOLO `[{presentacion_id, cantidad}]` + dirección. El
  servidor busca precios, calcula subtotal, envío y total, y guarda en cada línea su
  copia de nombre y precio (regla de `CLAUDE.md`).
- `ordenes`: número legible (`SIN-000123`), usuario, dirección (copia), subtotal, envío,
  total, estado, método de pago, notas, fechas. `orden_lineas`.
- Estados y transiciones en UN lugar (`services/ordenes.py`):
  `pendiente_pago → pagada → enviada → entregada`, y `cancelada` desde las dos primeras.
- Cliente: `GET /v1/ordenes` y `GET /v1/ordenes/{id}` (solo las suyas).
- Superadmin: listado con búsqueda y filtros por estado y fecha, detalle, cambio de estado.
- Frontend: panel `/admin` (órdenes y productos) protegido por rol.

### Fase 4 · Pagos (módulo 6)
- Un adaptador por pasarela en `services/pagos/`. Se implementa SOLO la que elija
  BOTICAN (no se escriben varias «por si acaso»).
- `POST /v1/ordenes/{id}/pago` → URL del checkout alojado de la pasarela.
- `POST /v1/pagos/webhook/<pasarela>`: verifica la firma, es idempotente (guarda el id
  del evento) y pasa la orden a `pagada`. El regreso del navegador no confirma nada.
- Se mantiene «coordinar por WhatsApp» como método sin pasarela.

## Decisiones y por qué
- **Mismo stack que Hubu** (FastAPI, SQLAlchemy async, Alembic, Postgres, JWT, Docker):
  ya probado por el equipo, versiones fijadas con sus motivos.
- **Precios en centavos (enteros)**: sin errores de redondeo en totales.
- **Un solo Postgres, sin Redis ni Celery** hasta que haya un trabajo de fondo real
  (correos masivos, reportes). Los correos de la orden se envían después del commit.
- **Monolito modular**: `routers/` (HTTP), `services/` (reglas), `modelos/` (tablas).
- **Fotos en disco (volumen)**, no en S3, mientras el hosting sea un solo servidor.

## Fuera de alcance (se cotiza aparte, como dice la propuesta)
Facturación electrónica (CFDI), inventario con stock por unidades, cupones y
descuentos, multi-idioma, app móvil, correos de marketing.

## Dudas abiertas (necesito respuesta antes del plan)
1. **Pasarela de pago**: ¿Mercado Pago, Stripe, Conekta u Openpay? ¿BOTICAN ya tiene
   cuenta de comercio?
2. **Envío**: ¿tarifa fija, por zona o «se confirma por WhatsApp» como hoy? ¿Envío gratis
   desde algún monto?
3. **Hosting**: ¿dónde se despliega? (EasyPanel como Hubu, Vercel + otro servidor, …).
   Hoy `main` publica la landing desde la raíz; con el monorepo hay que apuntar el
   hosting a `frontend/` antes de pasar `dev` a `main`.
4. **Correo**: ¿con qué proveedor salen la confirmación de orden y «recuperar
   contraseña»? (Resend, SendGrid, el SMTP de BOTICAN…) y desde qué remitente.
5. **Avisos a BOTICAN**: cuando entra una orden, ¿correo, WhatsApp o solo el panel?
6. **Inventario**: ¿basta «agotado sí/no» por presentación, o necesitan contar unidades?
7. **Factura (CFDI)**: ¿la piden los clientes? Si sí, se cotiza como módulo aparte.
8. **Usuarios de administración**: ¿cuántos y quiénes? ¿Todos superadmin o hace falta
   un rol que solo vea órdenes?
