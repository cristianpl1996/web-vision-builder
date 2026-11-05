# Cómo se trabaja en SINERGIA

Una página. Lo que no está aquí está en `CLAUDE.md`, que es la constitución del
proyecto: cada regla lleva escrito POR QUÉ existe.

## 1. El primer día

1. Lee `CLAUDE.md` y `frontend/CLAUDE.md`.
2. Levanta el stack: `cp .env.example .env && docker compose up -d --build`
   (web en http://localhost:8090, API en http://localhost:8000/v1/docs).
3. Corre los tests UNA vez antes de tocar nada («Correr el proyecto y los tests» en
   `CLAUDE.md`). Si algo falla en limpio, avisa: es el punto de partida, no tu bug.
4. Con Claude Code, los plugins que el repo declara en `.claude/settings.json`:
   ```
   /plugin marketplace add obra/superpowers
   /plugin marketplace add DietrichGebert/ponytail
   /plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
   /plugin install superpowers@superpowers-dev
   /plugin install skill-creator@claude-plugins-official
   /plugin install ponytail@ponytail
   /plugin install ui-ux-pro-max@ui-ux-pro-max-skill
   ```
   Con otro agente, `AGENTS.md` le dice dónde leer.
5. Ten `uv` instalado: el lint del backend usa `uvx ruff@0.16.7` sin instalar nada más.

## 2. Ramas y commits

- **`main` es producción.** Solo entra por PR revisado.
- **`dev` es la rama de trabajo** (el monorepo frontend + backend vive aquí hasta
  que el hosting apunte a `frontend/`). Ramas cortas salen de `dev` y vuelven a `dev`.
- Commit: `tipo(ámbito): qué cambia para quien lo usa`, en español.
  Ej.: «feat(ordenes): el total lo recalcula el servidor».

## 3. Una tarea, de principio a fin

**¿Es trivial?** Un texto, un ajuste de pantalla, un bug con reproducción clara.
Rama, arreglo, verificación, PR.

**¿No lo es?** Toca plata (precios, órdenes, pagos), datos de clientes, permisos o
una pantalla nueva. Entonces son tres pasos, y cada uno se aprueba antes del siguiente:

1. **Diseño** en `docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md` (skill
   `superpowers:brainstorming`). Qué problema, qué decisiones y por qué, qué se deja
   fuera, y una lista de **dudas abiertas**. Cristian aprueba o corrige.
2. **Plan** en `docs/superpowers/plans/AAAA-MM-DD-<tema>.md` (skill
   `superpowers:writing-plans`): pasos chicos, cada uno con su verificación.
3. **Código** siguiendo el plan, con tests (`superpowers:test-driven-development`
   para la lógica de plata y permisos). Antes del PR: lint y tests en verde, y
   `/juez` si el cambio es grande.
