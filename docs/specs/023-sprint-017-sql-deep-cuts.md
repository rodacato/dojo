# Spec 023: Sprint 017 — SQL Deep Cuts course + public courses + debugging sensei

> **Status:** ready-to-implement
> **Depends on:** PRD 021, ADR 014 (Piston), ADR 015 (courses bounded context)
> **Sprint:** 017

---

## Overview

Cuatro deliverables coordinados:

1. **SQL Deep Cuts** — wire-up del draft de Sprint 016 a un curso en vivo
2. **Cursos públicos** — `isPublic` en `courses`, progreso anónimo vía localStorage + merge al loguearse
3. **Step type `read`** — UI dedicado sin editor para steps de solo explicación
4. **Sensei prompt para `debugging`** — contexto adicional cuando `exercise.category === 'debugging'`

---

## Part 1 — SQL Deep Cuts wire-up

### 1.1 Activar el draft

**File:** `apps/api/src/infrastructure/persistence/seed-courses-draft-sql.ts` → renombrar a `seed-courses-sql-deep-cuts.ts` y remover el bloque comentado

**File:** `apps/api/src/infrastructure/persistence/seed-courses.ts`

Importar las constantes del nuevo módulo y pasarlas a `seedOneCourse()`:

```typescript
import {
  SQL_DEEP_CUTS_COURSE,
  SQL_DEEP_CUTS_LESSONS,
  SQL_DEEP_CUTS_STEPS,
} from './seed-courses-sql-deep-cuts'

await seedOneCourse(db, {
  courseData: SQL_DEEP_CUTS_COURSE,
  lessonsData: SQL_DEEP_CUTS_LESSONS,
  stepsData: SQL_DEEP_CUTS_STEPS,
})
```

### 1.2 Alinear `step.type` con el UI

El schema tiene `type: varchar(20).default('exercise')`. El draft usa `'explanation'`. El seed anterior usa `'challenge'`. El CODE_SCHOOL_PLAN propone `'read' | 'code' | 'challenge'`.

**Decisión:** adoptar los tres del plan. Migrar valores existentes en Sprint 017:
- `'explanation'` → `'read'`
- `'exercise'` (default) → `'challenge'` (los existentes ya tienen testCode)

Migration 0013 incluye:
```sql
UPDATE steps SET type = 'read' WHERE type = 'explanation';
UPDATE steps SET type = 'challenge' WHERE type = 'exercise';
```

El seed de SQL Deep Cuts se escribe directamente con los tres tipos nuevos. Los cursos previos (TS Fundamentals, JS DOM Fundamentals) se re-seedean con los tipos correctos.

### 1.3 testCode para los 6 steps `challenge`

**Pattern confirmado** (ya usado en `sql-advanced.ts`): `CREATE TEMP TABLE` + `INSERT` + la solución del usuario se ejecuta + `DO $$ BEGIN ... RAISE EXCEPTION 'FAIL...' END $$`.

Los 6 steps de SQL Deep Cuts que requieren `testCode`:

| Step | Lesson | Técnica |
|---|---|---|
| 1.2 | Window Functions | `RANK() OVER (PARTITION BY)` — rank empleados por departamento |
| 1.3 | Window Functions | `SUM() OVER (ORDER BY ROWS UNBOUNDED PRECEDING)` — running totals |
| 2.2 | CTEs | Refactor subquery 3-niveles a CTE legible |
| 2.3 | CTEs | CTE encadenada — ratio sobre agregado previo |
| 3.2 | Real-World | Cohort analysis básico por mes de signup |
| 3.3 | Real-World (challenge final) | "Fix this slow report" — rewrite con CTE + window functions |

**Verificación manual:** cada `testCode` ejecutado contra Piston **antes** del commit. Guardar evidencia en comentario o checklist.

### 1.4 Marcar el curso como público

`SQL_DEEP_CUTS_COURSE.isPublic = true` (después de que Part 2 añada la columna).

---

## Part 2 — Cursos públicos + progreso híbrido

### 2.1 Migration 0013

**File:** `apps/api/src/infrastructure/persistence/drizzle/migrations/0013_public_courses_anonymous_progress.sql`

```sql
ALTER TABLE "courses" ADD COLUMN "is_public" boolean NOT NULL DEFAULT false;

ALTER TABLE "course_progress" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "course_progress" ADD COLUMN "anonymous_session_id" text;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_owner_chk"
  CHECK ((user_id IS NOT NULL) OR (anonymous_session_id IS NOT NULL));
CREATE INDEX "idx_course_progress_anon" ON "course_progress"("anonymous_session_id")
  WHERE anonymous_session_id IS NOT NULL;

-- Normalize step types to the CODE_SCHOOL_PLAN convention
UPDATE "steps" SET "type" = 'read' WHERE "type" = 'explanation';
UPDATE "steps" SET "type" = 'challenge' WHERE "type" = 'exercise';
```

### 2.2 Schema update

**File:** `apps/api/src/infrastructure/persistence/drizzle/schema.ts`

```typescript
export const courses = pgTable('courses', {
  // ...existing...
  isPublic: boolean('is_public').notNull().default(false),
  // ...
})

export const courseProgress = pgTable('course_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id), // nullable
  anonymousSessionId: text('anonymous_session_id'),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  completedSteps: jsonb('completed_steps').notNull().default([]),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).defaultNow().notNull(),
})
```

### 2.3 Domain: `CourseProgress` aggregate

**File:** `apps/api/src/domain/learning/course-progress.ts`

```typescript
interface CourseProgressProps {
  id: CourseProgressId
  owner: { kind: 'user'; userId: UserId } | { kind: 'anonymous'; sessionId: string }
  courseId: CourseId
  completedSteps: string[]  // "lessonOrder:stepOrder"
  lastAccessedAt: Date
}

class CourseProgress {
  static forUser(userId, courseId): CourseProgress
  static forAnonymous(sessionId, courseId): CourseProgress
  markStepComplete(key: string): void
  mergeFromAnonymous(other: CourseProgress): CourseProgress  // union + max(lastAccessedAt)
}
```

### 2.4 Use cases

**`TrackProgress`** (existe, extender):
- Acepta `userId?` o `anonymousSessionId?` — exactamente uno
- Si el curso no es público y no hay `userId` → reject

**`GetCourseProgress`** (existe, extender):
- Carga por `userId` si está autenticado
- Carga por `anonymousSessionId` si no

**`MergeAnonymousProgress`** (nuevo):
- Input: `userId`, `anonymousSessionId`
- Busca progreso anónimo → hace union con el del user (si existe) → reasigna a `userId` → borra el anónimo
- Idempotente (correr dos veces no duplica)

### 2.5 API endpoints

**Autenticación condicional** (pattern a añadir en middleware):

```typescript
// Nuevo helper: optionalAuth
// - Si hay bearer: resuelve userId
// - Si no hay: sigue sin userId
// - Solo rechaza si el handler lo requiere explícitamente
```

**Rutas afectadas** (`apps/api/src/infrastructure/http/routes/learn.ts` o donde vivan):

| Endpoint | Auth | Notas |
|---|---|---|
| `GET /learn/courses` | optional | Lista; si `!userId` solo devuelve `isPublic: true` |
| `GET /learn/courses/:slug` | optional | Si curso no es público y no hay userId → 404 |
| `POST /learn/execute` | optional | Si curso no es público y no hay userId → 401. Whitelist de lenguajes para anónimos (sql, typescript, python, javascript-dom) |
| `POST /learn/progress` | optional | Body acepta `anonymousSessionId` cuando no hay bearer |
| `GET /learn/progress/:courseId` | optional | Query `?anonymousSessionId=X` cuando no hay bearer |
| `POST /learn/progress/merge` | **required** | Body: `{ anonymousSessionId }`. Ejecuta `MergeAnonymousProgress` |

**Rate limiting:**
- Reusar limiter anónimo de Sprint 013 (10/min por IP) en `POST /learn/execute` y `POST /learn/progress` cuando no hay userId
- Usuarios autenticados siguen con el límite existente (60/min)

### 2.6 Frontend

**File:** `apps/web/src/lib/anonymousId.ts` (nuevo)

```typescript
export function getOrCreateAnonymousId(): string {
  const KEY = 'dojo-anon-id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}

export function clearAnonymousId(): void {
  localStorage.removeItem('dojo-anon-id')
}
```

**File:** `apps/web/src/pages/CoursePlayerPage.tsx`

- Si no hay sesión autenticada: genera/lee `anonymousSessionId` y lo pasa en todas las llamadas a `/learn/*`
- Al loguearse (existing auth flow): llamar `POST /learn/progress/merge` con el `anonymousSessionId` de localStorage, luego `clearAnonymousId()`

**File:** `apps/web/src/pages/LearnCatalogPage.tsx`

- Badge "Public" junto al nombre del curso cuando `course.isPublic === true`
- Estilos: `text-xs`, `bg-accent/10`, `text-accent`, `border-accent/20`

---

## Part 3 — Step type `read` UI

**File:** `apps/web/src/pages/CoursePlayerPage.tsx`

Renderizado condicional por tipo:

```tsx
{step.type === 'read' ? (
  <ReadOnlyStep markdown={step.instruction} onNext={handleNext} />
) : (
  <>
    <StepEditor step={step} ... />
    <OutputPanel ... />
  </>
)}
```

**Nuevo componente:** `apps/web/src/components/ReadOnlyStep.tsx`

- Layout full-width del panel derecho
- Markdown renderer (reusar el existente)
- Botón primario "Next →" que marca el step como completo (equivalente a test pasado)

**Step nav:**
- Checkmark se muestra igual pero con icono distinto para `read` (📖) vs `challenge` (✓)

---

## Part 4 — Sensei prompt para `debugging`

**File:** ubicar dónde se construye el prompt del sensei (probablemente en `apps/api/src/application/practice/` o en el adapter de Anthropic)

Búsqueda rápida: `exercise.category` o `PROMPT_TEMPLATES` para localizar el punto de inserción.

Añadir en el contexto del prompt:

```typescript
const debuggingContext = exercise.category === 'debugging'
  ? '\n\nContext: This is a bug-fix exercise. The developer received broken code and was asked to find and fix the bug. Evaluate whether they identified the root cause (not just patched the symptom), whether they understood WHY the code was wrong, and whether their fix is minimal and targeted.'
  : ''
```

**Verificación:** correr uno de los 5 katas `debugging` de Sprint 016 end-to-end en dev y confirmar que la evaluación del sensei menciona causa raíz.

---

## Verification checklist

### Tests nuevos
- [ ] `CourseProgress.mergeFromAnonymous` — union de completedSteps, `lastAccessedAt = max`
- [ ] `MergeAnonymousProgress` use case — 3 casos (con overlap, sin overlap, anónimo vacío)
- [ ] `TrackProgress` use case — rechaza si curso no-público sin userId
- [ ] `GetCourseProgress` use case — carga por anonymousSessionId
- [ ] Integration test endpoint: `POST /learn/progress` sin auth para curso público pasa, para curso no-público falla con 401

### Manuales
- [ ] Cada uno de los 6 testCode de SQL Deep Cuts ejecuta en Piston localmente
- [ ] Step `read` renderiza sin editor en dev
- [ ] Flujo completo anónimo: abrir `/learn/sql-deep-cuts` en incognito, completar 2 steps, confirmar localStorage
- [ ] Flujo merge: completar 2 steps anónimo → loguearse → confirmar progreso preservado en DB
- [ ] Sensei para debugging menciona causa raíz en evaluación de `fix-pagination-offset`

### Obligatorios
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm lint` pasa
- [ ] `pnpm test --filter=api` todos los tests pasan
- [ ] Migration 0013 corre sin errores contra DB fresh y contra DB existente
- [ ] README.md + CHANGELOG.md + ROADMAP.md actualizados

---

## Rollback

Si el contenido de SQL Deep Cuts revela problemas (testCode frágil, step mal secuenciado) al verificar contra Piston:
- Mantener curso como `status: 'draft'` (no visible en catálogo público)
- Cerrar sprint con Parts 2-4 entregados (cursos públicos + `read` UI + debugging prompt)
- El curso SQL Deep Cuts se arregla y publica en Sprint 018

Si la migration 0013 falla por datos existentes inesperados:
- Revert de la migration
- Investigar tipos de `steps.type` reales en producción antes de reintentarlo
