# Context

Everything you need to understand the architecture, data model, and key decisions made before writing a line of code.

---

## Ecosystem

Four services, two public, two private:

```
dojo.notdefined.dev          # this repo — the practice platform
drawhaus.notdefined.dev      # separate repo — Excalidraw with MCP + API
shellm (github.com/rodacato/SheLLM)  # separate repo — LLM proxy (optional)
dojocho (private, future)    # curation tool for building kata
```

Dojo consumes Drawhaus and the LLM provider via HTTP. The user never knows what's behind the LLM endpoint — it could be the official Anthropic API, OpenAI, or SheLLM routing through CLI subscriptions.

---

## Architecture

```
[Browser]
    ↓ HTTPS (Cloudflare Tunnel)
[dojo.notdefined.dev — React + Vite]
    ↓ WebSocket (sensei streams in real time)
[Dojo API — Hono + Node.js]
    ↓                     ↓
[LLM Endpoint]      [Drawhaus API]
(any compatible)    (whiteboard kata)
    ↓
[PostgreSQL]
```

WebSockets are used for the sensei evaluation flow — the user sees the sensei "typing" in real time rather than waiting for a full response. Hono has native WebSocket support. The LLM endpoint must support streaming.

---

## Data Model

### Exercise
The template. Created by the owner (initially only the creator), reviewed and published manually or via the future Dojocho tool.

```typescript
{
  id: uuid
  title: string
  description: string        // shown to the user
  duration: number           // in minutes
  difficulty: "easy" | "medium" | "hard"
  category: string
  type: "code" | "chat" | "whiteboard"
  status: "draft" | "published" | "archived"
  language: string[]         // ["ruby", "typescript", "agnostic", ...]
  tags: string[]
  topics: string[]           // areas covered — used for "topics to review" after failure
  owner_role: string         // how the sensei LLM should present itself
  owner_context: string      // technical briefing for the LLM — different from description
  created_by: uuid
  created_at: timestamp
}
```

### Variation
At least one per exercise (the default). Allows the same exercise to have different LLM personas or contexts, adding variability without full duplication.

```typescript
{
  id: uuid
  exercise_id: uuid
  owner_role: string         // can inherit or override the parent exercise
  owner_context: string
  created_at: timestamp
}
```

### Session
The instance. Created when a user picks a kata. The `body` — the actual exercise as the LLM constructed it — is generated here and persisted. It never changes until the session ends (completed or failed). The user always sees the same exercise if they refresh.

```typescript
{
  id: uuid
  user_id: uuid
  exercise_id: uuid
  variation_id: uuid
  body: string               // generated at session start, never regenerated
  status: "active" | "completed" | "failed"
  started_at: timestamp
  completed_at: timestamp | null
}
```

### Attempt
One row per exchange in the evaluation conversation. The sensei can ask follow-up questions (max 2) before giving a final verdict. `is_final_evaluation: true` marks the row that contains the full analysis — this feeds the dashboard, badges, and share card.

```typescript
{
  id: uuid
  session_id: uuid
  user_response: string
  llm_response: string
  is_final_evaluation: boolean
  submitted_at: timestamp
}
```

### User

```typescript
{
  id: uuid
  github_id: string
  username: string
  avatar_url: string
  created_at: timestamp
}
```

---

## Key Design Decisions

**`body` lives in Session, not Variation.**
The exercise is the template. The session is the instance. When a user picks a kata, the LLM generates the actual exercise body using the variation's `owner_role` and `owner_context`. That body is saved to the session immediately and never regenerated. Refreshing the page always shows the same exercise. The user committed — there's no escape.

**Mood and time are filters, not persisted data.**
When the user enters the dojo, they pick their mood and available time via group buttons. These are query parameters that filter available exercises — they're not saved to the database. No complexity, no tracking, no inferred behavior. Honor code.

**No fixed attempt counter.**
The original design had "3 attempts." After discussion, this was replaced with a more realistic model: the sensei decides when it has enough to evaluate. It can ask follow-up questions (max 2) before giving a final verdict with whatever was submitted. This mirrors real technical discussions — there's no attempt counter in a code review.

**The sensei evaluates the process, not the answer.**
The sensei has a specific `owner_role` and `owner_context` per exercise. A SQL exercise might have a "Senior DBA with 12 years in PostgreSQL" as the sensei. The evaluation focuses on reasoning, tradeoffs identified, and communication — not on whether the solution was optimal.

**No repeat exercises within 6 months.**
A user won't be offered an exercise they've already done in the past 6 months. After that window, it's fair game again — enough time for genuine growth.

**Exercises are multi-language by default.**
A developer should be able to reason about Ruby code even if they primarily write TypeScript. Part of the challenge is the discomfort of an unfamiliar language. Exercises can specify `language: ["agnostic"]` for language-independent scenarios.

---

## Exercise Types

### code
The user writes, refactors, reviews, or debugs code in a split-panel view. Left: context and requirements. Right: code editor (no autocomplete — honor code).

### chat
Technical roleplay. The sensei takes a role (tech lead, PM with an ambiguous requirement, a junior asking for help) and the user responds as they would in real life. Evaluated on reasoning and communication.

### whiteboard
System design and architecture. The user works in an embedded Drawhaus instance to diagram their solution, or describes it in prose. The sensei evaluates the proposal — not the perfect solution, but what the user considered, what they missed, and why they made the choices they did.

---

## Auth

GitHub OAuth only. Consistent across Dojo and Drawhaus — both services use the same GitHub OAuth app. When a user authenticates with Dojo, the session token can be passed to Drawhaus for seamless whiteboard integration without a second login.

---

## LLM Integration

Dojo talks to a single configurable endpoint. No logic for switching providers — that's handled outside (either via the official API or via SheLLM routing). The env vars:

```env
LLM_BASE_URL=https://api.anthropic.com   # or http://shellm:3000 or any compatible endpoint
LLM_API_KEY=your_key_here
LLM_MODEL=claude-sonnet-4-20250514
```

The API uses streaming. The WebSocket connection to the browser stays open during the entire evaluation flow — tokens stream from the LLM through the API to the browser in real time.

---

## Content Sources

Kata come from:
- The creator's past work: real refactors, architecture decisions, production incidents
- Design patterns with real-world context applied
- Reddit / Hacker News technical scenarios ("what would you do here?")
- Past FAANG-style interviews and the creator's own interview history
- Classic katas with language or domain variations
- Stack Overflow and technical blog posts
- Contributions from invited users (require creator approval or LLM QA gate)

Quality bar: every exercise should leave the user feeling they practiced or learned something, even if they failed. Wasted time is the one failure mode the product cannot afford.
