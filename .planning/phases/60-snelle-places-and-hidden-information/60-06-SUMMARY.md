---
phase: 60-snelle-places-and-hidden-information
plan: 06
requirements: [EFX-04]
commits: [2eee179, 1f98ee1]
---
# Phase 60 Plan 06: Cost / loss Places

- New `src/engine/energy/getEffectiveCost.js` (Dierenasiel pets 0; Welloe Graveyard -1 for Harde Didde / Klaar Met Jou / Elimination Strike; Coert's Caravan first 1+ Piecie free per player per turn, `caravanUsedTurn`), `delluftFee.js`, `fieldHasMosjeNamed.js`. Used by `activatePiecie`, `useMosjeAbility` (fee in the affordability check) and Dubbele Ding.
- `payEnergy` adds the Delluft fee (own turn, first non-zero payment, `delluftFeeTurn`; Coert/Binti 0, Cless 2, else 1); refused whole when cost + fee can't be paid.
- The Void: `gainMP` refuses source PIECIE / SNELLE (fresh Mosjes ignore it); the V4 loss block and RESTORE/FOOD gate are gone. Stabilizer cap and Zo is Natuur reducer were already 2.0.
- Removed: all V4 `effect_*` bodies + dispatcher cases for the 8 Places, `coertsCaravanShield`, `momentumStabilizerActive`. Momentum Factory untouched.
- Tests: new places-cost-loss (Stabilizer 40 -> 30, Zo, Void), place-delluft, rewrote place-coerts-caravan / place-dierenasiel / place-the-void-cleanup / Ronald Kip Void case; registry +21 cases (all 20 Places covered, Momentum Factory excluded), headless green; added `powerBoost` option to the testMode `setMosjeOnField` hook. `npm test` 153 files / 1631 green; node --check clean.
- Deleted V4-rule tests (rule gone): phase48 `effect_zo_is_natuur` file (end-phase +10/+15), getemt "Zo is Natuur gain" case, Caravan Quest-damage shield cases, Dierenasiel dead-flag cases. `fresh-ignores-places` floor 5 -> 0 (only Momentum Factory is still an effect_*).
- Unbuildable texts: none. Note: bot affordability checks (`botDriver`) still use the printed ability cost; the engine refuses an unaffordable fee safely.

## Self-Check: PASSED
