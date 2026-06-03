# Phase 22: Call of the Welloes — Context

**Gathered:** 2026-06-03
**Updated:** 2026-06-03 (mechanic revision after Wave 1+2 execution)
**Status:** Revised — gap closure plans needed
**Source:** Design session + user mechanic correction

<domain>
## Phase Boundary

Implement the full Call of the Welloes Piecie effect using existing engine primitives wherever possible. The card summons a Mosje from the owner's Welloe pile into a free active slot at **Level 1, 50 MP**. The Piecie stays active on the field as long as the summoned Mosje is alive. If the Piecie is destroyed, the summoned Mosje is also defeated. No new top-level state keys are needed. Everything lives on existing objects via two small new fields.

**MECHANIC REVISION (2026-06-03):** Waves 1 and 2 were executed with the wrong mechanic (restored stats + return-to-welloe). Gap-closure plans must replace those implementations with the correct mechanic below.

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
- **D-05** Mosje placement: use `createMosjeSlotFromDefinition(mosjeDef)` then set `mp: 50, level: 1` on the slot — NOT restored from welloe record. Summoned Mosje always starts fresh.
- **D-06** Summoned Mosje always starts at **Level 1, 50 MP** regardless of what it had when defeated. This is intentional — the card is balanced around a fresh but cheap summon.
- **D-07** After placing, pop the chosen Mosje from `player.welloe[]` (remove it from the welloe pile while it's on the field).

### Cancel conditions (silent — no error shown to user)
- **D-08** If `player.welloe.length === 0`: return `{ canActivate: false }` before the UI pick. Effect does nothing.
- **D-09** If no free `activeSlots` slot: return `{ canActivate: false }` before the UI pick. Effect does nothing.

### Destruction path — Piecie destroyed → defeat Mosje
- **D-10** When the anchor Piecie (`piecie_call_of_welloes`) is removed from `piecieSlots`, its linked Mosje must also be defeated. This is done by calling `markMosjeDefeated` (not a return-to-welloe). The Mosje is truly defeated, triggering the normal defeat flow (victory check, discard, etc.).
- **D-11** The `returnMosjeToWelloe` function created in Wave 1 is WRONG for this mechanic. It must be removed and replaced with defeat logic. Any tests relying on `returnMosjeToWelloe` must be updated.
- **D-12** The defeat happens inside the end-of-turn sweep: if the anchor Piecie is gone, call `markMosjeDefeated(state, playerId, slotIndex)` on the summoned Mosje's slot.

### End-of-turn sweep — Piecie persistence + defeat-on-removal
- **D-13** The Call of the Welloes Piecie **stays active on the field** as long as its linked Mosje is in `activeSlots`. This means the normal piecieSlots sweep must be modified or bypassed for this Piecie while it has a live linked Mosje (`linkedMosjeCardId` is set and that Mosje is in an activeSlot).
- **D-14** At end of turn, after the piecieSlots sweep: scan `player.activeSlots` for slots with `summonedByPiecie === 'piecie_call_of_welloes'`. Check if the anchor Piecie (`piecie_call_of_welloes`) is still in `piecieSlots`. If NOT found → call `markMosjeDefeated` on that activeSlot.
- **D-15** If the anchor Piecie IS still in piecieSlots → do nothing. Mosje stays on field, Piecie stays on field.
- **D-16 (NEW)** The piecieSlots sweep must NOT remove a `piecie_call_of_welloes` Piecie while its `linkedMosjeCardId` refers to a live Mosje in `activeSlots`. Skip that Piecie entry during the normal sweep.
- **D-17 (NEW)** When the linked Mosje is defeated naturally (via `markMosjeDefeated`) → clear `linkedMosjeCardId` from the Piecie slot. The Piecie can then be swept normally on the next turn.

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

**Card description (REVISED — what it must say in piecies.js):**
> "Choose a Mosje in your Welloe pile and summon it to the field at Level 1, 50 MP. This Piecie stays on the field as long as that Mosje is active. If this Piecie is destroyed, the summoned Mosje is also defeated."

**Wave 2 implemented a wrong description** ("restoring its MP and Level"). The gap-closure plan must correct this to match the mechanic above.

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
