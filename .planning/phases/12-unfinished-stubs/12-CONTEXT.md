# Phase 12 Context: Implement Unfinished Mechanics & Stubs

**Phase:** 12
**Name:** Implement Unfinished Mechanics & Stubs
**Date:** 2026-05-31
**Status:** Context gathered — ready to plan

---

<domain>
Eliminate every silent no-op in the engine. Status effects (MP_LOSS_HALVED, MP_LOSS_REDUCTION, WELLOE_SHIELD) are pushed to statusEffects arrays but never read by loseMP/victoryChecker. Snelle flags (negateNextSearch, mpLossReduction) are set but never consumed. Several ability functions are pure stubs or have hardcoded placeholder values. This phase wires everything up or explicitly documents what remains deferred and why.
</domain>

---

<decisions>

## Grouping & Execution Order

The 16 stubs are grouped into 5 plan waves by complexity. Execute waves in order — each wave is a separate PLAN.md.

### Wave 1 — Engine wiring (no UI, pure logic, highest impact)
These are the pure engine fixes that unblock the most card behaviour:

1. **MP_LOSS_HALVED** (STUB-01): In `loseMP()` in `src/engine/mpManager.js`, before applying damage, check `statusEffects` for `MP_LOSS_HALVED` with `turnsLeft > 0`. If present, halve the loss (round up). Decrement turnsLeft. Cards affected: Bowie & Stormey, Tony, Gekke Vogels (Jisca), KatjeGang (Alyssa), ViannaPoes (Cless). Restore `value` to 50 in all push sites (was zeroed as corruption-prevention — the real fix is wiring the read point, not keeping value=0).
2. **MP_LOSS_REDUCTION** (STUB-02): In `loseMP()`, check statusEffects for `MP_LOSS_REDUCTION` with `turnsLeft > 0`. Reduce loss by `value` (floor at 0). Decrement turnsLeft (consume on first trigger). Also wire the snelle flag `mpLossReduction` (from `effect_snelle_the_protector`) — consolidate: either convert snelle flag to push an MP_LOSS_REDUCTION status effect (preferred — one read point), or add a second check in loseMP. Restore `value: 20` in Laat me chillen and `value: 20/30` (resilient >= 2 → 30, else 20) in FF Haaltje Nemen.
3. **WELLOE_SHIELD** (STUB-03): In `src/engine/victoryChecker.js`, before sending a Mosje to the Welloe pile, check `statusEffects` for `WELLOE_SHIELD` with `turnsLeft > 0`. If present, skip the knockout, keep Mosje at 1 MP, decrement turnsLeft. Restore `value: 1` in Mosje Shield push site.
4. **negateNextSearch** (STUB-04): In `src/engine/turnManager.js` draw logic, check `opponent.snelleFlags.negateNextSearch` before a search/draw triggered by opponent. If set, cancel the draw and clear the flag. (Regular turn draw is NOT negated — only opponent-triggered searches/draws.)
5. **FF Haaltje Nemen undefined variable** (STUB-06): Remove the `console.log` line referencing undefined `reduction`, or reintroduce `const reduction = resilient >= 2 ? 30 : 20;` before the push (was removed in the previous zeroing fix).

### Wave 2 — Flag wiring (medium complexity)
6. **doubleNextPiecie** (STUB-05): In the piecie activation path in `src/engine/turnManager.js` (or wherever piecie effects are dispatched), after resolving a piecie effect, check `snelleFlags.doubleNextPiecie`. If set, re-invoke the same piecie effect function a second time on the current state, then clear the flag. This is the Double Trigger card.
7. **Dingetje Toch** (STUB-07): In the piecie play requirement checker, check `activeSlot._dingetjeTochActive`. If set, allow this activation regardless of normal play conditions, then clear the flag. Document the exact piecie requirement check location in the plan.
8. **SNOEIERTJE_COST cleanup** (STUB-08): The push `{ type: 'SNOEIERTJE_COST', value: -15, turnsLeft: 1 }` in `piecieEffects.js:265` is dead — `player.questBonusMP` already does the real work. Remove the dead push entirely. No functional change, just cleanup.

### Wave 3 — Place/context mechanics
9. **Dierenasiel cost-waiver** (STUB-09): The 25% MP loss reduction via `dierenasielActive` already works in `loseMP()`. The missing piece is: when `dierenasielActive` is true AND a player wants to activate a PET-tagged ability with 0 MP, the activation guard should pass (not block for insufficient MP). Move this guard from UI-side check to the ability activation path in `mosjeAbilities.js` or `turnManager.js`.
10. **Synergy Chamber cost/duration reduction** (STUB-10): When Synergy Chamber is the active place, ability activation costs should be reduced (per JSDoc). Wire: in the ability activation caller, read `gameState.currentPlace` for `synergy_chamber` and apply cost offset before deducting. Document exact cost reduction value (check placeEffects.js JSDoc).

### Wave 4 — UI-gated interactions (require selection modal)
These all need the existing SelectionModal pattern (or a simpler inline selection). Plan them together since they share the same UI primitive.

11. **Bagga of Greed** (STUB-11): Draw 2, then open SelectionModal asking player to pick one card to discard. The `_baggaDiscard = true` flag is already set — add the SelectionModal trigger in the UI handler that checks this flag after card resolution.
12. **Welloe Force redirect** (STUB-14): After discarding 1 card, open SelectionModal asking player which target to redirect the next incoming damage to. Set the target in state for the `_welloeForceActive` flag consumer to use. Note: current flag consumer location must be found first.
13. **MP Adjuster** (STUB-15): Remove hardcoded `mp = 50`. Open a numeric input dialog (or range SelectionModal with options: 20/40/60/80/100) to let player choose. Set chosen value.

### Wave 5 — Complex/deferred with explicit documentation
14. **Emergency Swap** (STUB-12): Full ability-copy requires knowing the opponent's Mosje's ability function at runtime. This is the most complex stub — it requires an ability registry lookup. Options: (a) implement if an ability registry exists in mosjeAbilities.js; (b) defer with explicit reason "requires ability registry — deferred to UI/registry phase." The plan should investigate first, then implement or document.
15. **Huisbaas** (STUB-13): Destroy active Place and search deck for a new one. Requires deck search primitive (check if `searchDeck` exists in turnManager.js). If it does, wire it. If not, defer with explicit reason.
16. **FPS West + Ronald Chef hand reveal** (STUB-16): `opponentHandPeeked` / `_ronaldPeek` flags are set. Wiring requires the UI to render opponent's hand face-up temporarily. This is a UI-layer concern. Defer with explicit reason "requires opponent hand reveal UI primitive — deferred to UI phase." Add DEFERRED comment at each flag set site.

## What NOT to do
- Do not add features beyond wiring the existing stubs to their intended behaviour.
- Do not change any card's intended effect magnitude (e.g. do not increase Tikker's +40 MP).
- Do not implement new UI primitives from scratch — if a stub requires a net-new UI primitive that doesn't exist (hand reveal, custom numeric input), defer it with a comment and move on.
- Bagga, Welloe Force, and MP Adjuster should reuse the existing `SelectionModal` component.

## Testing requirements
- After each wave, run `npm test` — must stay green before moving to next wave.
- After Wave 1, run the simulation (`node --loader ts-node/esm src/simulation/run-once.ts`) to verify no new crashes.
- Add at minimum one test per stub that proves the effect is now applied (e.g., a Mosje with MP_LOSS_HALVED active should take half the expected damage).
- Update `docs/card-reference.md`: change implemented stubs to `implemented`; add `// DEFERRED: <reason>` for deferred items.

## Key file locations
- MP loss logic: `src/engine/mpManager.js` — `loseMP()` function
- Snelle flags: `src/engine/turnManager.js`, `src/engine/mpManager.js`
- Victory/knockout check: `src/engine/victoryChecker.js`
- Ability effects: `src/abilities/piecieEffects.js`, `src/abilities/snelleEffects.js`, `src/abilities/mosjeAbilities.js`, `src/abilities/placeEffects.js`
- Card reference: `docs/card-reference.md`

</decisions>

---

<canonical_refs>
- `docs/card-reference.md` — authoritative list of card status (partial/implemented/deferred)
- `docs/phase0-rulings.md` — canonical game rules (check before changing any mechanic's magnitude or timing)
- `src/engine/mpManager.js` — loseMP(), gainMP(), applyStatusEffectMP()
- `src/engine/turnManager.js` — piecie activation, draw logic, snelle flag consumption
- `src/engine/victoryChecker.js` — knockout/elimination checks
- `src/abilities/piecieEffects.js` — all push sites for status effects
- `src/abilities/snelleEffects.js` — snelle flag set sites
</canonical_refs>

---

<code_context>
- `applyStatusEffectMP()` in mpManager.js (lines ~204-224): iterates statusEffects and applies non-zero value effects each turn. KLEINE_TAKS, CONTINUOUS_ASSAULT, HEMORRHAGE, DRAIN already work through this generic loop because they have non-zero values.
- `loseMP()` in mpManager.js: the correct insertion point for MP_LOSS_HALVED and MP_LOSS_REDUCTION checks — runs before the actual MP deduction.
- `dierenasielActive` flag pattern (mpManager.js): shows the existing pattern for place-driven MP reduction — MP_LOSS_HALVED / MP_LOSS_REDUCTION should follow the same pattern.
- `negateNextElimination` in victoryChecker.js (line ~94-97): working example for how to check a snelle flag before a game-state transition — WELLOE_SHIELD should mirror this pattern.
- SelectionModal component in `src/ui/`: existing generic selection UI — reuse for Bagga, Welloe Force, MP Adjuster.
</code_context>

---

<deferred_ideas>
- Full opponent hand reveal UI (FPS West, Ronald Chef) — deferred to a dedicated UI phase
- Ability registry for Emergency Swap copy mechanic — investigate in plan, likely defer
- Welloe linked-summon primitive (Call of the Welloes) — deferred, requires new engine primitive
- send-to-bottom deck primitive (Jammertje Gepakt advanced behaviour) — deferred
- Snelle Jensen source-card discard on negate — deferred
- Snelle Frenssen counter-chain caller targetRef resolution — deferred to UI
</deferred_ideas>
