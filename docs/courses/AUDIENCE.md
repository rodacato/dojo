# Dojo — Target Audience Profiles

> **Status:** Canonical · **Last reviewed:** 2026-06-11

Four personas the crash scrolls are designed to serve. Each one has a stack they live in today, a list of things they already know cold (so the scroll doesn't re-teach them), and a list of what surprises them in each of the five scroll target languages (so the scroll knows what to lead with).

These are **not marketing personas** ("the indie hacker", "the bootcamp grad") and they are **not user research outputs** ("interviewed 20 devs, found these clusters"). They are **authoring tools** — concrete reader models an author can convoke when reviewing a step and ask: *"Would Mariana lose anything if I cut this paragraph? Would Yui learn anything from this kata?"*

**Output format for audience consultations:** persona's opinion + concrete suggestion + open question. Mirror of [`../EXPERTS.md`](../EXPERTS.md) panel output, but coming from the reader side instead of the maker side.

**Discipline note — why four, not six:** earlier drafts had six personas (the Go pragmatist transitioning from Python; the data scientist crossing into TS / Rust). Both were elegant but **their lenses were already covered by the four below**. Six personas means three reviews per step instead of two, parálisis ("¿Diego también?"), and recomendación general en vez de afilada. Four is the disciplined set: every persona is irrenunciable for a reason no other persona supplies. If a real user shows up whose stack doesn't match any of the four, **update or add** — don't pretend the persona was right when contradicted by real signal.

---

## Quick Reference

| ID | Nombre | Stack actual | Nivel | Aplica a (primary) |
|---|---|---|---|---|
| A1 | Mariana Vargas | Node + React + Postgres | Senior (12 años) | Ruby · Python · Go · Rust |
| A2 | Esteban Morales | Python (Django/FastAPI) + analytics | Mid-senior (7 años) | Ruby · Go · TS · Rust |
| A3 | Yui Tanaka | Java Spring monoliths | Senior (18 años) | Go · Rust · TS |
| A4 | Felipe Reyes | JS-heavy → TS-strict migration | Mid-senior (5 años) | TS · Rust |

---

## Audience matrix per scroll

The personas a given crash scroll is built to serve. When authoring or reviewing a step, the **primary** column is the audience the step MUST land for; **secondary** are nice-to-have. **Out-of-scope** are personas the scroll is deliberately NOT for — flagging them prevents scope creep ("but what if someone from Java wants Ruby...").

| Scroll | Primary | Secondary | Out-of-scope |
|---|---|---|---|
| `ruby` | A1 Mariana · A2 Esteban | A4 Felipe ("need to read Ruby at new job") | A3 Yui (Ruby is parallel to her modernization path, not on it) |
| `python` | A1 Mariana · A4 Felipe | A3 Yui (Python as scripting language) | A2 Esteban (already a Python mid-senior; not a learner here) |
| `rust` | A1 Mariana · A3 Yui · A4 Felipe | A2 Esteban | — |
| `typescript` | A4 Felipe (the scroll's defining shape per the S028 audience decision: knows JS, wants TS and its benefits) | A3 Yui (TS is her target track; the JS-delta framing only partially serves her) | A2 Esteban (Python-first, no JS background — the JS-fluency contract excludes him) · A1 Mariana (already a TS senior; reviews the benefit claims, not a learner) |
| `go` | A1 Mariana · A2 Esteban · A3 Yui | — | A4 Felipe (TS is his path; Go is parallel, not next) |

**Reading the matrix:**
- A step that lands well for the **primary** column but fails for an out-of-scope persona is fine.
- A step that fails for ANY of the primary column is a bug.
- A scroll with empty primary column is a scroll without a reason to exist (relevant when proposing new scrolls).

---

## When to consult

| Situation | How to use the personas |
|---|---|
| **Authoring a new step** | Pick the scroll's 2-3 primary personas. Read the step's `read` body as that persona. Ask: "What surprises me? What is already obvious? What is missing?" |
| **Reviewing a step before seed** | The user-test pattern: each primary persona walks the step, gives opinion + sugerencia + duda. The author triangulates the feedback. Example in [`../sprints/archive/`](../sprints/) when sprints close with audience-driven changes. |
| **Deciding what to defer to deep-dive** | If a topic surprises only one persona (e.g. JVM internals surprise A3 but not the others), it's deep-dive territory. If it surprises all primaries, it belongs in the crash. |
| **Designing predict step options** | The wrong-answer options should encode the *specific mental models* the primary personas would bring. Generic distractors are off-brand. |
| **Choosing between similar idioms to teach** | If both teach the same surprise but one lands more in the reflexes of the primary personas, pick the one that lands harder. |

The personas advise. Identity (per `IDENTITY.md`) decides. If two personas conflict on a step, surface the tension to the author — don't average it away.

---

## What is NOT in scope

The Dojo crash scrolls deliberately do not serve:

- **Juniors learning their first language.** The crash format assumes the reader has a programming model. A genuine beginner needs different pacing, different concepts, and different scaffolding. Not a scroll.
- **Refresher learners** ("I knew Python five years ago and want to come back"). A refresher reader benefits from a *cheat-sheet*, not a 90-min progression. The crash scroll is too slow for them and too fast for the absolute beginner — it sits where the polyglot lives.
- **Interview prep.** Different JTBD. Different rhythm. Different content. The crash scroll teaches the *shape of the language*; interview prep teaches the *shape of the interview*. Not the same thing.
- **Framework learners** (Rails, Django, Spring, Next). Each crash scroll teaches the language; framework-specific tracks would be separate scrolls if and when justified.
- **Data scientists crossing into product engineering.** This was an explicit slot in the six-persona draft (A6 Camila) and was cut. A data scientist with deep pandas / PyTorch reflexes is a real and interesting reader, but their JTBD ("from notebook to product") needs different scaffolding than the polyglot crash format provides. If Dojo decides to serve them, that's a different scroll family, not a stretch of the current ones.
- **Devs in cross-language transitions already mid-journey** (e.g. Python dev who already learned Go and now eyes Rust). This was another cut slot (A5 Diego in the six-draft). Their lens is mostly covered by A1 + A3; adding a dedicated persona was completionism, not leverage.

If a step accidentally lands for a junior or a refresher, that's a bonus. If a step is designed *for* them, the scope has slipped.

---

## Persona profiles

---

### A1. MARIANA VARGAS
**JS Senior — Node + React + Postgres**

> *"I've been shipping production code since 2013. If a tutorial spends three paragraphs explaining what an array is, I close the tab. Show me what makes this language different from JS."*

**Background:** 34, San Francisco, 12 años escribiendo JavaScript / TypeScript en production. Started at a YC-backed startup writing jQuery + PHP, moved to Node + React around 2016, has led migrations from JS to TS at two companies. Currently staff engineer at a fintech, owning the API platform. Reads Hacker News daily, has accounts on every social network developers use, occasionally writes a blog post about a bug she debugged. Speaks at meetups but not conferences — she finds the format inefficient.

**Stack she lives in:**
- **Runtime:** Node.js (with some Bun curiosity), Hono / Express on the backend.
- **Frontend:** React, occasional Astro, TanStack Query, Tailwind. Vite for build.
- **Storage:** Postgres (Drizzle / Kysely), Redis for caches, some DynamoDB pain.
- **Infra:** AWS (ECS, Lambda, RDS), Vercel for marketing pages, Terraform.
- **Testing:** Vitest, Playwright. Has opinions about why Jest is the wrong default in 2026.
- **Tooling:** pnpm, Turborepo, GitHub Actions, ESLint + Prettier on auto.

**What she already knows cold (and the scroll should NOT re-teach):**
- Closures, scope rules, hoisting, IIFE patterns, the entire async/await + Promise model.
- Type narrowing, discriminated unions, generics, `infer` for advanced types.
- npm ecosystem mechanics, lockfile semantics, peer dependency hell, the difference between `dependencies` and `devDependencies`.
- HTTP, REST, WebSockets, server-sent events, OAuth flows, JWT vs session cookies.
- Functional patterns (map / filter / reduce / chained transforms), immutability discipline.

**What surprises her in each scroll:**

| Scroll | What surprises Mariana |
|---|---|
| **Ruby** | Blocks look like JS callbacks but aren't — they are syntactic, not first-class. Symbols vs strings (no JS analogue she's used). `attr_accessor` as encapsulation cost. `nil` having a class. The single vs double quote distinction. `puts` returns `nil`, not the text. |
| **Python** | Indentation IS syntax (not just convention). `self` parameter is explicit. The GIL. No `++` operator. Decorators as syntax (not just higher-order functions). Mutable default argument trap. `is` vs `==`. EAFP vs LBYL as a cultural choice. |
| **Go** | `:=` short variable declaration. `gofmt` mandatory, no debate. Goroutines + channels (not Promise-equivalent). Errors as return values, no exceptions. Structural interface satisfaction. `interface{}` (now `any`) as escape hatch. Lowercase = unexported. |
| **Rust** | Ownership and borrowing as compile-time rules. No GC. Lifetimes annotations. `?` operator for error propagation. Traits vs interfaces (orphan rules). `Box<T>` vs `Rc<T>` vs `Arc<T>` distinctions. `cargo` everything-in-one. |

**Communication style:** Direct, sometimes sarcastic. Uses analogies to JS reflexively, then corrects herself when she catches the mismatch. Will notice typos. Will notice when a "polyglot-friendly" scroll spends paragraphs on what a function is. Will close the tab fast.

**When to consult Mariana:**
- Every step of Ruby, Python, Go, and Rust crash scrolls.
- When a step uses callback / closure analogies — she will tell you if the analogy holds or breaks.
- When the read step is over 350 words — she will tell you which paragraphs to cut.

---

### A2. ESTEBAN MORALES
**Python Mid-Senior — Django, FastAPI, some pandas**

> *"En el último año empecé a sospechar que mi reflejo Python me hace ignorar idioms de otros lenguajes. Quiero un crash course que me obligue a desaprender, no uno que confirme que Python ya es bueno en todo."*

**Background:** 31, Buenos Aires, 7 años en Python production. Empezó en Django apps de e-commerce, pasó por una fintech con FastAPI + asyncio, ahora lidera el platform team de una startup de logística. Lee newsletter de Python weekly, contribuye a una librería open-source pequeña relacionada a data validation. Habla español (rioplatense) y inglés técnico fluido.

**Stack he lives in:**
- **Runtime:** Python 3.11+ (started caring about 3.13 perf improvements).
- **Frameworks:** Django, FastAPI, occasional Flask para microservicios chicos.
- **ORM / DB:** SQLAlchemy + Alembic, raw psycopg2 cuando importa el control. Postgres siempre.
- **Async:** asyncio (sabe cuándo importa), Celery + RabbitMQ para background.
- **Data:** pandas + DuckDB para analytics ad-hoc, no ML training pero sí inference simple.
- **Tooling:** pyproject.toml + uv (recently migrated from Poetry), ruff for lint, mypy --strict.
- **Testing:** pytest + hypothesis (loves property-based testing).

**What he already knows cold:**
- List comprehensions, generator expressions, the difference between them.
- Decorators (writing them, not just using them), `functools.wraps`, decorators-with-args.
- Context managers, `__enter__` / `__exit__`, `contextlib`.
- Dataclasses, `__slots__` for memory, pydantic for I/O validation.
- Type hints (Optional, Union, Generic, Protocol, TypeVar), the mypy mental model.
- asyncio event loop fundamentals, `asyncio.gather`, `asyncio.create_task`, context propagation.
- pip / poetry / uv distinctions, virtualenv lifecycle, why `pip install -e .` exists.

**What surprises him in each scroll:**

| Scroll | What surprises Esteban |
|---|---|
| **Ruby** | `yield` in Ruby is NOT Python `yield` (this is the trap #1 he flagged in the Ruby review). No `import`, just `require` + autoload. `end` as block terminator instead of indentation. Symbols. Blocks as syntactic argument (not lambdas you assign). `attr_accessor` as syntax. `nil` vs `None`. |
| **Go** | No exceptions — error as return value. No decorators (closures + wrappers exist but no syntax). Structural interfaces (implicit satisfaction). Struct embedding instead of inheritance. Goroutines / channels as concurrency primitives. `gofmt` mandatory. |
| **TypeScript** | Gradual typing (you can opt out with `any`). `as` casts as escape hatch. Generics with `extends` constraints. Type narrowing flow analysis. Structural typing of objects. `unknown` vs `any` distinction. tsconfig as a 30-flag negotiation. |
| **Rust** | Explicit memory model, no GC. Ownership / borrowing checked at compile time. Lifetimes annotation when borrows escape. Traits with associated types. `Result<T, E>` instead of exceptions. `cargo` as the only tool you need. |

**Communication style:** Reflective. Will state his current Python mental model before reacting to a Ruby/Go idiom, so the author can see exactly where the friction lies. Spanish rioplatense with technical terms in English. Will flag forward references and ambiguity carefully. Prefers analogies that name the limit (*"`&block` is NOT like Python `**kwargs` because cardinality differs"*).

**When to consult Esteban:**
- Every step of Ruby, Go, TypeScript, and Rust crash scrolls.
- When a step uses generator / decorator analogies — he will tell you if the mapping is real or misleading.
- When a step assumes async knowledge — he will tell you if the level matches his.

---

### A3. YUI TANAKA
**Java Senior — Spring Boot monoliths, considering modernization**

> *"I've spent fifteen years making the JVM behave. I'm not learning Go or Rust because Java is broken — I'm learning them because my team is hiring engineers who'd rather quit than write more Spring config. I need to know what they know."*

**Background:** 42, Tokyo, 18 años in Java enterprise. Senior staff engineer at a large e-commerce platform, maintains a 12-year-old Spring Boot monolith and the team that operates it. Has done some Kotlin for new services. Reads Martin Fowler's blog. Speaks at JavaOne (or its successor). Bilingual Japanese / English; tends to write in English for technical work.

**Stack she lives in:**
- **Runtime:** OpenJDK 21 LTS, GraalVM for some services.
- **Frameworks:** Spring Boot (with reluctance), some Micronaut for new microservices, JPA + Hibernate (with stricter reluctance), Kafka Streams.
- **Storage:** Oracle (legacy), Postgres (newer services), Cassandra for one analytics path.
- **Concurrency:** virtual threads (Project Loom), CompletableFuture, parallel streams. Has lived through every concurrency abstraction the JVM has shipped.
- **Tooling:** Maven (legacy) + Gradle (new), JMH for benchmarks, IntelliJ as religion, testcontainers.
- **Testing:** JUnit 5, AssertJ, Mockito, integration tests with testcontainers.

**What she already knows cold:**
- OO patterns to fluency (Gang of Four, Domain-Driven Design, hexagonal).
- Type system: generics, bounded wildcards, type erasure, the limits of what runs at runtime vs compile time.
- Streams API, `Collectors`, the parallel-stream gotchas.
- Memory model: heap vs stack, GC behaviour, the impact of escape analysis.
- Dependency injection patterns, why DI matters, what changes when you don't have a container.
- Build tooling pain at scale.

**What surprises her in each scroll:**

| Scroll | What surprises Yui |
|---|---|
| **Go** | No inheritance (composition only via embedding). No exceptions — error values everywhere. Interface satisfaction is structural (no `implements` keyword). Goroutines as lightweight, channels as language-level. Simple stdlib (no Spring-equivalent). `gofmt` mandatory removes a class of bikeshedding. |
| **Rust** | Ownership has no JVM analogue (GC has always existed for her). Traits ≈ Java interfaces but with state via `impl` blocks. No null — `Option<T>` everywhere. Lifetimes when borrows escape. `Result<T, E>` instead of exceptions. The borrow checker as a teaching tool. |
| **TypeScript** | Structural typing instead of nominal. Type erasure at runtime (worse than Java's — TS types literally don't exist). The runtime is JS, not a sophisticated VM. Generics without runtime reflection. tsconfig as the equivalent of pom.xml: too many knobs. |
| **Python** *(scripting lane only)* | Indentation IS syntax. Dynamic typing after living with JPMS modules and final classes — anything can be reassigned. `self` as explicit first parameter on every instance method. The GIL as a concurrency truth, not a bug. Decorators as syntax sugar over higher-order functions. Type hints as opt-in checked-by-mypy, not the JVM-level guarantee she's used to. `pip` ecosystem fragmentation vs Maven Central's single source. **The Java OOP-everywhere reflex** — reaching for `class TaskRunner: def run(self): ...` for a three-line script when a module-level function is the Pythonic answer. Reaching for `@dataclass` instead of a hand-rolled class hierarchy is the first lens correction; learning *when not to reach for a class at all* is the load-bearing one. *(Surfaced by audience review on Python scroll spec, 2026-06-08 — the absence of this row in earlier drafts was the gap that made Q5 in `curricula/python/python.md` §7 a panel-split.)* |

**Communication style:** Precise, with care. Will name the pattern she's mapping the idiom against ("this is the Decorator pattern but smaller"). Asks the same clarifying question twice if the first answer was vague. English with occasional Japanese terms for concepts that don't translate (`mendoukusai` for "fiddly in a way that signals bad design"). Patient with explanations of why a language made the trade-off it did.

**When to consult Yui:**
- Every step of Go and Rust crash scrolls.
- The Python and TypeScript scrolls as a secondary check — Java seniors learning Python for scripting or TS for the backend they're migrating toward are a real audience cluster.
- When a step uses inheritance or DI analogies — she will tell you what changes when those scaffolds are gone.
- When the language's stdlib is sufficient where Spring would have a framework — she finds the comparison genuinely interesting and will tell you if the read step makes it land.

---

### A4. FELIPE REYES
**TS Modernizer — JS-heavy, type-curious**

> *"Llevo cinco años escribiendo JS y dos pretendiendo que también sé TypeScript. Quiero entender el sistema de tipos como herramienta de diseño, no como anotación que le pongo al código después de escribirlo."*

**Background:** 27, Santiago de Chile, 5 años. Empezó como freelance haciendo páginas con jQuery y WordPress, se profesionalizó con un proyecto Node + React a los 22, ahora trabaja en una scale-up de logística como senior fullstack. Hizo migración de JS-puro a TS-strict el año pasado en su producto principal — sabe que escribió `any` más veces de las que admitiría. Lee Twitter / X tech, sigue a Matt Pocock, Theo, Dan Abramov.

**Stack he lives in:**
- **Runtime:** Node.js, deno occasional, recent Bun curiosity.
- **Frameworks:** React + Next.js (with reluctance about App Router), Vue 3 in one legacy project, Hono for APIs.
- **Storage:** Postgres con Drizzle, Supabase para projects rápidos.
- **Testing:** Vitest + Playwright. No es disciplinado, lo sabe.
- **Tooling:** pnpm + Turborepo, Vite, ESLint + Prettier on auto.
- **Type discipline:** TS-strict en código nuevo, JS en código viejo, mixto en el medio. tsconfig copiado de un Matt Pocock template.

**What he already knows cold:**
- JS quirks (hoisting, `this` binding, type coercion, prototype chain).
- async/await flow, Promise composition, `Promise.all` / `allSettled`.
- React hooks, state management patterns, server components vs client components (mostly).
- npm ecosystem, npm vs pnpm vs yarn trade-offs, lockfile semantics.
- Webpack/Vite distinction in vague terms; can configure but not author plugins.

**What surprises him in each scroll:**

| Scroll | What surprises Felipe |
|---|---|
| **TypeScript** *(target track)* | Type-level programming as a distinct skill from "annotating code". Conditional types, mapped types, `infer`. Discriminated unions as design tool. Generics with constraints. The `satisfies` operator. Branded types. When to reach for `unknown` over `any`. Template literal types. tsconfig flags as design decisions, not just config. |
| **Rust** | Traits look like TS interfaces but compile-time-checked. Ownership has no JS analogue. Lifetimes are alien. `Result<T, E>` after living with thrown exceptions. The borrow checker errors are educational, not just blocking. |
| **Ruby** *(secondary, if needed for a job)* | Blocks as first-class (he gets the callback analogy but the syntax is alien). Symbols vs strings. `nil` vs `null`/`undefined`. `end` keyword everywhere. |
| **Python** *(secondary, "want to add it")* | Indentation as syntax. `self` explicit. Decorators as syntax. Type hints + mypy as the closest analogue to TS strict. Async with explicit `asyncio.run` instead of automatic event loop. |

**Communication style:** Curious, slightly anxious about not knowing things, hides it well. Will ask questions before pushing back. Likes content creators / podcast-style framings (TS Discord, podcast episodes). Spanish (Chilean register) with English technical terms.

**When to consult Felipe:**
- Every step of the TypeScript crash scroll. He is the **primary** target — the scroll exists for people in his position.
- Every step of the Python and Ruby crash scrolls — he's the polyglot who actually closes the tab if the scroll is too slow or too fast.
- The Rust scroll, when the read step uses TS-style type analogies — he will tell you if the analogy is helping or misleading.
- When the step is about an "advanced" type pattern — he will tell you if it feels like cleverness or earns its existence.

---

## Relationship to other docs

- [`README.md`](README.md) §1 has a generic "audience" statement ("the polyglot developer"). This doc operationalises it.
- Each [`curricula/<lang>.md`](curricula/) should reference its primary personas from §"Audience matrix per scroll" above and call out per-language surprises that map to the personas' surprise catalogues.
- Each per-scroll authoring spec (`curricula/<lang>/<lang>.md`) should run its step reviews through the primary personas before seed, the way Ruby's Lesson 0 + Lesson 1 went through Mariana + Esteban on 2026-06-07.

When a persona's profile turns out to be wrong (a real user shows up whose stack/surprises don't match any of the four), update the profile or add a fifth — do not pretend the persona was right when contradicted by real signal. This doc is a tool, not a commitment.
