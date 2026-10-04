---
phase: 50-rarity-tier-card-redesign-4-tiers-boxed-full-art
plan: 04
subsystem: ui/card-faces
tags: [rarity, tier-3, foil, css]
requires: [50-03]
provides: [tier-3 boxed foil layout]
affects: [game.html, test-game.html, card-tiers-demo.html]
key-files:
  created: [src/ui/cardV1/buildFoilLayers.js, styles/card-tiers-foil.css]
  modified: [src/ui/cardV1/buildBoxedLayers.js, src/ui/cardV1/buildFaceV1.js, src/ui/cardV1/isTierLayoutEnabled.js, src/ui/cardTiersDemo.js, tests/ui/card-tiers.test.ts]
decisions:
  - "Tier 3 uses its own @property --foil-a (10s foilturn), not --holo-angle"
  - "Foil kept fainter than the board: wave tint opacity .6, cosmos .24 (board .32), rainbow sheen .10 (board .14), glow .12 (board .18)"
  - "Tier 3 plate backdrop brightness 2.5 (tier 2: 2.1) so the plate texture matches tier 2 without the extra plate wave copy"
status: awaiting-visual-approval
completed: 2026-10-04
---

# Phase 50 Plan 04: Tier 3 rainbow foil Summary

3-star cards now use the boxed layout with a thin (2px) moving rainbow foil inner line and art ring, faintly rainbow-tinted waves, and faint cosmos dots plus rainbow sheen in the art. IMPLEMENTED_TIERS = {1, 2, 3, 4}: all four tiers are live.

## Tasks
| Task | Commit | Notes |
|---|---|---|
| 1 Markup (TDD) | defc8f7 (RED), a95a71d (GREEN) | buildFoilLayers returns frame ring + window layers |
| 2 CSS + demo | 15b4ebc | card-tiers-foil.css linked after boxed CSS in game/test-game/demo |
| 3 Approval gate | - | STOPPED, waiting for Gandalf |

## Verification
- node --check (CLAUDE.md list + all cardV1 files + demo): clean
- npm test: 82 files, 808 tests passed
- CSS: "foilturn" and "--foil-a" present, "holo-angle" 0, "card-v1--field" 0
- Geometry at 440: art ring (19,119) 402x234, window (24,124) 392x224, inner line inset 6, plate (24,366) 392x186
- Cross-tier boxes (name, nick, traits, pill, category label, badge): 0px difference across tiers 1-4 for all 6 types. Diamonds: the first lit diamond moves 5px per tier because only the lit diamonds are shown, centred (by design, commit dc5bc5f)
- Plate texture, text hidden, mean luminance tier 2 vs 3: Fighting Mosje 39.70 vs 40.34; Piecie 39.53 vs 40.11; Snelle 39.53 vs 40.11 (within 2%; was 18% darker before the brightness fix)
- Busiest art (by contrast): Fighting Mosje (Gandoe), description stays readable
- Edge cases at tier 3 (4-trait Mosje, Place, art-less Piecie, no nickname, long name, longest text): no plate overflow, cosmos present also without art, traits end 20px before badge
- Field tiles: no ct- markup at any tier

## Deviations
1. [Faintness, per Gandalf's tier-4 feedback] Tint/sheen/cosmos/glow lower than board values (see decisions). Wave opacity stays .22 as specified.
2. [Rule 1] Plate looked 18% darker than tier 2 (tier 3 has no extra plate wave copy, as on the board); fixed with backdrop brightness 2.5 on tier 3.
3. Inner-line break done by nesting: the break mask sits on the .ct-inner wrapper and the foil ring (mask exclude/xor) is a child, as on the board. So markup is `.ct-inner--t3 > .ct-ring.ct-foil`, not `.ct-inner.ct-foil`. Safari risk: `mask-composite: exclude` / `-webkit-mask-composite: xor` and animated @property must be checked in the 50-05 WebKit pass.
4. Old tests that expected tier 3 = E1 were changed to `?tiers=off` / removed.

## Screenshots (shots-50-04/)
t3-{fighting,digital,artistic}-mosje-440.png, t3-{piecie,place,snelle}-440.png, alyssa-t3-440.png, busiest-art-t3-fighting-mosje-440.png, row-1234-piecie.png, plate-t2/t3-*.png, grid-440.png, edge-cases-440.png, field-after.png, board-tiers8.png, board-tiers7-alyssa.png, report.json

## Self-Check: PASSED
