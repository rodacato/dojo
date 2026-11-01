# ADR-032: The belts room
**Status:** accepted
**Date:** 2026-11-01

## Context
`/belts` was a list of cards. The approved Paper direction turns it into your dojo: an illustrated room, physical belt specimens, and a ledger of practice moments. `design/brand/README.md` bans physical belts and wooden dojos, and D66 and D71 in `design/DECISIONS.md` kept the app core quiet, so the direction cannot ship under the written rules.

## Decision
- **The ban gets one exception:** the signed-in `/belts` room and its specimens. The mark, landing, share cards and every public surface stay under it. D66 and D71 are superseded for this screen only.
- **The pixel practitioner stays the editable identity.** The room's figure is a fixed illustration, shown only for belts that have art (white and green).
- **Belongings derive from earned pieces:** hachimaki to cushion, kasa to lantern, scarf to tea set, happi to bonsai. No migration and no new table. Seasonal pieces stay wearable only.
- **Nothing about the room is saved.** Earned objects are always in it; there is no placement.
- **Rank rules do not change.** The sensei's verdict never decides a belt, and the page shows the four factors with no remainder (PRD-031).
- **The art is AI-generated and MIT-licensed** with the repository. `PROVENANCE.md` records this.

## Alternatives Considered
- **Lifting the ban everywhere:** cheaper to write, but it opens the art to surfaces that define the brand.
- **Waiting for figures on all five belts:** blocks the room on art that does not exist.
- **Saved placement:** no use of the room has been observed to justify the storage.

## Consequences
- Yellow, brown and black show the room without a figure until art exists.
- There is one figure, so the room does not reflect how a user looks; the practitioner does.
- AI-generated images may carry weak or no copyright, so the MIT grant may give less than it does for the code.
