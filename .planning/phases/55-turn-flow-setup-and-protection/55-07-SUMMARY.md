---
phase: 55
plan: 07
requirements-completed: []
key-files:
  created: [tests/ui/turn-flow-2-0.spec.js]
  modified: [tests/ui/helpers.js, tests/ui/mechanics.spec.js, tests/ui/full-game.spec.js, tests/ui/deckout-hang-repro.spec.js, tests/ui/cards/alyssa-jisca-synergy.spec.js, tests/ui/cards/gandoe-michelle-synergy.spec.js, docs/phase0-rulings.md, docs/card-reference.md, docs/developer-handoff.md, src/rules/card-specific-rulings.md]
---
# Phase 55 Plan 07: Playwright alignment, pointer docs, phase gate Summary

New headless `turn-flow-2-0.spec.js` proves E11 (setup, 3 cards for P1, 3 Energy, opponent starter fresh, P2 draws 1), E21 (deck-out gives a cooldown turn, Piecie placeable, summon refused, no hang) and E2 (summon pays Energy, arrives fresh) on the live board. The four read-first docs now point at `docs/obby-2.0/`. No `src/` changes were needed.

## Headless results (temp config, deleted; no server left running)
turn-flow-2-0 3/3, deckout-hang-repro 1/1, entry-protection 1/1, full-game 6 pass + 1 fixme, mechanics 6 pass + 5 fixme (VIS-01/02/04/06/07/08 pass), alyssa-jisca 2/2, gandoe-michelle 4 pass + 1 fixme, cardv1-hand 2 pass + 1 FAIL (230px text-collision, card-frame layout, unrelated to turn flow, not changed here).

## Changed expectations
- deckout-hang-repro: skipNextTurn replaced by cooldownTurn (then control returns to the human).
- alyssa-jisca Scenario A: delta 20 -> 10 (V4 +10 trickle removed, synergy +10 stays).
- mechanics VIS-01/02/08: guarantee the card with `setHand` (3-card hand, P1 skips first draw). helpers `readOpponentMosjes` uses the same selectors as `readOwnedMosjes` (opponent MP read -1 before).
- Comments only: first-turn lock / trickle / 6-card hand wording.

## KNOWN GAPS (test.fixme, expectations kept)
- Phase 56 (Quests): mechanics VIS-03, VIS-09; full-game "active" game (quest modal blocks the Piecie play); gandoe-michelle Scenario D.
- Phase 58 (Youri ability cost -20 MP -> Energy): mechanics VIS-05, VIS-06b, VIS-06c.

## Gate
`npm test` 113 files / 1144 tests green; node --check clean on src/main.js and the 5 UI files. No src files touched. `npm run test:sim` not run.

## Self-Check: PASSED
