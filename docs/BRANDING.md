# Dojo — Branding, UX/UI & Design Direction

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

## Identidad Visual

### Paleta de Color

**Primario:** `#0F172A` — Slate 950. Casi negro, no negro puro. Fondo base.
**Superficie:** `#1E293B` — Slate 800. Cards, paneles, editores.
**Borde:** `#334155` — Slate 700. Separadores, bordes de input.

**Accent principal:** `#6366F1` — Indigo 500. CTAs, highlights, elementos activos. Energético pero no agresivo.
**Accent secundario:** `#10B981` — Emerald 500. Éxito, completado, streaks positivos.
**Peligro/Fallo:** `#EF4444` — Red 500. Errores, tiempo agotado, failed sessions.
**Warning:** `#F59E0B` — Amber 500. Alertas, approaching time limit.

**Texto primario:** `#F8FAFC` — Slate 50.
**Texto secundario:** `#94A3B8` — Slate 400.
**Texto muted:** `#475569` — Slate 600.

### Tipografía

**Display/Headers:** `JetBrains Mono` — Monospace. Refuerza el contexto técnico. Para títulos grandes y números de dashboard.
**Body/UI:** `Inter` — Sans-serif. Limpio, legible, moderno. Para todo el texto de interfaz.
**Código:** `JetBrains Mono` — Consistente con el header font.

### Estilo Visual

Dark mode por defecto y única opción — los developers trabajan en dark mode, punto.

Estética: **terminal meets product**. No es una app corporativa, no es un juego infantil. Es algo que un developer serio usaría y no se avergonzaría de mostrar. Piensa Linear, Raycast, Warp — pero con más personalidad y menos minimalismo frío.

Elementos de carácter:
- Bordes sutiles con `border-radius` pequeño (4-6px). No rounded-full, no sharp. Técnico pero no rugoso.
- Sombras mínimas. Depth a través de color, no de drop-shadows.
- Animaciones funcionales: transitions de 150-200ms, nada de bouncing o easing dramático.
- El cursor parpadeante del terminal como elemento de identidad en estados de carga o espera.

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

## Componentes UI Clave

### Exercise Card (selección)
- Fondo `#1E293B`, borde `#334155`
- Badge de tipo: `CODE` `CHAT` `WHITEBOARD` — colores distintos por tipo
- Badge de dificultad: `EASY` verde / `MEDIUM` amber / `HARD` rojo
- Duración prominente en `JetBrains Mono`
- Tags como chips pequeños en la parte inferior
- Hover: borde `#6366F1`, transición 150ms

### Timer
- Número grande en `JetBrains Mono` en el top del ejercicio
- Color normal → amber (últimos 20%) → rojo (últimos 10%)
- Sin opción de pause. Sin extensión.

### Editor de Código
- Tema dark consistente con la paleta (base: `#0F172A`)
- Syntax highlighting con colores que no rompan la paleta
- Sin autocomplete durante el ejercicio — código de honor técnico

### Chat del LLM Experto
- Mensajes del experto con avatar y rol visible: `[Senior DBA] — 12 años en PostgreSQL`
- Estilo de respuesta: directo, sin emojis de celebración, con emojis técnicos ocasionales
- Indicador de "el experto está evaluando..." con cursor parpadeante

### Share Card
- Proporción 1200×630 (OG image estándar)
- Fondo oscuro con el accent del tipo de ejercicio
- Nombre del ejercicio, resultado, tiempo, la línea más memorable del análisis del LLM
- Logo Dojo + handle de GitHub del usuario
- Tono: irreverente, honesto, geek

---

## Prompts para Google Stitch

Usa estos prompts en secuencia para generar las pantallas principales:

### Prompt 1 — Dashboard / Home
```
Dark mode developer productivity app dashboard. Background #0F172A, cards #1E293B.
Primary accent color indigo #6366F1. Font: JetBrains Mono for numbers, headers and 
the logo ("dojo_" with blinking cursor). Inter for body text.

Top left: logo "dojo_" in JetBrains Mono white, small subtitle "dojo.notdefined.dev" 
in muted slate. Top right: GitHub avatar + username.

Show: streak counter (large monospace number with label "day streak"), today's kata 
status card ("The dojo was empty today." with a subtle indigo CTA "Enter the dojo"),
recent activity list (3-4 past kata: title, difficulty badge green/amber/red, time taken,
verdict badge PASSED/NEEDS WORK). 

Badges for kata types: CODE in blue-gray, CHAT in purple, WHITEBOARD in teal.
Small, tight border-radius (4px). No drop shadows. Minimal borders. Terminal meets 
product — like Linear or Raycast but with developer personality and martial arts restraint.
```

### Prompt 2 — Kata Selection (las 3 opciones)
```
Dark mode app screen showing 3 kata selection cards. Background #0F172A.
Each card: background #1E293B, 1px border #334155, hover state border #6366F1.

Card layout: top-left badge showing type (CODE/CHAT/WHITEBOARD), top-right difficulty 
badge (EASY green, MEDIUM amber, HARD red). Center: kata title in white Inter bold,
description in #94A3B8. Bottom: language tags (ruby, python, typescript etc) as small 
chips, duration in JetBrains Mono (e.g. "23 min").

Below cards: small muted text "These are your kata. No skip. No reroll."
Top of screen: mood and time filters already submitted, shown as inactive group buttons.
Minimal, focused. The cards are the only thing that matters on this screen.
```

### Prompt 3 — Kata Active (split view, tipo code)
```
Dark mode split-panel coding kata interface. Left panel (40%): kata context and 
description, background #1E293B, title in white bold, description in #94A3B8, 
language/tags chips at bottom. Right panel (60%): code editor with dark theme 
#0F172A background, line numbers in #475569, syntax highlighting in muted colors.

Top bar: kata title left-aligned, timer center in JetBrains Mono large (showing "18:43"
in amber — time running low), "Submit" button right in indigo. No other navigation. 
No sidebar. Completely focused interface.

Small role badge top: "[Staff Engineer — 8 yrs systems design]" as the sensei persona.
Subtle, authoritative. Bottom of left panel: "Enter the dojo. Leave the AI outside."
in very muted text — a reminder of the honor code.
```

### Prompt 4 — Sensei Evaluation (chat)
```
Dark mode chat interface for technical evaluation. Background #0F172A.
Two participants: user (right-aligned bubbles, background #6366F1) and 
"Senior DBA — PostgreSQL Sensei" (left-aligned, background #1E293B, 
small avatar with initials, role label above first message).

Conversation: user submitted a SQL answer, sensei asks one sharp follow-up question
(no praise, no emojis, direct technical tone — like a real senior dev talking).
User responds. Sensei gives final evaluation.

Final evaluation: larger card, background #0F172A with indigo left border,
verdict badge "PASSED WITH NOTES" in amber, followed by honest paragraph feedback
written as prose (not bullet points). Below: "View Full Analysis" button.

Bottom input: disabled, muted text "The sensei has spoken."
```

### Prompt 5 — Results & Analysis
```
Dark mode results screen. Background #0F172A. 

Top: large verdict in JetBrains Mono. "PASSED" in emerald or "NEEDS WORK" in red.
Kata name below. "Completed in 18:43" in muted text. Small badge: type + difficulty.

Middle: analysis card background #1E293B, left indigo border. Header: "Sensei's Analysis"
with role. 3-4 paragraphs of honest technical feedback in prose — no bullet points,
written like a senior dev actually talks. Harsh where needed, specific always.

Below: "Topics to Review" — 3 chip tags in amber.

Bottom: two buttons. "Share" (ghost, indigo border) and "Keep Practicing" (filled indigo).
Muted text between: "+2 positions in the dojo this week".

Share card preview (right or modal): dark 1200x630, "dojo_" logo top left, 
exercise name, verdict, one memorable line from the sensei's analysis in quotes,
github handle bottom right. Minimal, confident, slightly irreverent.
```

### Prompt 6 — Mobile View
```
Mobile dark mode kata selection. Single column. Same colors: #0F172A, #1E293B, #6366F1.

Top: "dojo_" logo left, GitHub avatar right. Below: mood/time filters as horizontal 
scrollable pill buttons, already submitted state (muted/inactive).

Cards full width, 16px padding, stacked vertically. Same badges. Duration prominent.

Fixed bottom bar: "These are your kata. No skip. No reroll." in muted small text
above safe area. No bottom navigation — this is a focused dojo, not a social app.
```

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

## Badges & Gamificación

Badges deberían ser earned, no regalados. El vocabulario sigue la metáfora del dojo:

- **`FIRST KATA`** — Completaste tu primer ejercicio
- **`5 STREAK`** — 5 días consecutivos con al menos un kata
- **`POLYGLOT`** — Completaste ejercicios en 3+ lenguajes distintos
- **`ARCHITECT`** — 10 ejercicios de whiteboard/design completados
- **`BRUTAL TRUTH`** — Recibiste un análisis particularmente duro y volviste al día siguiente
- **`CONSISTENT`** — 30 días con al menos un kata en el mes
- **`SQL SURVIVOR`** — Pasaste un ejercicio de SQL después de haberlo fallado antes
- **`SENSEI APPROVED`** — Completaste un ejercicio con evaluación perfecta del LLM experto
- **`UNDEFINED NO MORE`** — Completaste 50 ejercicios en total
- **`RUBBER DUCK`** — Completaste un kata de chat/discussion con score alto

Los badges no tienen puntos ni XP. Son colecciones — están o no están. El nombre `UNDEFINED NO MORE` conecta directamente con `notdefined.dev` y es el badge de progreso más significativo.

---

## Logo

**Concepto principal:** La palabra `dojo` en JetBrains Mono lowercase, con un cursor parpadeante `_` al final. Sin iconos. La tipografía monospace ya comunica "terminal", "técnico", "en proceso". El cursor dice "todavía escribiendo, todavía aprendiendo".

```
dojo_
```

Simple. No necesita más.

**Concepto alternativo:** Un círculo (el enso del Zen, incompleto adrede — símbolo de imperfección y proceso) con `dojo` en el centro en monospace. El círculo incompleto conecta con `notdefined.dev` — nada está del todo cerrado aquí.

**Para el favicon:** Solo el cursor parpadeante `▌` en indigo sobre fondo oscuro. Reconocible en 16x16.

**Para share cards y OG images:** `dojo.notdefined.dev` en monospace completo, el punto entre dojo y notdefined actúa como separador visual natural.

Evitar: iconografía de artes marciales literal (katanas, cinturones, dojos físicos), iconos de código genérico (corchetes, `</>`), iconos de robot/AI, cualquier cosa que parezca una startup de 2019.
