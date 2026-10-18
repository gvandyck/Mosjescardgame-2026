---
phase: 61-bot-2-0
plan: 04
requirements: [BOT-01]
commits: [c664ae7, 89f13ff, b41a794, 5de45e7]
---
# Phase 61 Plan 04: Bot action choice by expected value (BOT-01)

- `scoreMosjeAction(state, botId, slotIndex)`: attack = `attackMosje` dry-run on the table view (`skipReactions: true`), value = sum of `slotWorth` before - after over every opponent slot, minus the attacker's own loss (thorns); Quest = p x (gain + best jab) - (1-p) x lossWeight x loss - cost rank. A Level 3 drops any non-trained Quest whose failure leaves it at or below `opponentThreat`; best option wins if value > 0, a tie goes to the attack. `chooseMosjeAction` is that without the value (flat getemt bonus gone). `withQuietLog` keeps the dry-runs' engine console lines out of the console.
- `orderActingMosjes` sorts own slots by that value; driver Phase E re-asks it after every action (max `MAX_FIELD_MOSJES`), so the second Mosje finishes the getemt the first one set up. `action-skip` metric is emitted afterwards for slots never chosen; the attack metric names attacker slot and target.
- Every driver step now carries `action` (summon, place-piecie, activate, ability, place, attack, quest, end); waits have none. Jab target = highest `valueOfLoss(slot, 10)`, ties to lower MP. `EXAMPLE_TAKSEN` / `EXAMPLE_REGELAARS` / `EXAMPLE_CREATIEVELINGEN` profiles added, DUO_* kept.
- Tests: 6 value cases + 3 jab cases in `bot-actions-2-0.test.ts`, 5 driver cases (order in both slot orders, attack action shape, every step has a kind, Level 3 guard with a control), profile case. Both new traps in TRAP_TABLE (`scoreMosjeAction`, `orderActingMosjes`) incl. invariance. Mutations verified: dropping the Level 3 guard, the thorns term, the value order or the jab value each fails a test.
- Deviation (Rule 3): `offlineGame.smoke.test.ts` deck-out regression seed bumped 0xC0FFEF -> 0xC0FFF1 (same precedent as 54-05 / 56-08): the stronger bot KNOCKOUTs the passive human on turn 8 before any deck-out; assertions unchanged. The 3 bot-vs-bot Example Deck games still FINISH.
- `npm test` 159 files / 1870 green; `node --check` clean per file; no Playwright, no sim. BOT-01 stays unticked (61-05 / 61-08 / 61-09 still carry it). No KNOWN GAPs.

## Self-Check: PASSED
