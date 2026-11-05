# SINERGIA · frontend

React + Vite + TypeScript + Tailwind + shadcn/ui. La landing, la tienda, la cuenta del
cliente, el checkout con Mercado Pago y el panel de administración (`/admin`).

```sh
npm install
npm run dev      # http://localhost:8080 — necesita la API: docker compose up -d db backend
npm run build
```

La forma recomendada de desarrollar es con Docker desde la raíz del repo:
`docker compose --profile dev up -d --build` (Vite en http://localhost:5174).

Reglas de marca y contenido: `CLAUDE.md` de esta carpeta. Reglas del proyecto: `../CLAUDE.md`.
