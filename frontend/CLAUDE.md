# frontend/CLAUDE.md — marca y contenido

## Marca
- **Logo**: `src/assets/logo-sinergia-light.png` (todo blanco, sobre el verde del hero)
  y `logo-sinergia-dark.png` (gris con «CBD+CBG & Terpenos» en verde, sobre la barra
  blanca al hacer scroll). Los originales están en `src/assets/logo.png`.
- **Color**: tokens HSL en `src/index.css` (`--primary` verde bosque, `--accent` coral de
  BOTICAN, fondos crema). En componentes, siempre por token (`bg-primary`), nunca hex suelto.
  El verde del hero es más claro a pedido del doctor: no volver al casi negro.
- **Tipografía**: Lora (títulos, `font-display`) + Plus Jakarta Sans (texto y precios).
- **Hero**: las mascotas son el perro salchicha y el gato del doctor
  (`src/assets/pets-hero*.webp`, recortadas de `hero.png`). Se ven completas: en celular
  arriba del texto y en escritorio entre el texto y la tarjeta destacada. Sin burbujas.
- **Iconos**: lucide-react. Nada de emojis como iconos.

## Contenido
- Todo texto del producto sale de BOTICAN (landing anterior o el documento del doctor).
  No inventar certificaciones, cifras ni beneficios.
- Terpenos: **Linalol, Mirceno, Nerodiol** (así lo pidió el doctor, con D).
- El catálogo se administra en el panel (`/admin › Productos`) y llega de la API. La tienda
  muestra los productos en su campo «orden» (1500 → 250 mg). Las 3 presentaciones que faltan
  son productos en estado «Próximamente» hasta que BOTICAN mande datos y fotos.
- Los frascos se dibujan en escalera por mg dentro de cada línea (`toShopItems` en
  `src/data/products.ts`). La primera foto de cada producto debe ser el frasco recortado.

## Responsive
Celular primero. Revisar a 375 y 1440 px como mínimo; nunca scroll horizontal. Los
botones miden 44 px de alto o más. El ícono de menú está alineado al alto de la palabra
SINERGIA del logo (si cambia el logo, recalibrar en `components/layout/Header.tsx`).

## Datos
Las pantallas hablan con la API solo a través de `src/services/*` y `src/lib/api.ts`
(el token de sesión va en localStorage). Lo que se lee del servidor usa React Query.
El panel vive en `src/pages/admin/` (Órdenes, Productos, Ajustes).
