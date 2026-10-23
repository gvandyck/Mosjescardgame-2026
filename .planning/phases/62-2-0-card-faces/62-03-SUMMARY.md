---
phase: 62-2-0-card-faces
plan: 03
requirements-progress: [UI-04, TEST-04]
commits: [ff0defb, 31a7458, 1d6f4f1]
---
# Phase 62 Plan 03: 2.0 Piecie and Snelle faces Summary
**Piecie and Snelle run on the shared `buildPopupFace`: Energy cost corner (Blensen! "4 or free"), "Needs: <needsText>" info line with that lead dropped from the text box, tag-first label + STAYS chip, SNELLE "Instant · any turn"; V4 `getRequirementText` / `getPiecieCategoryLabel` removed.**
- Red first (recorded): 20 of 35 failed on the legacy faces (Needs line, label, cost corner, STAYS, escaping, A10 cost 0 / tag-first), the 15 kept tests stayed green. After: `npm test` 175 files / 2185 tests green; `node --check` clean per file; headless 1920x1080: piecie 4/4, snelle 1/1, hand 17/17, card-tiers 38/38, card-text-fits + hover-dock 4/4, card-play filters (bowie, tony, dikke taks, blensen, lucky coin) 10/10, board / field-tile / activate-btn / piecie-activate / snelle-reaction neighbours green.
- 230 px Known gap CLOSED: `cardv1-hand` enforces `width >= 230` again for all four types; piecie_bowie_stormey, piecie_tony, piecie_gekke_vogels are clean (all types also clean at 180). `styles/card-face-2-0.css` needed no change: 62-02's boxed rules already give text box 366..552 and info / pill / label bottoms 85 / 54 / 30 (a wrapping Needs line shortens the box); the specs now pin those numbers.
- Deviation (Rule 3): `card-text-fits.spec.js`, `hover-dock.spec.js`, `card-tiers.spec.js` / `.test.ts` measured the legacy plate / `.cv1-pill`; rewritten to the 2.0 markup (text stays in its box, unflagged overflow fails, the box never covers the art window, clamped set pinned to `piecie_bowie_stormey`, dock must hold the whole description). `windowOf` in card-tiers.test.ts now also stops at `.cv2-corner`.
- DESIGN CALL for Gandalf: Bowie & Stormey (383 chars) is the one Piecie/Snelle whose text clamps (fade + "...") at every size. The 2.0 box (186 high, line-height 1.5, floor 11.5) is smaller than the old plate (line-height 1.26), so the hover dock shows it clamped (full text is in the modal panel). A tighter line-height step before clamping would fit it; I kept the locked UI-SPEC (D-02) and did not change it.
- Still legacy by plan: field tile (62-05; it now shows the first sentence after the dropped Needs lead) and the modal chips "Requires level2" / "Free" (62-06).
- Screenshots looked at (tests/ui/screenshots/cardv1/): piecie-popup, piecie-hand-230, snelle-popup. Left behind: the two Phase 50 shot PNGs that `card-tiers.spec` rewrites (already modified before, not committed). Temp config and `test-results/` removed with `rm -r`.
- KNOWN GAP: none. UI-04 / TEST-04 not ticked (they close with the last plan of the phase).
