---
phase: 62-2-0-card-faces
verified: 2026-10-23T20:55:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification: false
gaps: []
deferred:
  - truth: "A field Mosje shows Fresh and Protected badges at the right times (A10 Playwright item)"
    addressed_in: "Phase 63"
    evidence: "62-CONTEXT 'Fresh / Protected / Sideways / HOLD / Tactician-MP badges and their Playwright tests - Phase 63'; ROADMAP Phase 63 SC3 and 'Tests to add: ... (plus the A10 badge / level-row screenshots on the live board)'"
  - truth: "The 3 Quests with their stacks and fail tokens are drawn on the live board with the 2.0 Quest tile; fail pips are filled from engine state"
    addressed_in: "Phase 63"
    evidence: "ROADMAP Phase 63 SC1 'the 3 Quests with their stacks and fail tokens'. Today src/ui/renderQuestStacks.js still draws a plain text widget, and the engine keeps tokens on state.questStacks[stack].tokens, not on the card, so nothing feeds the pips yet"
  - truth: "Tactician temporary MP wiring on the board"
    addressed_in: "Phase 63"
    evidence: "ROADMAP Phase 63 SC3 'a Tactician-set MP shows the temporary MP with the real MP small'; the face builders already accept tempMp (buildMosjeSpecV1.js) and a unit test covers it"
human_verification:
  - test: "Look at the A10 screenshots at 1920x1080 and judge the faces by eye"
    expected: "tests/ui/screenshots/cardv1/a10-*.png (a10-mosje-l1, a10-mosje-l2, a10-mosje-detail, a10-place-gallery, a10-place-board, a10-quest, a10-piecie, a10-piecie-tile, a10-contrast) plus sweep-230.png / sweep-tiles-240.png read well and match Gandalf's idea of Phase 7 section A. The folder is gitignored, so these PNGs exist only on this machine"
    why_human: "Visual quality and taste cannot be asserted by DOM/geometry checks"
  - test: "Decide on the hand-animation-perf failure"
    expected: "Gandalf picks one: accept it (headless software rendering, check on the real GPU), tune the frosted blur radius (overrides locked D-05), reduce the cost of the hover dock / 150% hand, or change the 25 ms threshold. See 'Known gaps' for the measured numbers"
    why_human: "It is a design and performance trade-off; the test must not be weakened silently"
  - test: "Answer the design calls the executors raised (list under 'Needs Gandalf')"
    expected: "Each item accepted or sent back as a change request"
    why_human: "Each one is a product decision"
---

# Phase 62: 2.0 Card Faces Verification Report

**Phase Goal:** Every card face follows the Phase 7 section A frame spec.
**Verified:** 2026-10-23
**Status:** human_needed (all 5 criteria verified; no blocking gaps; Gandalf has decisions and a visual sign-off to give)
**Re-verification:** No, initial verification

## Goal Achievement

The goal is achieved in the code that runs the game. I did not rely on the SUMMARYs. I read the builders and CSS, ran the unit suite, ran 107 headless browser specs myself, wrote an independent script that renders all 183 Card List cards through the real builders and asserts each criterion (0 failures), and looked at the screenshots.

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every card shows Energy cost top-left as a big number with "COST" under it (0 shows "0"; Blensen! shows "4" with "or free") and a frosted text box with readable contrast | VERIFIED | `formatEnergyCost.js` returns `{value, label:'COST', sub}`; `buildPopupFace.js` `buildCorner` emits `data-cv1-cost`, `cv2-corner-val`, `cv2-corner-label`. Independent script: all 145 non-Quest cards have `data-cv1-cost == card.cost` with the COST label; Blensen! gives 4 + `cv2-corner-sub` "or free". The 38 Quests show their dice need in that slot (they have no cost). Frosted box: `styles/card-face-2-0.css` lines 50-58 (`backdrop-filter: blur(14u) saturate(1.1)`, tint `--cv1-tint-alpha` .62 with a .60 floor in `resolveTintAlpha.js`). Contrast measured by pixel sampling over pure white art in MY run (a10 spec test 43): text box 8.32:1, dim level rows 6.26:1, boxed Piecie box 19.68:1 (all >= 4.5). Seen in `a10-contrast.png` |
| 2 | Mosjes are always full art, foil only on 5 stars or `foil`, 3 level rows with the current Level lit (L1 in hand and deck builder) | VERIFIED | `getFrameTier.js` (Mosje 4, or 5 on >= 5 stars / `foil === true`); `getTierAttributes.js` + `isFullArt.js` give `card--fullart`. Independent script, all 32 Mosjes: className has `card--fullart` and not `card--boxed`; tier matches the rule; holo layer (`ct-holo`) present exactly on the 10 tier-5 faces; exactly 3 `data-cv1-level-row`, exactly 1 lit, row 1 lit by default, `LVL 1` chip; with `level: 2` row 2 is the only lit row. A10 spec test 39 (my run): hover dock after a level-up lights row 2 / Power 30 / "LVL 2", the detail view does the same, a hand Mosje lights row 1. Deck builder: preview goes `deck-builder.js showCardPreview` -> `modalManager.showCardPreview` -> `renderCard` (2.0 face, L1). Seen in `a10-mosje-l1/l2/detail.png` |
| 3 | Piecies: tag first (Food/Gear/Substance/Pet, else MP/Attack/Utility), STAYS chip and "Needs:" line only with a requirement; Snelle "Instant · any turn"; Places show cost and "Good for · Bad for" | VERIFIED | `getPiecieLabel.js` (tag, then group). Independent script, all 73 Piecies: label equals the expected tag/group word; STAYS chip present iff `stays` (16 chips in total, Piecies plus Blensen!); info line present iff `needsText` (16 Needs lines in total, matching the guard tests); all 20 Snelle carry "Instant · any turn" and the SNELLE pill; all 20 Places carry the cost corner, "Good for: ... · Bad for: ...", PLACE pill and "Only 1 in play". No V4 strings ("MP COST", "Requires:", "Free", "Instant - play any time", "Only 1 active") on any face. Specs cardv1-piecie / snelle / place and A10 tests 40 + 42 pass. Seen in `a10-piecie.png`, `a10-place-gallery.png` |
| 4 | Quests use their stack colour with dice need top-left, "Rolls:" + band, WIN / LOSE in the footer and 2 fail pips on the field tile | VERIFIED (see note on "whole card") | `buildQuestSpecV1.js`, `getQuestNeed.js` (from `QUEST_BANDS`), `formatQuestRollsLine.js`, `formatQuestStakes.js`, `buildFieldTileStats.js` `buildPips`. Independent script, all 38 2.0 Quests: stack colour var present, need hook + NEED/TRAINED/COIN label, `Rolls: ...` info line, WIN and LOSE hooks, "<STACK> QUEST" pill, no LVL chip, tier 1, field tile has exactly 2 pips, and `failTokens: 1` fills exactly 1. A10 spec test 41 asserts the stack-colour pill, need, WIN/LOSE numbers ("can't fail" for Trained) and pips 0/1/2 filled; quest-card-tiers 16/16. Seen in `a10-quest.png`. Note: the stack colour fills the art window, pill and tile; the card body stays near-black (see Needs Gandalf) |
| 5 | The Phase 7 A10 unit tests and Playwright screenshots at 1920x1080 pass | VERIFIED | `npm test`: 179 files, 2256 tests passed (18.3 s). Headless Playwright 1920x1080, my run: 107 passed, 0 failed (3.3 min) over cardv1-* (hand, mosje, piecie, snelle, place, quest, board, activate-btn), card-tiers, quest-card-tiers, card-faces-2-0-a10 (5/5), card-faces-2-0-sweep (4/4, 183 cards), hover-dock (4/4), card-text-fits (2/2). A10 unit file `tests/ui/card-face-2-0-a10.test.ts` covers tier 4/5, foil rule, tag-first label, cost 0 -> "0". Screenshots written fresh to `tests/ui/screenshots/cardv1/a10-*.png` (9 files) |

**Score:** 5/5 truths verified

### Deferred Items

Not gaps. Each is explicitly scheduled in a later phase of this milestone.

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | A10 "Fresh / Protected badges at the right times" Playwright item | Phase 63 | 62-CONTEXT (badges and their tests are Phase 63); ROADMAP Phase 63 "Tests to add: ... plus the A10 badge / level-row screenshots on the live board" |
| 2 | Quest faces/tiles on the live board with fail pips fed from engine state | Phase 63 | ROADMAP Phase 63 SC1 ("the 3 Quests with their stacks and fail tokens"). `src/ui/renderQuestStacks.js` is still a text widget; engine tokens live on `state.questStacks[x].tokens`; pips read `card.failTokens ?? card.tokens` |
| 3 | Tactician `tempMp` wired to the board | Phase 63 | ROADMAP Phase 63 SC3; builder support exists and is unit-tested |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/ui/cardV1/buildPopupFace.js` | shared 2.0 pop-up/hand face | VERIFIED | Substantive, used by `buildCardV1` for all 5 types, reached from `renderCard` |
| `src/ui/cardV1/build{Mosje,Piecie,Snelle,Place,Quest}SpecV1.js` | per-type specs | VERIFIED | Read in full; no stubs; wired through `SPEC_BUILDERS` in `buildCardV1.js` |
| `src/ui/cardV1/buildFieldTile.js`, `buildFieldTileStats.js` | 2.0 field tiles | VERIFIED | Used by `renderCard(..., {fieldMode:true})` in `boardRenderer.js` (Mosjes, Piecies, Place) |
| `src/ui/cardV1/getCardPanelLines.js`, `buildCardPanel.js` | hover/detail panel | VERIFIED | Wired in `hoverZoom.js` and `modalManager.js` |
| `styles/card-face-2-0.css` | one `--u` token, container query, frosted box | VERIFIED | 259 lines; `@container cv1card (width < 150px)` hides unlit rows |
| `tests/helpers/{faceZones,contrast,samplePixels}.js` | test helpers | VERIFIED | `findFaceCollisions` also fails a card with no 2.0 face |
| `tests/ui/cards/card-faces-2-0-{a10,sweep}.spec.js` | A10 + sweep | VERIFIED | Ran green, assertions are real (computed colours, pixel samples, zone rects) |
| `tests/data/card-list-2-0-{needs-text,synergy-label-text}.test.ts` | Card List guards | VERIFIED | Green in `npm test` |
| `docs/developer-handoff.md` "Card faces (Phase 62)" | docs | VERIFIED | Section present at line 30 |
| Legacy V4 face code (`buildFaceV1`, `isCardV1Enabled`, `formatCost`, `getRequirementText`, `getPiecieCategoryLabel`, `buildFieldFaceV1`) | removed | VERIFIED | None of these files exist; no V4 strings in `src/ui`, `styles`, `index.html` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `cardRenderer.renderCard` | `buildCardV1` | direct call | WIRED | Falls back to the unified template only when `buildCardV1` returns null (10 leftover V4 Quests) |
| `getTierAttributes` | `getFrameTier` | `tier = getFrameTier(card)` | WIRED | |
| `hoverZoom` | field tile hooks | `data-cv1-mp / level / power` read into the dock card | WIRED | A10 test 39 proves a level-up lights row 2 in the dock |
| `hoverZoom`, `modalManager` | `buildCardPanel` | panel under dock / detail card | WIRED | hover-dock spec 90/91 |
| `deck-builder.js` preview | `modalManager.showCardPreview` -> `renderCard` | | WIRED | Deck builder tiles use `formatEnergyChip` and `needsText` too |
| sweep spec | `scripts/obby2/cardIdMap.mjs` | 183 ids | WIRED | |
| Quest tile pips | engine fail tokens | `card.failTokens ?? card.tokens` | NOT WIRED to engine state | Deferred to Phase 63 (see Deferred Items); builder, CSS and tests are correct |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Hand / dock / detail faces | `cost`, `levels`, `needsText`, `goodFor`, `band`, `win/lose` | `src/data/*.js` via `getCardById` | Yes (183 cards rendered from real data) | FLOWING |
| Mosje field tile + dock | live `level`, `power`, `mp` | `boardRenderer` slot -> tile hooks -> `hoverZoom` | Yes (A10 test 39) | FLOWING |
| Quest tile fail pips | `failTokens` | not supplied by the live board | Only via the test patch | STATIC until Phase 63 (deferred) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit suite | `npm test` | 179 files / 2256 tests passed | PASS |
| Syntax of UI files | `node --check` on main.js, modalManager, boardRenderer, handRenderer, logRenderer, actionAnimations, every `src/ui/cardV1/*.js`, cardRenderer, hoverZoom, cardSpotlight, cardAudit, deck-builder | no output | PASS |
| Face specs, headless 1920x1080 | `playwright test` (temp config) over cardv1-*, card-tiers, quest-card-tiers, card-faces-2-0-*, hover-dock, card-text-fits | 107 passed, 0 failed | PASS |
| All 183 cards through the real builders | scratch script (outside the repo) asserting criteria 1-4 per card | 0 failures; 32/73/20/20/38 by type; 16 Needs lines; 16 STAYS chips; 10 tier-5 Mosjes | PASS |
| hand-animation-perf | `playwright test hand-animation-perf` | FAILED, p95 50.1 ms vs < 25 | KNOWN GAP (see below) |

### Probe Execution

No probes declared by the plans and none apply (not a migration/tooling phase). SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| UI-04 | 62-01 .. 62-07 | Card faces follow Phase 7 A: Energy cost top-left, frosted text box, Mosjes always full art (foil on 5 stars or `foil`), 3 level rows with current lit, Piecie tag-first label, Place cost, Quests in stack colours with need / win / lose | SATISFIED | Criteria 1-4 above. The Quest "stack colour" is on the art window, pill and tile rather than the whole card (flagged for Gandalf) |
| TEST-04 | 62-01, 62-07 | Phase 7 A10 frame tests pass (unit + Playwright screenshots at 1920x1080) | SATISFIED | Criterion 5. The Fresh/Protected badge item of A10 is Phase 63's (deferred with evidence) |

No orphaned requirements: REQUIREMENTS.md maps only UI-04 and TEST-04 to Phase 62, and both are claimed by the plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | | TBD / FIXME / XXX / TODO / HACK / PLACEHOLDER in lines added since 85fee11 (excluding `.planning`, `docs`) | - | No unreferenced debt markers |
| `tests/ui/cards/cardv1-quest.spec.js` | 92 | Comment says "the whole card is in its stack colour" but the assertions check only the pill colour (and `card-v1-quest.test.ts` line 123 checks only the `--cv1-main` var) | Info | The tests do not prove a whole-card tint; see Needs Gandalf item 7 |

No stubs found: the `return null` in `buildQuestSpecV1` (V4 Quest) and `getQuestNeed` (unknown band) are deliberate fallbacks with tests.

## Known Gaps (accepted, not failures of this phase)

1. **`tests/ui/cards/hand-animation-perf.spec.js` is red.** I measured it myself, headless software rendering, p95 frame time (limit 25 ms):

   | Commit | p50 | p95 | frames > 40 ms | Result |
   |--------|-----|-----|----------------|--------|
   | 907734c (before the hover dock / 150% hand) | 16.7 | 16.7 | 0 of 206 | passes |
   | 0355d80 (just before Phase 62 started) | 33.3 | 50.1 | 32 of 97 | fails |
   | HEAD (Phase 62 done) | 49.9 | 50.1 | 46 of 84 | fails |

   The 62-07 summary quoted 66.7 ms at HEAD; the value is quantised to whole 60 Hz frames, so 50.1 vs 66.7 is a one-frame difference between runs. Reading: the failure was already there before any Phase 62 face (the dock and 150% hand commit 8cac3cd), so Phase 62 did not introduce the red. But the frosted `backdrop-filter` (locked D-05) makes the typical frame worse (p50 33.3 -> 49.9, frames over 40 ms 33% -> 55%). I did not re-run the "no blur / no dock" attribution from 62-07 because that needs a source edit. **Gandalf must decide:** (a) accept it and check on a real GPU in a real browser, since headless software rendering is the worst case; (b) lower the blur radius or drop blur on hand cards only (an exception to D-05); (c) make the dock / 150% hand cheaper; or (d) change the 25 ms bar. The test was left untouched, correctly.
2. `place_skiffa` reroll card spec is a known flake (todo filed). Not re-run by me.
3. Cinema `modal-preview` and `arena-hover` fail at baseline (hand click intercepted by `body`; no 4th hand card). Not re-run by me; the before/after record is in 62-06-SUMMARY. The panel they would have covered is proved by hover-dock and cardv1-board specs, which pass.
4. `src/deck-builder.js` still enforces the V4 `RARITY_COPY_LIMITS` (lines 41, 209, 240). Its tooltip no longer shows it. The deck builder is hidden in slice A (Phase 64 SC1), but ROADMAP Phase 64 does not explicitly schedule switching to `getCopyLimit`, so it is not formally tracked yet.

## Needs Gandalf

Design calls the executors raised, confirmed by me in code and screenshots:

1. **Bowie & Stormey text clamps at every size.** Its 383-character text is the only face whose text is flagged clamped (fade + "..."); confirmed in `a10-piecie.png`. Full text is in the detail view. A tighter line-height step would make it fit; the locked UI-SPEC says clamp.
2. **7 Quests show an empty dark band** between the art and the Rolls line (no cost, no Also text): arm_wrestling, quick_thinking, inspire_crowd, lucky_break, hack_mainframe, leap_of_faith, tough_it_out. Confirmed from data and in `a10-quest.png`. Filling it would add face text the Card List does not have.
3. **The hover panel overlays the right end of the hand** while hovering (it hangs under the docked card). Confirmed in `a10-place-board.png`.
4. **A two-success need ("2x 4+") is set smaller** (stacked "2x" over "4+", 30u not 44u) to fit the 56u corner. Confirmed.
5. **Piecie / Snelle / Place tile names wrap to two lines** (legacy behaviour kept).
6. **`deck-builder.js` still enforces V4 copy limits** (Known gap 4).
7. **(New, from this verification) "Whole card in stack colour".** D-08 and the UI-SPEC colour table say Quests are in their stack colour as a whole-card tint. The pop-up shows the stack colour in the art window, the pill, the label tints and the whole tile; the card body and frame stay near-black. ROADMAP criterion 4 ("use their stack colour") holds on any reasonable reading, so I did not fail it, but please check by eye that this is the look you want.
8. **Open from the UI-SPEC sign-off (Approval: pending Gandalf):** dim level rows at .55 opacity instead of Phase 7's "about 45%" (.55 is the lowest that passes 4.5:1; measured 6.26:1), and no cost shown on Piecie / Snelle / Place field tiles (already paid).
9. **FYI, no action needed:** the hand is sunk by 47% (from 8cac3cd), so the text box and the 3 level rows of a hand card are below the fold and show only in the hover dock or detail view; two Places (Delluft, Synergy Chamber) print "Limit 1 per deck." both in their text (it is the verbatim Card List sentence) and in the hover panel; the 10 leftover V4 Quests (all `disabled: true`) still render through the unified fallback, as the plan intended (visible in the offline test hand as "Kickboxing Bootcamp").

## Human Verification Required

### 1. Visual sign-off on the faces

**Test:** Open `tests/ui/screenshots/cardv1/a10-*.png`, `sweep-230.png`, `sweep-tiles-240.png` (regenerated by this verification run; the folder is gitignored so it only exists locally).
**Expected:** Mosje, Piecie, Snelle, Place and Quest faces and tiles look right per Phase 7 section A.
**Why human:** Taste and layout quality are not assertable.

### 2. Perf decision

**Test:** Choose among options (a)-(d) in Known Gap 1.
**Expected:** A decision recorded in STATE.md or a follow-up todo.
**Why human:** Trade-off between the locked frosted blur, the approved hover dock, and frame time.

### 3. The Needs Gandalf list above

**Why human:** Product decisions.

## Gaps Summary

No blocking gaps. All five ROADMAP criteria, UI-04 and TEST-04 are met in the code that runs the game. What remains is Gandalf's visual sign-off, the perf decision (red before this phase, made somewhat worse by it), and the design calls above. Items that belong to the board (live Quest stacks and fail pips, Fresh / Protected badges, Tactician temp MP) are explicitly Phase 63.

Housekeeping for the orchestrator: `.planning/REQUIREMENTS.md`, `ROADMAP.md` and `STATE.md` have uncommitted working-tree changes (the UI-04 / TEST-04 ticks and Phase 62 "completed 2026-10-23" among them) that I did not touch or commit; this commit contains only this file. The two Phase 50 shot PNGs are modified by `card-tiers.spec.js` runs and were left alone. Temp config, `test-results/` and the baseline worktree were removed; `_perf.out` was restored to its original content.

---

_Verified: 2026-10-23_
_Verifier: Claude (gsd-verifier)_
