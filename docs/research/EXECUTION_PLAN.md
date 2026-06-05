# Plan: Sandboxed Code Execution para Dojo

## Context

Hoy las katas de tipo `code` se evalúan solo con el LLM leyendo el texto. El sensei no sabe si el código compila o si pasa tests. Queremos ejecución real con tests predefinidos para Ruby, Python, Node, Go, Rust y SQL. Esta infraestructura también servirá para futuros cursos/guías y un playground general.

La ejecución de código es un **complemento** al sensei, no un reemplazo. El sensei sigue siendo el core — solo que ahora tiene evidencia factual en vez de adivinar si el código funciona.

---

## Opción elegida: Piston (self-hosted)

Container único con REST API. POST `{language, code, files}` → `{stdout, stderr, exitCode}`. Sandboxing via nsjail. Runtimes pre-cargados. 6 lenguajes listos out-of-the-box.

- **Setup:** 1-2 horas — un servicio en docker-compose
- **Latencia:** 100-500ms (sin spin-up de container)
- **Seguridad:** nsjail (namespace isolation), sin red, límites de CPU/RAM por ejecución
- **RAM:** ~300MB idle con los 6 lenguajes instalados
- **Playground/cursos:** Excelente — baja latencia, stateless
- **Fallback:** Si Piston se queda corto → swap adapter a DIY docker sin cambiar dominio ni aplicación

### Limitantes de Piston

| Limitante | Impacto en Dojo | Mitigación |
|---|---|---|
| Timeout default 3s (configurable) | Rust compile puede ser justo | Subir a 15-30s para Rust |
| Output cap 1024 chars (configurable) | Tests verbosos se truncan | Subir cap o parsear antes de truncar |
| Sin persistencia entre ejecuciones | No puedes `pip install`, `gem install` | Solo stdlib — suficiente para katas |
| Sin red (`--network=none`) | No HTTP calls, no download deps | Correcto para sandboxing, no es limitante |
| Single-file por defecto | No simula proyectos multi-directorio | Piston acepta múltiples files, suficiente para kata + tests |
| Solo stdlib disponible | Katas con numpy, rails, etc. no funcionan | Custom Piston image con paquetes pre-instalados si se necesita |
| SQLite3 ≠ Postgres | Features Postgres-específicos no cubiertos | Agregar `PostgresExecutionAdapter` si se necesita |
| Concurrencia en un solo container | 10+ users simultáneos pueden saturar | Queue con concurrency limit (ver sección) |

**Ninguna es blocker** para el catálogo actual de katas (ejercicios cortos, stdlib, single-file).

---

## Lenguajes

### Tiers de prioridad

| Tier | Lenguajes | Cuándo | Razón |
|---|---|---|---|
| **1 (lanzamiento)** | TypeScript, Python, SQL, Go, Rust, Ruby | Ahora | Core del developer mid-senior. SQL es universalmente necesario y poco dominado |
| **2 (siguiente)** | Java, Elixir | Cuando haya demanda | Java por volumen enterprise/Android. Elixir por community fit (nicho apasionado que comparte) |
| **3 (evaluar)** | Kotlin, C#, Swift | Si el perfil de usuario lo justifica | Kotlin si hay users Android, C# si hay users .NET, Swift difícil sin ecosistema Apple |

### No incluir (aún)

- **C/C++** — katas de 15 minutos no capturan lo que hace difícil C (memory management, build systems)
- **PHP** — el mercado se mueve en otra dirección para el user target
- **Lenguajes esotéricos** — no sirven al objetivo de Dojo

### Piston packages por lenguaje

| Lenguaje | Package en Piston | Runtime |
|---|---|---|
| Ruby | `packages/ruby` | MRI (CRuby) |
| Python | `packages/python` | CPython 3.x |
| Node.js | `packages/node` | Node.js LTS |
| Go | `packages/go` | Go toolchain |
| Rust | `packages/rust` | rustc + cargo |
| **SQL** | **`packages/sqlite3`** | **SQLite CLI** |
| TypeScript | `packages/typescript` | ts-node / Deno |
| Java | `packages/java` | OpenJDK |
| Elixir | `packages/elixir` | Elixir + OTP |
| Kotlin | `packages/kotlin` | Kotlin/JVM |
| C# | `packages/csharp` | Mono / .NET |
| Swift | `packages/swift` | Swift toolchain |

Solo se instalan los que se necesiten. Se agregan via `piston ppman install <language>` o preconfigurando en el Dockerfile.

---

## Cursos Guiados: segundo modo de Dojo

### Por qué

Dojo tiene hoy un solo modo: **kata** — "demuestra lo que sabes" bajo presión. Los cursos guiados son el complemento: **"aprende haciendo"** sin presión. Productos complementarios, no competidores.

```
Dojo tiene dos modos:

1. KATA (existe hoy)
   → "Demuestra lo que sabes"
   → Timer, sin ayuda, sensei evalúa al final
   → Para: mantener skills afilados

2. GUIDED (nuevo)
   → "Aprende haciendo"
   → Sin timer, feedback paso a paso, ejecución inmediata
   → Para: aprender un lenguaje nuevo o refrescar uno oxidado
```

### Estructura de un curso

Un curso es una **secuencia de pasos ejecutables**, no un video ni un PDF:

```
Curso: "Go desde cero para developers"

Lección 1: Variables y tipos
  Paso 1: "Declara una variable con var" → [editor] → [Run] → ver output
  Paso 2: "Ahora usa := shorthand" → [editor] → [Run] → comparar
  Paso 3: "Mini-reto: escribe una función que..." → [editor] → [Run tests]

Lección 2: Structs e interfaces
  ...
```

Cada paso tiene:
- **Instrucción** (texto markdown)
- **Código starter** (opcional — puede estar pre-llenado)
- **Zona de ejecución** (Piston) — el user escribe, da Run, ve stdout/stderr
- **Validación** (opcional — tests que verifican si el paso se completó)
- **Hint** (opcional — se revela si el user se atora)

### Por qué Piston es perfecto para cursos

- **Latencia baja** (100-500ms) = feedback instantáneo. Write → Run → ver resultado.
- **Stateless** = cada paso es independiente. No necesitas mantener un REPL vivo.
- **Multi-lenguaje** = un curso de Python, uno de Go, uno de Rust, todos con la misma infra.
- **Cero costo adicional** = misma infraestructura que las katas.

### UX del modo Guided

- **Sin timer** — no hay presión, el user avanza a su ritmo
- **Split panel persistente** — instrucciones a la izquierda, editor + output a la derecha
- **Botón "Run"** prominente (no "Submit") — feedback inmediato, no post-mortem
- **Progreso visible** — barra de progreso, checkmarks por paso completado
- **Output panel** debajo del editor — stdout/stderr en tiempo real después de cada Run

### Cursos iniciales propuestos

| Curso | Lenguaje | Propuesta |
|---|---|---|
| "Go para developers que vienen de JS/TS" | Go | Mapear conceptos conocidos a Go idiomático |
| "Rust ownership sin el dolor" | Rust | Borrow checker explicado con ejercicios progresivos |
| "SQL que no sabías que no sabías" | SQL | Window functions, CTEs, recursive queries |
| "Elixir en 2 horas" | Elixir | Pattern matching, GenServer, pipe operator |
| "Ruby para Pythonistas" | Ruby | Bloques, procs, metaprogramación |

### Evaluación en cursos

- **Phase 1:** Tests de Piston validan cada paso (sin LLM). Suficiente para "¿funciona tu código?"
- **Phase 2:** Sensei como **tutor on-demand** — click en "Ask sensei" cuando estás atorado. Ve instrucción + código + error → da hint, no solución.

### Growth: cursos como acquisition funnel

- Las **katas** son para **retención** (vuelves a practicar)
- Los **cursos** son para **adquisición** (alguien buscando "learn Go" encuentra tu curso)
- Funnel: **Curso (gratis, sin login) → Kata (invite-only, con login)**

---

## SQL Katas: Flow Diferenciado

### Estructura del ejercicio SQL

```
exercise.testCode contiene 3 bloques separados por delimitadores:

-- @SCHEMA
CREATE TABLE employees (id INT, name TEXT, department TEXT, salary REAL);
CREATE TABLE departments (id INT, name TEXT, budget REAL);

-- @SEED
INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 95000);
INSERT INTO employees VALUES (2, 'Bob', 'Engineering', 87000);
INSERT INTO employees VALUES (3, 'Carol', 'Sales', 72000);

-- @EXPECTED
name|department|salary|dept_avg|rank
Alice|Engineering|95000|91000.0|1
Bob|Engineering|87000|91000.0|2
```

### Flow de ejecución

```
1. Piston recibe script SQLite3: schema + seed + user query
2. El adapter compara stdout vs expected output
   → match = passed
   → diff = failed con detalle de qué filas difieren
3. El sensei recibe: "Query returned 3 rows, expected 5"
```

### SQLite3 vs Postgres

| Feature | SQLite3 | Necesita Postgres |
|---|---|---|
| JOINs, subqueries | ✓ | |
| Window functions (RANK, ROW_NUMBER, LAG/LEAD) | ✓ | |
| CTEs / CTEs recursivos | ✓ | |
| GROUP BY, HAVING, aggregations | ✓ | |
| CASE, COALESCE, string functions | ✓ | |
| JSON operators | Parcial (`json_extract`) | `->`, `->>`, `jsonb` |
| EXPLAIN ANALYZE | ✗ | ✓ |
| Materialized views | ✗ | ✓ |
| PL/pgSQL, stored procedures | ✗ | ✓ |

**Para el 90%+ de katas SQL** SQLite3 es suficiente.

---

## Integración en el Dominio

### Nuevo Port: `CodeExecutionPort`

**Archivo:** `apps/api/src/domain/practice/ports.ts`

```typescript
export interface ExecutionResult {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
  readonly timedOut: boolean
  readonly executionTimeMs: number
}

export interface CodeExecutionPort {
  execute(params: {
    language: string
    code: string
    testCode: string
    timeoutMs?: number
  }): Promise<ExecutionResult>
}
```

### Adapter: `PistonAdapter`

**Archivo nuevo:** `apps/api/src/infrastructure/execution/PistonAdapter.ts`
- Llama `POST http://piston:2000/api/v2/execute`
- Mapea nombres de lenguaje a identifiers de Piston
- `MockExecutionAdapter` para tests

### Value Object: `ExecutionOutcome`

**Archivo:** `apps/api/src/domain/practice/values.ts`

```typescript
export interface TestResult {
  readonly passed: number
  readonly failed: number
  readonly output: string
}

export interface ExecutionOutcome {
  readonly executionResult: ExecutionResult
  readonly testResult: TestResult | null
}
```

### Flow modificado (solo para `type: 'code'`)

```
Actual:
  submit → LLM evalúa leyendo código → stream tokens

Nuevo:
  submit {userResponse, language}
    → IF exercise.type === 'code' AND exercise.testCode:
        → Encolar ejecución en background queue
        → WS: {type: 'executing'}
        → Await resultado de la queue
        → WS: {type: 'execution_result', result}
    → LLM evalúa con código + resultados de ejecución
    → stream tokens
```

### Código inválido es un resultado válido

El submit puede contener código que no compila, tiene syntax errors, o falla todos los tests. Esto **no bloquea el flow** — es información valiosa:

```
Código válido, tests pasan     → sensei evalúa approach y calidad
Código válido, tests fallan    → sensei evalúa qué falló y por qué
Código no compila              → sensei evalúa el intento y el error
Código vacío / no ejecutable   → sensei evalúa como "no attempt"
```

**Nunca se rechaza un submit por código inválido** — la evaluación siempre procede. Piston devuelve `stderr` con el error y el sensei lo recibe como contexto.

### Ejecución en Background (Queue)

La ejecución se encola para no sobrecargar Piston con requests concurrentes. Crítico para soportar muchos usuarios simultáneos.

```
Phase 0: In-memory queue con concurrency limit
  - Max N ejecuciones concurrentes contra Piston (default 3)
  - Las demás esperan en queue FIFO
  - Suficiente para single-process, 10-50 users

Phase 1 (escala): BullMQ + Redis
  - Job queue persistente, retry automático, múltiples workers
```

**Implementación Phase 0:**

```typescript
// infrastructure/execution/ExecutionQueue.ts
class ExecutionQueue {
  private running = 0
  private queue: Array<{ resolve, reject, params }> = []

  constructor(
    private executor: CodeExecutionPort,
    private maxConcurrency = 3
  ) {}

  async enqueue(params: ExecuteParams): Promise<ExecutionResult> {
    if (this.running < this.maxConcurrency) {
      return this.run(params)
    }
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, params })
    })
  }
}
```

**Impacto en timers:** El tiempo en queue se suma al tiempo del submit, no de la kata. La ejecución ocurre al submit (el timer ya terminó), el user ya escribió su código — la espera es para la evaluación, no para la práctica. No es un deal-breaker.

**Configuración:**

```env
FF_CODE_EXECUTION_ENABLED=true
PISTON_URL=http://piston:2000
PISTON_MAX_CONCURRENT=3
PISTON_QUEUE_TIMEOUT_MS=30000
```

### Cambios de Schema

- **`exercises`**: agregar columna `test_code text` (nullable)
- **`attempts`**: agregar columna `execution_result jsonb` (nullable)
- **Zod schema**: agregar `language` opcional al submit attempt

### Prompt del Sensei

Agregar sección en `apps/api/src/prompts/sensei.ts`:

```
## Test Results
Tests passed: 3/5
  ✓ handles empty input
  ✗ handles duplicate keys — expected {a: 2} got {a: 1}
Exit code: 1 | Execution time: 234ms
```

### WebSocket: nuevos mensajes

- `{type: 'executing'}` — UI muestra "Running tests..."
- `{type: 'execution_result', result: ExecutionOutcome}` — UI muestra pass/fail antes del sensei

### Docker-Compose

```yaml
piston:
  image: ghcr.io/engineer-man/piston
  restart: unless-stopped
  volumes:
    - piston-packages:/piston/packages
  tmpfs:
    - /piston/jobs:exec,size=256m
```

### Tests en los Ejercicios

Formato por lenguaje:
- **Ruby:** Minitest | **Python:** pytest | **Node:** assertions/vitest
- **Go:** `_test.go` | **Rust:** `#[test]` | **SQL:** schema + seed + expected

---

## Secuencia de Implementación

1. Agregar Piston a docker-compose, verificar con curl
2. Agregar `CodeExecutionPort` y `ExecutionOutcome` al dominio
3. Implementar `PistonAdapter` + `MockExecutionAdapter`
4. Implementar `ExecutionQueue` con concurrency limit
5. Migración: `test_code` en exercises, `execution_result` en attempts
6. Modificar `SubmitAttempt` para encolar ejecución antes del LLM
7. Modificar prompt del sensei para incluir resultados
8. Agregar mensajes WS: `executing`, `execution_result`
9. Frontend: mostrar resultados de ejecución en la UI del kata
10. Seed: agregar `testCode` a ejercicios de código existentes

## Archivos Críticos

- `apps/api/src/domain/practice/ports.ts` — nuevo port
- `apps/api/src/domain/practice/values.ts` — nuevo value object
- `apps/api/src/application/practice/SubmitAttempt.ts` — inyectar ejecución antes del LLM
- `apps/api/src/infrastructure/container.ts` — wiring del adapter
- `apps/api/src/infrastructure/execution/PistonAdapter.ts` — adapter
- `apps/api/src/infrastructure/execution/ExecutionQueue.ts` — queue
- `apps/api/src/prompts/sensei.ts` — sección de resultados en prompt
- `apps/api/src/infrastructure/http/routes/ws.ts` — nuevos message types
- `docker-compose.yml` — servicio Piston

## Verificación

1. `curl http://localhost:2000/api/v2/runtimes` muestra los 6 lenguajes
2. `curl -X POST http://localhost:2000/api/v2/execute` con Python → `{"stdout":"2\n"}`
3. Kata con tests → submit → execution_result en WS → sensei cita resultados
4. `pnpm test --filter=api` pasa con MockExecutionAdapter
5. Timeout: `while True: pass` retorna `timedOut: true` en <15s
6. SQL kata: schema + seed + query → stdout coincide con expected
7. Queue: 5 submits simultáneos → solo 3 corren en paralelo

---

## Referencias Piston

- **Repo:** https://github.com/engineer-man/piston
- **API docs:** https://github.com/engineer-man/piston/blob/master/docs/api-v2.md
- **Packages:** https://github.com/engineer-man/piston/tree/master/packages

---

## Consulta al Panel de Expertos

### Priya Menon (Producto)

> Los 6 lenguajes Tier 1 cubren al developer mid-senior. Java y Elixir son los siguientes: Java por volumen, Elixir por community fit. Cursos guiados como acquisition funnel: curso gratuito con ejecución real → kata invite-only.

### Valentina Cruz (Contenido)

> Un curso no es una kata larga. Los mejores cursos para este perfil mapean lo que ya sabes a un lenguaje nuevo ("Go para devs de JS/TS" > "Intro a Go"). No necesitan LLM para Phase 1 — Piston + tests validan cada paso.

### Soren Bachmann (UX)

> Dashboard: Practice (katas) y Learn (cursos) como modos separados. UX de curso: sin timer, botón Run, output panel, progreso con checkmarks. Interactive tutorial, no evaluación.

### Yemi Okafor (LLM)

> En cursos, sensei es tutor on-demand (Phase 2): click "Ask sensei" → ve instrucción + código + error → hint, no solución. No bloquea Phase 1.

### Marta Kowalczyk (Seguridad)

> Cursos públicos sin login expanden superficie de ataque. Rate limiting: 10 ejecuciones/min sin auth, 60/min con auth. La queue con concurrency limit previene abuse.

### Amara Diallo (Community)

> Katas = retención. Cursos = adquisición. Funnel: Curso (gratis, sin login) → Kata (invite-only). Content marketing que funciona solo.

---

## Frontend Execution: HTML, CSS, JavaScript & Frameworks

El frontend es un caso fundamentalmente diferente al backend: **el browser ya es el runtime**. No necesita Piston ni server-side execution — todo corre en el browser del user. Esto lo hace más barato, más rápido y más seguro.

### Nivel 1: HTML / CSS / Vanilla JS → iframe sandbox

Zero infraestructura. El código del user se renderiza en un `<iframe sandbox>` directamente en el browser.

```html
<iframe sandbox="allow-scripts" srcdoc={userCode} />
```

- **Costo:** Cero. 100% client-side.
- **Latencia:** Instantánea. Sin network call.
- **Seguridad:** `sandbox` attribute es el aislamiento más fuerte del browser — sin acceso al DOM padre, sin cookies, sin navigation.
- **Esfuerzo:** 2-3 días.

**Validación:** DOM assertions via `postMessage` — un test runner corre dentro del iframe y reporta resultados al parent:

```typescript
// Test runner inyectado en el iframe
const h1 = document.querySelector('h1')
const results = {
  checks: [
    { name: 'h1 exists', pass: !!h1 },
    { name: 'h1 text correct', pass: h1?.textContent === 'Hello World' },
    { name: 'h1 is blue', pass: getComputedStyle(h1).color === 'rgb(0, 0, 255)' },
  ]
}
parent.postMessage({ type: 'test_results', results }, '*')
```

**Katas posibles:**

| Tipo | Ejemplo | Qué evalúa |
|---|---|---|
| CSS Layout | "Replica este layout responsive sin media queries" | CSS Grid / Flexbox |
| Accesibilidad | "Haz este form accesible — keyboard nav, ARIA" | Semantic HTML, ARIA |
| DOM manipulation | "Implementa infinite scroll sin framework" | Vanilla JS, IntersectionObserver |
| Animación | "Implementa esta transición con CSS puro" | Transitions, keyframes |
| Canvas/SVG | "Dibuja un reloj analógico en canvas" | Canvas API |

### Nivel 2: React / Vue / Svelte → Sandpack (browser-side bundler)

**Sandpack** es la librería open-source de CodeSandbox. Corre un **bundler completo en el browser** via Web Workers. Soporta JSX, TypeScript, imports, npm packages — todo sin server.

- **Repo:** https://github.com/codesandbox/sandpack
- **Costo:** Cero server-side. npm package que se integra en el frontend.
- **Latencia:** ~500ms primer bundle, updates instantáneos después (HMR in-browser).
- **Esfuerzo:** 1-2 días (es un componente React).

```tsx
import { Sandpack } from '@codesandbox/sandpack-react'

<Sandpack
  template="react"  // o "vue", "svelte", "vanilla"
  files={{
    '/App.js': userCode,
    '/App.test.js': exerciseTestCode,
  }}
  options={{
    showConsole: true,
    showTests: true,  // test runner built-in
  }}
/>
```

**Katas posibles:**

| Tipo | Ejemplo | Qué evalúa |
|---|---|---|
| React hooks | "Implementa un hook `useDebounce`" | Custom hooks, cleanup |
| Component patterns | "Crea un `<Accordion>` compound component" | Composition, context |
| Performance | "Este componente re-renders 47 veces. Arréglalo." | memo, useMemo, useCallback |
| State management | "Implementa undo/redo para este editor" | Reducer pattern, immutability |
| Vue reactivity | "Implementa un composable `useLocalStorage`" | Vue 3 composition API |
| Testing | "Escribe tests para este componente" | Testing Library, assertions |

### Nivel 3: Full Node.js en browser → WebContainers (futuro)

**WebContainers** (by StackBlitz) corre Node.js completo en el browser via WebAssembly. `npm install`, Vite, webpack, Next.js — todo in-browser.

- **SDK:** https://webcontainers.io
- **Costo:** Cero server-side.
- **Latencia:** ~2-3s boot, después similar a local dev.
- **Esfuerzo:** ~1 semana.

Ideal para **cursos guiados** de frameworks completos:
- "Curso: Build a React app from scratch" → proyecto real con Vite + React
- "Curso: Node.js CLI tools" → Node.js completo con filesystem

**No necesario para katas** — Sandpack cubre React/Vue. WebContainers es para cuando el curso necesita un entorno completo.

### UX: Preview Panel para frontend katas

La UX de una kata frontend necesita un **live preview** que el backend no tiene:

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│   Instructions       │   Code Editor        │
│   (kata body)        │   (HTML/CSS/JS)      │
│                      │                      │
│                      ├──────────────────────┤
│                      │                      │
│                      │   Live Preview       │
│                      │   (iframe / Sandpack)│
│                      │                      │
│                      ├──────────────────────┤
│                      │ ✓ h1 exists          │
│                      │ ✗ h1 is blue         │
│                      │ Tests: 1/2 passed    │
│                      └──────────────────────┘
```

- El preview se actualiza **en tiempo real** mientras el user escribe (debounced ~300ms)
- Los test results aparecen debajo del preview
- El user puede alternar entre Preview y Console (stdout/errors)

### Cómo encaja con el sensei

Para frontend katas, el sensei recibe:

1. **El código del user** (como hoy)
2. **Test results** de DOM assertions o Sandpack tests (igual que Piston para backend)
3. **DOM snapshot** (opcional) — serialización del DOM resultante como texto

```
## Test Results
DOM checks: 3/5 passed
  ✓ .container uses CSS Grid
  ✓ layout is responsive at 768px
  ✗ items don't reflow correctly at 480px — expected 1 column, got 2
  ✓ no media queries used
  ✗ gap between items — expected 16px, got 0px
```

**Phase 2:** Screenshot del iframe como imagen para evaluación multimodal del LLM — "el sensei ve el resultado visualmente". Pero DOM assertions son suficientes para Phase 1.

### Integración en el dominio

El frontend execution no necesita `CodeExecutionPort` del server. Es un concepto client-side. Pero los **test results** se envían al server con el submit para que el sensei los use:

```
submit {userResponse, language: 'html', frontendTestResults: TestResult}
  → frontendTestResults se inyectan al prompt del sensei
  → LLM evalúa con código + resultados
```

El exercise type se extiende:

```
ExerciseType: 'code' | 'chat' | 'whiteboard' | 'frontend'
```

Las katas `frontend` usan iframe/Sandpack client-side en vez de Piston server-side. El sensei flow es idéntico.

### Secuencia de implementación frontend

1. **Nivel 1 (HTML/CSS/JS):** iframe sandbox + DOM test runner + postMessage → junto con Piston
2. **Nivel 2 (React/Vue):** Agregar Sandpack como dependencia de `@dojo/web` → siguiente iteración
3. **Nivel 3 (Full Node):** WebContainers → solo para cursos guiados, Phase 2+

### Referencias

- **Sandpack:** https://github.com/codesandbox/sandpack
- **WebContainers:** https://webcontainers.io
- **iframe sandbox spec:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox

---

## Apéndice A: Otras opciones evaluadas

| Opción | Caso de uso futuro |
|---|---|
| **DIY docker (`docker run --rm`)** | Entornos custom (Rails completa, Go multi-package) |
| **Judge0** | Miles de usuarios concurrentes, queue distribuida |
| **Firecracker** | Serverless katas, público sin invite (ver Apéndice B) |

---

## Apéndice B: Firecracker microVMs (para evaluar después)

MicroVMs con kernel aislado, boot en ~125ms. Lo que corre debajo de AWS Lambda.

- **Repo:** https://github.com/firecracker-microvm/firecracker
- **Docs:** https://github.com/firecracker-microvm/firecracker/blob/main/docs/getting-started.md

### Cuándo evaluarlo

| Escenario | Por qué |
|---|---|
| Katas "escribe una Lambda function" | MicroVM simula runtime real de Lambda |
| Playground serverless (Vercel Functions / Deno Deploy) | Request-level isolation |
| Abrir Dojo al público | Aislamiento fuerte para código anónimo |

### Qué implica

- Requiere KVM (bare metal o nested virtualization)
- Sin Docker Compose — orquestación separada
- Construir rootfs images por lenguaje
- Setup: 1-2 semanas mínimo

### Cómo encajaría

```
CodeExecutionPort
  ├── PistonAdapter        ← katas normales (hoy)
  └── FirecrackerAdapter   ← katas serverless / public (futuro)
```

### Alternativas más ligeras

| Herramienta | Descripción |
|---|---|
| **gVisor (runsc)** | Kernel userspace de Google. Drop-in Docker runtime |
| **Kata Containers** | VMs ligeras compatibles con containerd |
| **Fly.io Machines API** | Firecracker-as-a-service |
