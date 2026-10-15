# Dojo — Branding, UX & Voice

> **Status:** Canonical · **Last reviewed:** 2026-10-15
>
> This file owns the brand: name, vocabulary, voice, information architecture, UX principles, microcopy.
> For the design system — tokens, themes, motifs, components, motion — see [`DESIGN.md`](DESIGN.md).
> BRANDING owns the *why* and the *words*, DESIGN owns the *values* and the *renders*.

---

## The name

**Dojo** — from Japanese, the place where an art is practiced until mastered.

It is not competition and not certification. It is personal discipline: the place you go to practice even if nobody is watching, even if you are going to fail, even if it is uncomfortable.

- Works in English and Spanish without translation
- Carries sustained practice, not competition
- Right cultural load: martial arts, repetition, progressive mastery
- Short, memorable, pronounceable in any language

**Reference instance domain:** `dojo.notdefined.dev`. Each instance uses its own host (`APP_HOST`); this one is the author's, not a service.

The domain adds a layer of personality the name alone lacks — *"the dojo for developers who are not fully defined yet"*. It is honest about the state of the developer using it: in progress, unfinished, still learning.

**Tagline:** *"The dojo for developers who still have something to prove. To themselves."*

---

## Glossary

The product speaks one vocabulary. Each term below is load-bearing — it does product work, not branding decoration. If a future term doesn't earn its place by being distinguishable from a generic SaaS word, don't add it. (See [ADR 020](adr/020-ubiquitous-language-pass.md) for the full rename.)

| Term | What it means in the product | On-brand | Off-brand |
|---|---|---|---|
| **Kata** | A single practice unit — one prompt, one sit, one sensei verdict. Atomic. | *"completed five katas this week"* | *"completed five exercises"* |
| **Sensei** | The LLM evaluator. Honest, structured, never softens. Voice register matters: noted, observed, recognized — not master/zen/wisdom. | *"the sensei noted the gap in your reasoning"* | *"the master grants you wisdom"* |
| **Scroll** | A learning path built as an external app and embedded in Dojo by iframe. Dojo hosts it (progress, session, code execution) and does not prescribe its content or format. The host works; availability depends on what the operator registers — see [#116](https://github.com/rodacato/dojo/issues/116). | *"finish the Pattern Circuit scroll"* | *"finish the Pattern Circuit course"* |
| **Belt** | A single rank per user — white / yellow / green / brown / black — computed from session history. Earned, kept (no decay in v1). The sensei does not influence advancement. | *"I'm working toward brown belt"* | *"I unlocked the brown belt trophy"* |
| **Milestone** | A single-moment recognition (`FIRST_KATA`, `POLYGLOT`, `CONSISTENT`). Independent from belt — earned at a moment in time. | *"earned the Polyglot milestone after my third whiteboard kata"* | *"got a Polyglot badge"* |
| **Engawa** | The transitional veranda. Lives at `/engawa` as the anonymous code playground (no account required to try a snippet), but the *concept* is broader — see [Engawa as a philosophy](#engawa-as-a-philosophy). | *"opened the engawa to test a Ruby idea"* | *"opened the playground"* (in our product surface) |
| **Kumite** | The planned 1v1 sparring feature — paired evaluation, shared kata, side-by-side reasoning compared by the sensei. **Not built yet** — the route exists as an honest placeholder. Not a relabel of the deleted leaderboard. | *"when kumite ships I want to spar against another reviewer"* | *"check the kumite leaderboard"* |

The self-hosting vocabulary, which is plain on purpose because it describes deployment, not practice:

| Term | What it means | On-brand | Off-brand |
|---|---|---|---|
| **Instance** | One running deployment, serving one group. "Dojo" is the software; an instance is a copy of it someone runs. | *"run your own instance"*, *"this instance"* | *"the platform"*, *"the hub"* (the word appears only in [ADR 024](adr/024-self-hosted-hub-pivot.md)) |
| **Operator** | The person who deploys an instance and sets `CREATOR_GITHUB_ID`. They own its invitations, its data and its LLM bill; the dojo project owns none of them. In code the same person is the `creator` (`CREATOR_GITHUB_ID`, `requireCreator`); renaming it would break existing deployments, so it stays. | *"ask the operator for an invitation"* | *"ask the dojo team"*, *"the admin"* (`/admin` is a route, not a role) |
| **Invitation** | The link an operator issues from `/admin/invitations`; there is no other way to sign up. The landing's form is a *request access*: a note to the operator, not a sign-up. | *"request an invitation"* | *"join the waitlist"* |
| **Reference instance** | The author's own deployment at `dojo.notdefined.dev`, kept as a live example. It is not a service and grants nothing beyond what its operator chooses. | *"the reference instance"* | *"the hosted version"* |

One more that is *not* dojo-flavored on purpose:

- **Dashboard** — generic post-login orientation surface. The one place we don't translate; the user shouldn't have to learn vocabulary before seeing where they are.

### Engawa as a philosophy

The engawa is the transitional veranda of a Japanese house — neither inside nor outside, a place where things sit while the household decides what to do with them. In Dojo it does double duty:

- **As a surface:** `/engawa` is the anonymous code playground. No account, no tracking, no consequence — just a place to drop a snippet and run it.
- **As a stance:** it's the explicit home for unfinished work. Experiments that may never ship. Half-formed ideas the creator wants on the site without committing to polish them.

A product that demands every surface be shipped-quality stagnates — the bar for "good enough to put up" becomes so high that nothing new appears. One with a legitimate home for *"still drying"* stays alive. If something is interesting but rough, it lives in `/engawa` until it either earns promotion to a real surface or quietly disappears.

---

## Brand personality

**Tone:** brutally honest, with humor. This is not a product that hugs you — it tells you the truth with a dark smile. Think of a tech lead who respects you enough not to lie to you.

**Voice:**
- Direct. No fluff.
- Geek humor. Technical references, developer-culture memes.
- Vulnerability celebrated. Failing is part of the process, not the shame.
- No motivational-poster energy. No "you can do it!". More "you failed SQL again, here is why."

**Voice anti-patterns:**
- ❌ "Congratulations! You did it!"
- ❌ "Don't worry, everyone makes mistakes"
- ✅ "It worked. The LLM says a junior would have written it cleaner."
- ✅ "15 minutes on a 10-minute problem. Runtime was O(n²) when O(n log n) was available. Good intent, sloppy execution."

---

## Information architecture

Flat and expandable. It is optimized for the creator's iteration speed, not for retaining anonymous visitors — adding another surface adds a row in the sidebar and breaks nothing.

| Surface | State | Purpose |
|---|---|---|
| **Katas** (`/katas`) | shipped | Atomic practice — Piston executes code, the sensei evaluates. The heart of the product. |
| **Scrolls** (`/scrolls`) | shipped (host) | External apps embedded by iframe (epic [#116](https://github.com/rodacato/dojo/issues/116)). What shows up depends on the scrolls the operator registers. |
| **Belts** (`/belts`) | shipped | Cross-cutting progress — rank and milestones derived from session history. |
| **Kumite** (`/kumite`) | honest placeholder | Planned 1v1 sparring. The route exists empty on purpose. |
| **Engawa** (`/engawa`) | shipped (playground) + philosophy | Anonymous code playground and the explicit space for unfinished work. See [Engawa as a philosophy](#engawa-as-a-philosophy). |

**Flat, not hierarchical.** Each surface is a top-level sidebar destination. No nested tabs until a surface's own data demands them. Moving two surfaces "under" another to look organized is cosmetic hierarchy that turns the sidebar into a file-explorer tree.

**The dashboard is not a surface, it is orientation.** It is the screen you see on sign-in and from which you go to the others. It has no vocabulary of its own.

---

## Theme and visual direction

Tokens, values and component specs live in [`DESIGN.md`](DESIGN.md) and `apps/web/src/styles/main.css`. This section is the *why*.

Sumi-e ink, two themes under one token system, picked by the OS by default:

- **Washi** (warm paper) — for reading: long sensei analysis. The light variant does real work, it is not light mode for completeness.
- **Sumi** (deep ink) — for long sessions: the kata flow, results, share cards.

A single accent: **hanko vermillion** (the red of a Japanese name seal). If it is interactive, it is vermillion. If not, it is not. **Slate Indigo**, the original dark theme, remains as an explicit choice in the theme toggle.

**Why:** catalogs need calm to study; neon cyberpunk would fight the content. Sumi-e is distinctive (not the purple-gradient AI slop of 2026), ownable (consistent with the dojo's Japanese vocabulary) and borrowed on purpose — 1,500 years of graphic tradition is the opposite of inventing fake originality.

### Motifs

Four elements carry the identity. Each has a contract in [`DESIGN.md`](DESIGN.md).

- **Enso** — the incomplete zen circle. Loader, section mark.
- **Hanko** — the square red seal. Milestone badge, verdict stamp.
- **Brushstroke** — a single brush stroke. Underline under H1.
- **Belt colors** — avatar ring and profile header band. The visual form of rank.

### Typography

Does not change between themes. **JetBrains Mono** for logo, numbers, verdicts, all-caps labels. **Inter** for body and UI. The terminal identity is stable — the theme changes the skin, not the typographic voice.

### Visual style (cross-theme)

- Subtle borders, small `border-radius` (4-6px). Never `rounded-full` on containers.
- Minimal shadows. Depth through surface-color stacking, not drop shadows.
- The `_` cursor blinking at 1Hz as an identity element — only in loading states, waiting states and the wordmark.

---

## Motion as signature

Functional CSS transitions of 150-200ms. The blinking `_` cursor is the only "identity animation". No bouncing, no sparkles, no celebration. GSAP is reserved for timeline-shaped motion (the landing, the enso loader, the brushstroke underline); dashboard and `/admin/*` are CSS-only. The scope rule and its reasons are in [`DESIGN.md`](DESIGN.md#motion).

**Forbidden in every theme:** confetti, celebration bursts, parallax, scroll-jacking, slide-ins from below, modal entries with bounce, visible FLIP rearrangements. **Failing is not dramatic, passing isn't either** — the principle that governs every animation in the product.

---

## UX — main flow

```
[Sign in with GitHub]
       ↓
[Dashboard: today's state]
  - Badge if you completed today
  - Current streak
  - Prompt if you have not done your challenge
       ↓
[Mood + Time] — simple group buttons, one submit
       ↓
[3 options] — cards with title, type, difficulty, language
  No skip. No reroll. These are your katas.
       ↓
[Active kata] — split view
  Left: problem context
  Right: your tool (editor / chat / Mermaid)
  Top: timer, no pause
       ↓
[LLM evaluation] — chat with the expert
  May ask follow-ups (see MAX_ATTEMPTS in the Session aggregate)
  Gives a verdict when it has enough
       ↓
[Result + analysis]
  Verdict: Passed / Passed with notes / Needs work
  Full brutal analysis
  Optional share card
       ↓
[Updated dashboard]
```

### UX principles

**Intentional friction:** no easy escape. The timer runs, the three options are what they are. By design — the point is to face the kata, not to optimize it.

**No distractions during the kata:** the split view is all there is. No navigation, no notifications, no external links.

**Failing is not dramatic:** if time runs out or the LLM decides there was no satisfactory resolution, the session ends with dignity. The analysis always appears — you failed and here is exactly why and what to study.

**The dashboard is the reward, not the goal:** seeing your progress is the reward for completing. It is not the entry point, not something to obsess over.

---

## Components — voice and behavior

Shape (radius, padding, color, motion) lives in [`DESIGN.md`](DESIGN.md). Here are only the voice and behavior decisions the components embody.

- **Kata card (selection):** the 3 picks are the 3 picks. The card doesn't hint that you could change them. Hover only confirms the target — it doesn't animate a "preview" of the kata.
- **Timer:** number-first, no "minutes" label. No pause, no extend. The color change (normal → amber → red) is the only narration of remaining time. Nothing else moves.
- **Code editor:** no autocomplete during the kata. Honor code, not enforcement. It should feel "clean", not "limited".
- **Sensei chat:** the "the expert is evaluating…" indicator uses the blinking cursor, not a spinner or dots. The expert speaks when it has something to say; there is no continuous typing indicator.
- **Share card:** irreverent, honest, geek voice. A `NEEDS_WORK` share card is shared with the same pride as a `PASSED` one — that is celebrated vulnerability, not consolation.

---

## Microcopy — voice in the UI

How the product sounds at key moments:

| Moment | Text |
|---|---|
| No kata completed | "No practice today. The dojo was empty." |
| Kata selection | "These are your kata. No skip. No reroll." |
| Timer approaching end | "Time's almost up. What do you have?" |
| Time out | "Time. The sensei evaluates with what you submitted." |
| Analysis ready | "Verdict is in. It's honest." |
| Share card prompt | "Own it. The good and the ugly." |
| Streak lost | "Streak broken. The dojo opens again tomorrow." |
| First kata | "First kata. The hardest one is always the first." |
| Passed | "That's a pass. The analysis tells you the rest." |
| Failed | "Not there yet. Read the analysis. Come back." |
| Sign in | "Enter the dojo." |
| Sign out | "See you tomorrow." |

---

## Belts & Milestones

Two orthogonal concepts, both on `/belts`. The rubric is [PRD-031](prd/031-belt-progression-rubric.md) and the thresholds are `BELT_THRESHOLDS` in `apps/api/src/domain/recognition/belt.ts`; this section is the voice.

### Belts — the rank

A single progression per user, derived from session history on every read: white (default), yellow, green, brown, black. Each step needs a number of completed katas, distinct topic clusters, active days in the last 30, and days at the previous rank.

The sensei does not influence promotion. This is deliberate: if verdicts counted, there would be an incentive to pressure the evaluator to be softer. Promotion is a function of sustained practice and diversity, not batting average.

**On-brand voice:** *"earned brown belt — Code Review track"*, *"working toward green belt"*.
**Off-brand voice:** *"unlocked the brown belt trophy"*, *"belt achievement complete"*.

No progress bar to the next rank (the dojo doesn't babysit). The user sees the four current factors and works out what is missing without the system pushing.

### Milestones — single moments

One-shot events earned at a specific instant. Not rank; the memory of "this happened". Slugs and thresholds are in `apps/api/src/infrastructure/events/MilestoneEventHandler.ts`: `FIRST_KATA`, `5_STREAK`, `CONSISTENT`, `POLYGLOT`, `ARCHITECT`, `RUBBER_DUCK`, `BRUTAL_TRUTH`, `SENSEI_APPROVED`, `SQL_SURVIVOR`, `UNDEFINED_NO_MORE`.

Milestones have no points or XP. They are collections — you have them or you don't. `UNDEFINED_NO_MORE` connects to `notdefined.dev` and is the most significant progress milestone.

---

## Logo

**Open Gate** is the approved mark: a restrained evolution of the earlier torii, with a curved lintel, a crossbar and two open posts. It sits next to the `dojo_` wordmark (JetBrains Mono, lowercase, blinking cursor `_`). The cursor says "still writing, still learning" and does not change with the theme.

- **Canonical geometry:** `apps/web/src/brand/logo.json` (consumed by `LogoMark`). The outlined wordmark and the social composition are `brand/wordmark.svg` and `brand/social-template.svg`. Colors always come from the app's theme tokens in `apps/web/src/styles/main.css`.
- **Generated, never hand-edited:** `site/brand/*` (lockups, icons, social cards, theme CSS), `site/favicon.svg` and `apps/web/public/favicon.svg`. Regenerate with `pnpm brand:assets`; `pnpm brand:check` fails when a checked-in asset is stale or a site link is broken.
- **Published guide:** `site/brand.html` (Pages) explains each asset, its use and the integration steps. Project social cards belong to project marketing and metadata, not to a person's shared session. The full map of canonical sources and generated outputs is [`brand/README.md`](../brand/README.md).
- **Uploading the repository preview:** GitHub has no API for it. In the repository's Settings → General → Social preview, upload `site/brand/social-sumi.png` (1280×640 is recommended; the card is 1200×630).

**Share cards and OG images:** the instance host in full monospace (`dojo.notdefined.dev` on the reference instance). The dot between `dojo` and `notdefined` acts as a natural visual separator.

**Avoid:**
- Literal martial-arts iconography (katanas, physical belts, wooden dojos)
- Generic code icons (brackets, `</>`)
- Robot/AI/brain/lightbulb icons
- Anything that looks like a 2019 startup

---

## Related documents

- [`DESIGN.md`](DESIGN.md) — tokens, themes, motifs, components, motion.
- [`VISION.md`](VISION.md) — product strategy.
- [`prd/031-belt-progression-rubric.md`](prd/031-belt-progression-rubric.md) — belt rank rubric (this file documents the voice; the PRD documents the math).
- [`adr/020-ubiquitous-language-pass.md`](adr/020-ubiquitous-language-pass.md) — the rename that introduced `scroll / kata / belt / milestone` as the visible vocabulary.
