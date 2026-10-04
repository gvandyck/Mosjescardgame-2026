---
phase: 50-rarity-tier-card-redesign-4-tiers-boxed-full-art
plan: 03
subsystem: ui/cardV1
tags: [rarity-tiers, boxed, seigaiha]
requires: [50-02]
provides: [boxed layout tiers 1-2, seigaiha.svg, buildBoxedLayers, buildBoxedPlate]
key-files:
  created: [assets/patterns/seigaiha.svg, src/ui/cardV1/buildBoxedLayers.js, src/ui/cardV1/buildBoxedPlate.js, styles/card-tiers-boxed.css]
  modified: [src/ui/cardV1/buildFaceV1.js, src/ui/cardV1/getAbilityTextSize.js, src/ui/cardV1/isTierLayoutEnabled.js, game.html, test-game.html, card-tiers-demo.html, src/ui/cardTiersDemo.js, tests/ui/card-tiers.test.ts, tests/ui/card-v1-mosje.test.ts]
decisions:
  - "Inner-line break is 268-392 in card coordinates (board mask stops 262/386 are relative to the line's own top at inset 6)"
  - "Boxed ability text: 17 one-sentence Piecie/Snelle, 14 Mosje, 15 short 3-line, 13 when total text >= 360 chars"
  - "Plate wrapping split into its own file buildBoxedPlate.js (one function per file)"
status: awaiting-visual-approval
completed: 2026-10-04
---

# Phase 50 Plan 03: Boxed layout, tiers 1 and 2 Summary

1-star and 2-star cards now show boxed art (24/124/224) over a faint seigaiha wave frame, with a see-through description plate; tier 1 has a soft white 1px inner line, tier 2 a type-coloured 2px line. IMPLEMENTED_TIERS = {1, 2, 4}; tier 3 still E1.

## Tasks
| Task | Commit | Notes |
|---|---|---|
| 1 Markup (TDD) | f1d5f85 (RED), a4ba877 (GREEN) | seigaiha.svg has the same 447 scales as the board |
| 2 CSS + demo | ff9e8f9 | also fixes the two demo edge-case pickers |
| 3 Approval gate | - | STOPPED, waiting for Gandalf |

## Verification
- node --check (CLAUDE.md list + demo + all cardV1 files): clean
- npm test: 82 files, 806 tests passed
- Playwright at 440: window (24,124) 392x224, plate (24,366) 392x186 for all 6 types
- Name, nick, traits, pill, category, badge and 4 diamonds: identical (<=0.5px) across tiers 1, 2, 4 for all 6 types
- Badge on tier 1: transparent, 0 border, no shadow; backdrop-filter computes to blur(4px) brightness(2.1) contrast(1.15)
- Edge cases: traits right edge 330, badge starts 350 (no overlap); Place traits use the space (398); art-less cards keep the placeholder; no plate overflow, including the longest ability text
- Field tiles: look the same as in 50-02 (the screenshot is wider because the page was wider, so a byte comparison is not possible); `card-v1--field` count in boxed CSS: 0

## Deviations
1. [Rule 1] Demo pickers: "no nickname" now uses parseMosjeName (-> The Hacker), "very long name" uses the displayed name (-> Jantje Jantje... Jantje?). Before, both picked Gandoe.
2. [D-06] Footer at 30/22/54/85 as decided, not the board's 22/12/46/77. As a result the traits line sits about 13px under the plate instead of about 21px.
3. Hand-strip cards: the plate text keeps a minimum of 9px; the full hand-size check is part of 50-05.
4. Tests 'tiers 1-3 are E1' were narrowed to tier 3; card-v1-mosje className expectations now include card--tierlayout for tier 1.

## Not done (for the gate)
- In-game hand screenshot not captured (needs a seeded game session).

## Screenshots
shots-50-03/: t1-/t2-{fighting,digital,artistic}-mosje-440.png, t1-/t2-{piecie,place,snelle}-440.png, grid-240.png, edge-cases-240.png, overlay-t2-vs-t4-piecie-440.png, fallback-no-backdrop-t1-piecie-440.png, field-after.png, board-tiers8.png, board-tiers7-alyssa.png

## Self-Check: PASSED
