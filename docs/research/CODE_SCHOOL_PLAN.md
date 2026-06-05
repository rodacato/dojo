# Plan: Interactive Courses — Modelo Code School para Dojo

## Context

Code School (2011-2018) fue la plataforma de aprendizaje interactivo más querida por developers. Cada curso era un mundo temático con ilustraciones únicas, videos de producción cinematográfica, y coding challenges en el browser. Fue adquirida por Pluralsight por $36M en 2015 y cerrada en 2018. No existe un sucesor directo.

Queremos traer ese espíritu a Dojo: cursos interactivos con ejecución real de código, pero a la escala de un indie builder usando Piston como infraestructura de ejecución.

---

## Qué hizo especial a Code School

### El formato

Cada curso seguía esta estructura por nivel (5 niveles por curso):

```
1. VIDEO (~10-15 min) — explicación con slides de alta producción
2. CODING CHALLENGE — editor en el browser, resolver problema relacionado
3. FEEDBACK — tests reales validan el código, hints si te atoras
4. BADGE — al completar el curso, badge público en tu perfil
```

### Lo que nadie ha replicado

| Elemento | Qué hacían | Por qué funcionaba |
|---|---|---|
| **Mundos temáticos** | Cada curso tenía su propia identidad visual: Rails for Zombies (apocalipsis), CSS Cross-Country (esquí), Git Real (Tron), JavaScript Road Trip (carretera americana) | El aprendizaje se sentía como una aventura, no como un tutorial |
| **Producción cinematográfica** | Videos con animaciones profesionales, humor, narrativa | Engagement superior a screencasts genéricos |
| **Zero setup** | Todo en el browser, nada que instalar | Eliminaba la fricción #1 de aprender a programar |
| **Tests reales, no string matching** | Múltiples soluciones válidas | Se sentía como programar de verdad |
| **Gamificación genuina** | Niveles, puntos, badges, hints canjeables | Progresión tangible sin sentirse manipulativo |
| **Cursos gratuitos como puerta de entrada** | Try Ruby, Try Git, Rails for Zombies | Acquisition funnel que generó 700K+ email subscribers |
| **Catálogo curado** | ~50 cursos de alta calidad vs miles mediocres | Calidad > cantidad. Cada curso era un evento |

### Números clave

- **$25-29/mes** suscripción
- **~24,000 suscriptores** al momento de la adquisición (~$696K MRR)
- **$60-80K** costo de producir un curso gratuito
- **~$20K** costo de un curso de pago
- **Breakeven** en ~2 meses por curso
- **Adquisición:** $36M por Pluralsight (enero 2015)
- **Cerrado:** junio 2018 — contenido migrado a Pluralsight, perdió identidad

### Por qué murió

Pluralsight compró Code School, extrajo el contenido, y cerró la marca. Los cursos migrados perdieron el formato interactivo y se convirtieron en videos genéricos. El fundador (Gregg Pollack) se fue un año después de la adquisición. La lección: **la identidad y el formato ERAN el producto**, no solo el contenido.

---

## Qué podemos hacer en Dojo: Code School a escala indie

### Principio: misma filosofía, diferente producción

Code School tenía un equipo de ~20 personas, ilustrador dedicado (Justin Mezzell), y presupuesto de $20-80K por curso. Nosotros tenemos Piston, un frontend React, y LLMs. La filosofía se mantiene; la producción se adapta.

### Lo que SÍ podemos replicar

| Elemento Code School | Versión Dojo | Cómo |
|---|---|---|
| Coding challenges en el browser | ✅ Piston + iframe/Sandpack | Ya está en el EXECUTION_PLAN |
| Tests reales, no string matching | ✅ Piston ejecuta tests reales | Misma infra que katas |
| Zero setup | ✅ Todo en el browser | Piston server-side, iframe/Sandpack client-side |
| Badges al completar | ✅ Ya existe el sistema de badges | Extender Recognition context |
| Cursos gratuitos como acquisition | ✅ Funnel curso → kata | Sin login para cursos, invite-only para katas |
| Gamificación (niveles, progreso) | ✅ Barra de progreso, checkmarks | Frontend implementation |
| Hints cuando te atoras | ✅ Hints + sensei on-demand | Hints estáticos Phase 1, LLM tutor Phase 2 |
| Feedback contextual en errores | ✅ Piston stderr + test output | Feedback inmediato del runner |

### Lo que adaptamos (no copiamos)

| Elemento Code School | Adaptación Dojo | Razón |
|---|---|---|
| Videos de producción cinematográfica | **Texto markdown + code snippets interactivos** | Un indie builder no puede producir videos de $20K. Pero el texto bien escrito con ejecución real es igual de efectivo para el perfil mid-senior |
| Ilustraciones temáticas por curso ($$$) | **Paleta de colores + icono + nombre temático por curso** | Identidad visual ligera pero distintiva. Cada curso tiene su color y personalidad sin necesitar un ilustrador |
| Equipo de 20 personas | **LLM-assisted content creation** | El sensei puede ayudar a generar ejercicios, hints, y test cases. El creador diseña la estructura y curación |
| $60-80K por curso | **~$0 en infra + tiempo del creador** | Piston ya existe. El costo es el tiempo de crear el contenido |

### Lo que NO intentamos (aún)

- Videos de producción alta — texto interactivo primero, video si hay demanda
- Ilustraciones custom por curso — identidad visual con CSS/tokens, no ilustraciones
- Catálogo de 50 cursos — empezar con 2-3, validar el formato

---

## Estructura de un curso Dojo

### Anatomía

```
Curso: "Go para developers que vienen de JS/TS"
├── Identidad: color #00ADD8, icono: gopher
├── Intro: por qué Go, qué vas a aprender (texto)
│
├── Lección 1: "Hello, Go"
│   ├── Paso 1: Explicación (markdown + code highlights)
│   ├── Paso 2: "Escribe tu primer programa" → [editor] → [Run]
│   ├── Paso 3: "Ahora con fmt.Println" → [editor] → [Run]
│   └── Challenge: "Escribe una función que..." → [editor] → [Run tests]
│
├── Lección 2: "Types & Structs — no son clases"
│   ├── Paso 1: Explicación (markdown + comparación con TS interfaces)
│   ├── Paso 2: "Define un struct" → [editor] → [Run]
│   └── Challenge: "Implementa un método receiver" → [editor] → [Run tests]
│
├── Lección 3: "Goroutines — concurrencia sin dolor"
│   └── ...
│
├── Lección 4: "Error handling — no hay try/catch"
│   └── ...
│
├── Lección 5: "Mini-proyecto: Build a URL shortener"
│   └── Challenge final que integra todo
│
└── Completado → Badge "Go Explorer" + sugerencia de katas de Go
```

### Cada paso tiene

```typescript
interface CourseStep {
  instruction: string        // Markdown con explicación
  starterCode?: string       // Código pre-llenado (opcional)
  solution?: string          // Solución (solo para hints, nunca visible directo)
  testCode?: string          // Tests de Piston para validar
  hint?: string              // Se revela con click
  language: string           // "go", "python", "rust", etc.
  type: 'read' | 'code' | 'challenge'  // read = solo texto, code = libre, challenge = con tests
}
```

### Tipos de paso

| Tipo | UX | Validación |
|---|---|---|
| `read` | Solo instrucción, sin editor. "Lee esto antes de continuar." | Click "Next" |
| `code` | Editor + Run. Sin tests, solo explorar. "Experimenta con esto." | Cualquier ejecución exitosa |
| `challenge` | Editor + Run tests. "Resuelve esto." | Tests de Piston deben pasar |

---

## Identidad visual por curso (lightweight theming)

En vez de ilustraciones de $20K, cada curso tiene una **identidad visual CSS** que lo hace único:

```typescript
interface CourseTheme {
  name: string           // "Go para devs de JS/TS"
  slug: string           // "go-from-jsts"
  accentColor: string    // "#00ADD8" (Go blue)
  icon: string           // emoji o simple SVG
  tagline: string        // "Think different. Write Go."
  difficulty: string     // "intermediate"
  estimatedHours: number // 3
}
```

Ejemplos:

| Curso | Color | Icono | Tagline |
|---|---|---|---|
| Go from JS/TS | `#00ADD8` | 🦫 | "Think different. Write Go." |
| Rust Ownership | `#CE422B` | 🦀 | "Fight the borrow checker. Win." |
| SQL Deep Cuts | `#336791` | 🗄️ | "The queries nobody taught you." |
| Elixir in 2h | `#6E4A7E` | 💧 | "Pattern match everything." |
| Ruby for Pythonistas | `#CC342D` | 💎 | "Blocks, procs, and magic." |

La UI aplica el `accentColor` al header, progress bar, badges, y botones del curso — dándole personalidad sin diseño custom.

---

## Modelo de datos

### Nuevas entidades

```typescript
// Course aggregate
interface Course {
  id: CourseId
  title: string
  slug: string
  description: string
  language: string
  theme: CourseTheme
  lessons: Lesson[]
  status: 'draft' | 'published'
  isPublic: boolean          // true = sin login (acquisition funnel)
  createdBy: UserId
}

// Lesson (child of Course)
interface Lesson {
  id: LessonId
  courseId: CourseId
  title: string
  order: number
  steps: CourseStep[]
}

// Progress tracking
interface CourseProgress {
  userId: UserId
  courseId: CourseId
  currentLessonId: LessonId
  currentStepIndex: number
  completedSteps: Set<string>  // "lesson1:step3"
  startedAt: Date
  completedAt?: Date
}
```

### Schema (nuevas tablas)

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL,
  theme JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title TEXT NOT NULL,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE course_steps (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  type TEXT NOT NULL,            -- 'read' | 'code' | 'challenge'
  instruction TEXT NOT NULL,
  starter_code TEXT,
  solution TEXT,
  test_code TEXT,
  hint TEXT,
  language TEXT NOT NULL,
  sort_order INT NOT NULL
);

CREATE TABLE course_progress (
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  current_lesson_id UUID REFERENCES lessons(id),
  current_step_index INT NOT NULL DEFAULT 0,
  completed_steps JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, course_id)
);
```

---

## UX del modo curso

### Navegación

```
Dashboard
  ├── Practice (katas)       → lo que existe hoy
  └── Learn (cursos)         → nuevo
       ├── Go from JS/TS     → [Start] o [Continue]
       ├── Rust Ownership     → [Start]
       └── SQL Deep Cuts      → [Completed ✓]
```

### Pantalla de curso activo

```
┌─────────────────────────────────────────────────────────┐
│  🦫 Go from JS/TS          Lesson 2 of 5    ████░░ 40% │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│  ## Types & Structs  │  // editor                       │
│                      │  type User struct {              │
│  En Go no hay clases │      Name string                 │
│  pero los structs    │      Age  int                    │
│  con métodos son     │  }                               │
│  igual de poderosos. │                                  │
│                      ├──────────────────────────────────┤
│  ```go               │  $ go run main.go                │
│  type User struct {  │  > {Alice 30}                    │
│    Name string       │                                  │
│  }                   │  [Run]           [Hint] [Next →] │
│  ```                 │                                  │
│                      │  ✓ Step 1  ✓ Step 2  ● Step 3   │
└──────────────────────┴──────────────────────────────────┘
```

### Diferencias clave vs kata

| Aspecto | Kata | Curso |
|---|---|---|
| Timer | Sí (presión) | No (a tu ritmo) |
| Botón principal | Submit | Run |
| Feedback | Post-mortem (sensei) | Inmediato (Piston) |
| Sensei | Siempre evalúa | On-demand ("Ask sensei") |
| Output visible | No (solo en eval) | Sí (panel de output siempre visible) |
| Progreso | Completo/incompleto | Paso a paso con checkmarks |
| Login requerido | Sí (invite-only) | Opcional (cursos públicos sin login) |

---

## El sensei en cursos

### Phase 1: sin LLM

Los cursos funcionan con Piston solo. Cada challenge tiene tests predefinidos. El feedback es:
- ✅ Tests pasan → "Correcto! Next step."
- ❌ Tests fallan → muestra stderr/output + hint disponible
- 💡 Hint → texto estático escrito por el creador del curso

### Phase 2: sensei como tutor on-demand

Botón "Ask sensei" disponible en cada paso. El sensei recibe:
- La instrucción del paso actual
- El código del user
- El error de ejecución (si hay)
- El hint (para no repetirlo)

El sensei da un **nudge contextual**, no la solución:
> "Mira el tipo de retorno de tu función. Go requiere que declares explícitamente qué retorna — no infiere como TypeScript."

---

## Funnel: Curso → Kata

```
Internet (SEO, sharing)
  → Curso público "SQL Deep Cuts" (sin login)
    → User completa lecciones, se engancha
      → "Ahora practica bajo presión → Kata de SQL" (requiere login + invite)
        → User se registra, entra al dojo
          → Retención via katas diarias
```

### Cursos como SEO/content marketing

Cada curso público genera URLs indexables:
- `/learn/go-from-jsts` — landing del curso
- `/learn/go-from-jsts/lesson/1/step/3` — cada paso es una página

Un developer buscando "learn Go for JavaScript developers" encuentra el curso de Dojo, lo completa gratis en el browser, y al final se le invita a las katas.

---

## Secuencia de implementación

| Phase | Qué | Esfuerzo | Depende de |
|---|---|---|---|
| **1** | Schema + API para courses/lessons/steps/progress | 2-3 días | Nada |
| **2** | UI de lista de cursos + pantalla de curso activo | 3-4 días | Phase 1 |
| **3** | Integración con Piston para challenges | 1 día | EXECUTION_PLAN implementado |
| **4** | Primer curso: "SQL Deep Cuts" (contenido) | 2-3 días | Phases 1-3 |
| **5** | Progress tracking + badges de curso | 1-2 días | Phase 1 |
| **6** | Cursos públicos (sin login) + SEO | 1 día | Phase 2 |
| **7** | Sensei tutor on-demand | 2-3 días | Phase 4 |
| **8** | Frontend courses (iframe/Sandpack) | 2-3 días | Phase 2 |

**Total estimado para MVP (Phases 1-4):** ~2 semanas

---

## Primer curso: "SQL Deep Cuts"

SQL es el mejor candidato para el primer curso porque:
- Ya hay ejercicios SQL en el catálogo de katas
- SQLite3 en Piston es el runtime más simple (sin compilación)
- Todo developer necesita SQL pero pocos dominan window functions, CTEs, etc.
- Es universalmente relevante (no depende de stack)

```
"SQL que no sabías que no sabías"

Lección 1: Window Functions 101
  - ROW_NUMBER, RANK, DENSE_RANK
  - PARTITION BY
  - Challenge: "Rankea empleados por salario dentro de su departamento"

Lección 2: CTEs — nombre tus queries
  - WITH clause
  - CTEs encadenados
  - Challenge: "Refactoriza esta subquery anidada a CTEs"

Lección 3: Recursive CTEs
  - Árboles y grafos en SQL
  - Challenge: "Encuentra todos los reportes (directo e indirectos) de un manager"

Lección 4: Advanced Aggregations
  - GROUPING SETS, ROLLUP, CUBE
  - FILTER clause
  - Challenge: "Genera un reporte con subtotales y totales"

Lección 5: Query Detective
  - Leer y optimizar queries reales
  - Challenge final: "Este query tarda 3s. Reescríbelo para que tarde <100ms"

Badge: "SQL Deep Diver" 🗄️
→ "Ahora practica: katas de SQL te esperan en el dojo"
```

---

## Consulta al Panel de Expertos

### Priya Menon (Producto)

> Code School murió porque Pluralsight compró el contenido pero no entendió que **el formato era el producto**. La lección para Dojo: nunca separar el contenido de la experiencia interactiva. Los cursos Dojo deben ser inseparables de la ejecución en browser — si alguien copia el texto, pierde el 90% del valor.
>
> Empezar con 1 curso (SQL) es correcto. Code School empezó con 1 (Rails for Zombies) y validó antes de escalar. El error sería planear 10 cursos antes de lanzar 1.
>
> Los cursos públicos sin login como acquisition funnel es exactamente el playbook de Code School (Try Ruby, Try Git fueron gratuitos). El funnel curso → kata es más fuerte que cualquier landing page.

### Valentina Cruz (Contenido)

> El formato texto + código interactivo es MEJOR que video para el perfil mid-senior. Un developer senior no quiere ver un video de 15 minutos — quiere leer rápido y escribir código. El video era necesario en 2011 porque la ejecución en browser era la novedad. Hoy la ejecución es lo esperado; la velocidad de iteración es lo que importa.
>
> La estructura de Code School (explicación → challenge → feedback) es correcta. Pero cada paso debe ser completable en 2-5 minutos máximo. Si un paso toma más de 5 minutos, debe dividirse.
>
> Los cursos para Dojo deben "mapear lo conocido a lo nuevo" — no enseñar desde cero. El user ya sabe programar; viene a aprender un lenguaje nuevo o profundizar uno que usa superficialmente.

### Soren Bachmann (UX)

> La identidad visual por curso con `accentColor` + icono es el approach correcto a escala indie. No necesitas un Justin Mezzell — necesitas que cada curso se sienta diferente cuando navegas entre ellos. Color + tipografía + un icono bien elegido logran el 80% del efecto con el 5% del esfuerzo.
>
> La pantalla de curso activo necesita: instrucción visible sin scroll (o minimal scroll), editor que ocupe al menos 50% del ancho, output siempre visible debajo del editor, progreso siempre visible. El user nunca debe perder contexto de dónde está.
>
> El botón "Run" debe ser el más prominente de la pantalla. No "Submit", no "Check" — "Run". La acción es experimentar, no entregar.

### Yemi Okafor (LLM)

> El sensei como tutor on-demand (Phase 2) es la evolución natural. Pero el prompt es diferente al de katas: en katas el sensei evalúa el resultado final; en cursos el sensei ayuda durante el proceso. El prompt necesita el contexto del paso actual + lo que el user ya completó en la lección.
>
> Una oportunidad que Code School no tenía: el LLM puede generar variaciones de los challenges. Si un user completa el challenge, ofrecer "¿Quieres intentar una variación más difícil?" generada por el sensei. Esto extiende el contenido sin que el creador escriba más.

### Marta Kowalczyk (Seguridad)

> Cursos públicos sin login son la superficie de ataque más grande. Rate limiting estricto: 10 ejecuciones/minuto por IP sin auth. Además, los challenges deben tener una whitelist de lenguajes — no permitir que un user público ejecute código arbitrario fuera del contexto del step.
>
> El progress tracking sin login puede usar localStorage + fingerprint ligero. Si el user luego se registra, migrar el progreso. No guardar PII sin auth.

### Amara Diallo (Community)

> Code School creció a 700K email subscribers con cursos gratuitos. El equivalente moderno no es email — es **share cards de progreso**. Cuando un user completa un curso, la share card dice "Completé SQL Deep Cuts en dojo_" con su badge. Eso es más viral que un email signup form.
>
> Los primeros cursos deben cubrir temas que la gente busca activamente: "learn Go", "learn Rust", "advanced SQL". Esos son los términos de búsqueda que traen tráfico orgánico. No empieces con temas nicho.

---

## Catálogo completo de Code School

Code School ofreció ~50 cursos organizados en paths. Los cursos marcados con ⭐ eran gratuitos (acquisition funnel).

### Ruby Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try Ruby** | Intro amigable | 8 | Variables, strings, arrays, hashes, methods, classes |
| **Ruby Bits** | — | 6 | Expressions, methods, classes, ActiveSupport, blocks/procs/lambdas |
| **Ruby Bits 2** | — | 6 | Closures, DSLs, metaprogramming, method_missing |

### Ruby on Rails Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Rails for Zombies Redux** | Apocalipsis zombie | 5 | L1: CRUD & ActiveRecord. L2: Models (validations, relationships). L3: Views (ERB, helpers, layouts). L4: Controllers (params, redirects, sessions). L5: Routes (RESTful, named routes) |
| **Rails for Zombies 2** | Zombie sequel | 5 | Migrations, named scopes, callbacks, asset pipeline, CoffeeScript, SCSS, mailers |
| **Rails Testing for Zombies** | Zombie testing | 5 | Unit tests, model tests, controller tests, integration tests, mocking/stubbing |
| **Rails 4: Zombie Outlaws** | Western zombie | 5 | Strong params, Turbolinks, Russian Doll caching, live streaming, ActionController::Live |
| **Rails 4 Patterns** | — | 5 | Decorators, form objects, service objects, concerns, workers |
| **Rails Best Practices** | — | 5 | Performance, anti-patterns, refactoring |
| **Surviving APIs with Rails** | Supervivencia | 5 | RESTful APIs, versioning, authentication, serialization, rate limiting |

### JavaScript Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **JavaScript Road Trip Part 1** | Road trip americano | 3 | Values, variables, strings, numbers, comparisons, conditionals |
| **JavaScript Road Trip Part 2** | Road trip continúa | 5 | Loops, functions, arrays, built-in functions, closures, hoisting |
| **JavaScript Road Trip Part 3** | Road trip final | 5 | Function expressions, closures, hoisting, objects, prototypes |
| **JavaScript Best Practices** | — | 4 | Ternaries, loop optimization, performance, namespacing |
| **ES2015: The Shape of JS to Come** | — | 5 | let/const, template strings, arrows, destructuring, classes, modules, Maps/Sets, Promises, iterators, generators |
| ⭐ **Try jQuery** | — | 5 | Selectors, DOM traversal, manipulation, events |
| **jQuery: The Return Flight** | Aviación | 5 | Ajax, plugins, promises, advanced events, deferred objects |
| **CoffeeScript** | — | 6 | Syntax, functions, conditionals, arrays, objects, classes, OOP |

### HTML/CSS Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Front-end Foundations** | — | 5 | HTML elements, structure, CSS selectors, box model, floats, fonts |
| **Front-end Formations** | — | 5 | Advanced selectors, pseudo-classes, layout techniques, responsive basics |
| **CSS Cross-Country** | Esquí | 7 | Cascade, floats, box model, positioning, responsive layout, specificity, clearing |
| **Adventures in Web Animations** | Aventura | 5 | CSS transitions, transforms 2D/3D, keyframe animations, performance |
| **Assembling Sass** | Ensamblaje | 5 | Variables, nesting, mixins, extends, imports, functions, placeholders |
| **Assembling Sass Part 2** | — | 5 | Conditionals, loops, math, advanced mixins, media queries, Bourbon |
| **Blasting Off with Bootstrap** | Espacial | 5 | Grid system, typography, components, JS plugins, customization |
| **Fundamentals of Design** | — | 5 | Typography, color theory, layout, balance, contrast, UX basics |
| **You, Me & SVG** | — | 5 | SVG basics, shapes, paths, text, styling, animation, optimization |
| **Cracking the Case with Flexbox** | Detective | 5 | Flex container, flex items, alignment, ordering, responsive patterns |
| **Unmasking HTML Emails** | Misterio | 5 | Table layouts, inline styles, email client quirks, responsive email |

### Angular Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Shaping Up with AngularJS** | Gem store | 5 | L1: Directives & expressions. L2: Filters & custom directives. L3: Forms & validation. L4: Custom directives. L5: Services & dependencies |
| **Staying Sharp with AngularJS** | — | 5 | Services, factories, providers, routes, resolve, directives API, testing |
| **Accelerating Through Angular 2** | — | 5 | Components, templates, data binding, services, DI, HTTP, pipes, routing |

### React Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| **Powering Up with React** | Energía | 5 | Components, JSX, props, state, lifecycle, events, synthetic events, refs |

### Backbone.js Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| **Anatomy of Backbone.js** | Anatomía | 7 | Models, views, collections, routers, events, syncing with server |
| **Anatomy of Backbone.js Part 2** | — | 7 | Custom collections, view templates, model relationships, composite views, app organization |

### Ember Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try Ember** | — | 5 | Handlebars templates, routes, models, components |
| **Warming Up with Ember.js** | — | 7 | Routes, templates, models, controllers, components, Ember Data, adapters |

### Node.js Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| **Real-time Web with Node.js** | — | 7 | Events, streams, modules, Express, Socket.io, persisting data |
| **Building Blocks of Express.js** | — | 5 | Middleware, routes, route files, dynamic routes, body parser |

### Git Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try Git** | — | 1 (25 challenges) | init, add, commit, push, pull, diff, log, branch, merge |
| **Git Real** | Digital/Tron | 7 | Staging, cloning, branching, merging, remote repos, tagging, rebasing |
| **Git Real 2** | — | 6 | Interactive rebase, stashing, cherry-pick, reflog, submodules, filter-branch |
| **Mastering GitHub** | — | 4 | Collaboration, pull requests, issues, GitHub Pages, organizations, CI |

### PHP Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try PHP** | — | 5 | Variables, strings, arrays, conditionals, loops, functions |
| **Close Encounters with PHP** | Aliens | 5 | Functions, classes, OOP, inheritance, PDO/databases, namespaces |

### Python Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try Python** | — | 5 | Variables, strings, conditionals, lists, functions |
| **Flying Through Python** | Vuelo | 5 | Functions, classes, modules, file I/O, error handling |

### Django Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| **Try Django** | — | 5 | Models, views, templates, URLs, admin |
| **Digging Into Django** | — | 5 | Forms, authentication, queries, migrations, deployment |

### iOS Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try Objective-C** | — | 5 | Types, objects, messages, properties, classes |
| ⭐ **Try iOS** | — | 5 | Xcode, Interface Builder, outlets, actions, views |
| **Core iOS 7** | — | 6 | Table views, auto layout, animations, networking, Core Data |
| **iOS Operation: Models** | — | 5 | Core Data, NSManagedObject, fetch requests, predicates |
| **App Evolution with Swift** | — | 5 | Swift syntax, optionals, classes, protocols, UIKit |

### .NET Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try ASP.NET Core** | — | 5 | Controllers, views, models, Razor, routing |
| **Forging Ahead with ASP.NET Core** | — | 5 | Tag helpers, middleware, configuration, Entity Framework, authentication |

### Database Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try SQL** | — | 5 | SELECT, WHERE, ORDER BY, JOIN, INSERT, UPDATE, DELETE |
| **The Sequel to SQL** | — | 5 | Aggregates, subqueries, indexing, constraints, normalization |
| **The Magical Marvels of MongoDB** | Magia/fantasía | 5 | Documents, CRUD, queries, update operators, data modeling |

### Elixir Path

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| ⭐ **Try Elixir** | — | 5 | Atoms, pattern matching, tuples, lists, maps, modules, functions |
| **Mixing It Up with Elixir** | — | 5 | Structs, control flow, Enum, pipe operator, processes, agents, OTP basics |
| **On Fire with Phoenix** | — | 5 | Routing, controllers, templates, Ecto, channels |

### Electives

| Curso | Tema | Levels | Currícula |
|---|---|---|---|
| **On Track with Golang** | Tren/vías | 5 | Variables, types, functions, structs, interfaces, goroutines, channels |
| **Breaking the Ice with Regex** | Ártico | 5 | Literals, character classes, quantifiers, anchors, groups, lookahead |
| ⭐ **Try R** | — | 5 | Vectors, matrices, data frames, factors, summary statistics |
| ⭐ **Discover DevTools** | Exploración | 7 | Elements, console, network, sources/debugging, profiles, timeline, audits |

### Cursos gratuitos (acquisition funnel)

Los ⭐ servían como puerta de entrada a cada path. Total: **18 cursos gratuitos** que generaron 700K+ email subscribers y sirvieron como el principal canal de adquisición.

---

## Resumen: Code School vs Dojo Courses

| Dimensión | Code School (2011) | Dojo Courses (2026) |
|---|---|---|
| Contenido | Video + challenges | Texto interactivo + challenges |
| Ejecución | Server-side custom | Piston (backend) + iframe/Sandpack (frontend) |
| Producción por curso | $20-80K, equipo de 20 | ~$0 infra + tiempo del creador |
| Identidad visual | Ilustraciones custom ($$$) | Color theme + icono (CSS) |
| Feedback en errores | Tests custom + hints | Piston tests + hints + sensei on-demand (LLM) |
| Modelo de negocio | $29/mes suscripción | Cursos gratis (acquisition) → katas invite-only (retención) |
| Catálogo inicial | 1 curso (Rails for Zombies) | 1 curso (SQL Deep Cuts) |
| Killer feature | Videos de alta producción | Ejecución real + sensei LLM |
