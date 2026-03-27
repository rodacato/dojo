# Sprint 015 — iframe Sandbox + JavaScript DOM Course

**Started:** 2026-03-27
**Phase:** Phase 1 Alpha

**Expected outcome:** Un segundo curso ("JavaScript DOM Fundamentals") playable en `/learn`. Ejercicios de DOM ejecutándose directo en el browser via iframe sandbox — sin costo de servidor. Carry-forwards críticos de Sprint 014 cerrados.

**Strategy:** Carry-forwards primero (quick wins), iframe runner (enabler técnico), segundo curso (valor real).

---

## Part 1 — Carry-forwards

- [x] Landing page "Try a free course" CTA → `/learn`
- [x] Rate limiter integration test (11th anon execution → 429)
- [ ] Piston production verification (Kamal deploy) — requiere deploy a producción
- [ ] Dashboard EXPLAIN ANALYZE en producción — requiere deploy a producción

---

## Part 2 — iframe Sandbox Runner

- [x] `apps/web/src/lib/iframeSandboxRunner.ts` — ejecuta JS en `<iframe sandbox="allow-scripts">`, comunica resultados via `postMessage`, retorna `ExecuteStepResponse` (mismo contrato que Piston)
- [x] Timeout de 5s con cleanup del iframe
- [x] Guard `event.source !== iframe.contentWindow` para prevenir spoofing
- [x] `window.onerror` dentro del srcdoc captura syntax errors y runtime errors fuera de try/catch
- [x] Escape de `</script>` en el código inyectado
- [x] ADR 016 documentando el modelo de seguridad y por qué no Sandpack/WebContainers

---

## Part 3 — StepEditor routing + CodeEditor

- [x] `CoursePlayerPage.tsx` — `isIframeLang = language === 'javascript-dom'` → routing a `runInIframe` o `api.executeStep`
- [x] Badge "Runs in browser" visible cuando el runner es iframe
- [x] `CodeEditor.tsx` — `'javascript-dom'` añadido al tipo de language (mapea a JS syntax highlighting)
- [x] Spec 021 como guía de implementación

---

## Part 4 — testCode DOM Pattern

- [x] `docs/wip/IFRAME-TESTCODE-PATTERN.md` — referencia para escribir testCode en cursos DOM
- [x] Mini runner en JS puro (sin tipos TypeScript)
- [x] `window.parent.postMessage({ type: 'test-results', log, failed }, '*')` como protocolo de salida
- [x] Patrones documentados: función que consulta el DOM, función que muta, listeners de eventos, "fix the bug"

---

## Part 5 — Seed: JavaScript DOM Fundamentals

- [x] `language: 'javascript-dom'`, `accentColor: '#F7DF1E'`, status: published
- [x] Lección 1: Seleccionando elementos — `querySelector`, `querySelectorAll` (explanation + 2 exercises)
- [x] Lección 2: Modificando elementos — `textContent`, `classList`, `setAttribute` (explanation + 2 exercises)
- [x] Lección 3: Eventos — `addEventListener`, event delegation (explanation + exercise + challenge)
- [x] Step 3.3: "Fix the event delegation bug" — código roto pre-llenado, el bug es `e.target` vs `e.target.closest("li")`
- [x] Seed runner refactorizado a `seedOneCourse()` helper para soportar N cursos
- [x] `pnpm --filter=api db:seed:courses` verificado

---

## Part 6 — Coverage + Docs + Env

- [x] `GetCourseProgress.test.ts` — nuevo, 0% → 100%
- [x] `ExecuteStep.test.ts` — 4 tests añadidos para ramas no cubiertas (✗ name:message split, fallback pass/fail)
- [x] `application/learning` layer: 100% statements, branches, functions, lines
- [x] README: fila "Courses" en features, comando `db:seed:courses` en Commands
- [x] `.env.example`: `PISTON_RUN_TIMEOUT` corregido 15000→3000 (alineado con config.ts)

---

## Verification

1. [x] Typecheck pasa (`pnpm typecheck`)
2. [x] Lint pasa (`pnpm lint`)
3. [x] 79 tests / 21 archivos — todos pasan
4. [x] `/learn` muestra dos cursos: TypeScript Fundamentals + JavaScript DOM Fundamentals
5. [x] JS DOM course: badge "Runs in browser", ejecución sin llamada al backend
6. [x] Step 3.3: starter code falla "clicking child" test, solución con `closest("li")` pasa todo
7. [x] TypeScript Fundamentals: sigue funcionando via Piston (no regresión)
8. [x] Landing page tiene CTA "Try a free course →" → `/learn`
9. [x] Rate limiter: 10 requests permitidas, 11ª devuelve 429

---

## Carry-forward a Sprint 016

- Piston production verification (Kamal) — requiere deploy a producción
- Dashboard EXPLAIN ANALYZE en producción — requiere deploy a producción
