# Running the sensei on SheLLM

The sensei needs a streaming LLM endpoint. There are two ways to give it one. This page covers the
second: [SheLLM](https://github.com/rodacato/SheLLM), which exposes an operator's own Claude or
ChatGPT subscription as an OpenAI/Anthropic-shaped REST API. Written against SheLLM v1.18.0.

## Pick a path

| | Direct API | SheLLM |
|---|---|---|
| Cost | Per token, billed to an API account | The subscription you already pay for |
| Who it suits | Any instance, any number of users | One operator, one small group of known people |
| Latency | First token in about a second | A CLI spawns per request: about 0.9 s cold start, then streams |
| Failure mode | Rate limits, billing | Rate limits of the plan itself, account-level anti-abuse flags |
| Dojo config | `LLM_BASE_URL` of the provider | `LLM_BASE_URL` of your SheLLM |

**Use direct API** for anything public or invitation-open to people you do not know. SheLLM's own
fair-use note discourages multi-tenant and batch use, and a flagged account takes the whole
subscription with it. **Use SheLLM** for a personal or small-group instance, where evaluation
volume stays human-sized.

Dojo cannot tell the difference: both are an `LLMPort` adapter pointed at a base URL.

## Configure dojo

SheLLM serves both formats, so either adapter works. `anthropic` is the one used in the examples
below; nothing in dojo requires it.

```env
LLM_ADAPTER_FORMAT=anthropic
LLM_BASE_URL=https://shellm.example.com     # a trailing /v1 is accepted and dropped
LLM_API_KEY=shellm-...                      # created in SheLLM's /admin/keys, one per app
LLM_MODEL=claude                            # the CLI's own default model, see below
LLM_STREAM=true
```

With `LLM_ADAPTER_FORMAT=openai` the base URL is the same host, and dojo appends `/v1/chat/completions`.

In a Kamal deploy these are the same `LLM_*` names listed in [deploy.md](deploy.md); nothing new to
wire.

### Model names are not Anthropic's

`LLM_MODEL` defaults to `claude-opus-4-6`, an Anthropic API id. SheLLM passes any `claude-*` id to
the CLI unchanged, so that works only while the CLI accepts it, and a name it refuses comes back as
404 `model_not_found`. Use the CLI's own names instead, which survive model retirements. `claude`
lets the CLI pick its default model, so a retirement never reaches dojo's config at all:

| Value | Runs |
|---|---|
| `claude` | the CLI's default |
| `claude-sonnet`, `claude-opus`, `claude-haiku` | that tier, on the 1M-context variant where the account has one |
| `codex`, `codex-<model>` | ChatGPT through the Codex CLI |

`GET $SHELLM_BASE/v1/models` lists what your instance can actually run.

## What dojo relies on, and what SheLLM does with it

Checked against SheLLM's compatibility guide and the changelog.

| Dojo behavior | SheLLM behavior | Consequence |
|---|---|---|
| `max_tokens` on every call (256 to 2048) | Validated, then ignored: no CLI has a cap flag | Length is bounded by the prompt only. Dojo's prompts already say how long to be |
| Streaming sensei verdict | SSE with a keepalive comment while the model is silent (v1.16.0) and a killed stream reported as an error, not as a finished answer (v1.16.1) | Both adapters now fail a stream that carries an error event or ends without its terminator, so a truncated session body or answer is never saved as complete |
| Plain text messages, no `tools` | `tools` or a forcing `tool_choice` is a 400 since v1.18.0 | Not a problem today. Any future dojo feature that uses function calling cannot run on SheLLM |
| Request timeout 90 s on every call, one retry in the Anthropic SDK | A request waits in a queue when the CLI slots are full (4 concurrent by default since v1.9.0); a full queue is a 429. A client that aborts frees its slot within about a second | A burst of evaluations queues, then times out at 90 s. Keep `MAX_CONCURRENT` above your realistic concurrent kata. The SDK's retry of a queue-full 429 costs no quota, since a rejected request never starts a CLI |
| Token usage logged from `message_start` and `message_delta` | `message_start` carries an estimate, `message_delta` the CLI's real counts | The `askSensei` usage promise settles on real counts; do not read usage from the first event |
| Reasoning | Both models reason before answering and nothing streams meanwhile. `GET /v1/models` reports `default_reasoning_effort` per model (`high` for `claude-sonnet` on the instance tested) | The first token takes longer than the cold start alone. `reasoning_effort` exists on the OpenAI endpoint only, and dojo's `openai` adapter does not send it yet, so today the server's setting decides |

## Operating it

- **Key per app.** Create a dedicated key for dojo so it can be rotated alone.
- **Reachability.** Put SheLLM on a private network or a tunnel; do not expose `/admin`. If dojo and
  SheLLM share a host, point `LLM_BASE_URL` at the internal address. This is the same posture as
  [SECURITY.md](../../SECURITY.md) asks for any self-hosted LLM endpoint.
- **Provider login expires.** SheLLM's unauthenticated `/health` only answers `{"status":"ok"}`; the
  login state of each provider is in its admin dashboard. A logged-out CLI surfaces in dojo as a
  failed generation (SheLLM documents it as a 503 `provider_unavailable`; not triggered here), so watch the dashboard.
  Dojo's own `/admin/health` only reports whether `LLM_API_KEY` is set, not whether the upstream works.
- **Rate limits are the plan's.** SheLLM reports a limit only after a provider refuses a request;
  it cannot tell you the remaining quota. If evaluations start failing late in the day, that is the
  first suspect.

## What was measured

Run on 2026-10-02 against SheLLM v1.18.0 with `claude-sonnet-4-6` and `claude-sonnet`, using dojo's
real `AnthropicStreamAdapter` and a real first-turn evaluation prompt. Single samples, not a benchmark.

| Check | Result |
|---|---|
| `/health`, `/v1/models` | 200; Claude and Codex models listed with limits |
| Anthropic stream, OpenAI stream | 200; `message_stop` and `[DONE]` arrive; usage included |
| `evaluate`, `generateSessionBody`, `nudge`, `askSensei` through the adapter | all complete; verdict parses; `askSensei` usage resolves with real counts |
| `tools` in the request | 400 `invalid_request_error` |
| Unknown `claude-*` model | 404 `not_found_error` |
| No key | 401 in the endpoint's own error shape |
| `max_tokens: 8`, 60 words requested | all 60 words returned: the cap is ignored |
| 8 parallel requests | 8 × 200; 5 started at once, 3 queued for about 2 s |
| Evaluation prompt, first token | about 2.8 s on `/v1/messages`; about 1.8 s with `reasoning_effort: low` on `/v1/chat/completions` |
| Evaluation prompt, total | about 20 s default; about 15 s with `low` |
| Input cost of a one-word reply | about 6.5k tokens: the CLI's own context counts against the plan on every call |
| `LLM_MODEL=claude` (CLI default) through the real adapter | all four methods complete; first chunk about 2.3 s, evaluation about 16 s |
| OpenAI adapter with a base URL ending in `/v1` | all four methods complete |
| 5 long streams aborted at 2 s, then a short stream | served in 3.1 s with 0.5 s queued: aborting frees the slot |
| 18 simultaneous requests | 14 × 200, 4 × 429 `Queue is full` |

### Where SheLLM differs from the real APIs

Probed on the same day against production. "Real API" is the documented behavior of Anthropic's and
OpenAI's endpoints.

| Behavior | Real API | SheLLM | Matters to dojo? |
|---|---|---|---|
| `max_tokens: 5`, ask for 30 numbers | Stops at 5 tokens, `stop_reason: max_tokens` | Returned 215 tokens, `stop_reason: end_turn` | Length is bounded by the prompt only |
| `stop_sequences: ["7"]` | Stops before the 7, `stop_reason: stop_sequence` | Ran past it, `stop_sequence: null` | No, dojo sends none |
| 429 on a full queue | Carries `Retry-After` | Correct `rate_limit_error` body and `x-request-id`, **no `Retry-After`** | SDK retries on its own short backoff. SheLLM's guide says to honor `Retry-After`, so this one is worth investigating |
| `default_reasoning_effort` of `claude-sonnet` | n/a | `high` in `/v1/models`; SheLLM's guide says the server default is `medium` | Sets how long the first token takes |
| Anthropic `usage.input_tokens` | Excludes cached input | Same: 183 for a call whose real input was about 6.7k | Logged cost undercounts input on this path. The OpenAI path reports the full count (9201) |

Matches the real APIs, verified: top-level `system`, SSE event order on both endpoints, error body
shape and status for 400/401/404/429, `x-request-id` on errors, and `tools` refused with a 400.

Not verified: the shape of an error sent *inside* an already-started stream. It could not be
triggered on demand, so both adapters treat an error event and a missing terminator as failures.

Two anomalies did **not** reproduce and are not explained: one adapter `evaluate` run whose first
prose chunk took 18 s (34 s total), and one `reasoning_effort: low` request that streamed a first
chunk and then ran to the 300 s `TIMEOUT_MS` without finishing. Treat a verdict taking over 30 s as
possible; the 90 s adapter timeout is what bounds it.

## Verify the wiring

From the dojo host, before switching the instance over:

```bash
curl -s "$LLM_BASE_URL/v1/models" -H "Authorization: Bearer $LLM_API_KEY"
curl -sN "$LLM_BASE_URL/v1/messages" -H "x-api-key: $LLM_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"'"$LLM_MODEL"'","max_tokens":64,"stream":true,"messages":[{"role":"user","content":"Reply with one word: pong"}]}'
```

The second call should print `event: message_start` almost immediately and end with
`event: message_stop`. Then run one kata end to end and check the API log for the
`llm.request` / `llm.response` events with `baseUrl` set to your SheLLM.
