# SINERGIA by BOTICAN — Landing + Tienda

Landing e-commerce (React + Vite + TypeScript + Tailwind + shadcn/ui) con carrito, cuentas de usuario y checkout.

```sh
npm i
npm run dev      # http://localhost:8080
npm run build
```

## Rutas

| Ruta | Descripción | Requiere cuenta |
|---|---|---|
| `/` | Landing + tienda | No |
| `/producto/:slug` | Detalle de producto | No |
| `/ingresar` | Iniciar sesión / registro (`?redirect=`) | No |
| `/checkout` | Dirección, envío y pago | **Sí** |
| `/cuenta` | Pedidos y direcciones | **Sí** |
| `/pedido/:id` | Confirmación del pedido | **Sí** |

El carrito funciona sin cuenta (se guarda en el navegador). La cuenta solo se pide al finalizar la compra.

## Dónde editar

- **Precios y WhatsApp:** `src/data/products.ts` (`STORE` y `PRODUCTS`). ⚠️ Los precios actuales son de referencia, pendientes de confirmar con BOTICAN. Si un producto tiene `price: null`, la tienda muestra "Precio por WhatsApp". El envío se confirma por WhatsApp.
- **Preguntas frecuentes y estados:** `src/data/content.ts`
- **Colores y tipografía:** `src/index.css` y `tailwind.config.ts`

## Pendiente antes de producción

La capa de datos está detrás de interfaces para cambiar la implementación sin tocar la UI:

1. **Autenticación:** `src/services/auth.ts`. Hoy usa `localAuthService` (cuentas guardadas en el navegador, **solo demo**). Implementa `AuthService` con Supabase Auth, Firebase u otra API y expórtalo como `authService`.
2. **Pedidos:** `src/services/orders.ts`. Implementa `OrderService` contra tu backend. **El servidor debe recalcular los totales** a partir de los IDs de producto y no confiar en los precios que envía el navegador.
3. **Pasarela de pago:** `src/services/payments.ts`. Crea un endpoint que genere el pago o la sesión (Mercado Pago, Stripe, Conekta, Openpay, Wompi...), haz que `start()` devuelva `{ type: "redirect", url }` y pon `enabled: true` en el método `card`. El checkout ya maneja la redirección.
4. Correos de confirmación, términos y condiciones, y aviso de privacidad (los enlaces del registro apuntan a `#`).
