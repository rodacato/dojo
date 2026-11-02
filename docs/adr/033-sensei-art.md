# ADR-033: The sensei on the review screens
**Status:** accepted
**Date:** 2026-11-02

## Context
The Paper prototype puts a cut-paper sensei on the review screens. D71 kept post-kata surfaces quiet because they are seen after every kata, and the revamp plan held this art back for that reason. The owner decided to ship it.

## Decision
- **Two poses, small:** `review` beside the waiting message and `explain` beside the verdict.
- **The pose never depends on the verdict.** PASS, PASS WITH NOTES and NEEDS WORK all get `explain`, and `review` only shows before a result exists, so the art cannot predict or soften one.
- **Decorative only:** hidden from assistive technology, outside the evaluation stream, and gone if the image fails.
- **D71 is superseded for these two placements.** Follow-up chat bubbles and the other four poses stay out. The brand exception widens to these two placements only.

## Alternatives Considered
- **Keep it out:** the plan's recommendation, overruled by the owner.
- **Verdict-specific poses:** more expressive, but a sensei who reacts adds a judgment the written review did not make.
- **All six poses as a canvas sprite:** 2 MB for four poses with no placement.

## Consequences
- A figure now appears after every kata, which D71 warned could wear thin.
- The art carries the same rights uncertainty as the belts art ([PROVENANCE.md](../../PROVENANCE.md)).
