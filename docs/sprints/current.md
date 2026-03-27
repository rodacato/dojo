# Active Block: Sprint 015 — iframe Sandbox + JavaScript DOM Course

**Started:** 2026-03-27
**Phase:** Phase 1 Alpha

**Expected outcome:** Un segundo curso ("JavaScript DOM Fundamentals") playable en `/learn`. Los ejercicios de DOM se ejecutan directo en el browser via iframe sandbox — sin costo de servidor, sin Piston. Los carry-forwards críticos de Sprint 014 quedan cerrados.

**Strategy:** Carry-forwards primero (quick wins), luego el iframe runner (enabler técnico), luego el segundo curso (el valor real).

---

## Panel sign-off

Aprobado por panel de expertos (2026-03-27):
- Priya (C1): ✅ condicional a que el sandbox habilite un curso real
- Tomás (C3): ✅ JS puro + DOM; CSS/React/Vue fuera de scope
- Darius (C2): ✅ encaja en puertos existentes; routing por `course.language` en frontend
- Soren (C6): ✅ Modo 1 (same UX); badge "Runs in browser"; live preview fuera de scope
- Valentina (S2): ✅ con patrón de testCode DOM documentado antes de escribir el curso

---

## Part 1 — Carry-forwards

- [ ] Landing page "Try a free course" CTA → `/learn`
- [ ] Rate limiter integration test (11th anon execution → 429)
- [ ] Piston production verification (Kamal deploy) — requiere deploy a producción
- [ ] Dashboard EXPLAIN ANALYZE en producción — requiere deploy a producción

---

## Part 2 — iframe Sandbox Runner (frontend)

El runner se ejecuta 100% en el browser. No hay cambios en el backend.

**Protocolo:**
1. `StepEditor` detecta `course.language === 'javascript-dom'` → usa `IframeSandboxRunner`
2. Runner construye un `srcdoc` HTML con el código del usuario + testCode inyectado
3. El testCode usa un mini runner que comunica resultados via `postMessage`
4. `IframeSandboxRunner` escucha el mensaje y retorna `TestResultDTO[]` — mismo contrato que Piston
5. Badge "Runs in browser" visible en el editor cuando el runner es iframe

**Seguridad:** `<iframe sandbox="allow-scripts">` — sin `allow-same-origin`, sin `allow-forms`, sin `allow-popups`. El iframe puede hacer `fetch()` externo (aceptable para cursos curados; documentar en ADR antes de Phase 3).

**Archivos a crear/modificar:**
- [ ] `apps/web/src/features/learn/IframeSandboxRunner.ts` — ejecuta código en iframe, retorna `TestResultDTO[]`
- [ ] `apps/web/src/features/learn/StepEditor.tsx` — routing: `javascript-dom` → IframeSandboxRunner, resto → `POST /learn/execute`

---

## Part 3 — Patrón testCode para ejercicios DOM

Antes de escribir el curso, documentar el patrón. El testCode de DOM no puede usar el mismo mini runner de TypeScript (no hay `document` en Piston).

**Patrón DOM testCode:**
```javascript
// El starterCode del usuario ya fue inyectado arriba por el runner
// Este testCode tiene acceso al DOM construido por el starterCode

let _fail = false
const _log = []

function test(name, fn) {
  try {
    fn()
    _log.push('✓ ' + name)
  } catch (e) {
    _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e)))
    _fail = true
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' got ' + JSON.stringify(actual))
    },
    toBeTruthy: () => { if (!actual) throw new Error('expected truthy, got ' + JSON.stringify(actual)) },
    toContain: (str) => {
      if (!String(actual).includes(str))
        throw new Error('expected "' + actual + '" to contain "' + str + '"')
    },
  }
}

// --- tests aquí ---
// test('el título dice Hello', () => {
//   const el = document.querySelector('#title')
//   expect(el?.textContent).toContain('Hello')
// })

// Comunicar resultados al runner padre
window.parent.postMessage({ type: 'test-results', log: _log, failed: _fail }, '*')
```

- [ ] Documentar patrón en `docs/wip/IFRAME-TESTCODE-PATTERN.md`

---

## Part 4 — Seed: JavaScript DOM Fundamentals

**Curso:** `javascript-dom` language, color `#F7DF1E` (JS yellow), 3 lecciones, 9 pasos.

### Lección 1: Seleccionando elementos

| Paso | Tipo | Contenido |
|---|---|---|
| 1.1 | explanation | `querySelector`, `querySelectorAll`, `getElementById` — cuándo usar cada uno |
| 1.2 | exercise | Seleccionar el `<h1>` y leer su `textContent` |
| 1.3 | exercise | Seleccionar todos los `<li>` y retornar su count |

### Lección 2: Modificando elementos

| Paso | Tipo | Contenido |
|---|---|---|
| 2.1 | explanation | `textContent`, `innerHTML`, `classList`, `setAttribute` — el DOM como árbol mutable |
| 2.2 | exercise | Cambiar el texto de un `<p>` a "Updated" |
| 2.3 | exercise | Agregar la clase `active` a un elemento y verificar con `classList.contains` |

### Lección 3: Eventos

| Paso | Tipo | Contenido |
|---|---|---|
| 3.1 | explanation | `addEventListener`, event object, event delegation — escuchar sin hardcodear |
| 3.2 | exercise | Agregar un listener a un `<button>` que modifica un contador |
| 3.3 | challenge | Event delegation: un `<ul>` con clicks que togglean clase `done` en el `<li>` clickeado |

**Archivos a crear/modificar:**
- [ ] `apps/api/src/infrastructure/persistence/seed-courses.ts` — añadir curso JS DOM
- [ ] Correr `pnpm --filter=api db:seed:courses` para verificar

---

## Part 5 — Backend: soporte `javascript-dom`

El backend necesita aceptar `javascript-dom` como lenguaje válido en el schema de `executeStepSchema`, aunque los ejercicios DOM no llamen al endpoint execute (se ejecutan en frontend). Si un ejercicio DOM llega al endpoint (fallback edge case), el PistonAdapter debe retornar un error claro en vez de ejecutar mal.

- [ ] `packages/shared/src/schemas.ts` — añadir `'javascript-dom'` al enum de lenguajes permitidos
- [ ] `apps/api/src/infrastructure/execution/PistonAdapter.ts` — `javascript-dom` no está en LANGUAGE_MAP, ya retorna "Unsupported language" correctamente — verificar que el mensaje sea útil

---

## Verificación

1. [ ] `/learn` muestra dos cursos: TypeScript Fundamentals y JavaScript DOM Fundamentals
2. [ ] Click en JS DOM course → player carga con badge "Runs in browser"
3. [ ] Ejercicio DOM: escribir código correcto → todos los tests pasan → auto-advance
4. [ ] Ejercicio DOM: código incorrecto → tests muestran ✗ con mensaje claro
5. [ ] Ejercicio TypeScript: sigue funcionando vía Piston (no regresión)
6. [ ] Landing page tiene CTA "Try a free course" → `/learn`
7. [ ] Typecheck, lint, tests pasan

---

## Carry-forward a Sprint 016

- Piston production verification (Kamal) — requiere deploy a producción
- Dashboard EXPLAIN ANALYZE — requiere deploy a producción
