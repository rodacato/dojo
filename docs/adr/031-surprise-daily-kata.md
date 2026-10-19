# ADR-031: One surprise kata a day, the picker under Advanced
**Status:** accepted
**Date:** 2026-10-19

## Context
Used daily, the loop felt slow, and the bottleneck was not typing: the muscle that atrophies when AI writes the code is reading and judging it. The entry contradicted VISION.md as well. `/katas` showed three kata to choose from, a reroll in disguise ("No reroll on today's kata"), and its mood picker was accepted by `GET /katas` and never used. No kata ran under 10 minutes, so shortening durations alone could not make a daily habit. Issue #193 carries the trigger and the panel.

## Decision
- **The dashboard leads with today's kata, blind** (D53): about five minutes, one primary action, the topic revealed when it opens. The pick is fixed per learner and day on the server (`domain/practice/daily-kata.ts`), so leaving and coming back is not a reroll.
- **Today's kata comes only from micro kata**, published kata of `MICRO_KATA_MAX_MINUTES` (5) or less. It prefers kata not practiced in six months and repeats rather than give nothing.
- **After it, one more** (D54): the done state offers another surprise micro kata, never one practiced that day.
- **The picker becomes Advanced** (D56): duration, type and language in, one kata out, no list. The mood picker is gone.
- **Practice preferences live in Settings** (D57) and weigh both picks; full randomness ignores them.
- **A micro kata declares its answer shape** (D52). The pilot ships *point*: tap the line, then say why, and the why is what the sensei grades.

## Alternatives Considered
- **Shorter durations on the existing formats:** a 5-minute free-text review spends the time typing on a phone, and the sensei has to guess which line was meant.
- **Closed for the day after one kata** (D54 A): purer, but it slows down the days the learner wants more.
- **Filters with three picks in Advanced** (D56 B): choosing among three is the reroll again.

## Consequences
The daily habit depends on micro kata content, which is harder to write well than a long kata. Ten mediocre ones would kill the format, and a pilot with too few repeats within days. "One more" is open-ended, and every kata spends the operator's LLM tokens. Rollback is cheap: long kata and the picker stay intact under Advanced, and the dashboard can point back to them.

## Open questions
- **Whether five minutes holds** is what the two-week trial in #193 measures. The nightly generator waits for it.
- **Sensei calibration for three-sentence answers** (single pass, no follow-up) is unverified on real answers.
