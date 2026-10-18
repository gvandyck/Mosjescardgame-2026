---
phase: 60-snelle-places-and-hidden-information
verified: 2026-10-18T01:20:00Z
status: passed
score: 4/4 roadmap success criteria verified (the one Void defect found was closed in-session; the 3 open rule questions were ruled by Gandalf 2026-10-18 and implemented)
overrides_applied: 0
re_verification: false
gaps: []
gaps_closed:
  - truth: "The Void blocks Emergency Healings (Piecies and Snelle can't make a Mosje gain MP)"
    fix: "src/engine/mp/voidBlocksGain.js (shared check, used by gainMP and emergencyHealingsStep.js)"
    tests: "tests/abilities/snelle-protect-dice.test.ts (failed first: 35 vs 10) + place_the_void registry case in tests/ui/cards/place-registry-2-0.js (failed without the step fix: 65 vs 30)"
human_verification: []
---

# Phase 60: Snelle, Places and Hidden Information - Verification Report

**Phase Goal:** Every Snelle and Place works as the Card List says, hidden-info cards only reveal to the right player, and every card in the game has a card test.
**Verified:** 2026-10-18 on branch obby-2.0, HEAD 436d1d2
**Status:** passed (one small rule defect found and closed in-session, see Gap closure; everything else holds)
**Re-verification:** No, initial verification

Source of truth for card text: `docs/obby-2.0/Obby Card Game 2.0 - Card List.md`. `/_archive/` was not read. `npm run test:sim` was not run.

## Goal Achievement

### Observable truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 20 Snelle work as the Card List says, incl. Jensen! -> Frenssen! -> Blensen! (free after a Jensen!), Harde Didde / Klaar Met Jou answered by Not Today! and Jensen! | VERIFIED | Effects read against the table in `src/abilities/snelle/*.js`: Momentum Rush +15, Bijna Welloe only at <=10 MP then +20, Ff Haaltje draw 2, Chillingsvoorbij last Place, Jantje? Bank Chilling only, Emergency Healings 25/35 before the loss, Protector -30, Perfect Dodge -20/-30 with Needs Physical 2, Drain Reversal -20 plus a fixed 10, Not Today! keeps sideways and lifts to 5, Lucky Coin, Sleutelpuntje, Je Weet Niet, Counter Strikka, Jammertje (Piecie-only, to deck bottom), Dubbele Temminks, Gevalletje, Jensen!, Frenssen!, Blensen!. `snelleConditions.js` gates Needs/Only-if before Energy is paid and `getEligibleReactions` hides unmet Snelle; Protector `limitPerDeck: 1`; Blensen! costs 0 when `jensenPlayedTurn === turnNumber` else 4 (`getSnelleCost.js`), shield in `isShielded.js`, `stays: endOfTurn`. Headless 11/11 green: `snelle-chains-2-0.spec.js` (Jensen! -> Frenssen! -> Blensen! with Blensen! free, the bot's Frenssen! costing the Jensen! player 10, Affoe fizzled, Blensen! left in its slot; Harde Didde and Klaar Met Jou each answered by Not Today! and by Jensen!) plus the Emergency / Protector / Jensen / Frenssen / Blensen / Dubbele registry cases. |
| 2 | All 20 Places work as the Card List says; Momentum Stabilizer caps a 40 hit at 30; fresh Mosjes ignore both sides | VERIFIED (1 defect found, closed in-session, see Gap closure) | Power (`placePower.js`), dice (`questDiceSources.js`), turn start (`placeTurnStart`), Quest MP (`placeQuestBonus`, added after Michelle's double), Skiffa reroll, Tesla destroy, DGS draw, costs (`getEffectiveCost.js`, `delluftFee.js` inside `payEnergy`), Stabilizer cap (`momentumStabilizerCap.js`, after the reducers, skips fresh), Zo is Natuur, Welloe Graveyard (-1 on Harde Didde / Klaar / Elimination Strike, `canLeaveWelloePile`), Synergy Chamber all match the table. Headless 24/24 green on the Stabilizer / Synergy Chamber / Welloe Graveyard / Delluft / Dierenasiel / Skiffa / Void / Caravan / Tesla cases, including "attack of Power 40 takes 30 (80 -> 50)"; `place-play.spec.js` green. **Defect:** The Void does not stop Emergency Healings (see Gaps). Open rule question: staying-Piecie start-of-turn gains (`payStaysStartGain`, source `STAYS_START`: Bowie & Stormey, Gekke Vogels) are not blocked by The Void either; the Card List does not say whether a staying Piecie's later gain counts, so this is not asserted as a failure. |
| 3 | Ronald, FPS West, Stookerino, Jantje, Chef's Special, Those Eyelashes reveal only to the entitled player | VERIFIED | `revealCards` / `getRevealedFor` keep `state.revealed[viewerId]` per viewer with stale turns dropped; all six cards write through it (`ronaldChefStrategicInsight`, `fpsWestGuess`, `fpsWestRevealHand`, `utilityDrawPiecies` Stookerino, `attackRevealPiecies` Jantje, `mpPiecies` Chef's Special only with Ronald). `showNewReveals.js` (called from `renderFromState`) shows only `getRevealedFor(state, localPlayerId)`. Bot: `defaultAbilityInputs` reads the opponent hand only via a reveal or the peek ability itself (unit test with a throwing hand getter). Those Eyelashes: the hand owner picks their own discard and `_snelleBlocked` is set. `hidden-info.test.ts` (11) is in the green `npm test`; `hidden-info.spec.js` 4/4 green headless (human sees the Chef's Special reveal; Stookerino's pick modal is the reveal; the bot's Ronald shows the human nothing; the bot's Eyelashes gives the human their own pick). Note: Chef's Special reveals only the opponent's Piecies while the text says "look at your opponent's hand"; that under-reveals, it never leaks. |
| 4 | Every Card List card has a card-test-library entry, incl. all section 6b must-haves, and the card suite is green | VERIFIED (apart from the two known cardv1 reds) | `tests/meta/card-coverage.test.ts` asserts 32+38+73+20+20 = 183 against the data and the five registries (green in `npm test`). My own count of the registries: 32 / 38 / 73 / 20 / 20 cards with 53 / 93 / 107 / 31 / 64 cases. Section 6b all present: Ronald Kip + Chef + Amplifier (`piecie-registry-2-0.js` ~l.293-322), Harde Didde / Klaar Met Jou Level 2 gate + MP limit (45 / 35 MP cases) + Not Today! / Jensen! (chains spec), Jensen! -> Frenssen! -> Blensen!, Jisca + DDR Chris chain (`mosje-chains-2-0.spec.js`), Leipe Swap, Stabilizer 40 -> 30, Synergy Chamber. `fixme-reasons.test.ts` rejects any skip naming Phase 59/60. Two cardv1 specs are red, both pre-existing (item a). |

**Score:** criteria 1, 3, 4 verified; criterion 2 verified except for one defect.

### Requirements traceability

| Requirement | Plans claiming it | REQUIREMENTS.md | Status |
|-------------|-------------------|-----------------|--------|
| EFX-03 (Snelle, incl. chain) | 60-01, 60-02, 60-03, 60-08 | `[x]`, Phase 60, Complete | SATISFIED |
| EFX-04 (Places) | 60-04, 60-05, 60-06, 60-08 | `[x]`, Phase 60, Complete | SATISFIED (the Void + Emergency Healings defect was closed in-session) |
| EFX-07 (hidden info) | 60-07, 60-08 | `[x]`, Phase 60, Complete | SATISFIED |
| TEST-02 (every card except the 38 Quests has a card-test entry) | 60-08 | `[x]`, Phase 60, Complete | SATISFIED (the 38 Quest cases are extras; the requirement excludes Quests) |

All four IDs from the PLAN frontmatter are in REQUIREMENTS.md. No other requirement is mapped to Phase 60, so there are no orphans.

### The three items you asked about

**(a) cardv1-hand (230px) and cardv1-piecie (440x660) are pre-existing: CONFIRMED.** I extracted `161dfb4` with `git archive` and ran both specs headless there. The same two tests fail with identical output: `mosje_martin_historian`, `mosje_martin_senor_west`, `piecie_bowie_stormey`, `piecie_tony`, `piecie_gekke_vogels` collide at 230px, and `piecie_bowie_stormey` desc is not clear of the info line at 440x660. The same two fail at HEAD. The cards are Mosjes/Piecies from Phases 58/59. Phase 60 changed no card-face file: `git diff 161dfb4 HEAD` in `src/ui` touches only `actionAnimations.js`, `settleReactions.js`, `handRenderer.js` (Caravan hint) and `showNewReveals.js`, no CSS/HTML, and in `src/data` only `snelle_blensen.reactionMoments`. They stay red until the Phase 62 card faces, as the SUMMARY says.

**(b) VIS-02 `setHand('player_2', [])` pin: LEGITIMATE ISOLATION, not a weakened test.** `git diff 161dfb4 HEAD -- tests/ui/mechanics.spec.js` is one added line plus a comment; every assertion is unchanged (swapped MP 90/5, MP kept after two end-turns and within 50-100, log mentions Leipe). The test is about Leipe Swap's permanence. Since Phase 60 the bot's Jensen! really cancels a Piecie that targets its Mosje (the test deck holds 2), so the bot's random hand decided the outcome; pinning the hand removes an unrelated variable, and Jensen! cancelling a Piecie has its own specs (snelle-chains, registry). Caveat on stability: at HEAD I got 26 of 27 passes (9/10, 14/14, 3/3 before a rate-limit abort); the one failure happened at the first `endTurnAndWait`, before the pin, when the bot killed the human's 0-MP opening Gandoe in its first turn ("Defeat: no Mosje left"). At 161dfb4 I got 14/14 (the executor reported 30/30). One in 27 cannot separate a Phase 60 effect from an old rare flake, so "30/30 now" is not fully reproducible, but it is not caused by the pin and not a Leipe Swap problem.

**(c) Klaar Met Jou draws 1 with no legal target: OPEN RULE QUESTION, not a failure.** `effect_klaar_met_jou` is `drawFromEffect(sendToWelloe(...), pid, 1)` and draws unconditionally. The Card List says only "Send one opponent Mosje with 30 MP or less to the Welloe pile. Draw 1 card." and is silent about no legal target. The registry case for a 35 MP target asserts the Welloe pile (0) and the MP (35) but deliberately not the hand delta, with a comment saying so. It needs a Gandalf ruling in the Card List Rulings section.

## Required artifacts and wiring

| Artifact | Status | Details |
|----------|--------|---------|
| `src/abilities/snelle/*.js`, `src/engine/snelle/*`, `src/engine/reactions/*`, `src/rules/snelleConditions.js` | VERIFIED | substantive; wired through `runSnelleEffect`, `resolveReaction`, `getEligibleReactions` and the loss steps |
| `src/abilities/place/placePower.js`, `placeTurnQuestEffects.js`, `src/engine/energy/*` | VERIFIED | wired: `getPower`, `turnManager` (placeTurnStart, getEffectiveCost), `payEnergy` (Delluft), `resolveQuestAttempt`, `rollQuestAttempt`, `afterPiecieEffect`, `victoryChecker` |
| `src/engine/hidden/*`, `src/ui/showNewReveals.js` | VERIFIED | wired in 5 ability / Piecie files, the bot input rule and `main.js` renderFromState |
| `tests/ui/cards/{snelle,place,quest}-registry-2-0.js` + specs, `tests/meta/card-coverage.test.ts`, `fixme-reasons.test.ts` | VERIFIED | green |
| V4 leftovers | NOTE | `effect_emergency_healings` and `effect_ff_haaltje_nemen` V4 bodies remain in `snelleEffects.js` (kept for a legacy import; the data uses the 2.0 ids). `place_momentum_factory` is parked and untouched. Not reachable from live data. |

## Behavioral spot-checks (headless, temporary config, port 5500)

| Run | Result |
|-----|--------|
| `npm test` | 155 files, 1678 tests passed |
| `node --check` on main.js, each ui file, actions/*, showNewReveals, hidden/* | clean |
| snelle-chains-2-0 + Emergency / Protector / Jensen / Frenssen / Blensen / Dubbele cases | 11/11 |
| place-cards-2-0: Stabilizer, Synergy Chamber, Welloe Graveyard, Delluft, Dierenasiel, Skiffa, Void, Caravan, Tesla | 24/24 |
| hidden-info.spec.js, place-play.spec.js, snelle-reaction.spec.js | 10/10 |
| cardv1-hand + cardv1-piecie at HEAD and at 161dfb4 | same 2 reds both times |
| VIS-02 repeats | HEAD 26/27, 161dfb4 14/14 |
| Read-only node probe: Void + Emergency Healings | gain not blocked (gap, since closed) |

The full 422-test run was not repeated (as instructed). The SUMMARY's 419/422 is consistent with the 2 cardv1 reds plus the pre-fix VIS-02.

## Anti-patterns and notes

| File | Finding | Severity |
|------|---------|----------|
| `src/data/snellePiecies.js` | `requirement` metadata is wrong for display: Jammertje Gepakt! is `mental3` (Card List: Needs Mental 2), Lucky Coin is `any` (Needs Creative 1), Dubbele Temminks `level1` (no such need). Only the card-face info line reads it (`getRequirementText`); the real gate is `snelleConditions.js`, so behaviour is right. | Warning (fix with the Phase 62 card faces) |
| bot vs Delluft | The bot's affordability check ignores the parking fee; the engine refuses safely. Already logged in ROADMAP for Phase 61. | Info |
| files changed 161dfb4..HEAD in `src/` and `tests/` | No TBD / FIXME / XXX marker and no `test.fixme` / `skip` (grep clean). | Info (clean) |

## Gap closure (orchestrator, 2026-10-18)

The Void defect was reproduced by the verifier's probe and then fixed inline (small, unambiguous Card List text):
- `src/engine/mp/voidBlocksGain.js` is the single Void check (non-fresh Mosje, source PIECIE or SNELLE). `gainMP` and `emergencyHealingsStep` both call it; the Snelle is still spent and the loss still lands.
- Failing-first: `snelle-protect-dice.test.ts` "Emergency Healings gives 0 MP under The Void" failed with 35 (expected 10), now passes; the new `place_the_void` registry case (Tuk Healer 50 MP, attack of Power 20, Emergency Healings -> 30) failed with 65 without the step fix and passes with it.
- After the fix: `npm test` 155 files green; place_the_void 4/4 and the Snelle Emergency Healings case green headless. The verifier did not re-run after the fix.

## Gaps summary

1. ~~The Void does not block Emergency Healings~~ CLOSED (see above).
2. Rule questions, all ruled by Gandalf 2026-10-18 (Card List "Rulings"): Klaar Met Jou with no legal target still draws 1 (no change); The Void also stops a staying Piecie's start-of-turn gain (`STAYS_START` added to `voidBlocksGain`, unit test failed first); Chef's Special with Ronald reveals the whole opponent hand (`mpPiecies.js`, unit + hidden-info.spec test updated).
3. Rare VIS-02 flake (1 in 27 at HEAD, before the pin, unrelated to Leipe Swap).

---

_Verified: 2026-10-18_
_Verifier: Claude (gsd-verifier)_
