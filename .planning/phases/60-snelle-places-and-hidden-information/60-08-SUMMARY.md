---
phase: 60-snelle-places-and-hidden-information
plan: 08
requirements: [TEST-02, EFX-03, EFX-04, EFX-07]
commits: [1a10934, d7936aa]
---
# Phase 60 Plan 08: Close-out

- Quest card tests: `quest-registry-2-0.js` (38 Quests, 93 cases from the Card List tables: win, fail + token, extra die, jab, paid cost, "no attempt" gates; 6 Example Deck Quests first) + `quest-cards-2-0.spec.js`, all green headless. TEST-02 text excludes Quests (Gandalf 2026-10-16) but the plan asked for them, so they are extra. New helpers: trigger kinds `attack` / `questRefused`, quest `ids` picks, setup `oppPiecies`, `tests/helpers/questCheckKit.js`.
- `tests/meta/card-coverage.test.ts` (12 tests): 32 + 38 + 73 + 20 + 20 = 183 asserted, every id has a registry case, no unknown / parked / cut id, Example Deck cards first per registry (Place registry now sorted Example first). Section 6b: all must-haves existed except the MP limits, added for Harde Didde (45 MP) and Klaar Met Jou (35 MP).
- Deleted (V4 Snelle, replaced by snelle-registry-2-0): `tests/ui/cards/card-registry.js`, `card-test-runner.js`, `snelle-effects.spec.js`. chain-7 Eendjes Voeren rewritten on the 2.0 text and re-enabled; place-play Drain Zone gap replaced by +10 Power asserts; `fixme-reasons` guard accepts only Phase 61+ with a reason; `grep` finds no open Phase 60 fixme/skip.
- Full headless run (422 tests): 419 pass, 3 fail. cardv1-hand (230px) and cardv1-piecie (440x660) fail identically on 161dfb4 (Mosje/Piecie text collisions, pre-existing). VIS-02 was a Phase 60 regression, not old flake: 30/30 on 161dfb4, 5+/30 failed on this branch because the bot's Jensen! now really cancels a Leipe Swap that targets its Mosje (log: "Bot: cards in hand -1"). Fixed by pinning the bot hand empty in that test; 30/30 now.
- `npm test` 155 files / 1678 green. EFX-03, EFX-04, EFX-07, TEST-02 ticked in REQUIREMENTS.md.
- KNOWN GAPs: the two cardv1 specs stay red until the Phase 62 card faces (not hidden). Open rule question: Klaar Met Jou still draws 1 when no opponent Mosje is a legal target; the Card List is silent, so it is not asserted.

## Self-Check: PASSED
