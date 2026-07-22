---
phase: 46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load
reviewed: 2026-07-19T19:25:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/data/piecies.js
  - src/abilities/piecieEffects.js
  - src/engine/turnManager.js
  - tests/effects/thematic-piecies.test.ts
  - tests/ui/cards/card-registry.js
  - docs/card-reference.md
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: resolved
resolved: 2026-07-19T19:50:00Z
resolution_plan: 46-03
---

# Phase 46: Code Review Report

**Reviewed:** 2026-07-19T19:25:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** resolved

## Summary

Reviewed the four new booster-only thematic Piecies (Loaded Dice, Boosterpackkie,
Perfect Rhythm, Dikke Plaat) across data, effects, engine hook, docs, and both
test layers (`git diff c7f7b00^..HEAD`).

What was verified as correct:

- `src/data/piecies.js` additions are pure data (no logic), follow the existing
  card shape, and all four `effectId`s resolve to exported functions in
  `piecieEffects.js` (dispatch via `piecieEffects[knownCardDef.effectId]` works).
- All four effect functions clone state via `cloneState()` and never mutate the
  input; `deck.length > 0` is checked before every `deck.shift()` (matching the
  file-wide draw convention — there is no reshuffle helper to bypass).
- Tag data exists: `JEFFREY` (mosje_jeffrey, mosje_jeffrey_gambler), `COERT`
  (coert_tech, kasteluck, kastelein, fps_coert), `DJ` (mosje_dj_8020), and the
  exact ids `mosje_alyssa_fissa` / `mosje_chris_ddr` are real. Alyssa Fissa has
  no `DJ` tag, so the exact-id exception is genuinely needed and correct;
  Alyssa Bulldozer correctly does not qualify.
- `questPrepBonus` uses `+=` consistently with `mosjeAbilities.js`, and is
  consumed-then-reset per roll (main.js / rollBotQuestDice.js), so stacking is
  sound; end-of-turn reset covers both the bonus and the new
  `perfectRhythmDrawNextPiecie` flag for the only player who can set it.
- Booster pool (`boosterEngine.js`) derives from `PIECIES` minus `disabled`, so
  the four cards drop without extra registration; starter-deck exclusion is
  test-guarded.
- The card-registry Playwright specs are deterministic: the default test Mosje
  is `mosje_gandoe_destroyer` (tags `["GANDOE"]` — no COERT/DJ/JEFFREY), so
  Boosterpackkie's `handDelta: 1` cannot flake on a 5–6 roll and the
  `questPrepBonus: 1` assertions cannot see the +2 kickers.
- The new vitest suite passes (23/23), mocks `Math.random`, covers the MP-100
  cap, exact-id gating, no-self-trigger, repeat draws, and end-of-turn clearing.
- `docs/card-reference.md` count 74 now matches the actual 74 `piecie_` entries
  (both previously stale numbers 68/64 were fixed).

The findings below are behavior gaps against the card text and lifecycle
inconsistencies — no security or data-loss issues in this diff.

## Warnings

### WR-01: Chris DDR chain activations bypass Perfect Rhythm's draw — on the card's own thematic combo

**File:** `src/engine/turnManager.js:78-124` (maybeChainChrisDdrCombo), `src/engine/turnManager.js:961-973` (rhythm hook)
**Issue:** Perfect Rhythm's card text says "Each later Piecie you activate this
turn also draws 1," and the engine's own counter agrees that chained Piecies are
activations — `maybeChainChrisDdrCombo` increments `pieciesActivatedThisTurn`
(line 121). But the chain applies the effect function directly
(`piecieEffects[def.effectId](state, playerId)`, line 107) instead of going
through `activatePiecie`, so the Perfect Rhythm draw hook (which lives only in
`activatePiecie`, lines 961-973) never fires for chained activations. This is
exactly the scenario the card is themed around: Perfect Rhythm's +10 MP kicker
requires `mosje_chris_ddr` on field, and DDR Chris on field is what triggers
Perfect Combo Chain — so in the card's flagship combo, up to 3 activations per
turn silently skip the promised draw. Neither the unit tests nor the registry
cover this path.
**Fix:** Extract the rhythm-draw block into a helper and call it from both
consumption points, e.g.:

```js
function applyPerfectRhythmDraw(state, playerId, activatedCardId) {
  const p = state.players[playerId];
  if (activatedCardId === 'piecie_perfect_rhythm' || !p.perfectRhythmDrawNextPiecie) return state;
  if (p.deck.length > 0) {
    p.hand.push(p.deck.shift());
    state = applyPlaceEffectsOnDraw(state, playerId, 1);
    console.log('[ABILITY] Perfect Rhythm: later Piecie activation drew 1 card');
  }
  return state;
}
```

Call it in `activatePiecie` (replacing lines 964-973) and in
`maybeChainChrisDdrCombo` after line 107 (`next = applyPerfectRhythmDraw(next, playerId, chainedCard.cardId);`).
Add a unit test: Perfect Rhythm armed + DDR Chris on field + chain roll forced
to 5-6 → chained Piecie draws 1. (If the no-draw-on-chain behavior is instead a
deliberate ruling, it must be stated on the card description and in
`docs/card-reference.md` — currently nothing documents it.)

### WR-02: A second Perfect Rhythm copy is denied the draw the card text promises it

**File:** `src/engine/turnManager.js:965`
**Issue:** The no-self-trigger guard is `slotCardId !== 'piecie_perfect_rhythm'`.
That correctly stops a single copy from consuming its own arming, but it also
blocks the draw when a *second* Perfect Rhythm copy is activated later in the
same turn — even though the first copy already armed the flag and the second
copy is unambiguously a "later Piecie you activate this turn." Booster packs
explicitly allow duplicates (`boosterEngine.js` drawPack: "duplicates
possible"), so two copies in one deck is a reachable game state. Relatedly,
because the flag is a boolean rather than a counter, two armed Rhythms grant
the same one-draw-per-activation as one — if stacking is intended to be
capped, that's fine, but the second copy drawing nothing at all contradicts the
card text.
**Fix:** Guard against self-trigger per activation, not per card id — e.g.
snapshot the flag *before* the effect runs and use that snapshot:

```js
const rhythmArmedBeforeEffect = state.players[playerId].perfectRhythmDrawNextPiecie === true;
// ... effect runs ...
if (rhythmArmedBeforeEffect && state.players[playerId].perfectRhythmDrawNextPiecie) {
  // draw 1 — works for any card, including a 2nd Perfect Rhythm,
  // but a card cannot trigger off the flag it just set itself
}
```

Add a unit test with two `piecie_perfect_rhythm` slots activated back-to-back:
first draws 0, second draws 1.

### WR-03: Perfect Rhythm has a turn-long effect but no `persistUntilEndOfTurn` — breaks the BUG-02 lifecycle convention

**File:** `src/data/piecies.js:461-475`; locked in by `tests/effects/thematic-piecies.test.ts:96,113`
**Issue:** The established convention (BUG-02, `piecie_quest_prep` comment at
`src/data/piecies.js:428`) is that a Piecie whose effect lasts until end of
turn stays face-up in its slot until the end-of-turn sweep, so the board shows
the effect is live. Loaded Dice and Dikke Plaat follow it (`persistUntilEndOfTurn:
true`) for a *one-roll* bonus. Perfect Rhythm — whose effect, after the 46-02
rework, now persists for the *entire rest of the turn* (`perfectRhythmDrawNextPiecie`
is only cleared in `endTurn`, turnManager.js:498) — is discarded to the
graveyard immediately on activation. Players get no on-board indicator that
every later Piecie this turn draws a card, and the inconsistency is codified by
the test's `persists = false` expectation, so a future fix must change both
files. The 46-01 plan specified the persist flag for Loaded Dice/Dikke Plaat
but was silent on Perfect Rhythm, and the 46-02 rework (which lengthened the
effect from one-shot to whole-turn) did not revisit the decision.
**Fix:** Add `persistUntilEndOfTurn: true` to `piecie_perfect_rhythm` in
`src/data/piecies.js` and flip the expected tuple in
`tests/effects/thematic-piecies.test.ts:96` to `['piecie_perfect_rhythm', '★', true]`
(the endTurn sweep already discards persistent cards, and the effect itself
needs no change). If immediate discard is a deliberate design choice, record
the rationale in `docs/card-reference.md` so the asymmetry with Dubbele
Dosis/Loaded Dice/Dikke Plaat is documented rather than accidental.

## Info

### IN-01: Boosterpackkie's player-facing text reads as roll-gating the +10 MP, but the code grants it unconditionally

**File:** `src/data/piecies.js:455`; `src/abilities/piecieEffects.js:545-546`
**Issue:** The description "COERT Mosje on field: on 5-6 draw 1 more, and gain
10 MP." parses naturally as *both* the bonus draw and the +10 MP being gated on
rolling 5-6. The implementation grants +10 MP whenever a COERT Mosje is on
field, regardless of the roll (only the docs table states this reading).
Players will predict the wrong outcome on rolls 1-4.
**Fix:** Split the sentences: `"Draw 1, then roll 1d6. COERT Mosje on field: on 5-6 draw 1 more. A COERT Mosje also grants +10 MP."`

### IN-02: The +10 MP kickers credit the first active slot, not the thematic Mosje

**File:** `src/abilities/piecieEffects.js:544-545` (Boosterpackkie), `src/abilities/piecieEffects.js:560-561` (Perfect Rhythm)
**Issue:** Both kickers use `getFirstActiveSlotIndex(player)`, so with e.g.
Gandoe in slot 0 and Coert Tech in slot 1, Boosterpackkie's COERT-conditional
+10 MP lands on Gandoe. This matches the file-wide "gain X MP → active (first)
Mosje" convention, but for cards whose entire bonus exists *because* a specific
Mosje is on field, granting the MP to a different Mosje may not be the intent.
The unit tests only ever place the thematic Mosje in slot 0, so the divergence
is untested.
**Fix:** Confirm the ruling. If the thematic Mosje should receive the MP, use
the index of the matching slot (`findIndex` on the COERT tag / `mosje_chris_ddr`)
instead of `getFirstActiveSlotIndex`, and add a slot-1 test case.

### IN-03: card-reference.md table rows for the new cards break the ID naming convention

**File:** `docs/card-reference.md:105,122,127,131` (new rows)
**Issue:** Every existing Piecie row uses a kebab-case slug (`bagga-of-greed`,
`call-of-the-welloes`), while the four new rows use raw engine ids
(`piecie_boosterpackkie`, `piecie_dikke_plaat`, `piecie_loaded_dice`,
`piecie_perfect_rhythm`). Anyone scripting against the table's ID column now
has two formats.
**Fix:** Rename the four IDs in the table to `boosterpackkie`, `dikke-plaat`,
`loaded-dice`, `perfect-rhythm` to match the column's convention.

### IN-04: Stale log wording after the 46-02 repeat rework

**File:** `src/engine/turnManager.js:969,971`
**Issue:** The log still says "Perfect Rhythm: next Piecie activation drew 1
card" from the original one-shot design. Since 46-02 the draw repeats on every
later activation, so "next" is misleading in the battle/console log when the
third Piecie of the turn draws. (Minor, but these `[ABILITY]` lines are the
debugging surface the project's bug-repro workflow relies on.)
**Fix:** Reword to `"Perfect Rhythm: later Piecie activation drew 1 card"` /
`"...had no card to draw"`.

## Resolution (Plan 46-03)

All seven findings were resolved on 2026-07-19 without changing card costs,
MP amounts, quest-roll bonuses, or the DDR chain cap.

| Finding | Status | Resolution evidence |
|---------|--------|---------------------|
| WR-01 | RESOLVED | `applyPerfectRhythmDraw` is shared by manual `activatePiecie` and `maybeChainChrisDdrCombo`; the DDR-chain regression passes. |
| WR-02 | RESOLVED | Both activation paths snapshot the flag before resolving the effect, so the first Rhythm does not self-trigger and a later copy draws exactly once. |
| WR-03 | RESOLVED | `piecie_perfect_rhythm` now has `persistUntilEndOfTurn: true`; its lifecycle regression confirms both copies remain face-up until the normal sweep. |
| IN-01 | RESOLVED | Boosterpackkie's player-facing text now separates the 5-6 extra draw from the roll-independent COERT +10 MP kicker. |
| IN-02 | RESOLVED | Boosterpackkie targets the first qualifying COERT slot; Perfect Rhythm targets exact active `mosje_chris_ddr`; unrelated slot-0 Mosjes remain unchanged in regression tests. |
| IN-03 | RESOLVED | The four new card-reference IDs now use kebab-case slugs. |
| IN-04 | RESOLVED | Perfect Rhythm effect and draw logs now say “each later” / “later” activation. |

Verification evidence:

- `node --check src/engine/turnManager.js src/abilities/piecieEffects.js src/data/piecies.js`: passed.
- `npx vitest run tests/effects/thematic-piecies.test.ts`: 27/27 passed.
- `npm run validate`: 72 files and 705/705 tests passed; lint retained only the repository's existing warning baseline.
- Focused Playwright card checks: 5/5 passed (four Phase 46 cards plus Ronald Kip, whose MP delta remained +50).
- Full simulation: 152/160 passed; all 8 failures were timeout-only, the 100-game deck matrix passed 100/100, and no nonzero crash row was emitted.

---

_Reviewed: 2026-07-19T19:25:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
