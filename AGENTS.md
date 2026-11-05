# Para agentes de código (Cursor, Copilot, Codex, Gemini…)

Este repo se trabaja con Claude Code y sus reglas viven en `CLAUDE.md`. Léelo entero
antes de tocar nada: no es un README, es la lista de decisiones del producto y su porqué.

Después: `CONTRIBUTING.md` (el flujo de trabajo), `frontend/CLAUDE.md` (marca y
contenido) y el diseño vigente en `docs/superpowers/specs/`.

Reglas que aplican a cualquier agente:

- La solución más corta que funcione. Sin abstracciones ni dependencias especulativas.
- Toda lógica no trivial deja una verificación ejecutable (`backend/tests/test_*.py`).
- Antes de entregar, en verde: `cd frontend && npx eslint src && npm run build` y
  `cd backend && uvx ruff@0.16.7 check . && uvx ruff@0.16.7 format --check .` y los
  tests. Para revisar con criterio, las rúbricas de `.claude/skills/juez/estructura.md`
  y `bugs.md`.
- El precio lo decide el servidor y el pago lo confirma la pasarela (ver `CLAUDE.md`).
- Nunca `git commit` ni `git push` sin que la persona revise el diff.
