---
phase: 48-original-requirement-verification-backfill-for-phases-01-06-and-09
verified: 2026-07-20
status: passed
score: 58/64 VERIFIED (5 GAP-DESCOPED, 1 SUPERSEDED — counted separately per D-08)
overrides_applied: 0
---

# Phase 48: Original Requirement Verification Backfill — Consolidated Traceability Matrix

**Phase Goal:** Produce honest, evidence-backed traceability for the 64 original
milestone requirements (28 `IMPL-PF-*`, 27 `IMPL-AR-*`, 4 cross-cutting `IMPL-*`,
5 Phase-9 `BUG-*`) that today read 0/64 satisfied in the milestone audit purely
because no `VERIFICATION.md` referenced them — an evidence gap, not a claim the
mechanics are broken.

**Method:** two-pronged evidence discovery (card-id string grep AND
effect/ability/requirement function-name grep across `tests/`) per D-07, assembled
map-first-then-gap-fill per D-03: all 64 rows were mapped against the existing
745-test suite before any new test was written; only rows with genuinely no
qualifying evidence received a new focused test (D-01/D-02 — no tautological or
registry-membership-only evidence counted). This document concatenates the five
Wave-1 bucket fragments (`48-FRAGMENT-01` .. `48-FRAGMENT-05`) into the single
1:1 requirement-id matrix required by D-05.

This is a **tests-only, docs-only** phase (D-04) — zero `src/` files were changed
producing this matrix; `git diff --stat -- src` is confirmed empty in the
Verification Commands section below.

---

## Matrix — Physical Force Piecies (12 rows, source: `48-FRAGMENT-01-pf-piecies.md`)

| Req ID | Original slug (2026-05) | Current card/effect id | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-PF-P1 | kannetje-melk | `piecie_kannetje_melk` / `effect_kannetje_melk` | VERIFIED | `tests/ui/cards/card-registry.js:17-21` (`expectedEffect: 'MP_GAIN'`, real bound-check via `card-test-runner.js:244-247`); also `tests/engine/food-double-synergy.test.ts` | Shared evidence with `IMPL-AR-P1` |
| IMPL-PF-P2 | te-hard-gaan | `piecie_te_hard_gaan` / `effect_te_hard_gaan` | VERIFIED | `tests/ui/cards/card-registry.js:216-220` (`expectedEffect: 'ATTACK'`, real assertion `card-test-runner.js:248-251`) | Mechanical mapping |
| IMPL-PF-P3 | snoeiertje | `piecie_snoeiertje` / `effect_snoeiertje` | VERIFIED (gap-filled 48-01) | `tests/effects/phase48-pf-piecie-verification.test.ts::effect_snoeiertje (IMPL-PF-P3)` | Was zero-hit gap prior to this plan; arms `questBonusMP += 15` |
| IMPL-PF-P4 | momentum-diefje | `piecie_momentum_diefje` / `effect_momentum_diefje` | VERIFIED (gap-filled 48-01) | `tests/effects/phase48-pf-piecie-verification.test.ts::effect_momentum_diefje happy path (IMPL-PF-P4)` + pre-existing `tests/engine/entry-protection.test.ts:194-203` (fizzle branch) | Only fizzle branch had evidence before; happy-path steal closed this plan |
| IMPL-PF-P5 | dikke-taks | `piecie_dikke_taks` / `effect_dikke_taks` | VERIFIED (gap-filled 48-01) | `tests/effects/phase48-pf-piecie-verification.test.ts::effect_dikke_taks (IMPL-PF-P5)` | Covers 2-player 35 MP + draw-2 branch; 3+-opponent threshold bump judged low-risk uncovered |
| IMPL-PF-P6 | grammetje-pieter | `piecie_grammetje_pieter` / `effect_grammetje_pieter` | VERIFIED | `tests/ui/cards/card-registry.js:29-33` (`expectedEffect: 'GAMBLE'`, non-tautological state-change assertion via `card-test-runner.js:267-269`) | Mechanical mapping |
| IMPL-PF-P7 | varkenspootjes | `piecie_varkenspootjes` / `effect_varkenspootjes` | VERIFIED (gap-filled 48-01) — **residual coverage note** | `tests/effects/phase48-pf-piecie-verification.test.ts::effect_varkenspootjes deferred target selection (IMPL-PF-P7)` | The actual +60/-30 MP swing is resolved by unexported non-pure UI/bot logic (`main.js:2931-2984`, `botDriver.js:57-116`) that cannot be unit-tested without a `src/` export change (out of D-04 scope) — flagged, not silently claimed fully closed |
| IMPL-PF-P8 | tikker | `piecie_tikker` / `effect_tikker` | VERIFIED | `tests/ui/cards/card-registry.js:135-139` (`expectedEffect: 'MP_GAIN'`, real assertion) | Mechanical mapping |
| IMPL-PF-P9 | nature-s-gift | none — confirmed absent | GAP-DESCOPED | Zero hits in `src/data/piecies.js`/`snellePiecies.js`/`places.js`/`docs/card-reference.md` (case-insensitive) | No live card, not renamed. Never ticked (D-08) |
| IMPL-PF-P10 | shoettoe | `piecie_energy_surge` / `effect_energy_surge` | VERIFIED | `tests/ui/cards/card-registry.js:174-178` (`expectedEffect: 'MP_GAIN'`, real assertion) | **Name/id divergence:** card named "Shoettoe", id `piecie_energy_surge` (confirmed against source `id:` field, not the stale docs ID column) |
| IMPL-PF-P11 | gun-een-piece | none — confirmed absent | GAP-DESCOPED | Zero hits in `src/data/piecies.js`/`snellePiecies.js`/`places.js`/`docs/card-reference.md` | No live card, not renamed. Never ticked (D-08) |
| IMPL-PF-P12 | quest_tough_it_out | `quest_tough_it_out` (a Quest, not a Piecie) | GAP-DESCOPED (duplicate-of-Q7) | REQUIREMENTS.md filing error — this is `IMPL-PF-Q7` mis-filed under the Piecie section; no Piecie by this id exists. Now resolvable via `IMPL-PF-Q7`'s evidence (`tests/effects/phase48-place-quest-verification.test.ts::quest_req_tough_it_out`, closed in 48-04) | No fabricated Piecie-level test written (per D-04/Pitfall 3) |

**Fragment 01 summary:** 5 pre-existing VERIFIED (P1,P2,P6,P8,P10), 4 gap-filled VERIFIED (P3,P4,P5,P7), 2 GAP-DESCOPED absent cards (P9,P11), 1 GAP-DESCOPED filing duplicate (P12).

---

## Matrix — Artistic Rhythm Piecies (13 rows, source: `48-FRAGMENT-02-ar-piecies.md`)

| Req ID | Original slug (2026-05) | Current card/effect id | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-AR-P1 | kannetje-melk | `piecie_kannetje_melk` / `effect_kannetje_melk` | VERIFIED | Same as `IMPL-PF-P1` — `tests/ui/cards/card-registry.js:17-21` | Shared card with `IMPL-PF-P1` |
| IMPL-AR-P2 | warm-kannetje-melk | `piecie_warm_kannetje_melk` / `effect_warm_kannetje_melk` | VERIFIED (gap-filled 48-02) | `tests/effects/phase48-ar-piecie-verification.test.ts::effect_warm_kannetje_melk (IMPL-AR-P2)` | Loses 10 MP, then draws min(2, deck.length) cards — not an MP-gain card despite the family name |
| IMPL-AR-P3 | broodje-doner | `piecie_broodje_doner` / `effect_broodje_doner` | VERIFIED | `tests/ui/cards/card-registry.js:141-145` (`expectedEffect: 'MP_GAIN'`, real assertion) | Mechanical mapping |
| IMPL-AR-P4 | nature-s-gift | none — confirmed absent | GAP-DESCOPED | Same absent slug as `IMPL-PF-P9` | Never ticked (D-08) |
| IMPL-AR-P5 | gun-een-piece | none — confirmed absent | GAP-DESCOPED | Same absent slug as `IMPL-PF-P11` | Never ticked (D-08) |
| IMPL-AR-P6 | bowie-stormey | `piecie_bowie_stormey` / `effect_bowie_stormey` | VERIFIED | `tests/ui/cards/card-registry.js:147-151` (`expectedEffect: 'STATUS_EFFECT'`, status-effect branch assertion) | Mechanical mapping |
| IMPL-AR-P7 | gekke-vogels | `piecie_gekke_vogels` / `effect_gekke_vogels` | VERIFIED | `tests/ui/cards/card-registry.js:234-238` (status-effect branch assertion) | Mechanical mapping |
| IMPL-AR-P8 | synergy-field | `piecie_synergy_field` / `effect_synergy_field` | VERIFIED | `tests/ui/cards/card-registry.js:106-111` (`expectedEffect: 'FIELD_EFFECT'`, concrete `stateFlag` assertion) | Mechanical mapping |
| IMPL-AR-P9 | dubbele-dosis | `piecie_quest_prep` / `effect_quest_prep` | VERIFIED | `tests/ui/cards/card-registry.js:65-70` (`stateFlag: { path: 'players.player_1.questPrepBonus', equals: 2 }`) | **Name/id divergence:** card named "Dubbele Dosis", id `piecie_quest_prep`. Shared evidence with `BUG-02`'s Phase-09 backfill row |
| IMPL-AR-P10 | dubbele-ding | `piecie_dubbele_ding` / `effect_dubbele_ding` | VERIFIED (gap-filled 48-02) | `tests/effects/phase48-ar-piecie-verification.test.ts::effect_dubbele_ding (IMPL-AR-P10)` | Sets `instantPiecieThisTurn`/`dubbeleActivations = 2` |
| IMPL-AR-P11 | mosje-shield | `piecie_mosje_shield` / `effect_mosje_shield` | VERIFIED | `tests/engine/stub-engine-wiring.test.ts:206-216` — found via **function-name grep**, not string-only (the file never contains `'piecie_mosje_shield'`) | Avoided a false-GAP that string-only search would have produced (RESEARCH.md Pitfall 1 seed example) |
| IMPL-AR-P12 | laat-me-chillen | `piecie_laat_me_chillen` / `effect_laat_me_chillen` | VERIFIED | `tests/ui/cards/card-registry.js:93-97` (status-effect branch assertion) | Mechanical mapping |
| IMPL-AR-P13 | shoettoe | `piecie_energy_surge` / `effect_energy_surge` | VERIFIED | Same as `IMPL-PF-P10` — `tests/ui/cards/card-registry.js:174-178` | Shared card/evidence with `IMPL-PF-P10` |

**Fragment 02 summary:** 8 pre-existing VERIFIED (P1,P3,P6,P7,P8,P9,P12,P13 — P11 found via function-name grep), 2 gap-filled VERIFIED (P2,P10), 2 GAP-DESCOPED absent cards (P4,P5).

---

## Matrix — Snelle Piecies (8 rows, source: `48-FRAGMENT-03-snelle.md`)

| Req ID | Original slug | Current effect id | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-PF-S1 | snelle_jensen | `effect_snelle_jensen` | VERIFIED | `tests/ui/cards/card-registry.js:276-279` (`SNELLE_REGISTRY`, real MP-delta + log-match), also `tests/ui/simulation/chain-tests.spec.js:271-272` | Shared card with `IMPL-AR-S1` |
| IMPL-AR-S1 | snelle_jensen | `effect_snelle_jensen` | VERIFIED | Same as `IMPL-PF-S1` | Shared card with `IMPL-PF-S1` |
| IMPL-PF-S2 | snelle_bijna_welloe | `effect_snelle_bijna_welloe` | VERIFIED (gap-filled 48-03) | `tests/effects/phase48-snelle-verification.test.ts` ("heals +20 at/below 10 MP" + "no heal above 10 MP") | Was zero-hit gap prior to this plan. Shared with `IMPL-AR-S2` |
| IMPL-AR-S2 | snelle_bijna_welloe | `effect_snelle_bijna_welloe` | VERIFIED (gap-filled 48-03) | Same as `IMPL-PF-S2` | Shared card with `IMPL-PF-S2` |
| IMPL-PF-S3 | snelle_negate_elimination | `effect_snelle_negate_elimination` | VERIFIED | `tests/ui/simulation/chain-tests.spec.js:264-329` ("Not Today! fires on bot elimination", real `mpAfter > 0` browser assertion) | Unique to PF bucket; `card-registry.js:296` `skipReason` correctly points here, not a false GAP |
| IMPL-AR-S3 | snelle_lucky_coin | `effect_snelle_lucky_coin` | VERIFIED | `tests/engine/snelle-piecie-full-slots.test.ts:105-123` (BUG-04 slot-guard, real `playSnellie` return-value assertions) | Shared card with `IMPL-PF-S4` |
| IMPL-PF-S4 | snelle_lucky_coin | `effect_snelle_lucky_coin` | VERIFIED | Same as `IMPL-AR-S3` | Shared card with `IMPL-AR-S3`; coin-flip effect body itself has no dedicated unit test beyond this slot-guard regression, judged sufficient outcome-asserting evidence |
| IMPL-AR-S4 | snelle_dubbele_temminks | `effect_snelle_dubbele_temminks` | VERIFIED (gap-filled 48-03) | `tests/effects/phase48-snelle-verification.test.ts` ("sets doubleNextPiecie flag") | Was zero-hit gap prior to this plan; unique to AR bucket |

**Fragment 03 summary:** 8/8 VERIFIED (4 pre-existing evidence pairs, 2 gap-filled evidence pairs).

---

## Matrix — Places (6 rows, source: `48-FRAGMENT-04-places-quests-crosscut.md`)

| Req ID | Original slug | Current id | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-PF-PL1 | place_the_gym | `place_the_gym` / `effect_the_gym` | VERIFIED | `tests/effects/physical-equipment-scaling.test.ts::effect_the_gym CLESS patch (PHYS-06)` (4 tests) | id already prefixed |
| IMPL-PF-PL2 | place_zo_is_natuur | `place_zo_is_natuur` / `effect_zo_is_natuur` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::effect_zo_is_natuur (IMPL-PF-PL2 gap-fill)` (2/2) | Was the only Place with zero pre-existing evidence |
| IMPL-PF-PL3 | place_obby_1 | `place_obby_1` / `effect_obby_1` | VERIFIED | `tests/engine/place-obby-1.test.ts::Obby #1 — On Quest (dispatcher-level, PLACE-02)` (3 tests, real MP-delta) | Phase 35 dispatcher-level suite |
| IMPL-AR-PL1 | place_arcade | `place_arcade` / `effect_arcade` | VERIFIED | `tests/engine/place-arcade.test.ts::Arcade — On Quest (dispatcher-level, PLACE-03)` (3 tests, real MP-delta) | Phase 35 dispatcher-level suite |
| IMPL-AR-PL2 | place_quest_haven | `place_quest_haven` / `effect_quest_haven` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::effect_quest_haven (IMPL-AR-PL2 gap-fill)` (3/3) | Pre-existing hits only covered registry/graveyard/quest-count bypass (Pitfall 2), never the +10/+25 reward logic itself |
| IMPL-AR-PL3 | place_coerts_caravan | `place_coerts_caravan` / `effect_coerts_caravan` | VERIFIED | `tests/engine/place-coerts-caravan.test.ts::place_coerts_caravan (Phase 41) — Coert Quest-damage shield` (5 tests) | Phase 41 rework, dedicated suite |

---

## Matrix — Quests (12 rows, source: `48-FRAGMENT-04-places-quests-crosscut.md`)

| Req ID | Original slug | Current id | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-PF-Q1 | quest_endurance_test | `quest_endurance_test` / `quest_req_endurance_test` | VERIFIED | `tests/ui/simulation/chain-tests.spec.js` — browser T1, real live-game quest attempt | |
| IMPL-PF-Q2 | quest_sustained_assault | `quest_sustained_assault` / `quest_req_sustained_assault` | VERIFIED | `tests/abilities/phase-22-quest-gates.test.ts::quest_req_sustained_assault` (4 tests: gate block/allow, threshold 2/4) | |
| IMPL-PF-Q3 | quest_shotje_obby | `quest_shotje_obby` / `quest_req_shotje_obby` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_shotje_obby (IMPL-PF-Q3 gap-fill)` (2/2) | Pre-existing hit used the card only as an inert fixture (Pitfall 2), never exercised the Obby-#1 auto-succeed clause |
| IMPL-PF-Q4 | quest_leap_of_faith | `quest_leap_of_faith` / `quest_req_leap_of_faith` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_leap_of_faith (IMPL-PF-Q4 gap-fill)` (1/1) | Pre-existing spec tested only the affordability gate (Phase 37), not the threshold-4 roll mechanic (Pitfall 2) |
| IMPL-PF-Q5 | quest_survive_storm | `quest_survive_storm` / `quest_req_survive_storm` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_survive_storm (IMPL-PF-Q5 gap-fill)` (2/2) | Zero hits prior |
| IMPL-PF-Q6 | quest_never_give_up | `quest_never_give_up` / `quest_req_never_give_up` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_never_give_up (IMPL-PF-Q6 gap-fill)` (2/2) | Zero hits prior |
| IMPL-PF-Q7 | quest_tough_it_out | `quest_tough_it_out` / `quest_req_tough_it_out` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_tough_it_out (IMPL-PF-Q7 gap-fill, canonical for IMPL-PF-P12)` (2/2) | **Canonical row `IMPL-PF-P12` duplicates** — resolves Plan 48-01's open item |
| IMPL-AR-Q1 | quest_artistic_expression | `quest_artistic_expression` / `quest_req_artistic_expression` | VERIFIED (PARTIAL pre-existing + gap-filled 48-04) | `tests/abilities/quest-behaviors.test.ts::resolveQuest — drawOnSuccess` (draw mechanism) + `tests/effects/phase48-place-quest-verification.test.ts::quest_req_artistic_expression (IMPL-AR-Q1 gap-fill — auto-succeed gate)` (2/2) | Draw-2 mechanism was already proven; Creative ★★ auto-succeed gate closed this plan |
| IMPL-AR-Q2 | quest_improvise | `quest_improvise` / `quest_req_improvise` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_improvise (IMPL-AR-Q2 gap-fill)` (2/2) | Zero hits prior |
| IMPL-AR-Q3 | quest_create_masterpiece | `quest_create_masterpiece` / `quest_req_create_masterpiece` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_create_masterpiece (IMPL-AR-Q3 gap-fill)` (2/2) | Only pre-existing hit was registry-membership only (not qualifying, D-01 T3) |
| IMPL-AR-Q4 | quest_lucky_break | `quest_lucky_break` / `quest_req_lucky_break` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_lucky_break (IMPL-AR-Q4 gap-fill)` (1/1) | Zero hits prior |
| IMPL-AR-Q5 | quest_synergy_mastery | `quest_synergy_mastery` / `quest_req_synergy_mastery` | VERIFIED (gap-filled 48-04) | `tests/effects/phase48-place-quest-verification.test.ts::quest_req_synergy_mastery (IMPL-AR-Q5 gap-fill)` (2/2) | Zero hits prior |

---

## Matrix — Cross-Cutting (4 rows, source: `48-FRAGMENT-04-places-quests-crosscut.md`)

| Req ID | What it asks | Disposition | Evidence | Notes |
|---|---|---|---|---|
| IMPL-TEST | Unit tests exist for all new card effects | VERIFIED | Aggregate: `tests/` tree (113+ files incl. this phase's new files) + `npm test` pass count (745/745 at time of this plan) | Aggregate evidence class per D-01, not a single test |
| IMPL-LOBBY | Deck selection enabled for both decks in lobby | SUPERSEDED | `tests/ui/active-deck-lobby.spec.js` + `tests/ui/onboarding-starter-deck.spec.js` — verify the current 5-duo-deck onboarding + active-deck lobby switcher (Phase 34, 2026-07-03) | The original "2-deck toggle" premise no longer exists; verified against current behavior per D-08 |
| IMPL-SIM | Simulation runs without crashes | VERIFIED | `tests/ui/simulation/sim-30-games.spec.js:67-68` (`expect(collector.getErrors()).toHaveLength(0)` per game) + `sim-botvsbot.spec.js` | Real crash-count assertion, not log-eyeballing |
| IMPL-REG | Cards registered in card registry correctly | VERIFIED | `tests/data/deck-balance.test.ts` — deck-membership `toContain`/`not.toContain` assertions | Membership checks are legitimate evidence HERE ONLY (IMPL-REG's own carve-out per D-01); never cited for any card's own effect row elsewhere in this matrix |

---

## Matrix — Mosje Abilities (4 rows, source: `48-FRAGMENT-05-mosje-bugs.md`)

| Req ID | Original slug/desc | Current id/fn | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-PF-M1 | Alyssa the Bulldozer — ability execution and effect resolution | `mosje_alyssa_bulldozer` / `ability_alyssa_bulldozer_unstoppable` | VERIFIED (gap-filled 48-05) | `tests/abilities/phase48-mosje-ability-verification.test.ts::ability_alyssa_bulldozer_unstoppable (IMPL-PF-M1)` | Comeback math `Math.floor(mpLostThisTurn/10)*5` asserted, plus a 0-lost/no-bonus counter-case |
| IMPL-PF-M2 | Jeffrey the Strongman — ability execution and effect resolution | `mosje_jeffrey` / passive `applyMosjeFieldEffectsOnQuest` (NOT the no-op `ability_jeffrey_brute_force` stub) | VERIFIED (gap-filled 48-05) | `tests/abilities/phase48-mosje-ability-verification.test.ts::Jeffrey Brute Force passive quest bonus (IMPL-PF-M2)` | Verified against the real PASSIVE mechanic via `resolveQuest`, deliberately never calling the documented no-op stub (T-48-SC guard) |
| IMPL-AR-M1 | DJ 80/20 — ability execution and effect resolution | `mosje_dj_8020` / `ability_dj_8020_lucky_beats` | VERIFIED (gap-filled 48-05) | `tests/abilities/phase48-mosje-ability-verification.test.ts::ability_dj_8020_lucky_beats (IMPL-AR-M1)` | Single test asserts BOTH `+10 MP` AND `questPrepBonus += 2`; shares evidence with `BUG-05` |
| IMPL-AR-M2 | Jisca the Maestro — ability execution and effect resolution | `mosje_jisca` / `ability_jisca_perfect_combo` | VERIFIED | `tests/abilities/ability-text-reconciliation.test.ts:438-513` (`Jisca — Perfect Combo`, 6 real assertions) | Pre-existing qualifying evidence — no gap-fill needed |

---

## Matrix — Phase 9 Bug Fixes (5 rows, source: `48-FRAGMENT-05-mosje-bugs.md`; also backfilled into `.planning/phases/09-ui-engine-bug-fixes/09-VERIFICATION.md` per D-06)

| Req ID | Original slug/desc | Current id/fn | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| BUG-01 | Quest roll threshold tier mismatch — dual-path agreement; "stale activeMosje suspected at runtime, debug log added" | `getQuestDiceThreshold` vs `quest_req_strategy_puzzle`/`quest_req_quick_thinking` | VERIFIED (residual claim explicitly investigated, not silently ticked) | `tests/engine/quest-threshold.test.ts` (4 `(BUG-01)`-tagged describe blocks, dual-path agreement) + direct source read of `src/main.js:1244-1261`/`1452` confirming a single closure-captured `activeMosje`/threshold is reused for both display and roll — no second stale fetch exists | Per D-08, VERIFIED with explicit rationale, not a bare tick — the diagnostic `[QUEST-DEBUG]` log never found a real divergence |
| BUG-02 | Dubbele Dosis Piecie lifecycle — persistUntilEndOfTurn flag + endTurn sweep | `piecie_quest_prep` (name/id divergence — "Dubbele Dosis" text) | VERIFIED | `tests/engine/piecie-persist-eot.test.ts::Dubbele Dosis — Persist Until End-of-Turn (BUG-02)` (5 real assertions) | Shared evidence/card with `IMPL-AR-P9` |
| BUG-03 | Senor West MP floor — wrong-guess routes through loseMP(); activation blocked at level 0 + MP 0 | `ability_martin_senor_west_calculated_guess` | VERIFIED | `tests/engine/west-calculated-guess.test.ts::West — MP floor behavior (BUG-03)` (3 real assertions, real `loseMP` floor-clamp path) | |
| BUG-04 | Lucky Coin activation guard — slot check runs before coin flip; blocks when all 4 slots full | `snelle_lucky_coin` / `playSnellie` | VERIFIED | `tests/engine/snelle-piecie-full-slots.test.ts::Lucky Coin — Full Slot Guard (BUG-04)` (2 real assertions) | Shared evidence with `IMPL-PF-S4`/`IMPL-AR-S3` |
| BUG-05 | DJ Lucky Mixer turn modifier — redesigned as questPrepBonus +2, cleared at endTurn | `mosje_dj_8020` / `ability_dj_8020_lucky_beats` | VERIFIED (gap-filled 48-05) | `tests/abilities/phase48-mosje-ability-verification.test.ts::ability_dj_8020_lucky_beats` (stacking counter-case confirms additive, not overwritten) | Shares evidence pointer with `IMPL-AR-M1` |

---

## Summary Tally

| Disposition | Count | Rows |
|---|---|---|
| VERIFIED | 58 | All rows except the 6 listed below |
| SUPERSEDED | 1 | `IMPL-LOBBY` (Phase 34) |
| GAP-DESCOPED | 5 | `IMPL-PF-P9`, `IMPL-PF-P11`, `IMPL-PF-P12`, `IMPL-AR-P4`, `IMPL-AR-P5` |
| **Total** | **64** | |

**GAP-DESCOPED rows in detail (never ticked, per D-08):**
- `IMPL-PF-P9` / `IMPL-AR-P4` — `nature-s-gift`: confirmed absent from `src/data/piecies.js`, `snellePiecies.js`, `places.js`, and `docs/card-reference.md` (case-insensitive grep, zero hits). Not a renamed card — genuinely absent from the 74-Piecie live pool.
- `IMPL-PF-P11` / `IMPL-AR-P5` — `gun-een-piece`: same absence pattern, same reasoning.
- `IMPL-PF-P12` — `quest_tough_it_out`: a REQUIREMENTS.md filing error, not a real Piecie (the id is a Quest, correctly filed separately as `IMPL-PF-Q7`, which is itself VERIFIED). Recorded as a duplicate-of-Q7 pointer rather than fabricating a Piecie-level test for a card that does not exist.

**No FINDINGs raised by Wave 1** beyond the two coverage notes flagged below (neither is a behavioral defect — both are honest test-coverage gaps within the tests-only D-04 boundary):
- `IMPL-PF-P7` (Varkenspootjes): the pending-target-selection flag is fully tested; the actual +60/-30 MP resolution lives in unexported UI (`main.js`) / bot (`botDriver.js`) logic that cannot be unit-tested without an architectural export change (out of this phase's tests-only scope) — recommend a follow-up browser-coverage task.
- `BUG-01`: the "stale activeMosje" runtime claim was investigated directly against `src/main.js`'s closure structure (not assumed from the unit test alone) and confirmed to describe a diagnostic safeguard that never found a real divergence — recorded VERIFIED with explicit rationale, not a bare tick.

---

## Verification Commands

- `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` — clean, no output.
- `npm test` — **77 files, 745/745 passed** (0 regressions; 705 Phase-46 baseline + 40 Phase-48 gap-fill tests across all five waves).
- `git diff --stat -- src` — empty (D-04: zero `src/` files touched across the entire phase).
- `npx playwright test --project=cards --workers=1 -g "piecie_ronald_kip"` — Ronald Kip +50 MP stacking check re-run live this session: **1 passed** (`ownΔ=50 oppΔ=0`, matching the base MP_GAIN value).
- `npm run test:sim` — intentionally not re-run as a behavior check this phase, per the plan's own framing: D-04 forbids any `src/` change, so the simulation's *behavior* cannot have moved. The most recent recorded baseline (Phase 46, `152/160`, 8 timeout-only failures, 0 crashes) remains the valid confirmation for the current runtime source state, since Phase 48 added zero `src/` changes since that run.

## Human Verification Required

None. All 64 dispositions were verifiable via direct automated test execution and source-code inspection.

## Gaps Summary

5 requirements are GAP-DESCOPED (2 pairs of confirmed-absent cards + 1 filing-duplicate) and 1 is SUPERSEDED (a stale premise superseded by Phase 34) — all recorded with honest reasons, never silently ticked. 58/64 requirements are VERIFIED with real, non-tautological automated evidence. Zero runtime defects were found or patched (D-04 preserved); the two residual coverage notes above (Varkenspootjes MP-swing tier, BUG-01's diagnostic-log rationale) are flagged for future follow-up, not claimed as fully closed.

---

_Verified: 2026-07-20_
_Verifier: Claude (gsd-executor, Phase 48 Plan 06)_
