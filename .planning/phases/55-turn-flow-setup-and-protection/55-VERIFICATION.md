---
phase: 55-turn-flow-setup-and-protection
verified: 2026-10-11
status: passed
score: 5/5 success criteria verified
---

# Phase 55 Verification

**Goal:** A 2.0 game sets up and runs turn by turn under the 2.0 flow, with every V4 leftover rule gone.

| # | Success criterion | Status | Evidence |
|---|---|---|---|
| 1 | Setup: free fresh start Mosje, 3 cards, 2 Energy, 3 Quests, high die first, P1 3 / P2 4 cards | VERIFIED | tests/engine/setup-2-0.test.ts, turn-steps.test.ts (E11) |
| 2 | Summon pays Energy, fresh, max 2; R1 empty-field cheapest Mosje, deck shuffled after search | VERIFIED | summon-cost.test.ts (E2), empty-field-r1.test.ts (E9) |
| 3 | Deck-out shuffles discard (not Welloe pile); cooldown turn allows only face-down Piecies | VERIFIED | cooldown-turn.test.ts (E21) |
| 4 | Fresh protection, level-up protection, Places ignored, triggers fire, "this turn" boosts expire | VERIFIED | fresh-protection.test.ts, fresh-ignores-places.test.ts, entry-protection.test.ts, level-up.test.ts, turn-steps.test.ts |
| 5 | Level 0, MP costs, first-turn lock, 4th slot, 6-card hand, active Mosje gone | VERIFIED | v4-leftovers-removed.test.ts and no-level-zero.test.ts static guards; grep of src finds no skipNextTurn or first-turn lock |

Requirements RULE-05, RULE-06, RULE-07, RULE-08, RULE-10 and TABLE-01 are claimed by the plans and are marked Complete in REQUIREMENTS.md. No orphaned requirements.

## Checks run
- `npm test`: 113 files, 1144 tests, all passed.
- `node --check` on all 6 UI files: clean.

## Open item: tests/ui/cards/cardv1-hand.spec.js (230px text collision)
**Pre-existing, not caused by Phase 55.** Run in a temporary worktree at 8c90525 (before Phase 55 code) and on the current branch: both fail with the same 5 colliding cards (mosje_martin_historian, mosje_martin_senor_west, piecie_bowie_stormey, piecie_tony, piecie_gekke_vogels). The 180px test passes in both. It is a card-face text layout issue (Phase 62 territory). The worktree and server were removed.

## Anti-patterns / human items
None blocking. Phase 56-58 known gaps are out of scope.
