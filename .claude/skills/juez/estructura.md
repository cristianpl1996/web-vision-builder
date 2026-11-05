# Rúbrica de estructura

Revisa SOLO lo que el diff agrega o cambia. La pregunta no es si funciona —eso es de
los tests y de la otra pasada—: es si deja el código más fácil o más difícil de
cambiar la próxima vez.

## Ambición, con el contrapeso de la casa

Busca el **judo**: la reformulación que conserva el comportamiento y hace
DESAPARECER ramas, modos, banderas o capas enteras. Mover la misma complejidad a
otro archivo no es judo.

El contrapeso manda («Precedencia de instrucciones» en `CLAUDE.md`): **no propongas
andamiaje**. Una abstracción se justifica cuando borra ramas de dos o más sitios.
Una interfaz con una sola implementación o una capa «por si acaso» son el problema,
no el arreglo. (Excepción ya decidida: `frontend/src/services/*` son interfaces a
propósito, para cambiar la versión local por la API sin tocar pantallas.)

## Lo que se marca siempre

1. **Una pregunta, una respuesta.** ¿Cuánto cuesta esta orden? ¿Puede este usuario
   ver esto? ¿Qué estados puede tener una orden? Cada pregunta tiene UN dueño en el
   backend. Si el diff la contesta otra vez —un segundo cálculo de total, un filtro
   de rol escrito a mano— es el hallazgo más grave: dos respuestas terminan diciendo
   cosas distintas, en silencio. Un espejo backend↔frontend (los estados de orden,
   los tipos) solo vale con un test que compare los dos.
2. **La capa correcta.**
   - Backend: `routers/` hace HTTP (auth, validar la entrada, la forma de la
     respuesta); la regla de negocio va en `services/`; los modelos en `modelos/`.
   - Frontend: `services/` habla con la API, `context/` sostiene el estado,
     `lib/` es lógica pura, `components/ui/` son los primitivos y `pages/` compone.
   - La UI no es el control: toda regla que aplica la pantalla la revalida el backend.
3. **El `if` suelto.** Una condición especial metida en un flujo ajeno («si es el
   producto 1500…», «si viene del panel…») es un problema de diseño: ese dato debería
   vivir donde se decide.
4. **Contratos flojos.** Opcionales que no deberían serlo, `Any`/`dict` sin forma,
   casts que tapan una suposición, un `None` que significa dos cosas. Un `except`
   que traga o un default que inventa un valor también.
5. **Envoltorios que no pagan su precio** y **duplicar en vez de reusar**.
6. **Orquestación torpe.** Escrituras relacionadas que pueden quedar a medias (la
   orden sin sus líneas), o un `await` dentro de un bucle sobre filas.

## Gravedad

- **Alta** (bloquea): una segunda respuesta a una pregunta que ya tenía dueño;
  lógica de negocio en una capa que otra puerta necesita; un judo claro que
  borraría buena parte del diff.
- **Media**: contratos flojos, envoltorios, duplicados menores.
- **Baja**: legibilidad. Si hay altas, las bajas sobran.

Pocos hallazgos con convicción valen más que una lista larga.
