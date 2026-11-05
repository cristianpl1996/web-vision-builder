---
name: juez
description: Revisión con criterio de una rama antes del merge — estructura (capas, una sola respuesta por pregunta, «judo»), bugs y seguridad, o las dos con un solo veredicto. Úsala SOLO cuando la persona la pida por nombre («/juez», «pásale el juez»): cuesta uso de Claude y no reemplaza la revisión de Cristian.
disable-model-invocation: true
---

# El juez

El segundo de «Los árbitros del código» (`CLAUDE.md`). La máquina (ESLint y Ruff,
en cada edición vía `.claude/hooks/arbitro.mjs`) decide gratis todo lo que una regla
puede decidir. Al juez se le pregunta lo que solo un juez puede contestar: si el
cambio está bien PLANTEADO. Propone, no arregla.

## Qué revisar

`$ARGUMENTS` elige la pasada y el alcance:

| Argumento | Pasada |
|---|---|
| `estructura` | solo [estructura.md](estructura.md) |
| `bugs` | solo [bugs.md](bugs.md) |
| nada, o `todo` | las dos en paralelo, con un veredicto |

Cualquier otra cosa es el alcance: una rama, un rango (`main..HEAD`) o una lista
de archivos. Sin alcance, todo lo que la rama cambió respecto de `main`, **incluido
lo que no está commiteado**: `git diff $(git merge-base main HEAD)` más los archivos
nuevos de `git status --porcelain`.

## Pasos

1. **La máquina primero.** Sobre los archivos del alcance:
   `cd frontend && npx eslint <src/…>` y `cd backend && uvx ruff@0.16.7 check <app/…>`.
   Si algo falla, para y dilo: pagarle al juez lo que una regla ya marca es el
   orden al revés.
2. **Junta el diff UNA vez**: los archivos tocados con sus líneas (+/−) y el total.
   Si pasa de ~3.000 líneas cambiadas, dilo ANTES de seguir y propone partirlo.
3. **Las pasadas.** Con las dos, lanza dos agentes `general-purpose` en el MISMO
   mensaje. A cada uno: la ruta de su rúbrica (que la lea entera), que lea las
   secciones de `CLAUDE.md` que tocan los archivos del diff, el comando exacto del
   diff y la lista de archivos. Que devuelvan hallazgos con `archivo:línea`, la
   evidencia y la gravedad, y que lo que no pudieron confirmar sin correr código lo
   digan así. Con una sola pasada, hazla tú siguiendo su rúbrica.
4. **Un solo veredicto, en español:**
   - junta los repetidos; si las dos pasadas encontraron lo mismo, súbelo de gravedad;
   - si se contradicen, toma partido y di por qué;
   - ordena por lo que más duele;
   - cada hallazgo: `archivo:línea` · qué está mal · qué regla rompe · el arreglo,
     marcado **judo** si borra complejidad en vez de moverla;
   - cierra con **Se integra** o **Todavía no**, y en ese caso cuáles bloquean.
5. **No cambies nada.** Si después piden aplicar: solo los de gravedad alta, de a
   uno, diciendo antes qué vas a cambiar, con lint y tests después de cada uno.

Las rúbricas adaptan las skills `thermos` de [cursor/plugins](https://github.com/cursor/plugins)
(commit `c1c0a32`, MIT, ver `LICENSE-thermos`), vía las de Hubu, reescritas sobre las
reglas de SINERGIA. Son archivos sueltos a propósito: cualquier agente las puede leer.
