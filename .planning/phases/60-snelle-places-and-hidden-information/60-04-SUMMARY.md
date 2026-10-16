---
phase: 60-snelle-places-and-hidden-information
plan: 04
requirements: [EFX-04]
commits: [be7a446, b22f3c5]
---
# Phase 60 Plan 04: Place Power in getPower

- `src/abilities/place/placePower.js` `placePowerBonus(state, slot, ownerId)`; `getPower(slot, state, ownerId)` adds it before rounding and the floor at 0. Gym / Boxing Ring (Gandoe +20) / De Box / Arcade / Skiffa / Bank Chilling / Drain Zone / Dierenasiel (-10 without a face-up staying pet Piecie); fresh Mosjes get nothing. `attackMosje` and the bot's `chooseMosjeAction` pass state, so attacks and bot choice use the same number.
- Removed: `drainZoneBonus` (Drain Zone gap closed) and the V4 MP bodies of Boxing Ring, De Box, Arcade, Drain Zone (dispatcher cases are now no-ops; `effectId` strings stay in `places.js` because deck-balance tests assert them).
- Test hook `getMosjePower`, `expect.power`, trigger `none`, setup `fresh` and `stays` for `setPiecieOnField`; `place-registry-2-0.js` + `place-cards-2-0.spec.js`: 8 Places, 29 cases green headless (incl. Gym attack 20 -> 30). `places-power.test.ts` (9). npm test 152 files green, node --check clean.
- Deviations: (1) `hasWord` in `questDiceSources.js` split on whitespace so "Gandoe," / "Michelle," never matched; now splits on non-letters (same fix in placePower). (2) Deleted V4-rule tests: `place-arcade.test.ts`, `place-de-box.test.ts`, De Box block in deck-balance, `effect_boxing_ring` block in physical-equipment-scaling, Drain Zone MP case in getemt, "Drain Zone + Stabilizer" case in loss-pipeline-order (Drain Zone cases rewritten to no-bonus).
- Unbuildable texts: none. Gym/Bank Chilling/Skiffa non-Power parts belong to 60-05; Dierenasiel 0-Energy pets to 60-06.

## Self-Check: PASSED
