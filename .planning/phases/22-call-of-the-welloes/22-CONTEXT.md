# Phase 22: Call of the Welloes — Context

**Gathered:** 2026-06-03
**Status:** Ready for planning
**Source:** Design session (conversation analysis + codebase audit)

<domain>
## Phase Boundary

Implement the full Call of the Welloes Piecie effect using existing engine primitives wherever possible. The card summons a Mosje from the owner's Welloe pile into a free active slot; the Piecie acts as an anchor — when it leaves play, the summoned Mosje immediately returns to the Welloe pile. No new top-level state keys are needed. Everything lives on existing objects via two small new fields.

**In scope:**
- `effect_call_of_welloes` activation logic (summon path)
- UI pick for which Mosje to summon (showOptionSelect, same as Ronald Master Plan / Tuk)
- `returnMosjeToWelloe` engine helper (subset of `markMosjeDefeated` without defeat side-effects)
- End-of-turn sweep check (hook into existing piecieSlots sweep in `endTurn`)
- Two new tracking fields: `piecieSlots[i].linkedMosjeCardId` and `activeSlots[i].summonedByPiecie`
- TDD tests: summon path, return path, no-free-slot cancel, empty-welloe cancel, end-of-turn check, startTurn reset
- `docs/card-reference.md` update marking Call of the Welloes as implemented

**Out of scope (not this phase):**
- Call of the Welloes Snelle Piecie variant (if any)
- Welloe pile UI visualization changes
- Any other Bucket D items (already handled in fix/phase-22-bucket-d-quest-gates)

</domain>

<decisions>
## Implementation Decisions

### State shape — two new fields only, no top-level keys
- **D-01** `player.piecieSlots[i]` gains `linkedMosjeCardId: string | null` — set when Call of the Welloes activates, stores the cardId of the summoned Mosje so the end-of-turn sweep knows which Mosje to return.
- **D-02** `player.activeSlots[i]` gains `summonedByPiecie: string | null` — set to `'piecie_call_of_welloes'` when a Mosje is summoned; used to identify summoned Mosjes during the sweep check.
- **D-03** No new top-level state keys (e.g. no `_callOfWelloesActive`). All tracking is on existing objects.

### Summon path — reuse playMosje primitives
- **D-04** Free-slot check: `player.activeSlots.findIndex(s => s === null) >= 0` — same logic as `playMosje` (line 836 of turnManager.js).
- **D-05** Mosje placement: use `createMosjeSlotFromDefinition(mosjeDef)` then restore saved stats from the welloe record (`saved.mp`, `saved.level`, `saved.traits`, `saved.statusEffects`) — identical to the saved-state restoration in `playMosje` lines 848–854.
- **D-06** Summoned Mosje starts with its **welloe-recorded** MP and level (not fresh Level 0 / 0 MP). The card was already in play before being defeated; restore where it left off.
- **D-07** After placing, pop the chosen Mosje from `player.welloe[]` (remove it from the welloe pile while it's on the field).

### Cancel conditions (silent — no error shown to user)
- **D-08** If `player.welloe.length === 0`: return `{ canActivate: false }` before the UI pick. Effect does nothing.
- **D-09** If no free `activeSlots` slot: return `{ canActivate: false }` before the UI pick. Effect does nothing.

### Return path — new helper `returnMosjeToWelloe`
- **D-10** `returnMosjeToWelloe(state, playerId, slotIndex)` — pure function, subset of `markMosjeDefeated` without: WELLOE_SHIELD check, Not Today! check, Tesla check, `isDefeated = true`, discard entry, or `checkVictory` call. Just: `player.welloe.push({ ...mosjeSlot })` then `player.activeSlots[slotIndex] = null`.
- **D-11** The return does NOT trigger a victory check — the Mosje goes back to the welloe pile (already "out of play"), not to defeat. No knockout state change.
- **D-12** The return does NOT add a discard entry — the Mosje was never truly defeated, just un-summoned.

### End-of-turn sweep — hook into existing loop
- **D-13** In `endTurn`, after the existing piecieSlots sweep loop (lines 241–253), add a second pass over `player.activeSlots`. For each slot with `summonedByPiecie === 'piecie_call_of_welloes'`, check whether any `piecieSlots` entry still has `cardId === 'piecie_call_of_welloes'`. If no match found → call `returnMosjeToWelloe`.
- **D-14** The sweep runs for the player whose turn is ending (same `playerId` as the existing sweep) — the Piecie and the summoned Mosje always belong to the same player.
- **D-15** If the Piecie is still on field → do nothing. Mosje stays.

### UI flow — reuse showOptionSelect pattern
- **D-16** After `activatePiecie` fires `effect_call_of_welloes` and the engine returns `{ requiresWelloeSelect: true, welloeOptions: [{cardId, name, mp, level}, ...] }`, main.js shows `showOptionSelect` for the player to pick a Mosje.
- **D-17** After the player picks, main.js calls a new exported engine function `confirmCallOfWelloes(state, playerId, mosjeCardId)` that executes the full summon (D-04 → D-07).
- **D-18** Pattern precedent: Ronald Master Plan (`_masterPlanPick`) and Tuk Perfect Placement already follow this two-step activate → confirm pattern in main.js and mosjeAbilities.js. Call of the Welloes follows the same shape but for a Piecie effect.

### What is NOT new (reused as-is)
- `player.welloe[]` — already stores full Mosje objects after `markMosjeDefeated` (victoryChecker.js:122). Source pile for the summon.
- `createMosjeSlotFromDefinition()` — already exported from turnManager.js (line 862).
- `showOptionSelect` modal — already used in main.js for Welloe Force, MP Adjuster, and Mosje ability targets.
- `piecieSlots` sweep loop — already runs every `endTurn`; we add ~12 lines after it.
- `normalizePiecieSlots` — already called in the sweep; no change needed.

### Claude's Discretion
- Exact `welloeOptions` shape passed to main.js (recommend `{ cardId, name, mp, level }` to show meaningful labels in the modal)
- Whether the `linkedMosjeCardId` is cleared when the Mosje returns (yes — clear both fields on return)
- Test helper structure (follow `tests/abilities/quest-behaviors.test.ts` pattern)
- Whether `confirmCallOfWelloes` is exported from turnManager.js or a new file (recommend turnManager.js — same file as `playMosje`, consistent with engine function location)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Engine — Mosje slot management
- `src/engine/turnManager.js` lines 820–878 — `playMosje` + `createMosjeSlotFromDefinition`: summon precedent, saved-state restoration pattern, free-slot check
- `src/engine/turnManager.js` lines 239–253 — `endTurn` piecieSlots sweep: where the return-check hook goes
- `src/engine/victoryChecker.js` lines 83–132 — `markMosjeDefeated`: what `returnMosjeToWelloe` must NOT do (no defeat flags, no discard entry, no victory check)

### Card definition
- `src/data/piecies.js` lines 704–717 — `piecie_call_of_welloes` definition (effectId, description, subtype)

### Pattern precedents for UI two-step flow
- `src/abilities/mosjeAbilities.js` — Ronald Master Plan (`_masterPlanPick`) two-step pattern
- `src/main.js` — `handleActivatePiecie` and `handleUseAbility` — where the `requiresWelloeSelect` branch and `confirmCallOfWelloes` call goes

### Test pattern
- `tests/abilities/quest-behaviors.test.ts` — structure for engine-level behavior tests
- `tests/abilities/phase-22-quest-gates.test.ts` — most recent test file in this phase series; follow its helper / makeState pattern

### Project rules
- `CLAUDE.md` — one function per file, pure functions in engine, test every new card/effect

</canonical_refs>

<specifics>
## Specific Implementation Notes

**Card description (from piecies.js):**
> "Choose a Mosje in a Welloe pile and summon it to the field at Level 1, 0 MP. This Piecie stays linked to that Mosje; if this Piecie leaves play, that Mosje returns to Welloe."

**Note on "Level 1, 0 MP" in description vs D-06:**
The card description says "summon at Level 1, 0 MP" but the user design session said restore welloe-recorded stats. These conflict. The planner should flag this and default to **restoring welloe stats** (the more interesting/strategic mechanic), and update the card description text in piecies.js to match. This is a data correction, not an engine design change.

**Piecie leaving play — when does this happen?**
1. Normal end-of-turn sweep (Piecie not persistent → swept to discard)
2. Opponent card effect that removes a Piecie from the field (e.g. place destruction)
3. The Piecie was a Snelle Piecie — swept immediately after activation

Call of the Welloes is a regular Piecie (not a Snelle), so case 1 is the primary trigger. Case 2 is handled automatically because the sweep check runs at end of turn regardless. Case 3 does not apply.

**Two-player scope:**
The summon is always from the *activating player's own* Welloe pile. Cannot summon opponent's Mosjes.

</specifics>

<deferred>
## Deferred Ideas

- Opponent-pile summon variant (different card concept)
- Snelle Piecie version of Call of the Welloes
- Visual indicator on the summoned Mosje (UI polish, not engine)
- Mid-turn return trigger (i.e. return immediately when Piecie is destroyed mid-turn by an opponent effect) — this is complex; end-of-turn sweep covers the common case correctly. Rare mid-turn destruction can be addressed in a future polish phase.

</deferred>

---

*Phase: 22-call-of-the-welloes*
*Context gathered: 2026-06-03 via design session*
