---
phase: 62-2-0-card-faces
plan: 01
requirements-completed: [UI-04, TEST-04]
commits: [6fb57fa, 3f5c869, ca51881]
duration: ~20min
---
# Phase 62 Plan 01: Card data, face helpers, frame tier Summary
**`needsText` (16 cards) and `synergyLabelText` (14 Mosjes) guarded against the Card List; 6 pure 2.0 face helpers; Mosjes always full art via `getFrameTier`, diamonds show the rules rarity.**
- Red first (recorded): needs-text 3/4 failed, synergy-label-text 2/3, helpers file would not load, A10 8/10 failed; all green after. `npm test` 173 files / 2152 tests green; `node --check` clean per file; headless card-tiers + quest-card-tiers + cardv1-mosje 48/48, card-text-fits, hover-dock, cardv1-hand green.
- Contrast by construction (asserted): white on tint .60 over white art 5.5:1, dim rows (.55 on .80 block) 4.8:1, control .40 tint 2.8:1. Removed `isTierLayoutEnabled.js` + `getRarityTier.js` (planned); `data-cv1-diamonds` centres diamonds; `?tiers=` no longer changes a face.
- Deviation (Rule 3): `card-text-fits.spec.js` boxed floor `>100` is now `>90` plus exact `boxed === non-Mosje frame tier 1-3` (Mosjes have no plate any more, count fell to 97; the text-fit check itself is unchanged).
- Test scoping: Piecie-label test covers the 73 Card List Piecies (`piecie_mp_adjuster` is a disabled dev tool without tag/group); synergy id check covers the 32 Card List Mosjes.
- cardv1-hand at 230 px now collides only on piecie_bowie_stormey, piecie_tony, piecie_gekke_vogels (the two Martin Mosjes are fixed by the full-art frame); 180 px: 12 ids; 338/386 clean. Piecie fix = 62-03.
- KNOWN GAP: none. Left behind: gitignored `test-results/` (1 file; `rm -rf` was denied). Phase 50 shots PNGs were already modified before this plan, not committed.
