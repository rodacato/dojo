# ADR-034: Choose a kata, up to three options outside the daily
**Status:** accepted
**Date:** 2026-11-02

## Context
Advanced (D56, [ADR 031](031-surprise-daily-kata.md)) gave one kata inside the learner's filters and no list. Used daily, it was the wrong tool for the second kata of the day: the learner wanted a quick kata on a topic they cared about, two taps away, not a second surprise. Two defects sat under it. The daily pick read any session started today, so a micro kata done from Advanced closed today's kata and could change which one it was. And the options query limited joined kata×variation rows, so a kata with several variations could take more than one of its slots.

## Decision
- **`/katas` becomes Choose a kata**: maximum duration (5, 10 or 20 minutes), type and language in, up to three different kata out, the first one selected. Start is a separate tap; no session exists before it. It shows the kata that match and never pads to three.
- **The last constraints are remembered in the browser** and looked up again on the next visit, so the dashboard's "Choose a kata" link is one tap to the options and one to Start. Standing preferences stay in Settings (D57).
- **Each lookup is random** within the preference weighting, with kata not practiced in six months first and repeats filling what is left.
- **Today's kata is excluded from the options**, so choosing never spoils the surprise.
- **Only the daily entry makes today's kata.** Sessions started from it are marked `is_daily`; "one more" and the dashboard's "done today" read that mark, and today's pick reads only practice from before today.
- The daily loop of ADR 031 is unchanged. This supersedes D56 and ADR 031's "the picker becomes Advanced" for optional practice only.

## Alternatives Considered
- **Keep one kata per lookup** (D56 A): the reroll it avoided is the point here; the learner is choosing, not being surprised.
- **Remember the constraints on the server:** follows the learner across devices, but it is a preference by another name and would blur the line with Settings.
- **Infer today's kata from the pick instead of marking sessions:** the pick depends on practice history, which the chosen kata change, so it cannot be recomputed after the fact.

## Consequences
Kata longer than 20 minutes cannot be reached from the app until a longer mode is designed; they stay published. Every option list costs nothing, but every Start still spends the operator's LLM tokens. Rollback: drop the chooser for the D56 page; the `is_daily` column is harmless to keep.
