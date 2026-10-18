---
phase: 61-bot-2-0
verified: 2026-10-18T18:45:00Z
status: human_needed
score: 4/4 roadmap success criteria verified (no blocker; the Delluft known gap is closed; 3 warnings and 1 Gandalf decision are open)
overrides_applied: 0
re_verification: false
gaps: []
human_verification:
  - test: "Decide what to do with the two open engine gaps (Drain Reversal rider vs the attacker, Perfect Dodge vs a sideways 0 MP Level 1 target). Recommendation: do NOT block Phase 61; schedule one small engine gap-closure before the Phase 64 deploy, and rule what Drain Reversal does when its rider sidelines the attacker."
    expected: "A Gandalf ruling for Drain Reversal (attack fizzles, or the attack still lands) and a place in the roadmap for the fix. Reproduction seeds are in this report."
    why_human: "The Drain Reversal case needs a rule ruling; scheduling is a planning decision. Neither is a bot defect (a human hits the same engine refusal)."
  - test: "Optional playtest: play 2-3 turns against the bot at 1920x1080 (attack/Quest choices, a reaction window with a Snelle in your hand, the bot answering your Piecie)."
    expected: "The bot does not look broken or suicidal; its reaction answers appear; no frozen window."
    why_human: "'Sensible' play is partly a feel judgement. The code-level checks below cannot judge it; I did not run Playwright (told not to)."
---

# Phase 61: Bot 2.0 Verification Report

**Phase Goal:** The bot plays legal, sensible 2.0 games against a human or another bot.
**Verified:** 2026-10-18 on branch obby-2.0, HEAD 7c16be4
**Status:** human_needed (all 4 roadmap criteria hold in the code; no blocker; open items are one Gandalf decision and three warnings)
**Re-verification:** No, initial verification

Source of truth for card text: `docs/obby-2.0/Obby Card Game 2.0 - Card List.md`. `/_archive/` was not read. `npm run test:sim` and Playwright were not run (instructed). SUMMARY claims were not used as evidence; every claim below was checked in code, by a test run, by a reverted mutation, or by a read-only probe in the scratchpad.

## Goal Achievement

### Observable truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Each bot Mosje chooses attack or Quest by best expected MP swing, finishes a getemt when it can and protects a Level 3 Mosje | VERIFIED | `src/bot/strategy/scoreMosjeAction.js`: every attack is an `attackMosje` dry-run on the table view scored as the sum of `slotWorth` before minus after over all opponent slots minus the thorns on the attacker; a Quest is `p x (gain + best jab) - (1-p) x lossWeight x loss - cost rank`; best value wins, a tie goes to the attack. `valueOfLoss`/`slotWorth` price a getemt (level drop, sideways, Welloe), so the finishing hit and the Level 3 drop outrank a plain hit (tests: "finishes a getemt ... beats a Steady Quest", "hits the Mosje it can finish, not the fat one (either slot order)", "values dropping a Level 3 above an equal hit on a Level 1"). Level 3 guard in `bestQuest`: a non-trained Quest whose failure leaves MP at or below `opponentThreat` is skipped (control case with opponent Power 20 still Quests). `orderActingMosjes` + `runActionPhase` re-ask after every action so the second Mosje finishes the getemt (driver test, both slot orders). Own-target picks route MP to a threatened Level 3 (`pickOwnSlotByRole`/`pickBotOwnTarget`), `pickDefensiveSnelle` prioritises a Level 3 in danger. In the 15 legality games: 380 attacks, 110 finished a getemt, 198 Quests. |
| 2 | Across bot-vs-bot games with all 3 Example Decks, the bot pays Energy, plays Piecies, Snelle, Places and summons only when legal and never targets a fresh or level-up-protected Mosje | VERIFIED (2 warnings) | `npx vitest run tests/bot/bot-legality.test.ts`: 16/16 green. 15 seeded games (6 ordered pairings x 2 seeds + 3 Delluft games), all FINISHED within 200 turns, 0 `engine-refused`, Energy an integer 0-6 at every step, attacker may act and is not fresh, target passes the engine's own `isValidAttackTarget` (fresh + `levelUpProtected`) on the state before the step. Coverage: 47 summons, 307 Piecie placements, 238 activations (126 cost Energy), 15 Places, 9 own-turn Snelle, 50 reactions played, 10 Delluft fee payments. **Mutation A (reverted):** the bot's attack picker allowed a target the engine calls invalid: the legality test failed (engine-refused in at least 10 of the 15 games, output was truncated) plus 8 unit tests. Note the per-step target assertion is not what trips (a refused attack never becomes a step); `engine-refused` is the real catch, and the per-step check is a redundant second line that uses the same engine helper. **Mutation E (reverted):** ignoring the Delluft fee again failed 2 of the 3 Delluft games. Independent probe, 300 fresh-seed games (seeds 7000-7049 x 6 pairings, read-only): 0 unfinished, 0 throws, 10,166 attacks, **0** invalid attack targets. Warnings: W1 (target legality is only asserted for attacks) and W2 (refusal metric has silent paths), see below. |
| 3 | A bot holding a reaction Snelle keeps a slot free and plays it when a matching reaction window opens | VERIFIED | `reactionReserve` (defender moments only) feeds `choosePieciesToPlace` (room = slots - filled - 1 while a reaction Snelle is held) and the Energy budget for activations, abilities and Places. The engine really needs the slot (`getEligibleReactions`: `filled >= PIECIE_SLOT_COUNT` returns no Snelle), so the reservation is load-bearing. Windows are real, not mocked: `reaction-bot.test.ts` opens windows with `attackMosje`/`rollQuestAttempt` and answers them through `settleReactions` + `resolveReaction` (emits `reaction-played` only when the engine accepts), driver human-window pause/resume, and 50 reactions played in the 15 seeded games (Dodge, Drain Reversal, Emergency Healings, Not Today!, Jammertje, Lucky Coin, Sleutelpuntje, DJ rerolls). Production wiring: `src/main.js` calls `driveBotTurnSteps(..., { humanIds })`, `src/ui/actions/settleReactions.js` calls `chooseReaction`. **Mutation B (reverted):** ignoring the held slot failed 4 unit tests + 14 of the 15 legality games. **Mutation C (reverted):** `chooseReaction` always passes: 12 reaction tests, the aggregate "reaction Snelle played" assertion and the seeded reaction test all failed. |
| 4 | Bot decisions read only what a player at a real table would know (no opponent hand, no deck order), guarded by a test | VERIFIED (warning W3: the guard does not cover the driver files) | `getBotView` builds a new object from public parts (opponent hand and both decks as stand-ins with only `.length` read, Quest stack decks, opponent face-down Piecie ids, `revealed[opponent]`, opponent pause/reaction options, `_pendingTargets`); the bot's own deck order is hidden too. All 29 state-taking exports in `src/bot/strategy` are covered: I cross-checked by script, every one except `getBotView`/`asBotView`/`getBotProfile` contains `asBotView(` and every one is in `TRAP_TABLE` (one trap run per export per seat, a source scan that fails on a missing or stale entry, per-file `asBotView(` presence checks, view/decision invariance). `grep` of `src/bot` for direct reads of opponent `hand`/`deck`/`revealed`/`questStacks` decks outside the view: none (own hand, own slots, array `.length` only). **Mutation D2 (reverted):** a strategy chooser reading the actor's hand through the raw state failed its trap test for both seats. **Mutation D3 (reverted): a hidden read added to `botDriver.js` (opponent hand steering `lethalPressure`) passed all 442 bot tests**, so the guard stops at `src/bot/strategy`. The current driver, `settleReactions.js` and `settleMosjePauses.js` are clean by reading, and a read-only full-turn invariance probe (392 turns of 12 seeded games, opponent hand swapped with its deck top, windows left to a "human") found 0 differing bot action sequences. |

**Score:** 4/4 truths verified. No FAILED truth, so no gap and no blocker.

### Roadmap known gap (a): bot affordability ignored the Delluft parking fee

CLOSED. `getBotPaymentCost` = engine cost function + `delluftFee`, `canBotAfford` on top; the driver pays only what it can cover; the engine's own `getEligibleReactions` now offers a Snelle only when `cost + delluftFee` is payable (`tests/engine/reaction-eligible-fee.test.ts`, 5 cases, in the green `npm test`). Mutation E proves the legality test and the Delluft games fail without it.

### Requirements coverage

| Requirement | Plans claiming it | REQUIREMENTS.md | Evidence | Status |
|-------------|-------------------|-----------------|----------|--------|
| BOT-01 | 61-03, 61-04, 61-05, 61-08, 61-09 | `[x]`, Phase 61, Complete | Truth 1; unit + driver tests; 442 bot tests green | SATISFIED |
| BOT-02 | 61-02, 61-05, 61-06, 61-08, 61-09 | `[x]`, Phase 61, Complete | Truth 2; 0 refusals in 15 seeded games and 0 invalid attack targets in 10,166 further attacks; Delluft closed | SATISFIED (see W1, W2 and the engine gaps) |
| BOT-03 | 61-06, 61-07, 61-09 | `[x]`, Phase 61, Complete | Truth 3; mutations B and C | SATISFIED |
| BOT-04 | 61-01, 61-09 | `[x]`, Phase 61, Complete | Truth 4; mutation D2 caught | SATISFIED (see W3) |

All four IDs from the PLAN frontmatter are in REQUIREMENTS.md and mapped to Phase 61; no other requirement is mapped to this phase, so there are no orphans. Process note: BOT-02 and BOT-04 were ticked early (in 61-02 and 61-01) before the evidence existed; they are backed by the final evidence now. `.planning/ROADMAP.md` line 399 still shows `61. Bot 2.0 | 0/TBD | Not started` in the second "Progress (v2.0)" table, but that whole table is stale for phases 53-64 (also Phase 60), so it is not a Phase 61 defect. STATE.md still says "EXECUTING"; that is orchestrator bookkeeping.

### Required artifacts and wiring

| Artifact | Status | Details |
|----------|--------|---------|
| `gsd-sdk query verify.artifacts` on all 9 plans | VERIFIED | 25/25 artifacts exist, substantive |
| `gsd-sdk query verify.key-links` | VERIFIED manually | the tool reported "Invalid regex pattern" for 12 links because the PLAN patterns are double-escaped (`asBotView\\(`); I grepped each of the 12 by hand: all present and used (e.g. `botDriver` -> `orderActingMosjes`/`reactionReserve`/`playSnellie`, `chooseReaction` -> `pickDefensiveSnelle`, `choosePlaceToPlay` -> `placeFit`, `getEligibleReactions` -> `delluftFee`) |
| Production wiring | VERIFIED | `src/main.js` (driver, `settleMosjePauses`), `src/ui/actions/settleReactions.js` (`chooseReaction`); only one engine file changed in the phase (`getEligibleReactions.js`, the fee) |
| Anti-patterns | CLEAN | no TBD/FIXME/XXX/TODO/HACK and no `skip`/`todo`/`fixme` in the `.js`/`.ts` files under `src/` and `tests/` changed since 1152618 |

### Changed existing tests: did any lose strength?

| Change | Verdict |
|--------|---------|
| `tests/ui/cards/snelle-registry-2-0.js` "snelle_frenssen" (61-09): bot Mosje now Level 3 at 70 MP, expected 70-10-15 = 45, plus `level: {'opp.0': 3}` | NOT weakened. The assertions that prove "Frenssen! cancels Jensen!" are intact: `players.player_2.energy 5` proves the bot really played Jensen! (6 -> 5; a bot that passes would fail the case, which is exactly how the regression showed), `own.0 30` proves my Affoe resolved, `opp.0 45` proves Frenssen!'s fixed 10 plus Affoe's 15 landed; the added `level` assertion is honoured by the runner (`tests/helpers/mosjeCardTest.js` line 24). Cost: the card test is now coupled to the bot's Jensen! policy ("only to save a Mosje in danger"); a future policy tweak will break it again. Recommendation (info): give card tests a test hook that forces the bot's reaction instead of relying on its policy. I could not re-run this Playwright case (instructed); the executor reports 36/36 snelle specs green after the change. |
| `tests/engine/no-active-mosje.test.ts` (61-05): `effect_stripje_bennies` -> `effect_te_hard_gaan` | NOT weakened. Same fixture, same `toBe(1)`; Stripje Bennies is a self-loss card in 2.0, so a "non-gain effect goes to the higher Power" case needs a real Power card. Self-loss routing is separately covered in `bot-targets.test.ts`. |
| `tests/bot/reaction-bot.test.ts` (61-07) | Mixed, acceptable. "cheapest eligible" (`toContain(pick)` only) became `toBe('snelle_negate_elimination')` (stronger). "20 MP hit on a healthy 50 MP Mosje" flipped from `toBeNull()` to `toBe('snelle_perfect_dodge')`: a deliberate policy change (20 MP is the "worth a card" line), documented in the test; the "pass on a small hit" behaviour is still asserted (10 MP loss -> null, in `pickDefensiveSnelle` and in the chooseReaction dispatcher test). Balance of that 20 MP line is a tuning call for Gandalf, not a defect. |
| `bot-energy`, `botDriver`, `reaction-bot` own-window, `no-hidden-info` choosePlaceToPlay fixtures (61-08) | NOT weakened. They give the opponent a second Mosje / a Gym board so a Place has positive fit, or make the Quest window a real one; the assertions are unchanged (`toBe('place_bank_chilling')`, `activePlace`, energy numbers). |
| `tests/engine/hidden-info.test.ts` (61-01) | NOT weakened. The throwing getter on the whole `hand` became a Proxy that throws on any card read; the hand COUNT is table information. `toBeNull()` kept. |
| `tests/bot/offlineGame.smoke.test.ts` seed bump 0xC0FFEF -> 0xC0FFF1 | Acceptable (same precedent as 54-05/56-08). `expect(sawCooldownFlag).toBe(true)` stays, so a seed that misses the cooldown path fails instead of passing silently. |
| `tests/bot/strategy.test.ts` fixture 4 -> 3 Piecie slots | Correct for 2.0 (`PIECIE_SLOT_COUNT` is 3); original assertions kept. |

### Behavioral spot-checks and probes

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Bot suite | `npx vitest run tests/bot` | 15 files, 442 tests passed | PASS |
| Full unit suite | `npm test` (once) | 164 files, 2074 tests passed | PASS |
| Mutations A, B, C, D2, E | single-file edit, run, `git checkout` | each failed the expected tests; D3 failed nothing (W3) | see Truths |
| Replay of the two sweep seeds | read-only node probe | 0xB00E (45070) CREATIEVELINGEN vs REGELAARS: 1x `resolveReaction snelle_drain_reversal "This Mosje cannot act"`; 50349 TAKSEN vs CREATIEVELINGEN: 1x `resolveReaction snelle_perfect_dodge "Invalid attack target"` | both gaps REAL |
| Independent 300-game sweep | read-only node probe | 0 unfinished, 0 throws, 0 bad attack targets in 10,166 attacks, 3 visible refusals (all Drain Reversal) | PASS |
| Hostile effect aimed at a fresh Mosje | engine log "Fresh: ... fizzled" | 0 in the 15 legality games; 14 in 300 sweep games, the 4 I inspected were Straffoe's "each opponent Mosje loses 10" (fresh skipped by design); the other 10 not inspected | no bot mis-targeting found |
| Probe + Playwright | not run (instructed); the 420/423 headless card run is the executor's claim | UNVERIFIED by me | the 2 cardv1 reds were independently confirmed pre-existing by the Phase 60 verifier on 161dfb4 |

`git status` at the end: no tracked changes, no change under `src/` or `tests/`; my probe scripts live in the session scratchpad only. Unrelated untracked repo-root files were left alone.

## The two open engine gaps (judgement)

Both are **real** and reproduce at HEAD with the seeds above; **neither occurs in the 15 legality games** (0 refusals, also when I temporarily instrumented the silent fallbacks, see W2). Neither is a bot-only problem: the bot picks a card the engine itself lists as eligible, and a human playing the same card hits the same refusal.

1. **Drain Reversal rider vs the attacker.** Engine-level repro (read-only, `makeEngineState`): the attacker is a Level 1 Mosje at 10 MP and the opponent has two Mosjes. After `resolveReaction(..., 'snelle_drain_reversal')` the engine offers the `reversal_opp` pick; answering with the attacker (the obvious punishing choice, and also option 0) fails with "This Mosje cannot act". The Snelle is already paid and gone (Energy 6 -> 4, hand empty) and the attack does not land (target MP unchanged). With a lone opponent Mosje the rider auto-targets the attacker and `resolveReaction` refuses at once. The recorded frequency (9 of 1800) is understated: the refusal metric misses the pick path, see W2; in my 300 games I counted 3 visible plus 10 silent, about 1 game in 23.
2. **Perfect Dodge vs a sideways 0 MP Level 1 target.** Window state already carries `_pendingWelloe`; playing the Snelle sweeps the Mosje away and the held attack fails with "Invalid attack target". 1 of 1800. It affects humans too, in the case where Perfect Dodge matters most. Not Today! covers the same board when it is in hand.

**Recommendation:** do not block Phase 61. The bot's goal (legal, sensible play) holds, the game continues after each refusal (the window is passed, no freeze, no crash), and the fix is in engine reaction replay (Phases 57/60 territory). Put one small gap-closure on the roadmap before the Phase 64 deploy (a decimal phase 61.1 or the start of Phase 63), with the two seeds as failing-first specs. Drain Reversal needs a Card List ruling first: when the rider sidelines the attacker, does the attack still land or fizzle? Perfect Dodge needs no ruling.

## Warnings (non-blocking)

- **W1: target legality is only asserted for attacks.** The roadmap sentence "never targets a fresh or level-up-protected Mosje" is guarded per step for attacks (and `levelUpProtected` only exists as an attack-target rule in the engine). Hostile Piecie/ability/Snelle effects at a fresh Mosje fizzle silently in the engine instead of being refused, so nothing in `bot-legality.test.ts` would notice a bot that aims at one. The bot filters fresh targets in `defaultAbilityInputs` (`!entryProtected`), `isUsefulActivation` and the engine's own pick lists, and the probes found no case, so this is a coverage gap, not a defect. Suggestion: count the `[MP] ... Fresh ... fizzled` log lines of single-target effects in `runSeededBotGame` and assert 0 outside the known all-targets cards (Straffoe).
- **W2: the `engine-refused` metric has silent paths.** `settleMosjePauses.js` ("malformed: never loop" for a refused `resolvePendingChoice` and for `finishDrawStep`) and the second failure in `settleReactions.js` drop the refusal without a metric. Temporarily instrumenting those three lines (reverted) over the 300-game sweep exposed 10 hidden refusals (`resolvePendingChoice | reversal_opp | This Mosje cannot act`) next to the 3 visible ones. The legality test's "0 engine-refused" therefore does not cover refused pause answers; in the 15 seeded games the instrumented run was still clean (16/16). Suggestion: emit `engine-refused` in those fallbacks.
- **W3: the BOT-04 guard stops at `src/bot/strategy`.** The source scan and `TRAP_TABLE` read only that directory; `botDriver.js` (it contains decisions such as `getOpponentPressure`), `settleReactions.js`, `settleMosjePauses.js` and `pickBotDeck.js` are outside it, and the driver clones the state with `JSON.stringify` on entry so it cannot run on a trap state at all. Mutation D3 proves a hidden read there passes the whole bot suite. Suggestion: extend the source scan to `src/bot/*.js` with a short allowlist for own-seat reads, or add a full-turn invariance test (the probe I used is a ready template: swap the opponent hand with its deck top, `humanIds: [opponent]`, compare the bot's action prefixes).

## Info

- The bot never picks an opponent target for a single-target Piecie (it takes the engine default: first non-fresh Mosje); only 'mosje' pause options (Snelle riders, Counter Strikka) are chosen by value. Legal, but not a "best target" pick.
- The bot never uses draw-step abilities (Coert Tech, Martin Historian); the draw step is a normal draw. Already recorded in ROADMAP/deferred-items as open, not a refusal.
- The PLAN files for 61-01..61-09 and `61-RESEARCH.md` are untracked in git (the SUMMARYs and code are committed); commit them with the phase docs.

## Gaps summary

No failed truth, no gap. Decisions and follow-ups for Gandalf: (1) rule on Drain Reversal's rider vs the attacker and schedule the two engine fixes before the Phase 64 deploy; (2) optional playtest; (3) take W1-W3 as small hardening tasks (a few lines each in `src/bot/` and `tests/bot/`), none of which changes the phase result.

---

_Verified: 2026-10-18_
_Verifier: Claude (gsd-verifier)_
