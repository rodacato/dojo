# Dojo — Branding, UX & Voice

> **Status:** Canonical · **Last reviewed:** 2026-06-06
>
> This file owns the brand: name, vocabulary, voice, information architecture, UX principles, microcopy.
> For the design system itself — tokens, themes, motifs, components, motion specs — see [`DESIGN.md`](DESIGN.md).
> The two used to overlap; the colors/tokens sections lived here and drifted. Now BRANDING owns the *why* and the *words*, DESIGN owns the *values* and the *renders*.

---

## El Nombre

**Dojo** — Del japonés, el lugar donde se practica un arte hasta dominarlo.

No es competencia. No es certificación. Es disciplina personal — el lugar donde vas a practicar aunque nadie te esté mirando, aunque vayas a fallar, aunque sea incómodo.

- Funciona en inglés y en español sin traducción
- No tiene connotación de competencia sino de práctica sostenida
- Carga cultural correcta: artes marciales, repetición, maestría progresiva
- Corto, memorable, pronunciable en cualquier idioma

**Dominio:** `dojo.notdefined.dev`

El dominio agrega una capa de personalidad que el nombre solo no tiene — *"el dojo de los que todavía no están definidos del todo"*. Es honesto sobre el estado del developer que lo usa: en proceso, no terminado, todavía aprendiendo.

**Tagline:** *"The dojo for developers who still have something to prove. To themselves."*

Alternativas consideradas: `Dojo`, `CodeDojo`, `kata.notdefined.dev`, `debug.notdefined.dev` — Dojo gana por simplicidad, historia cultural y fit con el dominio.

---

## Glosario

The product speaks one vocabulary. Each term below is load-bearing — it does product work, not branding decoration. If a future term doesn't earn its place by being distinguishable from a generic SaaS word, don't add it. (See [ADR 020](adr/020-ubiquitous-language-pass.md) for the full rename.)

| Term | What it means in the product | On-brand | Off-brand |
|---|---|---|---|
| **Kata** | A single practice unit — one prompt, one sit, one sensei verdict. Atomic. | *"completed five katas this week"* | *"completed five exercises"* |
| **Sensei** | The LLM evaluator. Honest, structured, never softens. Voice register matters: noted, observed, recognized — not master/zen/wisdom. | *"the sensei noted the gap in your reasoning"* | *"the master grants you wisdom"* |
| **Scroll** | A multi-step learning path — read, code, exercise, challenge — followed in order, with instant Piston/iframe feedback. The scroll is the curriculum; the steps are inside it. | *"finish the SQL Deep Cuts scroll"* | *"finish the SQL Deep Cuts course"* |
| **Belt** | A single rank per user — white / yellow / green / brown / black — computed from session history. Earned, kept (no decay in v1). The sensei does not influence advancement. | *"I'm working toward brown belt"* | *"I unlocked the brown belt trophy"* |
| **Milestone** | A single-moment recognition (`FIRST_KATA`, `POLYGLOT`, `CONSISTENT`, scroll completions). Independent from belt — earned at a moment in time. | *"earned the Polyglot milestone after my third whiteboard kata"* | *"got a Polyglot badge"* |
| **Engawa** | The transitional veranda. Lives at `/engawa` as the anonymous code playground (no account required to try a snippet), but the *concept* is broader — see §Engawa as a philosophy below. | *"opened the engawa to test a Ruby idea"* | *"opened the playground"* (in our product surface) |
| **Kumite** | The planned 1v1 sparring feature — paired evaluation, shared kata, side-by-side reasoning compared by the sensei. **Not built yet** — the route exists as an honest placeholder. Not a relabel of the deleted leaderboard. | *"when kumite ships I want to spar against another reviewer"* | *"check the kumite leaderboard"* |

One more that is *not* dojo-flavored on purpose:

- **Dashboard** — generic post-login orientation surface. The one place we don't translate; the user shouldn't have to learn vocabulary before seeing where they are.

> **Historical note:** an earlier draft kept `/start` + "practice" as a separate nav item. Day-to-day use showed it was a stutter — one extra click between intent and the picks. `/katas` now hosts the full ritual (streak + mood + duration + customize) plus the three picks inline. One surface, one click to commit.

### Engawa as a philosophy

The engawa is the transitional veranda of a Japanese house — neither inside nor outside, a place where things sit while the household decides what to do with them. In Dojo it does double duty:

- **As a surface:** `/engawa` is the anonymous code playground. No account, no tracking, no consequence — just a place to drop a snippet and run it.
- **As a stance:** it's the explicit home for unfinished work. GSAP experiments that may never ship. Scrolls in draft. Half-formed ideas the creator wants on the site without committing to polish them.

This matters. A product that demands every surface be shipped-quality stagnates — the bar for "good enough to put up" becomes so high that nothing new appears. One with a legitimate home for *"still drying"* stays alive. The engawa is that home. If something is interesting but rough, it lives in `/engawa` until it either earns promotion to a real surface or quietly disappears.

---

## Personalidad de Marca

**Tono:** Brutalmente honesto pero con humor. No es un producto que te abraza — te dice la verdad con una sonrisa dark. Piensa en un tech lead que te respeta lo suficiente como para no mentirte.

**Voz:**
- Directa. Sin fluff.
- Geek humor. Referencias técnicas, memes de developer culture.
- Vulnerabilidad celebrada. El fail es parte del proceso, no la vergüenza.
- Sin motivational poster energy. Nada de "¡tú puedes!". Más de "fallaste en SQL otra vez, aquí está por qué."

**Anti-patrones de voz:**
- ❌ "¡Felicitaciones! ¡Lo lograste!"
- ❌ "No te preocupes, todos cometemos errores"
- ✅ "Funcionó. El LLM dice que un junior lo hubiera escrito más limpio."
- ✅ "15 minutos en un problema de 10. El tiempo de ejecución fue O(n²) cuando había O(n log n) disponible. Buena intención, ejecución descuidada."

---

## Arquitectura de información

Cinco surfaces, plana y expandible. Está optimizada para velocidad de iteración del creator, no para retención de visitantes anónimos — añadir una sexta surface no rompe el patrón, sólo agrega un row en el sidebar.

| Surface | Estado | Propósito |
|---|---|---|
| **Katas** (`/katas`) | shipped | Práctica de código atómica — Piston ejecuta, sensei evalúa. El corazón del producto. |
| **Scrolls** (`/scrolls`) | parcial | Catálogos visuales, paths multi-step. Tres prototipos hoy; el "almanaque técnico" del dojo. |
| **Belts** (`/belts`) | shipped | Progreso transversal — rank + milestones derivados de session history. |
| **Kumite** (`/kumite`) | placeholder honesto | 1v1 sparring planeado. La ruta existe vacía a propósito; cuando se construya, será PvP donde dos developers atacan el mismo kata y el sensei compara sus razonamientos lado a lado. |
| **Engawa** (`/engawa`) | shipped (playground) + filosofía | Anonymous code playground + el espacio explícito para lo no terminado. Ver §Engawa as a philosophy. |

**Plana, no jerárquica.** Cada surface es un destino top-level del sidebar. No hay sub-tabs anidados hasta que la data del propio surface lo exija. **Expandible.** El patrón sobrevive a una sexta surface; lo que no sobrevive es la tentación de mover dos surfaces "bajo" otra para parecer organizado — eso es jerarquía cosmética que termina convirtiendo el sidebar en un árbol de file explorer.

**El Dashboard no es una surface, es la orientación.** Es la pantalla que ves al firmar y de donde sales hacia las cinco. No tiene vocabulario propio (ver Glosario).

---

## Tema y dirección visual

Tokens, hex values y component specs viven en [`DESIGN.md`](DESIGN.md). Esta sección documenta la **dirección** — el por qué visual y hacia dónde se mueve.

### Hoy: Slate Indigo

Dark mode "terminal meets product" — Linear / Raycast / Warp como referencia. Frío, técnico, restraint. Indigo como acento único, slate como base. Es lo que renderea en producción ahora y se mantendrá hasta que la migración sumi-e cierre.

### Mañana: Sumi-e

Tinta japonesa, dos temas bajo el mismo sistema de tokens:

- **Washi** (papel cálido) — para reading: catalogo de scrolls, prosa de los pasos, sensei en modo análisis largo. El light variant cumple un trabajo real, no es modo claro por completionismo.
- **Sumi** (tinta profunda) — para sesiones largas: dark variant del kata flow, results, share cards.

Un solo acento — **hanko vermillion** (el rojo del sello del nombre japonés). Reemplaza al indigo cuando la migración cierra. Si es interactivo, es vermillion. Si no, no.

**Por qué este pivote:** los catálogos necesitan calma para estudiar; el cyberpunk neón pelearía con el contenido. Sumi-e es distintivo (no es el slop morado-degradado de IA de 2026), ownable (consistente con el vocabulario japonés del dojo), y borrowed-on-purpose — 1,500 años de tradición gráfica son lo opuesto a inventar originalidad falsa.

### Motivos visuales

Cuatro elementos cargan la identidad sumi-e. Cada uno con contrato explícito en [`DESIGN.md`](DESIGN.md) §Brand motifs.

- **Enso** — círculo zen incompleto. Loader, section mark, wash detrás del avatar.
- **Hanko** — sello cuadrado rojo. Milestone earned badge, verdict stamp en share cards, anillo del black belt.
- **Brushstroke** — trazo único de pincel. Underline bajo H1, focus indicator en kata-active, hover reveal en cards.
- **Belt colors** — anillo del avatar y banda en el profile header. Realización visual del rank.

### Tipografía

No cambia entre temas. **JetBrains Mono** para logo, números, verdicts, labels all-caps. **Inter** para body y UI. La identidad terminal es estable — el theme cambia la piel, no la voz tipográfica.

### Estilo visual (cross-theme)

- Bordes sutiles, `border-radius` pequeño (4-6px). Nunca `rounded-full` en containers.
- Sombras mínimas. Depth a través de surface color stacking, no de drop shadows.
- El cursor `_` parpadeando 1Hz como elemento de identidad — único en estados de carga, espera y en el wordmark.

La migración va detrás de feature flag (`FF_SUMI_THEME_ENABLED`). Sin piecemeal swap. Operativa completa en [`DESIGN.md`](DESIGN.md) §Migration path.

---

## Motion como firma

### Slate Indigo (hoy)

Transiciones CSS funcionales 150-200ms. El cursor `_` parpadeando 1Hz como única "animación de identidad". Sin bouncing, sin sparkles, sin celebración. GSAP vive sólo en la landing (orquesta el reveal del hero + el carrusel del terminal demo) — el resto del producto es CSS.

### Sumi-e (mañana)

GSAP + DrawSVG como motion language del sitio. La tinta es el pretexto ideal: el enso se dibuja al cargar, la brushstroke se traza bajo el H1 cuando entra al viewport, el hanko se planta (no rebota) cuando el verdict aterriza, las transiciones entre pasos del scroll fluyen como tinta secándose. GSAP deja de ser experimento suelto y se vuelve la **firma de movimiento del producto**.

Carga lazy en rutas que lo usan (kata flow, scroll player, results, share). Landing, dashboard y admin no pagan el bundle. Contratos completos en [`DESIGN.md`](DESIGN.md) §Motion.

### Prohibido en ambos temas

Confetti, bursts de celebración, parallax, scroll-jacking, slide-ins desde abajo, modal entries con bounce, FLIP rearrangements visibles. **El fail no es dramático, el pass tampoco** — es el principio que rige toda animación del producto.

---

## UX — Flujos Principales

### Flujo de Entrada (Landing → Ejercicio)

```
[Login con GitHub]
       ↓
[Dashboard: estado del día]
  - Badge si completaste hoy
  - Streak actual
  - Prompt si no has hecho tu challenge
       ↓
[Mood + Tiempo] — group buttons simples, un submit
  Mood: 🔥 En racha / 😐 Regular / 🧠 A medias
  Tiempo: 10min / 20min / 30min / 45min+
       ↓
[3 opciones] — cards con título, tipo, dificultad, lenguaje
  No skip. No reroll. Estos son tus ejercicios.
       ↓
[Ejercicio activo] — split view
  Izquierda: Contexto del problema
  Derecha: Tu herramienta (editor / chat / Mermaid)
  Top: Timer, sin pause
       ↓
[Evaluación del LLM] — chat con el experto
  Puede hacer follow-up (máx 2 veces)
  Da veredicto cuando tiene suficiente
       ↓
[Resultado + Análisis]
  Veredicto: Passed / Passed with notes / Needs work
  Análisis brutal completo
  Share card opcional
       ↓
[Dashboard actualizado]
```

### Principios de UX

**Fricción intencional:** No hay escape fácil. El timer corre, las 3 opciones son las que son. Esto es por diseño — el punto es que te enfrentes al ejercicio, no que lo optimices.

**Sin distracciones durante el ejercicio:** El split view es todo lo que hay. Sin navegación, sin notificaciones, sin links externos.

**El fallo no es dramático:** Si el tiempo se acaba o el LLM determina que no hubo resolución satisfactoria, la sesión termina con dignidad. El análisis siempre aparece — fallaste y aquí está exactamente por qué y qué estudiar.

**El dashboard es el premio, no la meta:** Ver tu progreso es la recompensa de completar. No es el punto de entrada — no es algo que te obsesiones revisando.

---

## Componentes — voz y comportamiento

La forma (radius, padding, color, motion) vive en [`DESIGN.md`](DESIGN.md) §Component vocabulary. Aquí van únicamente las decisiones de *voz* y *comportamiento* que los componentes encarnan.

- **Exercise card (selección):** los 3 picks son los 3 picks. El card no insinúa que podrías cambiarlos. El hover sólo confirma el target — no anima un "preview" del kata.
- **Timer:** number-first, sin label "minutes". No tiene pause ni extend. El cambio de color (normal → amber → red) es la única narración del tiempo que queda. Nada más se mueve.
- **Editor de código:** sin autocomplete durante el ejercicio. Código de honor técnico, no enforcement. La sensación es de un editor "limpio", no de uno "limitado".
- **Sensei chat:** el indicador "el experto está evaluando..." usa el cursor parpadeante, no un spinner ni dots. El expert habla cuando tiene algo que decir; no hay typing indicator continuo.
- **Share card:** voz irreverente, honesta, geek. La share card que muestra `NEEDS_WORK` se comparte con el mismo orgullo que la `PASSED` — eso es vulnerabilidad celebrada, no consuelo.

---

## Microcopy — Voz en la UI

Estos son ejemplos de cómo suena el producto en momentos clave:

| Momento | Texto |
|---------|-------|
| Sin challenge completado | "No practice today. The dojo was empty." |
| Selección de ejercicio | "These are your kata. No skip. No reroll." |
| Timer approaching end | "Time's almost up. What do you have?" |
| Tiempo agotado | "Time. The sensei evaluates with what you submitted." |
| Análisis listo | "Verdict is in. It's honest." |
| Share card prompt | "Own it. The good and the ugly." |
| Streak perdida | "Streak broken. The dojo opens again tomorrow." |
| Primer ejercicio | "First kata. The hardest one is always the first." |
| Passed | "That's a pass. The analysis tells you the rest." |
| Failed | "Not there yet. Read the analysis. Come back." |
| Login | "Enter the dojo." |
| Logout | "See you tomorrow." |

---

## Belts & Milestones

Dos conceptos ortogonales, ambos en `/belts`. El rubric vive en [PRD-031](prd/031-belt-progression-rubric.md); aquí se documenta la voz.

### Belts — el rank

Una sola progresión por usuario, derivada de session history en cada lectura. Cinco grados:

- **white** — default al firmar
- **yellow** — 10 katas, 2 topic clusters distintos, 5 active days en 30
- **green** — 40 katas, 4 clusters, 10 active days, 21 días en yellow
- **brown** — 120 katas, 6 clusters, 15 active days, 60 días en green
- **black** — 300 katas, 8 clusters, 18 active days, 120 días en brown

El sensei no influye en la promoción. Esto es deliberado: si los verdicts contaran, habría incentivo a presionar al evaluador para que sea más suave. La promoción es función de práctica sostenida y diversidad, no de batting average.

**Voz on-brand:** *"earned brown belt — Code Review track"*, *"working toward green belt"*.
**Voz off-brand:** *"unlocked the brown belt trophy"*, *"belt achievement complete"*.

Sin progress bar al siguiente rank (el dojo no babysittea). El usuario ve los cuatro factores actuales — completed katas, topic clusters distintos, active days en 30, días en rank actual — y deduce qué le falta sin que el sistema lo empuje.

### Milestones — momentos puntuales

Eventos one-shot que se ganan en un instante específico. No son rank; son la memoria de "esto pasó". Las llamábamos badges hasta que el rename de Sprint 023 desentangló los dos conceptos.

- **`FIRST_KATA`** — completaste tu primer kata
- **`5_STREAK`** — 5 días consecutivos con al menos un kata
- **`POLYGLOT`** — completaste katas en los 3 types (CODE, CHAT, WHITEBOARD)
- **`ARCHITECT`** — 10 katas de whiteboard
- **`BRUTAL_TRUTH`** — 3 verdicts NEEDS_WORK acumulados (showed up anyway)
- **`CONSISTENT`** — 30 días de streak
- **`SQL_SURVIVOR`** — 3 katas con tag SQL
- **`SENSEI_APPROVED`** — 5 verdicts PASSED limpios
- **`UNDEFINED_NO_MORE`** — 50 katas en total (prestige milestone — conecta con `notdefined.dev`)
- **`RUBBER_DUCK`** — 3 katas CHAT
- **`COURSE_TYPESCRIPT_FUNDAMENTALS`** / **`COURSE_JAVASCRIPT_DOM_FUNDAMENTALS`** / **`COURSE_SQL_DEEP_CUTS`** — scroll completions

Los stored slugs siguen con prefijo `COURSE_` por compatibilidad con datos persistidos; el surface visible al usuario habla de "scroll completions" (ADR 020).

Los milestones no tienen puntos ni XP. Son colecciones — están o no están. El nombre `UNDEFINED_NO_MORE` conecta directamente con `notdefined.dev` y es el milestone de progreso más significativo.

---

## Logo

**Concepto principal — wordmark:** la palabra `dojo` en JetBrains Mono lowercase, con un cursor parpadeante `_` al final. Sin íconos. La tipografía monospace ya comunica "terminal", "técnico", "en proceso". El cursor dice "todavía escribiendo, todavía aprendiendo".

```
dojo_
```

Simple. No necesita más. Estable a través de la migración de temas — el wordmark no cambia cuando cambia la piel.

**Concepto sumi-e — enso wordmark (post-migración):** el wordmark vive dentro de un enso (círculo zen incompleto, dibujado con DrawSVG en la primera carga). El enso no rodea cosméticamente — es el motivo principal del sistema visual y el wordmark se convierte en su contenido. El círculo incompleto conecta con `notdefined.dev` — nada está del todo cerrado aquí. Detalles en [`DESIGN.md`](DESIGN.md) §Brand motifs.

**Para el favicon:** sólo el cursor parpadeante `▌` sobre fondo oscuro (indigo en Slate, vermillion en Sumi-e). Reconocible en 16×16.

**Para share cards y OG images:** `dojo.notdefined.dev` en monospace completo. El punto entre `dojo` y `notdefined` actúa como separador visual natural.

**Evitar:**
- Iconografía de artes marciales literal (katanas, cinturones físicos, dojos de madera)
- Íconos de código genérico (corchetes, `</>`)
- Íconos de robot/AI/cerebro/lightbulb
- Cualquier cosa que parezca una startup de 2019

---

## Related documents

- [`DESIGN.md`](DESIGN.md) — tokens, themes (Slate Indigo + Sumi-e), motifs, components, motion specs. Source of truth para todo lo visual/operativo.
- [`VISION.md`](VISION.md) — product strategy.
- [`courses/INTERACTIVITY-PATTERNS.md`](courses/INTERACTIVITY-PATTERNS.md) — step-type animations within scrolls.
- [`prd/031-belt-progression-rubric.md`](prd/031-belt-progression-rubric.md) — belt rank rubric (this file documents the voice; the PRD documents the math).
- [`adr/020-ubiquitous-language-pass.md`](adr/020-ubiquitous-language-pass.md) — Sprint 023's rename que introdujo `scroll / kata / belt / milestone` como vocabulario visible.
