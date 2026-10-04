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
| 8 | Hover | PASS for Mosje — hover shows the enlarged full card (the Arena popup from ui/arena-hover-spotlight, merged in), live MP, click still opens the detail modal. No flavour/rarity on hover (Gandalf: enlarged card, not a text panel). See verification/mosje-hover.png. |
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

## Piecie

Test cards (real data, `tests/ui/cards/cardv1-piecie.spec.js`): Kannetje Melk (Free, short text),
Welloe Force (the only paid Piecie, 40), Stookerino, Leipe Swap, Call of the Welloes (longest
text, 3 paragraphs), Those Eyelashes Tho... (longest name), Ronald Kip (Lvl 2+), Super Saiyan Mos
(Attack), Bowie & Stormey (Pet Protection), Affoe (Substance), Keyboard (Digital Equipment),
Dumbbells (Physical Equipment), Pot of Weed (Utility). Modes: pop-up 440x660, field 240x176, hand
size 96px, board size 110px. Note: HANDOFF names "Emergency Swap"; no such Piecie exists in the data.

| # | Check | Result |
|---|---|---|
| 1 | Left edge: name, description, info, pill, border text all at x=42 | PASS (measured, 13 cards) |
| 2 | Badge straddles the art corner; value fits ("Free", "40") | PASS (measured: value and label fit inside the badge) |
| 3 | No text collides with badge, stripes or name block | PASS (description clear of name block and info line on all 13) |
| 4 | Longest text fits without clipping | PASS — Call of the Welloes (3 paragraphs) steps down to 14.5px and fills 22.8% of the card height. None flagged overflowing. |
| 5 | Name block: long name | PASS — "Those Eyelashes Tho..." shrinks to 25.4px on one line; Call of the Welloes 29.4px. No second line for Piecies. |
| 6 | Type colour (green) on pill, border text, badge label, middle diamond | PASS (pill measured rgb(21,128,61) = #15803D) |
| 7 | No blur, divider, brackets, wordmark, serif, flavour or rarity | PASS (unit test over all 74 Piecies: no flavour text, no "rarity") |
| 8 | Hover | PASS — hover uses the Arena enlarged-card popup (same as Mosje); renders the Piecie face. Only face-up Piecies on the field show it. |
| 9 | Field mode: ellipsis, pill, COST badge | PASS ("Those Eyelashes Tho..." fits; pill "PIECIE"; badge COST) |
| 10 | Missing-art fallback | PASS — green window, readable text, no broken image (`piecie-noart.png`). Several Piecies have no art in the data and show the fallback. |
| 11 | Live values | n/a — Piecies have no live MP/level; cost comes from `mpCost`. |
| 12 | Side-by-side with reference | see below |

### Visible differences from `reference/card-system.html` (Kannetje Melk)
Pop-up (`verification/compare-piecie-popup.png`, left = reference, right = game): no visible
difference beyond a 1px dark outline around the card edge (the game card has a `0 0 0 1px #000`
ring that is also in the reference source but renders against a lighter page background here).
Field tile: art position 50% 45% as in the reference.

Mapping decisions (data -> face):
- Requirement: `any` -> "Any", `levelN` -> "Lvl N+", `mental2` -> "Mental ★★+", `bankChilling` ->
  "Bank Chilling active". Sub-category: the data `subtype` (PET shown as "Pet Protection"). The
  HANDOFF list also names "Momentum-Draining"; no Piecie has that subtype, so it is not used.
- Description size: short text is set at 18px (1-2 rows) or 16px (up to 3 rows), as in the
  reference; longer text steps down from 14.5px.

### Tests
- `npm test`: 776 passed (10 new in `tests/ui/card-v1-piecie.test.ts`).
- Regression finding: after merging the Arena branch, the card-library chain specs that click a
  field ability button failed because the transparent hand strip caught the click (fails with
  `?cardv1=off` too). Fixed in `styles/arena.css` (strip is click-through, cards stay clickable)
  and the `cards` Playwright project now uses a 1600x900 viewport like the Arena specs.

## Snelle

All 20 Snelle Piecies in the data were rendered (`cardv1-snelle.spec.js`), pop-up 440x660, field
240x176, hand size 96px. Screenshots: `verification/snelle-popup.png`, `snelle-field.png`, `snelle-small.png`.

| # | Check | Result |
|---|---|---|
| 1 | Left edge at x=42 (name, description, info, pill, border text) | PASS (measured, 20 cards) |
| 2 | Badge straddles corner, value fits | PASS ("Free"; a numeric cost is covered by a unit test only, see below) |
| 3 | No collisions (desc vs name block, info line vs badge) | PASS |
| 4 | Longest text fits | PASS — none flagged overflowing; description is at most 16.2% of card height, min size 14.5px |
| 5 | Name block | PASS — "Jantje Jantje... Jantje?" and "Gevalletje Klakkeloos" shrink to one line (min 24px) |
| 6 | Gold type colour on pill (rgb 161,98,7), border text, badge label, diamond | PASS |
| 7 | No blur / divider / brackets / wordmark / serif / flavour / rarity | PASS (unit test over all 20) |
| 8 | Hover | Uses the Arena popup. Snelles are not on the field (played from hand), so hover applies to the hand fan. |
| 9 | Field mode | PASS (SNELLE pill, COST badge). Snelles do not normally appear on the field. |
| 10 | Missing-art fallback | PASS — 12 of the 20 Snelles have no art in the data; gold fallback with readable text |
| 12 | Reference | Same frame as Piecie (compared above); gold colours from the tokens |

Data differences to flag:
- **No Snelle has a cost.** All 20 have `mpCost: 0`, so every badge reads "Free". HANDOFF expects
  "Lucky Cóin (numeric cost)" and "Momentum Rush (Free)": in the game data Lucky Coin is free
  and has no accent ("Lucky Coin"). A paid Snelle would render as "<n> MP COST".
- Requirement texts come from the data (`Requires: Any`, `Mental ★★+`, `Physical ★★+`,
  `Mental ★★★`, `Lvl 1+`, `Bank Chilling active`). The reference shows "Creative ★" for Lucky Cóin;
  the data says "any". Not changed.
- Known out-of-scope bug "Lucky Coin wrong label" not touched.

## Place

All 21 Places in the data were rendered (`cardv1-place.spec.js`). Screenshots:
`verification/place-popup.png`, `place-field.png`, `place-small.png`, `board-all-types.png` (live game).

| # | Check | Result |
|---|---|---|
| 1 | Left edge at x=42 | PASS (measured, 21 cards) |
| 2 | No badge on pop-up or field tile | PASS (asserted); info line runs the full width (right edge 42px) |
| 3 | No collisions | PASS |
| 4 | Longest text fits (The Gym, 5 lines) | PASS — none flagged overflowing; max 22.5% of card height |
| 5 | Name block | PASS ("Digital Gaming Stop", "Momentum Stabilizer" shrink, min 29.4px) |
| 6 | Violet on pill (rgb 109,40,217), border text, diamond | PASS |
| 7 | No blur / divider / brackets / wordmark / serif / flavour / rarity | PASS |
| 8 | Hover | Arena popup on the field Place |
| 9 | Field mode without badge | PASS (live board screenshot) |
| 10 | Missing art | PASS — 8 Places have no art: violet fallback, readable |

Data differences to flag:
- **Good for / Bad for:** 11 of 21 Places have no `goodFor` and 17 of 21 have no `badFor`. An empty
  side is left out (e.g. "Good for: Digital, Artistic"); with both empty the info line is empty.
  Nothing is invented ("Bad for: Others" in the reference is not in the data).
- Bank Chilling's art has white bars on both sides in the source image; not touched.
- Drain Zone and The Void are hidden from players (`playerFacingPlaces.js`) but render fine.

## Overall

- `npm test`: 785 passed. `node --check` clean.
- Browser specs: `tests/ui/cards/cardv1-{mosje,piecie,snelle,place,board}.spec.js` all pass.
- The full card-library Playwright run was not completed in this pass (the user asked to keep
  testing small). Known: the Piecie chain spec "MP Amplifier" cannot click Activate because the
  raised hand cards cover the player's Piecie row at 900px height. It fails the same way with
  `?cardv1=off`, so it comes from the Arena layout, not the new faces.
