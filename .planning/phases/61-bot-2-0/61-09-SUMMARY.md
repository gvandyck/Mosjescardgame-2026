---
phase: 61-bot-2-0
plan: 09
requirements: [BOT-01, BOT-02, BOT-03, BOT-04]
requirements-completed: [BOT-01, BOT-02, BOT-03, BOT-04]
commits: [7ed8f20, c711bb7, f2a1d6d]
duration: 55 min
completed: 2026-10-18
---
# Phase 61 Plan 09: Seeded legality proof, full suites, docs and ticks (BOT-01..BOT-04)

- `tests/bot/bot-legality.test.ts` (on the 61-08 `runSeededBotGame` helper): 15 seeded games (6 ordered pairings of the 3 Example Decks x 0xB07A / 0xB07B, plus 3 Delluft games at 0xDE1F). All 15 finish, 0 `engine-refused`; per step: Energy an integer 0-6, every attack checked with `canMosjeTakeAction` / `isFresh` / `isValidAttackTarget` on the state before it, a cooldown turn only has `place-piecie` / `end`, no face-down Piecie into the last free slot while a reaction Snelle is held. Coverage over the 15 games: 47 summons, 307 Piecie placements, 238 activations (126 cost Energy), 15 Places, 9 own-turn Snelle, 380 attacks (110 finished a getemt), 198 Quests, 50 reactions played, 10 Delluft fee payments. Mutation check: ignoring the reaction slot fails 14 tests; ignoring the cooldown turn fails 2. No bot defect was found, so no `src/bot/` change.
- Full headless card suite (temp config, 1920x1080, workers 1, 423 tests): 420 passed, 3 red. Compared on 1152618 in a temporary worktree: `cardv1-hand` (230px text collides) and `cardv1-piecie` (440x660 desc vs info line) are red there too (known, Phase 62). `snelle-cards-2-0` "snelle_frenssen" was green on 1152618 and is a NEW Phase 61 regression, deterministic on this branch: 61-07's `pickDefensiveSnelle` deliberately passes Jensen! for a 40 MP Level 1 Mosje hit by Affoe (-15), but the Phase 60 case needed the bot to play it (received 25, expected 15). Fixed in the card test fixture, not in the bot: the bot Mosje is now Level 3 at 70 MP (a danger case), expected 70 - 10 - 15 = 45 plus a level 3 assert; all other assertions are unchanged. Green after; the Snelle card and chain specs pass 36/36. Temp configs, worktree and test-results dir deleted, no browser or server process left.
- `npm test` 164 files / 2074 green; `node --check` clean on src/main.js and all 45 src/bot files, one command per file. No sim, no push.
- Docs: `src/bot/strategy/README.md` rewritten for 2.0 (file table, only-the-table-view rule with `no-hidden-info.test.ts`, `bot-legality.test.ts`; V4 text deleted). ROADMAP gap lines marked closed (60-02 Drain Reversal, 60-05 / Phase 59 Skiffa, 61-02 / 61-06 Delluft). BOT-01 and BOT-03 ticked (BOT-02 / BOT-04 were already complete from earlier plans); all four rows Complete.
- OPEN ENGINE GAPS, for Gandalf to decide (kept in `deferred-items.md` and the ROADMAP Phase 61 notes; neither is in the seeded games): (1) Drain Reversal's rider can send the attacker sideways, so the held attack replays with "This Mosje cannot act" and the whole reaction is refused (9 of 1800 sweep games). (2) Perfect Dodge on a sideways 0 MP Level 1 target: `_pendingWelloe` is already set, the Snelle sweeps the Mosje away and the held attack fails with "Invalid attack target" (1 of 1800). Also open, not a refusal: the bot never uses draw-step abilities (Coert Tech, Martin Historian).
- Deviations: STATE.md was updated through `gsd-sdk query` as the orchestrator asked, although the plan's executor line says not to. Trailer is Sonnet 5.5 (orchestrator rule), not the plan's Opus 5.5. The plan did not set a viewport; 1920x1080 was used per the orchestrator.

## Self-Check: PASSED
