# Rúbrica de bugs y seguridad

Revisa SOLO lo que el diff agrega o cambia: la deuda vieja no es de este cambio. Sé
exhaustivo, pero no infles: un «alta» que no lo es enseña a ignorar al juez.

## Qué buscar

1. **La plata.** Es una tienda: lo más grave es cobrar mal.
   - **El precio lo decide el servidor.** El total de una orden se recalcula en el
     backend desde los ids de producto y las cantidades; un precio, subtotal o
     descuento que llega del navegador no se usa nunca.
   - **El pago lo confirma la pasarela**, por webhook firmado y verificado, nunca la
     página de regreso del navegador. El webhook es idempotente: el mismo aviso dos
     veces no marca dos pagos ni manda dos correos.
   - Ninguna llamada a la pasarela ni ningún envío de correo dentro de una transacción
     de base de datos que todavía puede deshacerse.
2. **Lo que se rompe sin que los tests se enteren.** Sigue cada cambio hasta todas
   sus puertas: la tienda pública, la cuenta del cliente y el panel (admin y superadmin)
   leen los MISMOS services. Un cambio de forma en el JSON rompe al frontend
   (`frontend/src/services/*`).
3. **Fugas.**
   - **Entre clientes**, la más grave: toda consulta de órdenes, direcciones o
     datos de cuenta filtra por el usuario de la sesión; un id que llega del cliente
     se valida contra ese usuario.
   - **De rol**: lo de administración exige admin o superadmin (y Ajustes solo superadmin) en el BACKEND. Un endpoint
     nuevo sin guarda es un permiso abierto; esconder el botón no es control.
4. **Seguridad.** Entrada sin validar, SQL armado con strings, contraseñas sin hash,
   secretos en el código o en los logs, datos personales (dirección, teléfono) en
   respuestas que no los necesitan, archivos subidos sin validar tipo y tamaño.
5. **Lo que rompe a quien ya compró.** Datos existentes: una migración que no
   contempla filas viejas, una columna nueva NOT NULL sin valor por defecto, un
   producto borrado que deja órdenes viejas sin nombre ni precio (la orden guarda
   su propia copia del nombre y del precio al comprar).
6. **Lo que rompe el despliegue.** Variables de entorno nuevas o renombradas,
   puertos, el `Caddyfile`, una migración. No son bugs, pero van escritos en el PR
   o se pierden.

## Reglas

- **Nada de investigación a medias.** Si puedes leer el otro lado —el backend que
  valida, el service que filtra—, léelo antes de reportar.
- Lo que no se puede confirmar sin correr el código se dice así, con lo que habría
  que correr.
- **Alta** = se le rompe algo a un cliente, se fuga algo, o se cobra mal, de más o
  dos veces. **Media** = pasa en un caso concreto que se puede describir.
  **Baja** = endurecimiento.
