# Ruby — Authoring Spec

> Executable authoring brief for the `ruby` scroll — the dojo's Ruby crash course.
> Inherits the Ruby Course Authoring Profile from [`../ruby.md`](../ruby.md) §2. Template: [`../../authoring-spec-template.md`](../../authoring-spec-template.md). Framework: [`../../README.md`](../../README.md). Direction: [ADR 022](../../../adr/022-crash-course-pivot.md).
>
> **Re-scoped 2026-06-07** — polyglot-first reorder, Lesson 0 added, playgrounds introduced as a `kata` variant. The pre-2026-06-07 spec (object-model-first, 20 steps, no Lesson 0) is preserved in git history.

## Header

```yaml
slug: ruby
title: "Ruby"
kind: language-scroll
language: ruby
sandbox: piston
prereqs: []
audience: "polyglot developer who already programs in another language"
learner_time: "~110 minutes (60-120 range)"
status: spec-in-progress         # Lesson 0 + Lesson 1 drafted; Lesson 3 inherits the seed currently in DB and needs re-tightening; Lessons 2/4/5 stubbed
maintainers:
  - S10 Rhea Kapoor              # language pedagogy
  - S5 Elif Yıldız               # curriculum architecture
  - S2 Valentina Cruz            # content quality
  - S11 Maya Lindqvist           # predict / playground / read+inline review
```

---

## 1. Learning Outcomes

After finishing this scroll, the learner can…

- Locate Ruby on their internal language map: what it is for, where it does and doesn't fit, what RubyGems/Bundler do, how `bundle exec` differs from raw invocation, and why `Gemfile.lock` matters. Predict which command a polyglot should run first after cloning a Ruby project.
- Read and write Ruby blocks: pass `do |x| ... end` or `{ |x| ... }` to a method, accept one with `yield` or `&block`, recognise the `&:symbol` shorthand, and explain the "block-as-API-shape" pattern (`File.open(path) { |f| ... }`). Depth on `Proc` vs `lambda` mechanics deferred to the blocks deep-dive.
- Read and write idiomatic Ruby across the core literal surprises — single vs double quotes with `#{}` interpolation, `Hash#fetch` with a default block, symbol identity as immutable interned strings, `Array#tally`, integer division gotcha. Generic literal facts the polyglot already knows are explicitly NOT taught.
- Predict the result of common Ruby expressions that surprise a polyglot (`nil.class`, `0` as truthy, `:foo == "foo"`, `[].max`, `5.+(2)`) and explain *why* each result holds in terms of Ruby's object model.
- Use Ruby's control flow with confidence in the surprises that bite: only `false` and `nil` are falsy; `case/when` uses `===`; `unless`/`until` and the postfix forms (`x if y`) are first-class.
- Define methods with positional, default, keyword, and splat (`*args` / `**opts`) arguments, recognise implicit return, and introspect a method's parameter classification with `Method#parameters`.
- Name the Ruby-specific footguns the polyglot will eventually encounter in real codebases (`method_missing`, eigenclasses, monkey-patching, `attr_accessor` as encapsulation cost) and know they belong to deep-dive scrolls — not to be silently ignored, not to be taught here in passing.

Each outcome maps to at least one exercise, `predict`, or playground step in §4. Outcomes without a step are aspirational and must be cut or backed by a step.

---

## 2. Sub-course Authoring Notes

No deviations from the Ruby Course Authoring Profile (see [`../ruby.md`](../ruby.md) §2). Inherits the full profile as-is:

- Voice & angle — Ruby-not-Rails. Polyglot audience explicitly assumed in every step.
- Step density — 300-400 words per `read` step; this scroll leans into Ruby's "everything is an object" + "blocks are central" surprises.
- Interactivity menu — `read`, `exercise`, `challenge`, `predict`, `read+inline`, and the local-experiment `playground` variant (see §2 below). No `trace`.
- Pedagogical bets — all four apply.

Explicit local choices for this scroll specifically:

### 2.1 The "paragraph test" — gate for every `read` step

Before any `read` paragraph ships, it passes the test:

> *If I delete this paragraph, does the polyglot lose something Ruby-specific? If no, the paragraph doesn't exist.*

This is the load-bearing rule against the tour-guide failure mode. The polyglot doesn't need to be told that strings have an `upcase` method (every language has uppercase) or that arrays are zero-indexed (so is theirs). They need to be told what surprises them: that `5.+(2)` parses, that `nil` has a class, that `Hash#fetch` takes a block. Every word of every `read` step is judged against this gate at draft and at review. Tour-guide prose that survives a draft is cut at review.

### 2.2 `predict` placement

Four predict steps total — one each in Lessons 0, 1, 3, and 4. Locations:

- **Lesson 0 — "Which command after cloning a Ruby project?"** — orientation predict, validates the Bundler mental model the read step introduced.
- **Lesson 1 — "What does `with_timer { 1 + 1 }` output?"** — model-building moment on yield + implicit return.
- **Lesson 3 — `nil.class`** — canonical Ruby surprise.
- **Lesson 4 — "Is `if 0` truthy or falsy?"** — the polyglot reflex correction.

Lessons 2 and 5 are mechanical enough that `predict` would feel forced; they stick to read + exercise + challenge.

### 2.3 Playgrounds as `kata` variant (local experiment)

Two playground steps in this scroll (Lessons 1 and 3). They are NOT a new step type — they are `kata` steps with a `data.kind: "playground"` flag. The scroll player reads the flag and renders without verdict UI: button reads "Ejecutar" instead of "Ejecutar tests", no test-result list, no pass/fail chip. The harness's `testCode` carries a single trivially-true assertion so the backend stays uniform.

This is a deliberate **local experiment**, not a framework decision. Per [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md) §"Authoring checklist for a new step type", a step type must be used in ≥20 steps across the catalog to earn formalisation. 2 playgrounds × 5 language scrolls = 10-15, which is below the gate. The pattern lives here as an undocumented variant until 2-3 lessons across at least 2 scrolls validate it. If it survives, it gets promoted to a canonical step type with an ADR and a `INTERACTIVITY-PATTERNS.md` update. If it doesn't (boring playground steps, low engagement signal), it disappears without leaving framework debt.

**Playground voice contract:** the instruction text gives the learner specific things to try, with motivation. Not "explorá libremente" — that produces an empty editor. The starter code pre-loads 3-5 expressions tied to the read/kata the playground follows; the learner runs them, observes output, then is invited to vary them. Maya (S11) will block any playground whose instruction reduces to "play around."

### 2.4 Footgun deferral discipline

When a topic that belongs in a future deep-dive surfaces (e.g. `Proc.new { return 1 }` semantics, eigenclasses, `method_missing`), the scroll **names it explicitly** and points to the deep-dive — does not silently elide. This is the difference between honest crash and superficial cheat sheet.

### 2.5 No Minitest

The crash scroll uses the manual `_t` / `_eq` harness defined in §5. Minitest belongs to its own deep-dive scroll; teaching it here would steal pedagogy budget from the language.

---

## 3. Retrieval & Cross-references

- **From prior scrolls:** none — this is the entry scroll of the Ruby track.
- **Within this scroll:**
  - Lesson 1's `repeat(n)` and `map_keys(hash, &block)` introduce blocks; Lesson 2's hash exercises and Lesson 3's object-model exercises reuse the block syntax silently — the learner who completed Lesson 1 reads `[1,2,3].map(&:to_s)` without re-explanation.
  - Lesson 1's `&:method` shorthand reappears in Lesson 2's literals work; Lesson 2 does NOT re-teach the mechanism, only uses it. (The mechanism's *explanation* lands in Lesson 3 once the object model is on the table.)
  - Lesson 2's symbol-key hash literals (`{ name: "Ada", age: 30 }`) reappear as fixtures for Lesson 4's `case/when` exercises and Lesson 5's keyword-argument examples.
  - Lesson 3's `respond_to?` and `inspect` muscles reappear in Lesson 5's method introspection (`Method#parameters` is conceptually the same shape).
- **Forward hooks for future deep-dive scrolls:**
  - `Proc` vs `lambda` semantics, `&block` vs `yield`, `Proc#curry` — named-and-deferred in Lesson 1's read step and again in Lesson 5's closer.
  - `attr_*`, `method_missing`, eigenclasses — named-and-deferred in Lesson 5's "what we didn't cover" closing.
  - `Symbol#to_proc` mechanism — used syntactically in Lessons 1-2, explained mechanically in Lesson 3 when the object model is the table.

---

## 4. Lessons

### Lesson 0 — Ruby en contexto

> *What changes in the learner's head:* "I now know whether Ruby is for me, what version family to learn, and what commands a real Ruby project expects me to type — without having to crawl through five tabs of mixed-quality docs."

**Step distribution:** 2 `read`, 1 `predict` = 3 steps. No `kata` here — this lesson orients, it doesn't drill syntax. A kata would be padding.

**Status:** drafting.

#### Step 0.1 — `read` — "¿Para qué sirve Ruby (y para qué no)?"

```yaml
title: "¿Para qué sirve Ruby (y para qué no)?"
type: read
why_care: |
  Antes de invertir 100 minutos en sintaxis, el polyglot necesita saber si Ruby
  vale su viernes. Esta lección lo orienta: dónde brilla, dónde no, quién la
  mantiene, qué versión usar. Información que normalmente sale de 5 tabs y un
  Hacker News thread.
body: |
  ~400 palabras. Cubre:
  - **Sweet spot:** Rails web apps (sigue siendo el caso de uso #1 a nivel
    económico), CLI tools (Homebrew, Jekyll, Vagrant están en Ruby), DSLs y
    configuración (Rakefile, Fastlane, Sass-original), scripting de
    automatización corta, prototipos donde la expresividad pesa más que la
    raw performance.
  - **Donde no brilla:** workloads CPU-intensive (ML training, simulaciones
    numéricas — usá Python o Julia o Rust), embedded, sistemas de latencia
    sub-ms, mobile native. No es por falta de calidad — el modelo de ejecución
    y el GC priorizaron expresividad sobre raw throughput.
  - **Quién hace Ruby hoy:** Matz (Yukihiro Matsumoto) sigue como BDFL.
    Shopify es el sponsor industrial más visible (financió YJIT, contribuye a
    pattern matching). Comunidad activa pero menos hype que Rust o Go en los
    últimos años — eso no es señal de muerte, es señal de madurez.
  - **Versiones modernas:** 3.x es el target. Ruby 3.0 (Dec 2020) trajo
    keyword args separados de hashes, ractors, pattern matching. Ruby 3.2
    trajo YJIT estable. Ruby 3.3 (Dec 2023) trae más YJIT y mejoras de pattern
    matching. **Evitá material pre-2.7** — sintaxis de kwargs distinta,
    performance baseline distinta, idioms intermedios.
  - **Sandbox honesty:** "Este crash course corre Ruby 3.0.1 en sandbox.
    Es la version mínima que soporta todo lo que vamos a usar (kwargs, tally,
    pattern matching básico). En tu máquina, querés 3.3+ via `rbenv` o `asdf`."
  - NO incluir: "Ruby es elegante" / "Matz is nice and so we are nice (MINASWAN)" /
    historia de Ruby on Rails / qué es un lenguaje interpretado.
  Cierra con: "En la próxima leés cómo se ejecuta Ruby en proyectos reales. La
  primera vez que tipées `bundle exec` vas a saber por qué."
voice_check: |
  Cada párrafo pasa el paragraph test (§2.1). El párrafo de "sweet spot" no
  existe si solo dice "Ruby sirve para web apps" — debe nombrar Homebrew,
  Jekyll, Vagrant porque eso es la información que el polyglot no tenía.
```

#### Step 0.2 — `read` — "Cómo se ejecuta Ruby"

```yaml
title: "Cómo se ejecuta Ruby (en proyectos reales)"
type: read
why_care: |
  Un proyecto Ruby clonado tiene un Gemfile y un Gemfile.lock. El polyglot
  reconoce el patrón (package.json, requirements.txt, go.mod) pero no sabe
  los comandos. Ahorrar dos horas de Stack Overflow.
body: |
  ~300 palabras. Cubre:
  - **`ruby file.rb`** — el comando básico para ejecutar un script.
  - **`irb`** — REPL stdlib (Interactive RuBy). Para experimentar líneas
    sueltas, probar expresiones, refrescar memoria de sintaxis.
  - **`pry`** — REPL mejor que irb (autocomplete, syntax highlight, source
    navigation). Es una gem, no viene por default; instalala con
    `gem install pry` o agregala al Gemfile en el grupo `:development`.
  - **`Gemfile` y `Gemfile.lock`** — el Gemfile declara qué gems necesita el
    proyecto (con rangos de versión). El Gemfile.lock fija las versiones
    exactas que se resolvieron. Análogo a `package.json` + `package-lock.json`,
    o `pyproject.toml` + `poetry.lock`, o `Cargo.toml` + `Cargo.lock`.
  - **`bundle install`** — instala las gems del Gemfile en el vendor local
    del proyecto (o globalmente con `--system`, raro). Crea el Gemfile.lock si
    no existe; lo respeta si existe.
  - **`bundle exec <comando>`** — corre el comando usando exclusivamente las
    gems del Gemfile.lock. Si tu máquina tiene varias versiones de `rspec`
    globales, sin `bundle exec` corrés con la version equivocada y los tests
    pueden fallar por razones que no tienen nada que ver con el código. **En
    cualquier proyecto Ruby moderno, el prefix `bundle exec` es default:**
    `bundle exec rspec`, `bundle exec rake db:migrate`, `bundle exec rubocop`.
    *Distinto de Python's venv:* Bundler no "activa" un environment global
    de la shell; cada comando se aísla con `bundle exec`. Mismo aislamiento
    por proyecto, mental model per-command.
  - **`.ruby-version`** — archivo de una línea con la version de Ruby que el
    proyecto espera. Herramientas como `rbenv` y `asdf` lo leen para
    auto-switchear. Si no usás un version manager, `ruby -v` te dice qué
    estás corriendo realmente.
  - **Sandbox honesty:** "En este scroll no necesitás instalar nada. Todo corre
    en sandbox sin Bundler. Pero los katas reflejan la convención: las
    soluciones son métodos puros que correrías como `ruby file.rb` sin gems
    externas. Cuando salgas a un proyecto real, `bundle exec` es la prefix."
  - NO incluir: "Ruby es interpretado" / qué es un package manager en general /
    historia de Bundler / RubyGems vs gems vs rubygems.org.
voice_check: |
  Cada comando aparece con su análogo en otros lenguajes una sola vez para
  enganchar la intuición del polyglot. No repetir la analogía cada párrafo.
```

#### Step 0.3 — `predict` — "Tenés un proyecto Ruby clonado. ¿Qué corrés primero?"

```yaml
title: "Tenés un proyecto Ruby clonado. ¿Qué corrés primero?"
type: predict
question: "Clonaste un proyecto Ruby de GitHub. El README dice 'usa Ruby 3.3'. Querés correr la app. ¿Qué comando ejecutás primero?"
snippet: |
  $ git clone https://github.com/example/ruby-app.git
  $ cd ruby-app
  $ ls
  Gemfile  Gemfile.lock  README.md  bin/  config/  lib/
  $ ???
options:
  - id: a
    text: "`ruby bin/app.rb`"
  - id: b
    text: "`bundle install`"
  - id: c
    text: "`irb`"
  - id: d
    text: "`gem install`"
correct: b
feedback:
  a: |
    El reflejo "simplemente correlo" funciona en lenguajes con stdlib generosa
    y proyectos chicos. En Ruby casi cualquier proyecto real depende de gems
    declaradas en el Gemfile; correr antes de instalar dependencias te tira
    `LoadError` en el primer `require`. Después de `bundle install`, sí podés
    correr lo que sea — idealmente con `bundle exec ruby bin/app.rb`.
  b: |
    Correcto. Cualquier proyecto Ruby clonado tiene un Gemfile (y casi siempre
    un `.ruby-version` también). `bundle install` lee el Gemfile, resuelve el
    grafo de dependencias, descarga las gems al vendor del proyecto, y respeta
    (o genera) el Gemfile.lock. Sin eso, los `require` de las dependencias
    fallan en el primer `ruby` que corras.
  c: |
    `irb` te abre un REPL aislado del proyecto. Es útil para probar expresiones
    del lenguaje (`5.times { |i| puts i }`) pero NO carga el Gemfile del
    proyecto ni su código. Para un REPL con el proyecto cargado, los proyectos
    suelen tener `bin/console` (Rails) o `pry -r ./lib/whatever.rb`.
  d: |
    `gem install <name>` instala UNA gem globalmente — útil para herramientas
    standalone como `rubocop` o `pry`, pero rompe la promesa de Bundler
    (versiones reproducibles por proyecto). En un proyecto clonado lo
    idiomático es declarar la gem en el Gemfile y dejar que Bundler la maneje.
```

---

### Lesson 1 — Blocks: lo que ves en todos lados

> *What changes in the learner's head:* "Blocks no son la sintaxis de `each` — `each` es uno de los métodos que toma un bloque. El patrón está en todos lados. Y entendí que la `&` en `&:method` y `&block` es la misma idea."

**Step distribution:** 1 `read`, 1 `predict`, 2 `kata`, 1 `playground` = 5 steps.

**Why blocks first (polyglot-first defense):** the polyglot will read Ruby code on Friday. The first thing they will see in any non-trivial file is `do |x| ... end` or `{ |x| ... }`. Teaching the object model first and ending with "and also, blocks exist" is the textbook-canonical order — defensible for a beginner, wrong for a polyglot. Rhea (S10) signed off on this reorder with the constraint that blocks land *before* the object model, not as a teaser of an object-model lesson.

**Status:** drafting.

#### Step 1.1 — `read` — "Blocks: la sintaxis que ves en todos lados"

```yaml
title: "Blocks: la sintaxis que ves en todos lados"
type: read
why_care: |
  Cualquier código Ruby que abras tiene bloques. Ignorarlos = no poder leer
  Ruby. Esta lección los presenta como la idea central del lenguaje, no como
  el sufijo de un método específico.
body: |
  ~350 palabras. Cubre:
  - **Lo que ves en cualquier código Ruby:** `[1,2,3].each do |x| puts x end`,
    `[1,2,3].map { |x| x * 2 }`, `5.times { puts "hi" }`,
    `File.open("path") { |f| f.read }`, `[1,2,3].tap { |arr| puts arr.size }`.
  - **Qué es un bloque, técnicamente:** por sí mismo es sintaxis — un chunk
    que se le pasa a una llamada de método como argumento especial. Dos
    formas equivalentes: `do |args| ... end` (multilínea), `{ |args| ... }`
    (una línea). Convención: `do...end` para side effects / multi-línea;
    `{...}` para expresiones que retornan valor. Por sí solo no es un
    objeto que puedas guardar en una variable; **solo existe como objeto
    cuando un método lo captura con `&block`** (más abajo en este read).
  - **No son keywords:** `each`, `map`, `times`, `File.open` son métodos
    definidos en stdlib (no syntax especial del lenguaje) que aceptan un
    bloque opcional. Esto es lo que el polyglot debe internalizar: la
    "syntax-y" de Ruby es casi toda métodos en disfraz.
  - **`yield` invoca el bloque desde adentro del método.** Un mini-snippet
    para hacerlo concreto:
    ```ruby
    def shout
      yield.upcase + "!"
    end
    shout { "hello" }  # => "HELLO!"
    ```
    El bloque retorna `"hello"` (última expresión, return implícito), `yield`
    devuelve eso al método, el método lo procesa, retorna el resultado.
    *Si venís de Python:* Ruby's `yield` **no** es Python's `yield`. Python's
    emite valores desde un generator; Ruby's invoca el bloque que el caller
    pasó. Misma palabra, semántica distinta — es la trampa #1 para el dev
    Python aterrizando en Ruby.
  - **`&:method` shorthand:** `[1,2,3].map(&:to_s)` ≡ `[1,2,3].map { |x| x.to_s }`.
    Es azúcar que convierte un símbolo en un bloque. Por qué funciona se
    explica en Lesson 3 (object model); por ahora usalo como patrón.
  - **Notación rápida que vas a ver ya:** `#{expression}` adentro de comillas
    dobles evalúa el expression e inserta el resultado en el string —
    Lesson 2 lo cubre a fondo. `puts` imprime a STDOUT con un newline al
    final; lo que el método `puts` *retorna* es `nil`, no el texto impreso.
  - **`&block` parameter:** un método puede capturar el bloque como un
    objeto Proc:
    ```ruby
    def with_logger(&block)
      puts "start"
      result = block.call
      puts "done"
      result
    end
    ```
    Equivalente a usar `yield` pero ahora el bloque es un objeto que podés
    pasar, guardar, llamar varias veces.
  - **Footgun named-and-deferred:** `Proc` vs `lambda` se comportan distinto
    con `return` y arity. Eso es el deep-dive de blocks; acá lo nombramos y
    seguimos.
voice_check: |
  El read NO explica qué es un método ni qué es una llamada. El polyglot ya
  sabe. Explica solamente la parte Ruby-específica: el bloque como tercera
  cosa que un método puede recibir, además de positional y keyword args.
```

#### Step 1.2 — `predict` — "¿Qué retorna `with_timer { 1 + 1 }`?"

```yaml
title: "Predict: ¿qué retorna este código?"
type: predict
question: "Considerando que `Process.clock_gettime(Process::CLOCK_MONOTONIC)` devuelve un Float con segundos, ¿qué **retorna** esta llamada?"
snippet: |
  def with_timer
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    result = yield
    elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - start
    [result, elapsed.round(2)]
  end

  with_timer { 1 + 1 }
options:
  - id: a
    text: "`[2, 0.0]`"
  - id: b
    text: "`[nil, 0.0]`  (el bloque no devuelve nada útil)"
  - id: c
    text: "`LocalJumpError` — yield falla porque no se le pasaron argumentos"
  - id: d
    text: "`2` solamente (el método retorna lo que retorna el bloque)"
correct: a
feedback:
  a: |
    Correcto. El bloque `{ 1 + 1 }` retorna `2` por return implícito (la
    última expresión es el valor del bloque, igual que en cualquier método
    Ruby). `yield` devuelve ese `2` al método llamante, que lo asigna a
    `result`. La última expresión de `with_timer` es `[result, elapsed.round(2)]`,
    ese es el valor que el método retorna al caller. El tiempo entre las dos
    llamadas a `clock_gettime` es ~0s para una suma trivial — `round(2)` lo
    redondea a `0.0`.
  b: |
    Reflejo C/Java: "bloques pequeños no retornan implícitamente". En Ruby
    todo lo que es chunk de código — método o bloque — retorna la última
    expresión por default. Si quisieras que el bloque retorne nada útil
    explícitamente, escribís `{ 1 + 1; nil }`.
  c: |
    `LocalJumpError` salta cuando un método llama `yield` y NO se le pasó un
    bloque. Acá `with_timer { 1 + 1 }` sí pasa bloque, así que `yield` lo
    invoca limpio. `yield` con o sin argumentos siempre invoca al bloque que
    se pasó; los argumentos son para el bloque, no para `yield` mismo.
  d: |
    Casi — `yield` sí retorna `2` al método. Pero `with_timer` continúa
    después: calcula `elapsed`, y su última expresión es `[result, elapsed.round(2)]`.
    El valor del bloque va al método; el valor del método (su última
    expresión) va al caller. Son dos hops distintos: bloque → método, método
    → caller.
```

#### Step 1.3 — `kata` — `repeat(n) { ... }`

```yaml
title: "repeat(n) — invocar el bloque n veces"
type: kata
instruction: |
  Implementá `repeat(n)` que invoque el bloque pasado `n` veces. No te
  importa el valor que retorne el bloque; te importa que se llame N veces.

  Ejemplos:
  ```ruby
  counter = 0
  repeat(3) { counter += 1 }
  counter  # => 3

  repeat(0) { raise "no debería llamarse" }
  # no levanta — el bloque no se invocó
  ```

  La solución idiomática es de una sola línea. Pensá Ruby, no C.
starter_code: |
  def repeat(n)
    # Tu código acá.
  end
tests:
  - name: "llama al bloque 3 veces"
    body: |
      counter = 0
      repeat(3) { counter += 1 }
      _eq counter, 3
  - name: "llama al bloque 0 veces cuando n es 0"
    body: |
      counter = 0
      repeat(0) { counter += 1 }
      _eq counter, 0
  - name: "llama al bloque 5 veces"
    body: |
      counter = 0
      repeat(5) { counter += 1 }
      _eq counter, 5
hint: |
  Pensá en qué objeto ya sabe iterar N veces. En Ruby los integers no son
  un tipo primitivo — son objetos con métodos. ¿Cuál de esos métodos invoca
  un bloque?
solution: |
  def repeat(n)
    n.times { yield }
  end
alternative_approach: |
  Una solución sin `Integer#times` sería un loop manual:
  ```ruby
  def repeat(n)
    i = 0
    while i < n
      yield
      i += 1
    end
  end
  ```
  Funciona — pero es C-idiomatic, no Ruby-idiomatic. Cuando una colección o
  un integer ya sabe iterar, mantenete del lado del método; los loops manuales
  en Ruby son señal de que algo está mal pensado o que la librería no tenía
  el método que necesitabas (raro).
```

#### Step 1.4 — `kata` — `map_keys(hash, &block)`

```yaml
title: "map_keys(hash) — transformar las keys con un bloque"
type: kata
instruction: |
  Implementá `map_keys(hash)` que reciba un hash y un bloque; devuelve un
  nuevo hash donde cada key fue transformada por el bloque. Los values se
  mantienen sin cambios.

  **Cómo funciona `&block` en la firma:** capturás el bloque pasado como un
  objeto Proc nombrado `block`. Lo invocás con `block.call(arg)`, o lo
  re-pasás a otro método con `&block` (la misma sigil; el `&` "deshace" el
  Proc a bloque cuando va de salida, "rehace" el bloque a Proc cuando va de
  entrada).

  Forzá la firma para que acepte **tanto** la forma `do...end` como la forma
  `&:method` shorthand:

  ```ruby
  map_keys({ a: 1, b: 2 }) { |k| k.to_s }
  # => { "a" => 1, "b" => 2 }

  map_keys({ "Foo" => 1, "BAR" => 2 }, &:downcase)
  # => { "foo" => 1, "bar" => 2 }
  ```

  El segundo ejemplo es la prueba de que la firma del método capturó el
  bloque correctamente — si el método usa solo `yield`, el `&:downcase`
  llamante no se va a aplicar.

  Nota sobre colisiones: si dos keys originales colapsan al transformarse
  (ej. `"Foo"` y `"FOO"` ambos a `"foo"` con `&:downcase`), `transform_keys`
  mantiene la última. Los tests no exercen este caso.
starter_code: |
  def map_keys(hash, &block)
    # Tu código acá.
  end
tests:
  - name: "transforma symbol keys a strings con bloque explícito"
    body: |
      result = map_keys({ a: 1, b: 2 }) { |k| k.to_s }
      _eq result, { "a" => 1, "b" => 2 }
  - name: "acepta &:downcase como bloque"
    body: |
      result = map_keys({ "Foo" => 1, "BAR" => 2 }, &:downcase)
      _eq result, { "foo" => 1, "bar" => 2 }
  - name: "hash vacío retorna hash vacío"
    body: |
      _eq map_keys({}) { |k| k }, {}
hint: |
  `Hash` tiene un método que hace exactamente esto — `transform_keys`. Y si
  capturás el bloque como `&block` en la firma, lo podés re-pasar a otro
  método que tome bloque usando `&block` de nuevo: `hash.transform_keys(&block)`.
solution: |
  def map_keys(hash, &block)
    hash.transform_keys(&block)
  end
alternative_approach: |
  Sin `transform_keys`, una solución con `each_with_object`:
  ```ruby
  def map_keys(hash, &block)
    hash.each_with_object({}) { |(k, v), acc| acc[block.call(k)] = v }
  end
  ```
  O usando `yield` en vez de `&block`:
  ```ruby
  def map_keys(hash)
    hash.transform_keys { |k| yield(k) }
  end
  ```
  La versión con `yield` NO acepta `&:downcase` como segundo argumento — sin
  un parámetro `&block`, no hay nada que reciba el bloque-shorthand. Por eso
  los tests fuerzan `&block` en la firma. Es la diferencia entre "este método
  acepta un bloque" (yield) y "este método captura el bloque como objeto"
  (&block).
```

#### Step 1.5 — `playground` — "Explorá `&:method` y `Symbol#to_proc`"

```yaml
title: "Playground: explorá &:method"
type: kata
data:
  kind: playground
instruction: |
  El kata anterior usó `&:downcase` para pasar `Symbol#downcase` como bloque.
  Funciona con cualquier método unario (que no toma argumentos) del receiver.

  Acá no hay tests. Ejecutá el código de arriba, observá el output, y
  experimentá con las preguntas debajo.

  **Probá estas expresiones:**
  - `["hello", "world"].map(&:upcase)`
  - `[1, 2, 3].map(&:to_s)`
  - `["a", "b", "c"].map(&:next)`  ← `String#next` te sorprende
  - `[1, 4, 9].map(&:zero?)`        ← predicates devuelven booleano
  - `[1, -2, 3].map(&:abs)`

  **Preguntas para explorar:**
  1. ¿Qué pasa si pasás un símbolo que NO es un método de los elementos?
     (Probá `[1, 2, 3].map(&:nope)`)
  2. ¿Qué pasa si el método requiere un argumento? (Probá `[1, 2].map(&:+)`)
  3. `[1, 2, 3].inject(&:+)` — ¿qué hace? ¿Por qué funciona?
starter_code: |
  # Ejecutá esto primero:
  puts ["hello", "world"].map(&:upcase).inspect
  puts [1, 2, 3].map(&:to_s).inspect
  puts ["a", "b", "c"].map(&:next).inspect
  puts [1, 4, 9].map(&:zero?).inspect
  puts [1, -2, 3].map(&:abs).inspect

  # Tu turno: probá las preguntas de arriba.
  # ¿Qué método interesante encontrás?
test_code_note: |
  Harness con un solo `_t('explored') { _eq true, true }` para que siempre
  pase. El renderer del playground oculta el verdict UI y el panel de tests.
hint: null
solution: null
alternative_approach: null
```

---

### Lesson 2 — Literales que sorprenden

> *What changes in the learner's head:* "Los hashes Ruby NO son JS objects. La key story es distinta: symbols son inmutables, importan, y `fetch` con bloque es el idiom correcto para missing keys. La interpolación con `#{}` reemplaza el concat y el sprintf."

**Step distribution:** 1 `read`, 3 `kata` = 4 steps. No predict — las sorpresas de esta lección son mecánicas (no model-building) y se aprenden mejor escribiéndolas.

**Status:** stub. Lessons 2-5 desarrollan en W2 una vez Lessons 0+1 estén shipeadas y la voz validada.

- **Step 2.1 — `read` — "Cuatro sorpresas de literales Ruby":**
  - **Topics:** comillas simples vs dobles (sólo dobles interpolan con `#{}` y procesan escapes); integer division (`5 / 2 == 2`, fix con `5.fdiv(2)` o convertir un operando); symbols como identificadores inmutables (`:foo.object_id == :foo.object_id` siempre; `"foo".object_id != "foo".object_id`); `Hash#fetch` con bloque por defecto (`h.fetch(:missing) { "default" }`) y por qué es superior a `h[:missing] || "default"`.
  - **NO incluir:** "arrays son zero-indexed", "strings tienen métodos", "los hashes tienen pares key-value". El polyglot ya sabe. La regla del párrafo (§2.1) corta cualquier párrafo que no nombre una sorpresa Ruby-específica.
- **Step 2.2 — `kata` — `lookup(records, name)`:**
  - Hash de records, devolver el record con ese name o `"unknown person"` como default usando `Hash#fetch` con bloque.
  - Forzar el idiom: tests con keys missing donde `h[:k] || default` daría el wrong answer si algún value es `false` o `nil` legítimo.
- **Step 2.3 — `kata` — `summarize(records)`:**
  - Array de hashes con symbol keys (`{ name: "Ada", age: 30 }`), devolver `"Ada (30), Linus (25)"`.
  - Combina 4 idioms en uno: array iteration con `map`, hash symbol-key access, interpolación, `join(", ")`.
- **Step 2.4 — `kata` — `tally_words(words)`:**
  - Array de strings, devolver hash con counts. Solución idiomática: `words.tally`. Reference: `{"hi" => 2, "bye" => 1}`.
  - Reemplaza el `uppercase_all(words)` original — Lesson 1 ya enseñó `&:upcase` con suficiente profundidad; repetirlo en Lesson 2 sería retrieval pero sin novedad. `Array#tally` es modern-Ruby (3.0+, justo la version del sandbox) y muestra el "Ruby tiene un método para eso" feel.

---

### Lesson 3 — Object model: la razón por la que blocks y literales funcionan así

> *What changes in the learner's head:* "Ahora entiendo por qué `5.times { ... }` funciona — `5` es un objeto, `times` es un método de Integer, el bloque es el tercer cosa que las llamadas aceptan. Y por qué `nil.respond_to?(:to_s)` es `true` — `nil` no es ausencia, es la única instancia de `NilClass`. Y por qué `&:upcase` funciona — los símbolos saben convertirse a Proc."

**Step distribution:** 1 `read`, 1 `predict`, 2 `kata`, 1 `playground` = 5 steps.

**DB inheritance:** la lección 1 actual en el seed (object model, 4 steps) **se re-posiciona a `order: 4` (Lesson 3 en el nuevo orden)**. El `lessonId` del seed (`LESSON_1_ID = seedUuid('ruby-l1-object-model')`) se mantiene estable para no perder progreso histórico (aunque en Phase 0 esto es irrelevante). El title cambia a "Object model: la razón por la que blocks y literales funcionan así" para reflejar la nueva framing post-blocks. El `order` se actualiza al re-seedear.

**Status:** content inherited from current seed, requires re-tightening against §2.1 paragraph test + 1.2 feedback shortening + replacement of step 1.3 (`type_of`) for either `respond_to?` kata or `compare_views` (to-be-decided in W2 authoring block). Playground step is new.

- **Step 3.1 — `read` — Tightened version of the current seed's STEP_1_1.** Cut the generic "`.class` returns the class object" paragraph; expand the operators-as-methods section; cut the `.ancestors` paragraph or move it to the playground starter code. Target: 300 words (down from ~620).
- **Step 3.2 — `predict` — `nil.class`** (current STEP_1_2 in seed). Re-tighten feedback to half the length: lose the "common reflex from languages where..." preambles, get straight to the mechanic.
- **Step 3.3 — `kata` — decision pending between:**
  - **Option A (keep current):** `type_of(value)` returns class name string. Mechanical but ships.
  - **Option B (replace):** `safe_call(obj, method_name)` returns `obj.send(method_name)` if `obj.respond_to?(method_name)`, else `nil`. Teaches `respond_to?` and `send` — both Ruby-idiomatic. Tests with `safe_call(nil, :to_s)` returning `""` and `safe_call(42, :nope)` returning `nil`.
  - Pick at W2 authoring block. B teaches more but adds authoring time. Default: B if Lesson 0+1 land cleanly with budget to spare; A if not.
- **Step 3.4 — `kata` — decision pending between:**
  - **Option A (keep current):** `describe(obj)` returns `"<ClassName>: <inspect>"`. Mechanical.
  - **Option B (replace):** `compare_views(obj)` returns `[obj.to_s, obj.inspect]`. Tests show divergence (strings get quotes from inspect; `nil` becomes `""` for to_s vs `"nil"` for inspect; arrays get bracket-formatting). This *exhibits* the contrast instead of just using `inspect`.
  - Pick at W2. B is the stronger teaching shape; A is what's in the DB.
- **Step 3.5 — `playground` — "Object model en acción":**
  - Pre-loaded code: `5.+(2)`, `5.send(:+, 2)`, `nil.respond_to?(:to_s)`, `nil.respond_to?(:foo)`, `:foo.class`, `Integer.ancestors`. Plus "tu turno" prompts: "¿qué responde `String.ancestors`? ¿Y `class Foo; end; Foo.ancestors`?"
  - The same playground spec shape as 1.5: `data.kind: "playground"`, harness with trivially-true test, no verdict UI.

---

### Lesson 4 — Control flow + truthiness

> *What changes in the learner's head:* "Solo `false` y `nil` son falsy. `0`, `""`, `[]` son truthy. Eso reescribe cómo chequeo cosas. Y `case/when` usa `===`, no `==` — por eso `case x; when Integer; ...; when String; ...; end` funciona."

**Step distribution:** 1 `read`, 1 `predict`, 1 `kata`, 1 `challenge` = 4 steps.

**Status:** stub.

- **Step 4.1 — `read` — Truthiness, `case/when` con `===`, `unless`/`until`, postfix forms.**
  - **Topics:** la regla truthy/falsy con el "polyglot reflex" callout (Python/JS treat `0`, `""`, `[]` como falsy; Ruby no); `case/when` y el `===` operator (qué significa cuando el `when` clause es una clase, un range, una regex); `unless x` ≡ `if !x` y cuándo lee más limpio; `until` ≡ `while !`; postfix `return x if y` para guards.
  - **NO incluir:** explicación de qué es `if/else/while`, qué son los operadores booleanos `&&`/`||` — el polyglot ya sabe. La regla del párrafo corta cualquier párrafo que no sea Ruby-specific.
- **Step 4.2 — `predict` — "¿es `if 0` truthy o falsy?"**
  - Options: truthy / falsy / `TypeError` / depende del version de Ruby. Correct: truthy. Feedback corto, sin preámbulo: name el reflex C/Java/Python/JS para cada distractor.
- **Step 4.3 — `kata` — `classify(x)` con `case` sobre class.**
  - Tests cubren `Integer`, `String`, `Array`, `Hash`, `Symbol`, y un tipo no-reconocido que fall-through a `"other"`. Expone semántica de `Class === instance`.
- **Step 4.4 — `challenge` — `bucketize(values)` reemplaza FizzBuzz.**
  - Recibe array mixto de Integer/String/Symbol/Array/Hash, devuelve `Hash` con `Class` keys y `Array` values: `{ Integer => [1, 2, 3], String => ["a", "b"], Symbol => [:foo] }`.
  - Refuerza `case/when` + `Class === instance` en un contexto nuevo (retrieval interleaving con 4.3).
  - Constraint en el prompt: usá `case/when` (no `case .class when`), keep it under 8 líneas. 15-min budget.

---

### Lesson 5 — Methods

> *What changes in the learner's head:* "Keyword args no son optional flavor — son cómo leés un call site seis meses después. `*args` y `**opts` son cómo cada DSL Ruby convierte llamadas en data. Y los métodos son objetos también — `Method#parameters` te dice qué args toma."

**Step distribution:** 1 `read`, 2 `kata`, 1 `challenge` = 4 steps.

**Status:** stub.

- **Step 5.1 — `read` — kwargs, splats, implicit return, `Method#parameters`.**
  - **Topics:** keyword args (`def greet(name:, greeting: "Hello")`); positional + default; splat `*args` + double-splat `**opts`; implicit return (last expression's value); `method(:name).parameters` que devuelve `[[:req, :name], [:keyreq, :age], [:rest, :extras], [:keyrest, :opts]]`.
  - **NO incluir:** qué es un método, qué es un parámetro, qué es un return statement. La regla del párrafo corta cualquier párrafo que no sea Ruby-specific.
- **Step 5.2 — `kata` — `greet(name:, greeting: "Hello")` con kwargs.**
  - Tests: `greet(name: "Ada")` → `"Hello, Ada!"`; `greet(name: "Linus", greeting: "Hej")` → `"Hej, Linus!"`; `greet()` levanta `ArgumentError` por missing required kwarg.
- **Step 5.3 — `kata` — `tally_args(*nums, **opts)`.**
  - Devuelve `{ positional_count: nums.length, keyword_count: opts.length, opts: opts }`. Forza engagement con ambas formas de splat.
- **Step 5.4 — `challenge` — `parameters_of(method_name)` reemplaza el refactor.**
  - Recibe el nombre de un método como símbolo, devuelve un Hash con counts: `{ required: N, optional: N, keyword_required: N, keyword_optional: N, rest: bool, keyrest: bool }` usando `method(method_name).parameters`.
  - Cierra el loop del object model (un método ES un objeto, podés introspeccionarlo).
  - Test method definitions provistas en el `starterCode` para que el learner no tenga que inventarlas — solo escribir `parameters_of`.

**Closer (al final de 5.4 o en una nota de la lesson):** "Lo que dejamos para el deep-dive de Ruby OOP / blocks / metaprogramming: `attr_*` como decisión de boundary, `Proc.new { return 1 }` semantics, `method_missing` y eigenclasses, `Module#class_eval`. Sabés que existen y aproximadamente para qué — eso es suficiente para leer Ruby idiomático. Cuando uno te muerda, vas al deep-dive correspondiente."

---

## 5. Sandbox notes

- **Runner:** Piston Ruby 3.0.1.
- **Test harness:** **manual**, defined inline in `testCode`. The harness is global `$tests` plus two helpers:
  ```ruby
  def _t(name)
    yield
    $tests << { 'name' => name, 'passed' => true }
  rescue => e
    $tests << { 'name' => name, 'passed' => false, 'message' => e.message }
  end

  def _eq(actual, expected)
    raise "expected #{expected.inspect} but got #{actual.inspect}" unless actual == expected
  end
  ```
  Final footer emits `__DOJO_RESULT__ <json>` for ExecuteStep to parse. Minitest is **not** introduced — that's a deep-dive scroll's job.
- **Playground harness:** same shape, single test `_t('explored') { _eq true, true }`. Frontend reads `step.data.kind === "playground"` and hides the verdict UI / test result list / button text changes to "Ejecutar". Backend stays uniform.
- **Stdlib only.** No gems. `Array#tally`, kwargs, `&:method`, `Hash#fetch` with a block, `Hash#transform_keys` — all stdlib in Ruby 3.0+.
- **Determinism:** no `Time.now`, no `rand`. `Process.clock_gettime(Process::CLOCK_MONOTONIC)` is allowed in Lesson 1's `with_timer` predict and any kata that needs monotonic timing because tests assert on type/bound, not exact value.
- **STDIN behaviour:** never exercised. All inputs come as method arguments.
- **`inspect` output stability:** Lesson 3.4's `describe` / `compare_views` test asserts exact `inspect` strings. Ruby 3.0's `inspect` format for Hash is `{:a=>1}` (no spaces around `=>`); confirmed via Piston smoke test.
- **Run timeout:** Piston's default `run_timeout: 3000` ms is tight when six assertions all raise — pathological cascade case can push past 3s and Piston SIGKILLs. Single- or partial-failure cases run cleanly. Worth raising the timeout for the Ruby scroll specifically; tracked as an open item, see §7.

---

## 6. References

Sources cited or drawn from inside this scroll's prose:

- *The Well-Grounded Rubyist*, 3rd ed. — Chapter 2 (Objects, methods, local variables), Chapter 3 (Organizing objects with classes), Chapter 14 (Blocks and procs). The spine of Lessons 1 and 3.
- *Eloquent Ruby* (Russ Olsen) — "Execute Around with a Block" is the closest external match to Lesson 1's `with_timer` example.
- *Programming Ruby 3.2* (Pickaxe) — reference for `Array#tally`, `Hash#fetch`, `Hash#transform_keys`, `Symbol#to_proc`, `Method#parameters`.
- Ruby docs — <https://docs.ruby-lang.org/en/3.3/Integer.html>, <https://docs.ruby-lang.org/en/3.3/NilClass.html>, <https://docs.ruby-lang.org/en/3.3/String.html>, <https://docs.ruby-lang.org/en/3.3/Array.html>, <https://docs.ruby-lang.org/en/3.3/Hash.html>, <https://docs.ruby-lang.org/en/3.3/Symbol.html>, <https://docs.ruby-lang.org/en/3.3/Method.html>, <https://docs.ruby-lang.org/en/3.3/Proc.html>.
- Bundler docs — <https://bundler.io/> for Lesson 0's read on `bundle install` / `bundle exec`.
- RubyGems guides — <https://guides.rubygems.org/> for Lesson 0's read on gems vs Bundler.
- Ruby Koans — borrow the assertion-as-question voice for predict steps.

---

## 7. Open questions / known gaps

- **Lesson 3 kata picks (3.3 and 3.4).** Decided at W2 authoring block. Default A (keep current `type_of` and `describe`) if Lesson 0+1 take longer than estimated; default B (`safe_call` and `compare_views`) if budget allows. Default decision deferred is itself a project risk — if W2 starts without a clear pick, default to A.
- **Playground pattern survival.** Both playgrounds (1.5 and 3.5) ship in W1/W2 as `data.kind: "playground"` variants. Sprint midpoint retro (per `current.md` §Working order) checks engagement signal. If signal holds, promote to canonical step type with ADR + `INTERACTIVITY-PATTERNS.md` update in S027. If not, drop the variant and let the scroll close without playgrounds (no rewrite needed — the kata variant is removable without disturbing surrounding lessons).
- **Playground frontend (Option B2).** ~4-6 hours of work. Lands before the first playground step seeds, so probably mid-W1. Spec for Tomás (yo): read `step.data?.kind`, branch the verdict UI, button label, and assertion panel. No backend changes. No schema migration. Visual contract to be drafted before implementation — Maya (S11) reviews the contract.
- **Piston run_timeout for Ruby.** Default 3-second per-execution timeout is tight when many assertions fail in cascade. Single-fail and partial-fail cases pass cleanly. Options: raise globally to 5s, raise for Ruby specifically via `PISTON_LIMIT_OVERRIDES`, or accept the all-fail edge case. Decision deferred until a learner trips it.
- **DB seed of old Lesson 1 → re-position as Lesson 3.** When the re-seed runs, the existing `lessonId` stays stable (same UUID) and `order` updates from `1` to `4` (Lesson 3 is the 4th lesson if Lesson 0 is `order: 0`, or the 3rd if Lesson 0 is `order: 1` — to clarify when seed runs). Step UUIDs also stay stable. Phase 0 has no real users with progress, but the stability preserves the option to keep test progress.
- **Total step count: 25.** Lesson 0 has 3, Lesson 1 has 5, Lesson 2 has 4, Lesson 3 has 5, Lesson 4 has 4, Lesson 5 has 4 = 25. At top of the 60-120 min budget range. If post-authoring the time creeps past 120 min, first cuts: playground 1.5 (drop to 4 steps in Lesson 1) and Lesson 5.4 challenge (drop to 3 steps in Lesson 5). Don't pre-emptively cut — let actual authored content reveal whether it's bloated.
- **Predict step count: 4 of 25 = 16%.** Slightly above the heuristic's 10-15%. Defensible because the Ruby surprise surface is large and Lesson 0's predict is an orientation tool, not a syntax check.
