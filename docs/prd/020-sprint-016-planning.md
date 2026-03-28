# PRD-020: Sprint 016 — Surprise me + Fix-the-bug + SQL Advanced

> **Status:** advancing to spec
> **Date:** 2026-03-27
> **Author:** Lucía Navarro, con input del panel de expertos + MARKET_RESEARCH.md review

---

## Idea en una frase

Reducir la fricción de entrada al kata loop, añadir nuevos formatos de ejercicio que reflejan trabajo real, y expandir el catálogo SQL con contenido avanzado que ningún competidor cubre bien.

---

## Por qué ahora

Sprint 015 cerró el segundo curso y el iframe runner. El catálogo de cursos está en buen estado (2 cursos, 2 idiomas). El kata loop existe y funciona. Los dos problemas que quedan:

1. **Fricción de selección:** El Day Start obliga a elegir entre 3 opciones. Para usuarios recurrentes que quieren practicar sin pensar, esto es fricción innecesaria.
2. **Uniformidad de ejercicios:** Todos los kata actuales son "implementa esto desde cero". El mercado y el panel coinciden en que los kata de debugging y refactoring son más cercanos al trabajo real y más diferenciadores vs. LeetCode.
3. **Catálogo SQL débil:** Los ejercicios SQL actuales son entry-level. Window functions, CTEs, y optimización de queries son temas universales que nadie cubre bien para mid-senior.

Además, el `MARKET_RESEARCH.md` review confirma que "SQL Deep Cuts" tiene el mayor ROI como próximo curso (Tier 1, baja complejidad de runtime, alto valor SEO). El Sprint 016 incluye el diseño de ese contenido para habilitar Sprint 017.

---

## Perspectivas

### Como developer mid-senior que usa el dojo regularmente

Ya sé cómo funciona. A veces simplemente quiero practicar — sin elegir mood, sin comparar 3 opciones. Un botón "Surprise me" me lleva directo a un kata apropiado a mis preferencias e intereses. Eso es lo que hace LeetCode con el Daily Challenge, pero sin la presión de "tienes que hacerlo hoy o pierdes el streak".

### Como developer que quiere mejorar habilidades reales

Los kata de "implementa este algoritmo" no reflejan lo que hago en el trabajo. Lo que hago a diario es debuggear código roto, refactorizar funciones largas, y optimizar queries lentas. Un kata donde el código ya existe pero está mal — y mi trabajo es arreglarlo — es más honesto y más difícil de resolver con intuición.

### Como la plataforma

Más formatos de kata = más variedad en el catálogo sin aumentar la complejidad del sistema. Fix-the-bug usa el mismo Piston path, el mismo schema de ejercicio, y el mismo flujo de evaluación. El cambio es de contenido, no de arquitectura.

---

## Tensiones

| Tensión | Resolución |
|---|---|
| Surprise me vs. autonomía del usuario | El botón es opcional — siempre se puede seguir el flujo normal de selección |
| Fix-the-bug: ¿necesita nuevo tipo en schema? | No. `type: 'code'` con `starterCode` roto y `testCode` validador. La diferencia es contenido, no arquitectura |
| SQL kata: ¿SQLite o PostgreSQL en Piston? | PostgreSQL — ya soportado en ADR 014. Los ejercicios avanzados requieren window functions que SQLite no soporta bien |
| SQL Deep Cuts course: ¿Sprint 016 o 017? | Diseño del contenido en Sprint 016 (outline del curso como seed data draft). Implementación en Sprint 017 |

---

## Scope — Sprint 016

### 1. Surprise me button

Un botón de entrada directa al kata loop desde la pantalla de Day Start.

**UX:**
- Botón "Surprise me" en `DayStartPage`, visible junto a la opción normal de continuar
- Al hacer click: llama al endpoint de selección de ejercicios (ya existe) con las preferencias del usuario, selecciona uno aleatoriamente del resultado, navega directamente al kata
- No se muestra la pantalla de selección de 3 opciones
- Si el usuario no tiene preferencias configuradas: usa defaults (mid level, random)
- Toast breve: "Randomly selected: [exercise title]" durante la carga

**Backend:** Sin cambios. El endpoint de ejercicios ya devuelve opciones ponderadas por preferencias.

**Frontend:** Solo `DayStartPage.tsx` y navegación programática.

---

### 2. Fix-the-bug kata (3-5 ejercicios)

Nuevos ejercicios en el catálogo de la Practice loop donde el `starterCode` es código intencionalmente roto.

**Formato:**
- `type: 'code'` — misma infraestructura, sin cambios de schema
- `starterCode`: código con un bug específico (no compile error — código que ejecuta pero falla los tests)
- `testCode`: suite de tests que describe el comportamiento correcto. Falla con el código roto, pasa con el fix
- Prompt al sensei adaptado: se le informa que el ejercicio era "find and fix the bug" para que evalúe si el developer identificó la causa raíz, no solo parcheó el síntoma
- `category`: `debugging`

**Ejercicios a crear (TypeScript + Python + Go):**

| # | Título | Lenguaje | Bug | Dificultad |
|---|---|---|---|---|
| 1 | Off-by-one in pagination | TypeScript | `page * limit` en vez de `(page - 1) * limit` | Easy |
| 2 | Mutable default argument | Python | `def add(item, lst=[])` — default mutable arg | Medium |
| 3 | Race condition in counter | Go | Goroutines sin mutex | Medium |
| 4 | Silent truncation | TypeScript | `parseInt` sin radix, trunca floats | Easy |
| 5 | Wrong nil check | Go | `err != nil` después de asignación que siempre retorna nil | Medium |

---

### 3. SQL advanced kata (3-5 ejercicios)

Nuevos ejercicios SQL que cubren técnicas de mid-senior. Corren en Piston con PostgreSQL (ya soportado).

**Ejercicios a crear:**

| # | Título | Técnica | Dificultad |
|---|---|---|---|
| 1 | Department salary rankings | Window functions: `RANK() OVER (PARTITION BY)` | Medium |
| 2 | Running monthly totals | Window functions: `SUM() OVER (ORDER BY)` acumulativo | Medium |
| 3 | Org chart traversal | Recursive CTE: todos los reportes de un manager | Hard |
| 4 | Flatten nested subquery | CTEs: reescribir 3 niveles de subquery anidado | Medium |
| 5 | Churn analysis | Real-world: usuarios activos hace 3 meses que no compraron el mes pasado | Hard |

Cada ejercicio tiene `testCode` SQL que verifica el resultado con queries de validación.

---

### 4. SQL Deep Cuts — diseño de contenido (para Sprint 017)

No se implementa en Sprint 016 — se diseña como draft del seed data.

**Estructura del curso:**
- `slug: 'sql-deep-cuts'`, `language: 'sql'`, `accentColor: '#336791'` (PostgreSQL azul)
- Tagline: "The queries nobody taught you"
- 3 lecciones, ~9 steps

**Lección 1: Window Functions**
- Step 1.1: Explicación (markdown) — qué son las window functions, OVER(), PARTITION BY
- Step 1.2: RANK() por categoría — ejercicio
- Step 1.3: Running totals con SUM() acumulativo — ejercicio

**Lección 2: CTEs y Subqueries**
- Step 2.1: Explicación — cuándo usar CTE vs subquery
- Step 2.2: Refactorizar subquery anidado a CTE legible — ejercicio
- Step 2.3: CTE encadenada: calcular ratio sobre agregado previo — ejercicio

**Lección 3: Queries del mundo real**
- Step 3.1: Explicación — análisis de retención y churn
- Step 3.2: Cohort analysis básico — ejercicio
- Step 3.3 (challenge): "Fix this slow report" — query lento dado, reescribir con CTEs + window functions

---

## Qué NO está en Sprint 016

- Python course (se defer a Sprint 017 después de SQL Deep Cuts)
- Admin UI para cursos
- Kyu/Dan ranking system (backlog largo plazo)
- "Code Review" kata format (backlog Sprint 017+)
- "After solving: approaches" (panel lo deferred en Sprint 015)
- Canvas / CSS via iframe courses

---

## Opciones evaluadas

### Option A: Los tres items (elegido)

Surprise me + fix-the-bug kata + SQL advanced kata. SQL Deep Cuts solo diseño de contenido.

**Pros:** Variedad alta, todo reutiliza infraestructura existente, deliverable claro.
**Contras:** El fix-the-bug requiere buen judgment editorial — el bug tiene que ser sutil, no obvio.
**Complejidad:** Baja-media. El mayor esfuerzo es la calidad del contenido, no la implementación.

### Option B: Solo Surprise me + SQL avanzado (sin fix-the-bug)

**Descartado:** Fix-the-bug es el feature de mayor diferenciación vs. competidores. No tiene costo de infraestructura — es puro contenido.

### Option C: Incluir SQL Deep Cuts completo

**Descartado:** El curso requiere diseño cuidadoso de la secuencia de pasos y testCode SQL. Mejor diseñarlo en Sprint 016 e implementarlo en Sprint 017 cuando el diseño está validado.

---

## Expert panel notes

**Marcus Webb (UX/Frontend):** El Surprise me button tiene respaldo de mercado — LeetCode's Daily Challenge es su tool de retención #1. Nuestra versión es más respetuosa: sin streak pressure, con preferencias del usuario. Implementación frontend-only, ~1 día.

**Sofia Marchetti (DB/SQL):** Los 5 ejercicios SQL avanzados cubren exactamente los gaps que el mercado research confirmó: window functions y CTEs son lo que mid-senior quiere aprender y ninguna plataforma enseña bien en contexto práctico. Los recursive CTEs son el punto de diferenciación más fuerte. El testCode SQL en Piston ya funciona — solo es contenido.

**Priya Nair (DDD):** Fix-the-bug no necesita cambios de schema ni de dominio. El campo `starterCode` ya existe. El `testCode` ya existe. La evaluación del sensei es por prompt engineering, no por código. Zero complejidad arquitectural.

**Dr. Emeka Obi (learning design):** El diseño de contenido de SQL Deep Cuts en Sprint 016 es la decisión correcta — no implementes un curso sin haber pensado la secuencia completa de pasos y validado el testCode pattern en SQL. Un sprint de diseño → un sprint de implementación es el orden correcto.

**Jae-won Oh (DevOps):** Los carry-forwards de Piston production verification y EXPLAIN ANALYZE en producción siguen pendientes. Si hay un deploy en Sprint 016, eso cierra esos dos items sin esfuerzo adicional.

---

## Carry-forwards de Sprint 015

- [ ] Piston production verification (Kamal) — requiere deploy
- [ ] Dashboard EXPLAIN ANALYZE en producción — requiere deploy

---

## Next step

- [ ] Crear spec: `docs/specs/022-sprint-016.md`
