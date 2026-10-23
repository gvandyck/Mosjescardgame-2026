---
phase: 62-2-0-card-faces
plan: 02
requirements-progress: [UI-04, TEST-04]
commits: [8973bc0, 6e6e334, f5d4c32]
---
# Phase 62 Plan 02: 2.0 pop-up face and Mosje face Summary
**Shared `buildPopupFace` (cost corner, name, frosted text box with 3 level rows, Power / LVL / MP footer) drives every Mosje face from one `--u` token via `styles/card-face-2-0.css`; Mosje spec carries live level / mp / tempMp.**
- Red first (recorded): both new unit suites failed to load (`getTextBoxLayout.js`, `formatSynergyLabel.js` missing). After: `npm test` 175 files / 2175 tests green; `node --check` clean per file; headless 1920x1080: mosje 5/5, hand 17/17, board + tiers + spotlight 41/41, neighbours (hover-dock, card-text-fits, piecie/place/snelle, activate-btn, field-tile, quest-card-tiers) 19/19.
- 230 px: Mosje (35 cards), Snelle (20), Place (21) collision-free, both Martins fixed; Piecie (74) collides only on piecie_bowie_stormey, piecie_tony, piecie_gekke_vogels (62-03). 180 px is log-only (Piecie 9, Snelle 3 legacy collisions); 386 and 338 clean. Below 150 px one row (the lit one) shows.
- Clamp: no real Mosje clamps at 440 or 230 (estimate is conservative; the longest text fits at 14.5 with 3 rows), so fade + "..." + rows-stay is proven by a synthetic 10-clause Mosje (`mosje-clamped.png`). Detail view (`max-height: none`) with absurd text would grow over the name; no real card does.
- Deviations: hand spec keeps widths 386/338/230/180 per type (8cac3cd note); 230 enforced for Mosje/Snelle/Place and held to the 3 known ids for Piecie; face-2 text floor asserted as 11.5*w/440 (old >=5 px is 4.7 px at 180 by design); `buildFaceTextBox(spec)` has no size arg (the var lives on the root); extra class `cv2-name--wrap` for non-Mosje names; tier spec compares x/y/w/h at every rarity for Mosjes.
- Screenshots looked at (tests/ui/screenshots/cardv1/): mosje-popup, mosje-hover-l2, mosje-hand-230, mosje-clamped. Tint .62 / dim rows .55 unchanged from 62-01.
- Left behind: `src/ui/cardAudit.js` still measures legacy selectors (62-06); card-tiers.spec rewrote two Phase 50 PNGs (already modified before, not committed); temp config removed, `test-results/` removed with `rm -r` (`rm -rf` is denied).
- KNOWN GAP: none. UI-04 / TEST-04 not ticked (they close with the last plan of the phase).
