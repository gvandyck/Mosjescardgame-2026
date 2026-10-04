---
phase: 50-rarity-tier-card-redesign-4-tiers-boxed-full-art
plan: 01
subsystem: ui/cardV1
tags: [rarity-tiers, card-frame, demo]
requires: []
provides: [getRarityTier, isFullArt, isTierLayoutEnabled, getTierAttributes, card-tiers.css tokens, card-tiers-demo.html]
affects: [src/ui/cardV1/buildCardV1.js, src/ui/cardRenderer.js, game.html, test-game.html]
tech-stack:
  added: []
  patterns: [per-tier rollout gate (IMPLEMENTED_TIERS set + ?tiers=all|off)]
key-files:
  created: [src/ui/cardV1/getRarityTier.js, src/ui/cardV1/isFullArt.js, src/ui/cardV1/isTierLayoutEnabled.js, src/ui/cardV1/getTierAttributes.js, styles/card-tiers.css, card-tiers-demo.html, src/ui/cardTiersDemo.js, tests/ui/card-tiers.test.ts]
  modified: [src/ui/cardV1/buildCardV1.js, src/ui/cardRenderer.js, game.html, test-game.html, tests/ui/card-v1-mosje.test.ts]
decisions:
  - "Tier-layout CSS scoped to .card-v1--full.card--tierlayout only; field tiles never change (coordinator plan-check note a)"
  - "IMPLEMENTED_TIERS starts empty; later plans add 4, then 1, 2, 3"
metrics:
  completed: 2026-10-04
  tasks: 2/3 (task 3 = human visual gate, pending)
---

# Phase 50 Plan 01: Tier foundation + demo grid Summary

Every v1 card now carries `card--tier-N`, `card--boxed|card--fullart` and `data-tier` (from its star count), behind a per-tier on/off gate that is off for all tiers, plus scoped CSS tokens and a 6 types x 4 tiers demo page.

## Commits
- bdc227f test(50-01): failing tests for tier helpers (RED)
- f18b156 feat(50-01): tier helpers + tier attributes on card root (GREEN)
- b0e6b1c feat(50-01): tier CSS tokens + demo page
- 8b69620 fix(50-01): demo page scroll + review screenshots

## Verification
- `node --check` (main.js, modalManager, boardRenderer, handRenderer, logRenderer, actionAnimations, cardRenderer, cardTiersDemo): clean
- `npm test`: 82 files, 793 tests, all passing
- Playwright (temporary spec, not kept): demo shows 24 cards, all with `card--tierlayout`; game shows 8 v1 cards with `data-tier`, 0 with `card--tierlayout`. So the game looks the same.
- Screenshots: `screens/50-01-demo-grid.png`, `screens/50-01-game-hand.png`
- Smoke/Playwright full suite not run (the 2 known smoke.spec.js log-growth failures are pre-existing on main)

## Answers for later plans
- `@property --holo-angle` (styles/cards.css:246) **can be reused** for foil rotation: `<angle>`, `inherits: false`, global registration. Caveat: `.card.playable-now::before` already animates it, so 50-04 should use the property on a different element/pseudo (or register its own `--foil-angle`) to avoid clashing with the playable glow.

## Deviations from Plan
1. **[Coordinator note a]** Token CSS scoped to `.card-v1--full.card--tierlayout` (not `.card-v1.card--tierlayout`), so field tiles keep their shadow/outline.
2. **[Coordinator note b]** The "face unchanged" test compares face HTML against `buildFaceV1` / `buildFieldFaceV1` output, full and field mode. `tests/ui/card-v1-mosje.test.ts:133-134` pinned the exact root className; updated to include the new tier classes (the only change to existing tests).
3. **[Rule 1]** main.css locks body height, which cut the demo off after 2 rows; the demo page now overrides it (demo only).

## Carried-forward conflicts (not fixed here, per plan)
- E1 window inset 18/18/18/40 vs brief tier-4 uniform 18 (50-02)
- E1 3 diamonds at top 6 vs brief 4 diamonds at top 22 (50-02/03)
- E1 striped side marks vs vertical "OBBY CARD GAME" text (50-02/03)
- `.card.card-v1` 1px outer outline: removed only for full-face tier-layout cards
- buildUnifiedCardHTML still prints stars on the face (50-05)
- Tiers 7 (Alyssa) board exists at docs/design/rarity-tiers/source/CardTiers7.dc.html; treated as Mosje visual truth

## Checkpoint
Task 3 (Gandalf approves the demo grid) is **pending**. Do not start 50-02 without approval.

## Self-Check: PASSED
