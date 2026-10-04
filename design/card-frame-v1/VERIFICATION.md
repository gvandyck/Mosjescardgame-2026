# Card frame v1 — verification

Rendered from real game data (`src/data/mosjes.js` via `renderCard()`) in Chromium by
`tests/ui/cards/cardv1-mosje.spec.js`. Evidence: `verification/` (screenshots) and
`tests/ui/screenshots/cardv1/mosje-popup-metrics.json` (measured geometry).
Reference comparison: `verification/compare-mosje-popup.png` (left = reference, right = game),
`compare-mosje-field.png`.

## Mosje

Test cards: Alyssa The Bulldozer, Ronald The Master Chef, Jisca The Maestro, FPS Coert,
Dancing/DDR Chris, Parkour West The Flow Fighter, The Hacker, Gandoe The Unpredictable Wizard,
Ming The Natural, Ronald The Mastermind (plus one of each type colour). Modes: pop-up 440x660,
field 240x176, hand size 130px wide, board size 150px wide.

| # | Check | Result |
|---|---|---|
| 1 | Left edge: name, nickname, description, info, pill, border text all at x=42 | PASS (measured, all 11 cards) |
| 2 | Badge straddles art-window corner; fits 0, 5, 100+ | PASS (0, 10, 15, 60, 105 seen; unit test for 0/5/105). "Free" not applicable to Mosje. |
| 3 | No collision of description with name block / badge | PASS (min gap desc-to-name 272px; info line right edge 110px, clear of badge) |
| 4 | Longest text fits without clipping | PASS — Jisca (longest, 4 lines) fits at the default 14.5px, 24.6% of card height. No card was flagged overflowing. |
| 5 | Name block: no nickname / long first name / long nickname | PASS — FPS Coert, Dancing/DDR Chris (shrinks to 32.9px, one line), Gandoe "The Unpredictable Wizard" (longest nickname, one line). Field tile ellipsises long nicknames. |
| 6 | Type colour on pill, border text, badge label, middle diamond | PASS (Fighting orange, Digital teal, Artistic magenta; visual) |
| 7 | No blur, divider, brackets, wordmark, serif, flavour or rarity on the face | PASS (unit test asserts no flavour/"rarity"; fonts are Sora/DM Sans) |
| 8 | Hover panel | NOT DONE YET — phase 5 (shared hover panel) |
| 9 | Field mode: ellipsis, pill, badge | PASS (Place without badge: n/a, later) |
| 10 | Missing-art fallback | PASS — FPS Coert, Parkour West, The Hacker have no art in the data and show the type-coloured fallback with readable text. Broken image is removed by `onerror`. |
| 11 | Live values: MP and level follow game state | PASS — field tile showed 35 / L2, then 105 after `setMosjeMP`; hand/preview cards show Start MP and LVL 1 (see open question 2). |
| 12 | Side-by-side with reference | see below |

Interactions: ability button still works and is attached to the field tile (existing card
library suite 64 passed, see below). Hand click still opens the existing preview modal.

### Visible differences from `reference/card-system.html` (Alyssa, pop-up)
1. Description text differs: the reference shows paraphrased copy (3 effects); the game has one
   ability + one synergy line ("Unstoppable (comeback): ..."). Card text was NOT changed.
2. Trait order: reference "Physical · Social · Resilient"; game follows data order "Physical ·
   Resilient · Social". Not reordered (no reordering of card data).
3. Synergy text ("While [Jisca] ...") is rendered as an extra description paragraph (confirmed by Gandalf).
4. Description block sits ~10px lower in the game than the reference because of the line count (4 vs 5 rows); the bottom anchor (114px) is identical.
5. Field tile: matches the reference; at board size (150px wide) the tile is 110px tall, much shorter than the old portrait field card.
6. Fonts are self-hosted (assets/fonts/Sora-Variable.woff2, DMSans-Variable.woff2, latin subset from fontsource via jsDelivr). The ★ glyph is not in either font and falls back to the system font, as in the reference.

### Tests
- `npm test`: 766 passed (21 new in `tests/ui/card-v1-mosje.test.ts`).
- `node --check` on the UI files: clean.
- Playwright `cards` project (whole card library): 64 passed, 9 skipped, 2 failed
  (`mosje-abilities`: mosje_amplifier MP_GAIN, mosje_binti_creator DRAW). The same 2 fail with
  `?cardv1=off` (old faces), so they are not caused by this change. Not investigated.
- `onfield-ability-clamp.spec.js` (visual) passes; its `.uc-ability` clamp check now only runs on
  the old face, because v1 field tiles carry no ability text.
