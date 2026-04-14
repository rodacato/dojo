# PRD-021: Sprint 017 — SQL Deep Cuts course + public courses + debugging sensei

> **Status:** advancing to spec
> **Date:** 2026-03-28
> **Author:** Lucía Navarro, con input del panel de expertos (Priya, Darius, Yemi, Marta, Soren, Amara)

---

## Idea en una frase

Implementar el primer curso estilo Code School ("SQL Deep Cuts") con soporte completo de cursos públicos sin login y progreso híbrido localStorage/DB, cerrando el loop de acquisition funnel descrito en `CODE_SCHOOL_PLAN.md`.

---

## Por qué ahora

Sprint 014 construyó la infraestructura de cursos. Sprint 015 añadió un segundo runtime (iframe) y un segundo curso. Sprint 016 diseñó el contenido de SQL Deep Cuts como draft. El plan de Code School establece que el formato es el producto — y hasta hoy no hemos ejercitado el formato completo:

- Todos los cursos actuales requieren login (pierde el acquisition funnel que el plan enumera como feature central)
- No hay UI específica para steps tipo `read` (el draft de SQL Deep Cuts tiene 3 steps de explicación pura — si renderizan editor vacío, rompen ritmo)
- El schema de progreso asume `userId` no-null — bloqueador para cualquier curso público
- Los katas `category: 'debugging'` entregados en Sprint 016 aún no tienen adaptación de prompt del sensei (carry-forward)

Sprint 017 cierra los cuatro gaps. Es el primer sprint donde un developer que llega por SEO puede completar un curso end-to-end sin login, y donde el sensei sabe que un ejercicio de debugging se evalúa distinto.

---

## Perspectivas

### Como developer que llega por SEO buscando "advanced SQL"

Hago click desde Google, caigo en `/learn/sql-deep-cuts`, veo un curso con identidad visual distinta (azul PostgreSQL), empiezo a leer lección 1 y a las 2 minutos ya estoy ejecutando window functions en el browser. No me pidieron cuenta. Al final, completé el curso — el dojo me dice "practica bajo presión con katas SQL" y yo decido si quiero cuenta o no.

### Como la plataforma

Los cursos públicos expanden la superficie sin aumentar la complejidad de dominio. Reusamos `CourseRepository`, `ExecuteStep`, `TrackProgress` — solo hay que permitir `userId` null y añadir UI para el step type `read`. El acquisition funnel no requiere analytics nuevos; si el curso funciona, Sprint 018 puede medir conversion.

### Como el creador del curso

El draft de Sprint 016 tiene 9 steps con contenido ya pensado. Mi trabajo en Sprint 017 es traducirlo a seed data ejecutable — escribir los `testCode` robustos para cada uno, verificarlos contra Piston, y activar el seed. No invento contenido nuevo; solo lo hago ejecutable.

---

## Tensiones

| Tensión | Resolución |
|---|---|
| Progreso anónimo: ¿agregado nuevo o `userId` nullable? | Nullable. Darius: introducir `AnonymousProgress` como agregado separado aumenta la complejidad sin beneficio. Reusamos `CourseProgress` con identificador de sesión anónima (localStorage). |
| Merge al hacer login: ¿union, overwrite, discard? | Union de `completedSteps` + `lastAccessedAt` más reciente. Ya resuelto así en Sprint 014. |
| Cursos públicos = superficie de ataque | Reusar rate limiter anónimo (Sprint 013: 10/min por IP). Whitelist de lenguajes en endpoint público: solo los runtimes ya soportados. |
| Step type `read` vs `code` vs `challenge` | El schema ya tiene columna `type`. En Sprint 017 se distingue en el UI: `read` oculta el editor, `code` muestra editor sin tests, `challenge` tiene validación Piston. |
| ¿Share card de completación en Sprint 017? | Defer a Sprint 018 (Amara). El funnel mínimo viable es el CTA de texto al final del curso. |
| ¿"After solving: approaches" para cada step? | Defer a Sprint 018 (Priya). Foco en Sprint 017 = curso funcional + cursos públicos. |

---

## Scope — Sprint 017

### 1. SQL Deep Cuts — wire-up del draft

El draft en `seed-courses-draft-sql.ts` ya tiene:
- Estructura del curso (slug, tagline, accentColor)
- 3 lecciones (Window Functions, CTEs, Real-World Analysis)
- 9 steps con instrucciones en markdown (mezcla de `explanation`, `exercise`, `challenge`)

**Trabajo en Sprint 017:**
- Activar el draft: integrar con `seedOneCourse()`, eliminar bloque comentado
- Escribir `testCode` ejecutable para cada step tipo `exercise`/`challenge` (6 total)
- Verificar cada step manualmente contra Piston antes del commit final
- Alinear `type` con los valores del UI (decidir: `read | code | challenge` o mantener `explanation | exercise | challenge`)
- Marcar `isPublic: true` en el curso

### 2. Cursos públicos + progreso híbrido

**Backend:**
- Migration 0013: `course_progress.user_id` → nullable + columna `anonymous_session_id TEXT` (nullable)
- `CourseProgress` aggregate: acepta userId opcional + anonymousSessionId opcional (uno u otro, exclusivos)
- `TrackProgress` use case: si `isPublic && !userId`, usa `anonymousSessionId` del payload
- `GetCourseProgress` use case: carga por userId **o** por anonymousSessionId
- Endpoint `POST /learn/progress` y `GET /learn/progress/:courseId`: permiten request sin auth si el curso es público
- Rate limit estricto (10/min por IP) en endpoints de ejecución y progreso para usuarios anónimos
- Whitelist de lenguajes: solo `sql`, `typescript`, `python`, `javascript-dom` vía endpoint público

**Merge al loguearse:**
- Al autenticarse, si existe `anonymousSessionId` en localStorage → frontend envía `POST /learn/progress/merge` con el ID anónimo
- Union de `completedSteps`, conservar el `lastAccessedAt` más reciente, reasignar a `userId`, borrar el anónimo
- Test de integración que cubra 3 casos: merge con overlap, sin overlap, anónimo vacío

**Frontend:**
- `CoursePlayerPage`: si no hay sesión, genera `anonymousSessionId` (UUID v4) y lo persiste en localStorage bajo `dojo-anon-id`
- `LearnCatalogPage`: badge visual "Public" en cursos con `isPublic === true`

### 3. Step type `read` — UI dedicado

**Frontend:**
- `CoursePlayerPage`: cuando `step.type === 'read'` (o `'explanation'`), **oculta el editor completo** y muestra solo el markdown con botón "Next →"
- Los steps `code` y `challenge` mantienen el layout actual con editor + panel de output
- Añadir indicador visual al step nav (checkmark distinto para read vs challenge)

### 4. Sensei prompt — contexto para `debugging`

Carry-forward de Sprint 016. Zero complejidad:
- En la construcción del prompt del sensei (donde sea que viva actualmente), si `exercise.category === 'debugging'`, añadir párrafo de contexto: *"This is a bug-fix exercise. Evaluate whether the developer identified the root cause vs. just patching the symptom."*
- Verificar manualmente contra uno de los 5 katas de Sprint 016

---

## Qué NO está en Sprint 017

- **"After solving: approaches"** — defer a Sprint 018 (Priya: scope creep)
- **Share card de completación de curso** — defer a Sprint 018 (Amara: candidato fuerte)
- **Badge específico de curso** — Recognition context ya existe; merece su propia iteración
- **Sensei on-demand dentro del course player** — Phase 2 según CODE_SCHOOL_PLAN (Yemi)
- **Python course** — defer hasta después de SQL Deep Cuts validado
- **"Code Review" kata format** — formato nuevo, PRD propio
- **Cursos previos (TS Fundamentals, JS DOM) a público** — no se migran en este sprint; se prueba el modelo en SQL Deep Cuts primero

---

## Opciones evaluadas

### Option A: Los cuatro items (elegido)

SQL Deep Cuts wire-up + cursos públicos + step type `read` UI + sensei debugging prompt.

**Pros:** Cierra el loop del CODE_SCHOOL_PLAN. Cada pieza habilita la siguiente.
**Contras:** El curso depende de `read` UI y de cursos públicos — acoplamiento alto en el sprint.
**Complejidad:** Media. El cambio de schema es pequeño; la mayor inversión es testCode SQL.

### Option B: Solo SQL Deep Cuts privado (sin cursos públicos)

**Descartado:** Perdemos el principal punto del CODE_SCHOOL_PLAN — el acquisition funnel. Además, "read" UI sigue siendo necesario incluso en modo privado.

### Option C: Incluir share card + badge + approaches

**Descartado:** Priya — es sprint creep. Tres items de polish multiplican la superficie sin que el core esté validado.

---

## Expert panel notes

**Priya Menon (C1):** El foco es SQL Deep Cuts funcional + cursos públicos. Todo lo demás es polish para Sprint 018. Un curso público mediocre es peor que ningún curso público.

**Darius Osei (C2):** `userId` nullable + `anonymousSessionId` en `course_progress` es el patrón de menor fricción. Introducir un agregado paralelo `AnonymousProgress` sería overengineering. Migration 0013, retrocompatible.

**Yemi Okafor (C4):** El prompt para `debugging` es 20 líneas. No justifica un sprint aparte — que entre como parte del Sprint 017 aunque sea de otra área. El sensei on-demand dentro del course player se mantiene en Phase 2 (fuera de Sprint 017).

**Marta Kowalczyk (C5):** No-negociables: (1) Rate limiter anónimo ya existe — reusar. (2) Whitelist de lenguajes en el endpoint público. (3) `localStorage` solo guarda `completedSteps` + `anonymousSessionId`, nunca PII ni flags confiables server-side.

**Soren Bachmann (C6):** El step type `read` sin editor es crítico para el curso SQL. Sin eso, las 3 explicaciones rompen el ritmo. Badge visual "Public" en el catálogo evita confusión.

**Amara Diallo (S situacional):** Sin share card de completación, el acquisition funnel es inmaduro. Sugiere meterlo si hay aire — aceptado, pero no bloquea el sprint. En caso de no entrar, asegurar CTA de texto final: "Practice under pressure — dojo katas are waiting."

---

## Carry-forwards a Sprint 018

- Share card de completación de curso (Amara)
- "After solving: approaches" en course player (Soren, deferido desde Sprint 015)
- Piston production verification (requiere deploy)
- Dashboard EXPLAIN ANALYZE (requiere deploy)
- Badge específico por curso completado (Recognition context)

---

## Next step

- [ ] Crear spec: `docs/specs/023-sprint-017-sql-deep-cuts.md`
