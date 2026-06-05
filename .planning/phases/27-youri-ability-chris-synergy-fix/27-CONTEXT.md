# Phase 27: Youri Ability + Chris Synergy Fix — Context

**Gathered:** 2026-06-05
**Status:** Ready for planning
**Source:** User specification

<domain>
## Phase Boundary

Two related bugs with Youri The Speedrunner and the Chris+Youri passive synergy.

**Bug 1 — Youri ability (YCS-01, YCS-02, YCS-03):**
Current `ability_youri_speed_activate` only draws 1 card and sets `instantPiecieThisTurn`. The card description says: "Pay 20 MP → activate a newly set face-down Piecie the same turn → draw 1 card (max 3 uses per game)."

The correct sequence:
1. Check: player has ≥ 20 MP on Youri's slot AND has at least one face-down piecie on field
2. Deduct 20 MP from Youri's slot
3. Player picks which face-down piecie to activate (if multiple, show selector; if one, auto-pick)
4. Activate that piecie immediately (bypassing `canActivateOnTurn` check)
5. Draw 1 card
6. Increment `youriAbilityUses` counter — block if already at 3

**Bug 2 — Chris+Youri passive synergy:**
`synergyEffect: "Both may play Piecies directly to active state without face-down waiting"`
Currently not implemented. When both Chris (mosje_chris or mosje_chris_ddr) AND Youri (mosje_youri) are simultaneously on the field, any normal PIECIE played from hand should be placed with `canActivateOnTurn: currentTurn` (i.e., activatable immediately the same turn) instead of `canActivateOnTurn: currentTurn + 1`.

This is a passive always-on synergy, distinct from Chris's ability (`ability_chris_perfect_setup` — one free activation) and Youri's ability (costs 20 MP). The synergy gives every piecie placement from hand the same instant behaviour as Snelle Piecies, but only while both Mosjes are alive and on field.

</domain>

<decisions>
## Implementation Decisions

### Youri ability (locked)
- **20 MP cost**: deduct from Youri's activeSlot MP, not a flat player-level pool
- **Activation target**: player selects which face-down piecie to activate; if only one face-down piecie exists, auto-activate without showing a selector
- **Face-down piecie activation**: call the existing `activatePiecie` engine function (same path as normal activation) — do NOT duplicate activation logic
- **Draw 1 card**: after activation, draw 1 card from player deck (same as current implementation)
- **3-use cap**: tracked per game on player state as `youriAbilityUses` (integer, starts at 0). Block with message if ≥ 3
- **Blockers**: show clear error if (a) < 20 MP on Youri slot, (b) no face-down piecie on field, (c) uses exhausted
- **Remove `instantPiecieThisTurn` flag** from Youri ability — that flag was the wrong implementation

### Chris+Youri synergy (locked)
- **Trigger condition**: both `mosje_chris` (or `mosje_chris_ddr`) AND `mosje_youri` are in `activeSlots`, not defeated, at the moment a piecie is played from hand
- **Effect**: set `canActivateOnTurn: state.turnNumber` (same turn) instead of `state.turnNumber + 1` in `playPiecie` in turnManager.js
- **Scope**: only applies to normal PIECIE cards played from hand — not Snelle Piecies (already instant), not Place cards, not Quest cards
- **Implementation site**: `playPiecie` in `src/engine/turnManager.js` — add synergy check before setting `canActivateOnTurn`
- **Synergy check helper**: use existing `synergyWith` data or write a small inline check for the specific card IDs

### Test coverage (locked)
- Youri ability: test with/without 20 MP, with/without face-down piecie, use-count cap at 3
- Chris+Youri synergy: test that piecie placed while both on field has `canActivateOnTurn === turnNumber`; test that it does NOT apply when only one of them is on field

### Do NOT change
- Snelle Piecie play path (already instant from hand)
- Chris's ability (`ability_chris_perfect_setup`) — separate feature, not touched here
- `logStateOutcome` or any logging (Phase 26 work, don't touch)
- TypeScript declarative registry files in `src/engine/reducers/` — that's a separate system

</decisions>

<canonical_refs>
## Canonical References

- `src/abilities/mosjeAbilities.js` — `ability_youri_speed_activate` (current wrong impl, lines ~443-453)
- `src/engine/turnManager.js` — `playPiecie` function (placement + canActivateOnTurn logic, lines ~430-460), `activatePiecie` function (the activation path to reuse)
- `src/data/mosjes.js` — Youri (`mosje_youri`, line ~330) and Chris (`mosje_chris`, line ~312) data with synergyWith / synergyEffect fields
- `src/main.js` — `useMosjeAbility` call path and how ability dispatch works in the UI layer
- `docs/phase0-rulings.md` — canonical game rules for ability costs and synergy rules
- `CLAUDE.md` — verify commands: node --check + npm test required before every commit

</canonical_refs>

<specifics>
## Specific Implementation Notes

- The existing `activatePiecie(state, playerId, slotIndex)` in turnManager.js already handles the full activation sequence (effect application, slot.activated = true, etc.) — Youri's ability should call this rather than re-implementing
- Face-down piecie selection: if player has multiple face-down piecies, UI needs to let them pick (use existing `modal.showMosjeSelect` or a simple slot selector pattern already in main.js)
- `youriAbilityUses` should be initialised to 0 in the player state (check `createPlayer` or equivalent in gameState.js)
- The synergy check in `playPiecie` needs to check both `mosje_chris` AND `mosje_chris_ddr` as valid Chris cards (both are in Youri's `synergyWith` array)

</specifics>

<deferred>
## Deferred

- Youri ability bot AI logic (bot currently doesn't use Youri)
- Chris DDR + Youri synergy variant (Chris DDR has a separate synergyWith Youri entry — check if it needs separate handling)

</deferred>

---

*Phase: 27-youri-ability-chris-synergy-fix*
*Context gathered: 2026-06-05*
