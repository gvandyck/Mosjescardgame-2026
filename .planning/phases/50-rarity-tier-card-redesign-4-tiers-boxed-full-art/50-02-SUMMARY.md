---
phase: 50-rarity-tier-card-redesign-4-tiers-boxed-full-art
plan: 02
subsystem: ui/cardV1
tags: [rarity-tiers, tier-4, full-art, holo]
requires: [50-01]
provides: [tier-4 full-art face, getAbilityTextSize, getTierFadeHeight, buildTierChrome, buildShineLayers]
key-files:
  created: [src/ui/cardV1/buildTierChrome.js, src/ui/cardV1/buildShineLayers.js, src/ui/cardV1/getAbilityTextSize.js, src/ui/cardV1/getTierFadeHeight.js, styles/card-tiers-fullart.css]
  modified: [src/ui/cardV1/buildFaceV1.js, src/ui/cardV1/buildCardV1.js, src/ui/cardV1/isTierLayoutEnabled.js, styles/card-tiers.css, game.html, test-game.html, card-tiers-demo.html, src/ui/cardTiersDemo.js, tests/ui/card-tiers.test.ts]
decisions:
  - "Window layer order follows CardTiers7/8 source: art, bottom fade, top fade, holo, sweep, 3 glints (shine ABOVE fades)"
  - "Footer positions use D-06 (badge bottom 22, traits 85, desc 122), inherited from card-v1.css, not the plan's handoff numbers"
status: awaiting-visual-approval
completed: 2026-10-04
---

# Phase 50 Plan 02: Tier 4 full art Summary

Super-rare (4-star) cards now render full art in a uniform 18px black frame with a holographic colour wash, a light sweep and 3 glints; IMPLEMENTED_TIERS = {4}.

## Tasks
| Task | Commit | Notes |
|---|---|---|
| 1 Markup + rules (TDD) | b80becd | tests + implementation in one commit (no separate RED commit) |
| 2 CSS + demo | ef03c58 | includes screenshots in shots-50-02/ |
| 3 Approval gate | - | STOPPED, waiting for Gandalf |

## Layer order (confirmed from source)
CardTiers7.dc.html line ~84-87 and CardTiers8.dc.html line 82: inside the window, `img`, bottom fade (380px), top fade (150px), then `.holo4`, `.sweep4`, three `.glint4`. So the shine sits ABOVE the fades. The plan's default order (shine below fades) was replaced by the source order, and the test asserts the source order.

## Verification
- node --check (CLAUDE.md list + demo + all src/ui/cardV1/*.js): clean
- npm test: 82 files, 801 tests passed
- Tiers 1-3 face html byte-identical to the pre-plan builder (390 card x tier cases, ad-hoc script)
- Playwright measurements at 440/240/160: window inset 18u on all 4 sides (18 / 9.81 / 6.53px); badge on tiers 1-4 transparent, 0 border, no shadow, 0 radius, 80u x 80u at right 10u / bottom 22u (D-06)
- Edge-case Mosje traits line right edge 330px from the left at 440, no badge overlap; Place has no badge and its info right bound is 42u; art-less Piecie shows the placeholder gradient + shine, no img
- Reduced motion: glint animation none, opacity 0.8
- Field tiles: before/after screenshots look identical (byte diff from PNG encoding only)
- `card-v1--field` count in both tier CSS files: 0

## Deviations
1. [D-06] Badge bottom 22u, traits 85u, ability text 122u (the plan said 12/77/114). These positions are inherited from card-v1.css; tier CSS only removes the box, so the hand-strip overrides in card-v1.css still work.
2. [Rule 1] Text-position and badge-position overrides were dropped from the tier CSS, because their higher specificity would have broken the hand-strip layout.
3. The card data has no Mosje with 4 traits; the edge case shows the Mosje with the most traits (3).
4. The "no nickname" and "very long name" pickers both landed on Gandoe, because Mosje names are stored as "[X] Nick". The pickers need fixing in 50-03.
5. Tests read class lists from the html strings, because vitest has no DOM here.

## Not done (for the gate)
- In-game hand screenshot not captured (it needs a seeded game session). Recommend doing it during the review.
- Side-by-side comparison with the Tiers 8 board PNG is left to visual review.

## Screenshots
.planning/phases/50-rarity-tier-card-redesign-4-tiers-boxed-full-art/shots-50-02/: grid-440/240/160.png, t4-mosje-440.png, t4-type1..6-440.png, closeup-frame-bottom-right-440.png, closeup-frame-top-left-440.png, edge-cases-440.png, shine-frame-1..3.png, reduced-motion-440.png, field-before.png, field-after.png

## Self-Check: PASSED
