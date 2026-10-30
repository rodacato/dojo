# Recognition — renders

Pixel direction (D66), with fictional example data. Two kinds of file live here, and both are embedded by artboards rather than redrawn on the canvas.

**Shipped, captured from the app.** `belts-practitioner-*.png` and `result-piece-*.png` are the canvases of `PractitionerSection` and `PieceReceipt`, captured from the running app in the sumi theme. They feed `app-core · Belts / Populated` and `kata · Post-kata / Mobile / Result · new piece`. Regenerate them from the app when the art in `apps/web/src/lib/practitioner/art.ts` changes.

**Proposed, rendered from the prototype.** The `pixel-*.png` files are renders of the interactive prototype [`brand/proposals/practitioner/index.html`](../../brand/proposals/practitioner/index.html), not running-app captures and not Pencil exports: the proposed artboards in `flows/kata.pen` and `flows/public.pen` embed these files. Regenerate them from the prototype; never redraw them on the canvas.

The practitioner shipped in #229; its proposed desktop artboard was replaced by the real section in `Belts / Populated`. The rest of the app-core proposal (the dojo, the furnished room, the collection and piece detail) was removed unbuilt on 2026-10-30, to be redesigned. The Preserve direction (D63) that preceded it was removed; its artboards and exports remain in git at `fd3a36e`.

| Flow · artboard | PNG |
|---|---|
| public · Share / Proposed · recognition card | [pixel-share-card.png](pixel-share-card.png) · 1200 × 630 |
| kata · Post-kata / Mobile / Proposed · comeback after NEEDS WORK | [pixel-result-mobile.png](pixel-result-mobile.png) · 390 × 1090 |

![Result with a new piece and a comeback](pixel-result-mobile.png)

