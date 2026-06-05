# PRD-005: Expert Panel Review — Validation, Gaps & Recommendations

> **Status:** exploring
> **Date:** 2026-03-21
> **Author:** Claude — full panel consultation: Priya, Darius, Tomás, Yemi, Marta, Soren, Amara, Hiroshi, Valentina, Lucía

---

## Idea in one sentence

Run the full product concept and current design decisions through every expert to surface what was missed, what should be adjusted, and what is genuinely strong.

---

## What is being validated

1. The core loop (kata → timer → submission → sensei evaluation → verdict)
2. The screen set and feature list (PRD-001)
3. The "no reroll, no skip, no pause" philosophy
4. The invite-only model and growth strategy
5. The gamification approach (badges, streak, leaderboard)
6. The technical architecture as it stands

---

## Panel discussion

---

### Priya Menon — Product Strategy

**What is genuinely strong:**
The "delegated cognitive atrophy" problem statement is precise and credible. It avoids the trap most developer tools fall into — claiming to solve everything. This solves one specific thing for one specific type of developer who already recognizes the problem. That's the right starting point.

The "no skip, no reroll, no pause" constraint is not a limitation — it's the product. It's what makes the dojo feel different from a quiz app. Do not soften this under any pressure.

**What I'd adjust:**

1. **The Day Start screen is a gate that requires thought.** Mood + time selection before every session adds friction at the entry point. This is intentional friction, which I support — but it only works if the selection *actually changes what you get*. If the three kata are effectively random regardless of mood/time, users will pattern-match and always pick "focused + 20 min." Make sure the filtering is meaningful and visible enough that users understand *why* they got these three.

2. **The streak mechanic needs a philosophy decision.** Does a `needs_work` verdict count toward the streak? If yes, the streak measures *showing up* — which is the right philosophy ("practice over performance"). If no, the streak measures *passing*, which subtly shifts the incentive toward avoiding hard kata. I strongly recommend: **any completed session counts toward the streak**, regardless of verdict.

3. **The Dashboard is the product's long-term home.** But it's currently minimal by design (Phase 0). That's correct for now. Watch whether the dashboard becomes a reason to open the app vs. just a receipt for a session you already did. If it's only the latter, that's fine for a practice tool — but it's worth knowing.

4. **Invite-only is a brand asset, not just a quality control mechanism.** The way you communicate scarcity matters. "Invite-only because we're figuring it out" is honest but weak. "Invite-only because we want practitioners, not tourists" is the real reason — say that.

---

### Darius Osei — Architecture & DDD

**What is solid:**

The domain model is well-designed. `Session` as aggregate root with `Attempt` as child is correct — the session owns the conversation lifecycle, and invariants (no resubmit after completion, max follow-ups, immutable body) are properly enforced at the aggregate level. The bounded context separation (Practice / Content / Identity / Recognition) will hold for the foreseeable future.

**What I'd flag:**

1. **`mood` and `duration` not persisted is architecturally correct but may limit future analytics.** The current decision ("query parameters only, never written to DB") is clean and honors the "no tracking" principle. But if Phase 2 analytics need to know "users in low_energy mood tend to pick CHAT kata" — that data won't exist. This is a deliberate trade-off, not a mistake. Document it explicitly as an ADR.

2. **The `ExerciseFilters` type needs clarification on what "eligible" means.** Currently: 6-month exclusion window + filter by duration. Does "eligible" also filter by difficulty? By type? If the mood selector influences the difficulty or type of kata shown, that logic needs to live in `ExerciseRepositoryPort.findEligible()`, not in the route handler.

3. **`topics` field on `Exercise` vs `topicsToReview` on `EvaluationResult`.** The exercise has `topics[]` (areas the kata covers). The attempt has `topicsToReview[]` (areas the sensei flagged as weak). These are different things but share a vocabulary. Make sure the seed data's `topics` field and the LLM's `topicsToReview` output use consistent terminology — this is the data that powers the Phase 2 dashboard weak-areas analysis.

4. **The `InMemoryEventBus` for Phase 0 is correct.** Resist any temptation to add Redis before it's needed. The event bus upgrade should be driven by a specific failure mode (e.g., "the badge computation is too slow in-process"), not by anticipation.

---

### Tomás Ríos — Realtime & Infrastructure

**What is well-designed:**

The WebSocket message protocol in PRD-002 is correct. The separation of `POST /sessions/:id/attempts` (HTTP) and `WS /ws/sessions/:id` (stream) is the right architecture — HTTP handles the command, WebSocket handles the stream. This is cleaner than trying to do everything in one connection.

**What I'd add:**

1. **Reconnection handling is critical UX.** Mobile browsers on flaky connections will drop WebSocket mid-stream. The protocol needs a `{type: "reconnect", attemptId: string}` message the client can send after reconnecting, which tells the server "I lost connection during this attempt — send me what you have." The server should cache the partial response for 60 seconds.

2. **The timer is client-side, not server-side.** This is an honor code issue, not a security issue — the server trusts the client on timing. But the server needs to enforce the session expiry on submit: if `submittedAt > startedAt + duration * 60 * 1.1` (10% grace), reject the attempt with a `408 Session Expired` response. The 10% grace handles network latency.

3. **The code editor choice matters more than expected.** Recommendation: **CodeMirror 6** — it's the right balance of features, bundle size, and configurability. Monaco is too heavy (3MB+) for a focused practice tool. Plain `<textarea>` is too primitive for code. CodeMirror 6 can be configured to disable autocomplete, autocorrect, and spell check — exactly what the honor code requires.

4. **Mermaid rendering in the WHITEBOARD kata.** Use `mermaid.js` directly in the frontend — no server-side rendering needed. The Mermaid editor is local state; only the final diagram text is submitted. This keeps the `WhiteboardPort` simple for Phase 0 (it's effectively a no-op until Drawhaus is connected).

---

### Yemi Okafor — LLM & Evaluation Design

**What is well-designed:**

The structured output approach (raw streaming prose + final `<evaluation>` tag with JSON) is the correct architecture. It gives users the real-time reading experience while producing a parseable result at the end.

**What I'd flag — this is critical:**

1. **The sensei's persona is the most important product decision after the core loop.** The `ownerRole` and `ownerContext` fields on `Variation` determine how the sensei behaves. A bad persona produces vague, useless evaluations. A well-crafted persona produces evaluations that feel like a real expert who has seen your specific type of code before.

   **Recommendation:** Before writing the Anthropic adapter, write and test 3 system prompt variations. Compare outputs side by side. The difference between "You are a senior developer" and "You are a principal engineer at a payments company who has reviewed 200+ PRs in the last year and has strong opinions about error handling and boundary conditions" is enormous.

2. **The follow-up question logic.** Currently: max 2 follow-ups before forced final verdict. The sensei should decide when it has enough — the 2-exchange limit is a guardrail, not a default behavior. Prompt design should push the sensei toward:
   - No follow-up if the submission is clearly good or clearly bad (confident verdict)
   - One follow-up when there's ambiguity about the developer's reasoning
   - The max 2 limit as a hard stop for edge cases

3. **`topicsToReview` quality is the product's long-term value.** These chips appear on the Results screen, on the Dashboard (Phase 2), and will drive the psychological analysis view. If the LLM is vague ("review error handling") vs. specific ("review PostgreSQL transaction isolation — your query doesn't account for dirty reads"), the difference is enormous. The prompt needs explicit instruction: "Topics to review must be specific technical concepts, not general skill areas."

4. **Verdict distribution will drift.** Over time, the sensei may start being too harsh or too lenient. Monitor the `verdict` distribution in the admin dashboard (Phase 0 admin screen shows sessions and verdicts). If >70% are `needs_work` after 50 sessions, the prompt needs recalibration.

---

### Marta Kowalczyk — Security

**What is already solid:**

The auth implementation (spec 006) is correct — PKCE, no stored access tokens, HttpOnly cookies, state validation. The rate limiting is appropriate. The `requireAuth` middleware validates against DB, not just the cookie.

**What I'd flag:**

1. **WebSocket auth on upgrade, not on first message.** This is documented in PRD-002 but worth emphasizing: the cookie must be validated *before* the WebSocket handshake completes. Validating on the first message opens a brief window where an unauthenticated connection exists. Hono's WebSocket upgrade handler supports middleware — use `requireAuth` there.

2. **The exercise `description` and `ownerContext` fields will be passed to the LLM.** If the exercise content is user-controlled (Phase 3), this is a prompt injection surface. For Phase 0 (creator-controlled only), this is a trusted input — no sanitization needed. Document this assumption in the Admin — New Exercise form: "Evaluation rubric is passed directly to the LLM. Content is trusted." Add this to the Phase 3 threat model.

3. **The `CREATOR_GITHUB_ID` env var approach is fine for Phase 0.** When adding the `is_creator` DB column in Phase 1, do not expose a route to set it — it must be set via DB migration or a one-time admin script. A "make user creator" API endpoint would be a privilege escalation target.

4. **The invite token generation.** In Phase 1, invite tokens should be: cryptographically random (32+ bytes), single-use, expire after 7 days, and not reusable after redemption. Standard stuff but easy to get wrong.

---

### Soren Bachmann — UX & Design

**What is genuinely strong:**

The design system is complete and consistent. The "no blur, no shadows, no gradients (except the prestige badge)" constraint produces a clean, focused aesthetic that feels like a developer built it for developers. The monospace numbers, the amber/red timer states, the blinking cursor `▌` — these details are doing real work.

**What I'd adjust:**

1. **The kata type badge colors are doing too much work.** CODE (indigo, same as accent), CHAT (purple `#7C3AED`), WHITEBOARD (teal `#0D9488`). These are distinguishable but the purple/indigo proximity is subtle on small badges. Consider: CODE stays indigo, CHAT becomes amber (conceptually: "communication"), WHITEBOARD stays teal. But this is a minor preference — the current system works.

2. **The results screen "+N positions in the dojo this week" stat is premature.** This requires the leaderboard to exist and be populated. In Phase 0 (solo creator), this will always show "+0 positions." Either skip it in Phase 0, or replace with a different stat ("Your Xth kata" — simple but honest).

3. **The Admin UI screen shows a sidebar with 5 items: Exercises / Sessions / Users / Queue / Health.** For Phase 0, only Exercises is needed. Render the others as disabled/muted with "coming in Phase 1" labels. Do not build 5 admin sections when 1 is needed — display the skeleton so the creator can see the intent.

4. **The Dashboard "today card" has two states.** The empty state copy *"The dojo was empty today."* is on brand. But the CTA "Enter the dojo →" navigates to `/start`. Consider: if the user already has an active (not completed) session, should this navigate to the session directly? Yes — resuming a session should be possible without restarting the Day Start flow.

---

### Amara Diallo — Community & Growth

**What is strategically sound:**

The invite-only model is correct. The share card as a community artifact is high-leverage — a developer sharing "the sensei told me I need to review PostgreSQL transaction isolation" is doing recruiting and reputation work simultaneously. This is the right growth mechanic for this audience.

**What I'd flag:**

1. **The share card pull quote is the most important copy in the product.** The current design shows "the harshest/most specific line" from the analysis. This framing is correct — the specificity is what makes it worth sharing. But the LLM needs explicit instruction to surface a quotable, specific line. Generic evaluation text won't generate shareable pull quotes. Add this to the prompt requirements.

2. **The Changelog at `/changelog` is an underused build-in-public asset.** Each entry should be written in the first-person decision voice described in the screens README. If this is written well and shipped consistently, it becomes the best recruiting tool for Phase 1 invitations — developers who read the changelog understand the product's philosophy before they even try it.

3. **Phase 0 needs at least one real user who is not the creator before Phase 1.** Not for product reasons — for social proof reasons. When the first invitation is sent, the invitee will ask "is anyone else using this?" The answer "yes, three developers, including me" is very different from "just me." Find 1-2 trusted developer friends to test it privately before the official Phase 1 opening.

4. **The leaderboard footer copy is perfect:** *"Ranking resets on the 1st. Consistency compounds."* Do not change this. It captures the entire product philosophy in 6 words.

---

### Hiroshi Nakamura — QA & Testing

**What is well-structured:**

The test strategy from `docs/WORKFLOW.md` is correct. Domain unit tests, use case unit tests with `MockLLMAdapter`, infrastructure integration tests with real DB. The `EvaluationResult` structural contracts (verdict ∈ valid values, topicsToReview non-empty when needed) are the right thing to test — not the LLM's prose.

**What I'd add:**

1. **The WebSocket evaluation flow needs an integration test that doesn't require a real LLM.** Use the enhanced `MockLLMAdapter` (from PRD-004) to test the full flow: connect WS → submit attempt → receive tokens → receive EvaluationResult → connection closes. This test should live in `apps/api/src/infrastructure/http/ws.test.ts`.

2. **The timer enforcement test.** The server-side submit validation (`submittedAt > startedAt + duration * 1.1`) needs a unit test on the use case, not just an integration test. The clock is trickable — use `vi.useFakeTimers()` to simulate timer expiry.

3. **Seed data quality test.** Before the seed script runs in production, validate each exercise: `title` non-empty, `description` > 50 chars, at least one `variation` with non-empty `ownerRole` and `ownerContext`. A seed validation function that throws on bad data is better than a broken exercise in the catalog.

4. **The `topicsToReview` contract.** Test that the `EvaluationResult` value object rejects an empty `topicsToReview` array when `verdict === 'needs_work'`. The Results screen and Dashboard both depend on this being populated.

---

### Valentina Cruz — Content Design

**What is well-considered:**

The three kata types (CODE, CHAT, WHITEBOARD) cover distinct skill dimensions: technical execution, communication, and architecture. The variation system (different `ownerRole` and `ownerContext` per exercise) is the right mechanism for adding variability without duplication. The 6-month exclusion window is appropriate for a practice tool — exercises should feel fresh each time.

**What I'd flag:**

1. **The seed kata quality will define the product's first impression.** The first 8 exercises are what the creator will practice with for weeks before Phase 1. If they feel generic, the practice will feel generic. Prioritize exercises from real situations:
   - Real code review scenarios (not toy examples)
   - Real architectural decisions with actual tradeoffs
   - Real conversations that went wrong or right in a professional context

2. **Each exercise should have at least 2 variations.** The same exercise with different evaluators (e.g., a PostgreSQL DBA vs. a distributed systems engineer) produces meaningfully different evaluations. This prevents the exercise from feeling repetitive if the creator hits the same one twice (which shouldn't happen with the 6-month window, but variations add depth anyway).

3. **The `topics` field on `Exercise` must be specific.** "databases" is not useful. "PostgreSQL, transaction isolation, MVCC" is. These topics become the Phase 2 weak-areas analysis. Seed them properly from the start.

4. **WHITEBOARD exercises are the hardest to evaluate well.** The sensei is evaluating a Mermaid diagram + the developer's reasoning. The `ownerContext` for WHITEBOARD kata needs to include explicit instruction on what to look for: "Evaluate whether the developer considered X, Y, Z — not whether the diagram is technically correct." Start with 1-2 WHITEBOARD exercises and iterate.

---

### Lucía Navarro — Product Workflow

**On the overall plan:**

The phasing in PRD-003 is correct. The critical path is clear. The one thing I'd emphasize: **the creator doing one kata per day for 2 weeks is more valuable than building Phase 1 immediately.** Real usage will surface edge cases that no amount of planning catches.

**On the PRD process itself:**

These five PRDs have produced enough clarity to write specs for everything in sprint-002. The open questions are documented and labeled. The assumptions are explicit. This is the right level of exploration — enough to move forward without over-specifying.

**One thing to track actively:** The Anthropic adapter's prompt engineering (Yemi's concern). This is the highest-risk item in the sprint — not because it's technically hard, but because the output quality depends on prompt iteration that can't be fully automated or planned. Reserve time for real prompt testing before declaring the adapter done.

---

## Summary: what was validated

| Decision | Verdict | Notes |
|---|---|---|
| "No skip, no reroll, no pause" | ✅ Keep | This is the product — do not soften |
| Streak counts any completed session | ✅ Align | `needs_work` counts toward streak (showing up matters) |
| Invite-only model | ✅ Keep | Frame it as practitioner curation, not quality control |
| 3 kata types (CODE/CHAT/WHITEBOARD) | ✅ Keep | Distinct skill dimensions |
| `MockLLMAdapter` with streaming simulation | ✅ Add | Needed for frontend dev velocity |
| WebSocket reconnection handling | ⚠ Add | Tomás: critical UX, needs `{type:"reconnect"}` message |
| Server-side timer enforcement | ⚠ Add | `submittedAt > startedAt + duration * 1.1` → 408 |
| `is_creator` as env var (Phase 0) | ✅ Keep | Add DB column in Phase 1 |
| WHITEBOARD defer from sprint-002 | ✅ Defer | Connect Drawhaus in Phase 1 |
| "+N positions" stat on results screen | ⚠ Skip in Phase 0 | No leaderboard data yet |
| Prompt engineering before adapter | ⚠ Critical | Test prompts before wiring WebSocket |
| `topicsToReview` specificity in prompts | ⚠ Add to prompt | "Specific technical concepts, not general areas" |

---

## What was missed in the original design

| Gap | Who flagged | Recommendation |
|---|---|---|
| Reconnect message in WS protocol | Tomás | Add `{type:"reconnect", attemptId}` to PRD-002 |
| Server-side timer validation | Tomás | Add to `SubmitAttempt` use case |
| Prompt engineering as first step | Yemi | Write test script before wiring WS |
| Streak counts `needs_work` | Priya | Explicit product decision — any completed session |
| `topics` field vocabulary alignment | Darius | Align exercise `topics[]` with LLM `topicsToReview[]` |
| Mood/duration → filtering must be meaningful | Priya | Make filter logic visible in UX |
| Concurrent WS connection limit | Marta | One active stream per user |
| Session resume from dashboard | Soren | Dashboard today card should detect active session |
| 1-2 trusted beta users before Phase 1 | Amara | Recruit before announcing |

---

## Next step

- [ ] Update PRD-002 with reconnect message type and concurrent WS connection limit
- [ ] Add server-side timer enforcement to the `SubmitAttempt` use case spec
- [ ] Create `scripts/test-llm.ts` before implementing the Anthropic adapter
- [ ] Decide: streak counts `needs_work`? (Owner decision)
- [ ] Add `session resume` flow to Dashboard screen notes
- [ ] Advance this to a recommendation document for sprint-002 planning
