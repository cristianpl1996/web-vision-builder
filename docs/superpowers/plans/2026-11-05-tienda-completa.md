# Plan: tienda completa (backend + conexión del frontend)

Diseño base: `docs/superpowers/specs/2026-11-05-backend-design.md`. Fecha: 2026-11-05.

## Decisiones tomadas (respuestas a las dudas abiertas)
| Duda | Decisión |
|---|---|
| Pasarela | **Mercado Pago, Checkout Pro** (preferencia + redirección al checkout de MP). Se confirma por **webhook firmado** y, como respaldo, al volver del pago se consulta el pago en la API de MP. Siempre se verifica contra la API de MP (estado y monto), nunca contra lo que dice el navegador. |
| Credenciales | Pantalla **Admin › Ajustes**: Access Token, Public Key y clave secreta del webhook de MP, SMTP, envío y correo de avisos. Se guardan **cifradas** (Fernet, misma llave que firma los JWT, como `services/secretos.py` de Hubu). |
| Envío | Costo fijo + «gratis desde» configurables en Ajustes. Sin configurar = $0. |
| Correo | SMTP configurable en Ajustes (con respaldo en `.env`). En desarrollo, **Mailpit** atrapa todos los correos (http://localhost:8025). Sin SMTP, el correo se imprime en el log (como Hubu). |
| Avisos a BOTICAN | Correo al «correo de avisos» de Ajustes en cada orden nueva y en cada pago. |
| Inventario | Estado por producto: publicado, oculto, agotado o próximamente. Sin conteo de unidades. |
| Productos | Cada presentación es un producto (con `linea`, p. ej. «SINERGIA»): sirve para cualquier marca y evita una capa de variantes. Fotos subidas al volumen `media`. |
| Precios | Enteros en pesos MXN (los precios de la tienda no tienen centavos). |
| Roles | `cliente` y `superadmin`. El superadmin se crea por comando. |
| Hosting | Fuera de este plan (lo organiza Cristian). |

## Seguridad
- Contraseñas con bcrypt. JWT HS256 con `iat` y corte de sesiones (`sesiones_validas_desde`,
  como Hubu): cambiar o restablecer la contraseña cierra las demás sesiones.
- Verificación de correo por enlace firmado (48 h). Recuperar contraseña por enlace de un
  solo uso (1 h, atado al hash actual).
- Login con bloqueo de 15 min tras 5 intentos fallidos. Respuestas genéricas (no se revela
  si un correo existe).
- Toda ruta de admin exige `superadmin` en el backend. Cada cliente solo ve lo suyo.
- Subida de fotos: se valida el tipo por los bytes (JPG/PNG/WebP) y 5 MB máximo.

## Órdenes
Estados (un solo dueño: `services/ordenes.py`):
`pendiente_pago → pagada → preparando → enviada → entregada`; `cancelada` desde
pendiente_pago, pagada o preparando. «Enviada» exige transportista y número de guía.
Cada cambio queda en el historial (`orden_eventos`) y el cliente recibe correo al pagar,
al enviarse y al entregarse.

## Pasos
1. Infra: Mailpit, `frontend-dev` (Vite con recarga, perfil `dev`), base de tests.
2. Modelos + migración inicial + semilla de productos (5 presentaciones + 3 próximamente).
3. Cuentas: registro, login, verificación, recuperar contraseña, perfil y direcciones.
4. Productos: catálogo público y CRUD admin con fotos.
5. Órdenes: crear (precio en servidor), mis órdenes, admin con estados y despacho.
6. Mercado Pago: preferencia, webhook firmado e idempotente, verificación al volver.
7. Ajustes cifrados + correos.
8. Frontend: servicios contra la API, catálogo desde la API, panel `/admin`
   (Órdenes, Productos, Ajustes), páginas de verificar y recuperar contraseña.
9. Tests de cada regla de plata y permisos; lint; prueba de punta a punta en Docker.
