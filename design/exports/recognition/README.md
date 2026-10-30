# Recognition — renders

Pixel direction (D66). These files are embedded by artboards rather than redrawn on the canvas.

`belts-practitioner-*.png` and `result-piece-*.png` are the canvases of `PractitionerSection` and `PieceReceipt`, captured from the running app in the sumi theme. They feed `app-core · Belts / Populated` and `kata · Post-kata / Mobile / Result · new piece`. Regenerate them from the app when the art in `apps/web/src/lib/practitioner/art.ts` changes.

The practitioner shipped in #229; its proposed desktop artboard was replaced by the real section in `Belts / Populated`. The rest of the proposal (the dojo, the furnished room, the collection, piece detail, the comeback and the share card), its prototype renders and the prototype itself were removed unbuilt on 2026-10-30, to be redesigned. The Preserve direction (D63) that preceded it was removed; its artboards and exports remain in git at `fd3a36e`.

