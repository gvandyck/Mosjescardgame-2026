---
phase: 62-2-0-card-faces
plan: 05
requirements-progress: [UI-04, TEST-04]
commits: [43d3f42, d7ff897, f943324]
---
# Phase 62 Plan 05: 2.0 field tiles Summary
**`buildFieldTile` + `buildFieldTileStats` draw one 2.0 tile for every card type: Mosje (name + nickname line, L chip, POWER / MP boxes, temp MP big with the real MP small), Piecie / Snelle / Place (type pill + STAYS chip, no cost), Quest (need, WIN / LOSE, 2 fail pips); `hoverZoom` and `readOwnedMosjes` read the tile hooks.**
- Red first (recorded): 24 tile tests failed (new `card-field-tile-2-0.test.ts` + rewritten mosje / piecie / snelle / quest its) and `card-tiers.test.ts` failed to load (`buildFieldTile.js` missing). After: `npm test` 177 files / 2235 tests green; `node --check` clean per file; headless 1920x1080 all green: mosje 5, board 2, activate-btn 1, field-tile-no-overlap 3 (1600 / 2200 / 2560), facedown 1, quest-card-tiers 16, cardv1-quest 2, piecie, snelle, place, card-tiers, hover-dock, card-text-fits, cardv1-hand (230 px check intact), card-chains, mosje-cards-2-0 tactician + alyssa 5.
- Removed: `buildFieldFaceV1.js`, `formatCost.js`, spec keys `fieldPill` / `badge`, hoverZoom's dead `.uc-mp` and `.cv1-pill` branches. hoverZoom docking untouched (only reads `data-cv1-mp / level / power`; the level-2 hover case lights row 2). `data-cv1-mp` is the REAL MP even when a temp MP is shown.
- Deviations: (Rule 2) tile collision checks also added to cardv1-piecie / snelle / place / quest galleries (240 and 120), `faceZones.js` got a tile branch (name, L chip, Power, MP, pills, need, WIN, LOSE, pips, Activate button), activate-btn spec now checks the button against every tile zone; (Rule 1) the spec caught an unscaled name block (strut at 16 px collided with the Quest need at 120 / 150 px), fixed with a `--u` font-size; my own test fixes: tile "no chrome" check is `/\bct-/` because "object-position" contains "ct-", and one `level0-ok` marker for the Level 0 normalising assertion.
- DESIGN CALLS for Gandalf: Piecie / Snelle / Place tile names wrap to 2 lines (legacy behaviour; the plan said one line, nothing sits below until the pill row); a two-success need ("2× 4+") is 20 u not 24 u so it clears the die in the art.
- Still legacy by plan: Quest stacks on the board (`renderQuestStacks`, Phase 63) and Tactician `tempMp` wiring on the board (Phase 63); modal chips + `cardAudit.js` + unreferenced `buildFaceV1` (62-06). Tile pixel size and Fresh / Protected / HOLD badges stay Phase 63.
- Screenshots looked at (tests/ui/screenshots/cardv1/): mosje-field, mosje-field-120, piecie-field, quest-field, quest-tile, board-all-types, activate-btn, mosje-hover-l2. Left behind: the two Phase 50 shot PNGs `card-tiers.spec` rewrites (already modified before, not committed). Temp config and `test-results/` removed with `rm -r`.
- KNOWN GAP: none. UI-04 / TEST-04 not ticked (they close with the last plan of the phase).
