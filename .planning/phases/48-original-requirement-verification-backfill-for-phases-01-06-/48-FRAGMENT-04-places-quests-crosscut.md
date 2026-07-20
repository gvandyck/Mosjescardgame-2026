# Phase 48-04 Fragment — 6 Places + 12 Quests + 4 Cross-Cutting (22 rows)

**Method:** two-pronged grep (id string AND effect/requirement function name) against
`tests/`, per RESEARCH.md's evidence-discovery method. Every "VERIFIED" row below cites
a real test that asserts an outcome (MP delta, threshold value, autoSuccess flag,
crash-count assertion) — never registry membership alone (D-01/D-02).

## Places (6)

| Requirement ID | Original slug | Current id | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-PF-PL1 | place_the_gym | `place_the_gym` (`effect_the_gym`) | VERIFIED | `tests/effects/physical-equipment-scaling.test.ts::effect_the_gym CLESS patch (PHYS-06)` (4 tests: physical-branch, CLESS-branch, non-CLESS drain, WEST-neutral) | id already prefixed, no translation needed |
| IMPL-PF-PL2 | place_zo_is_natuur | `place_zo_is_natuur` (`effect_zo_is_natuur`) | GAP → CLOSED | Zero hits by either prong before this plan. New: `tests/effects/phase48-place-quest-verification.test.ts::effect_zo_is_natuur (IMPL-PF-PL2 gap-fill)` (2/2) | genuine gap — the only Place with literally no test evidence anywhere |
| IMPL-PF-PL3 | place_obby_1 | `place_obby_1` (`effect_obby_1`) | VERIFIED | `tests/engine/place-obby-1.test.ts::Obby #1 — On Quest (dispatcher-level, PLACE-02)` (3 tests, real MP-delta assertions via `applyPlaceEffectsOnQuest`) | Phase 35 dispatcher-level regression suite |
| IMPL-AR-PL1 | place_arcade | `place_arcade` (`effect_arcade`) | VERIFIED | `tests/engine/place-arcade.test.ts::Arcade — On Quest (dispatcher-level, PLACE-03)` (3 tests, real MP-delta assertions) | Phase 35 dispatcher-level regression suite |
| IMPL-AR-PL2 | place_quest_haven | `place_quest_haven` (`effect_quest_haven`) | GAP → CLOSED | Pre-existing hits (`tests/data/deck-balance.test.ts`, `tests/engine/unified-graveyard.test.ts`, `tests/engine/quest-haven-double-quest.test.ts`) only cover registry membership, Place-graveyard-routing, and the *quest-attempt-count bypass* — never the effect function's own +10/+25 MP reward logic (Pitfall 2: partial-scope evidence, different feature reusing the id string). New: `tests/effects/phase48-place-quest-verification.test.ts::effect_quest_haven (IMPL-AR-PL2 gap-fill)` (3/3) | |
| IMPL-AR-PL3 | place_coerts_caravan | `place_coerts_caravan` (`effect_coerts_caravan`) | VERIFIED | `tests/engine/place-coerts-caravan.test.ts::place_coerts_caravan (Phase 41) — Coert Quest-damage shield` (5 tests, real MP-delta + shield-usage assertions) | Phase 41 rework, dedicated suite |

## Quests (12)

| Requirement ID | Original slug | Current id | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-PF-Q1 | quest_endurance_test | `quest_endurance_test` (`quest_req_endurance_test`) | VERIFIED | `tests/ui/simulation/chain-tests.spec.js` — injects `quest_endurance_test` onto the shared deck, drives a real browser quest attempt through `completeQuest`, asserts the MP delta against the questPrepBonus-adjusted threshold | browser T1, real live-game outcome |
| IMPL-PF-Q2 | quest_sustained_assault | `quest_sustained_assault` (`quest_req_sustained_assault`) | VERIFIED | `tests/abilities/phase-22-quest-gates.test.ts::quest_req_sustained_assault` (4 tests: attack-piecie gate block/allow, Physical ★★★ threshold 2, Physical ★ threshold 4) | direct unit-test evidence |
| IMPL-PF-Q3 | quest_shotje_obby | `quest_shotje_obby` (`quest_req_shotje_obby`) | GAP → CLOSED | Pre-existing hit (`tests/engine/gandoe-michelle-synergy.test.ts`) uses `quest_shotje_obby` only as an inert `PHYSICAL_QUEST` fixture object passed straight to `resolveQuest` with `didSucceed` hardcoded — never calls `quest_req_shotje_obby` itself, never exercises the Obby #1 auto-succeed clause (Pitfall 2). New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_shotje_obby (IMPL-PF-Q3 gap-fill)` (2/2 — auto-succeed at Obby #1, threshold 4 elsewhere) | |
| IMPL-PF-Q4 | quest_leap_of_faith | `quest_leap_of_faith` (`quest_req_leap_of_faith`) | GAP → CLOSED | Pre-existing hit (`tests/ui/general-quest-affordability.spec.js`) injects `quest_leap_of_faith` only as a generic quest fixture to test the 20-MP affordability gate (Phase 37); the spec stops before/at the roll-resolution step and never asserts the Leap of Faith-specific threshold-4 roll mechanic (Pitfall 2). New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_leap_of_faith (IMPL-PF-Q4 gap-fill)` (1/1) | |
| IMPL-PF-Q5 | quest_survive_storm | `quest_survive_storm` (`quest_req_survive_storm`) | GAP → CLOSED | Zero hits by either prong. New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_survive_storm (IMPL-PF-Q5 gap-fill)` (2/2 — Resilient ★★★ → threshold 2, no trait → threshold 5) | |
| IMPL-PF-Q6 | quest_never_give_up | `quest_never_give_up` (`quest_req_never_give_up`) | GAP → CLOSED | Zero hits by either prong. New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_never_give_up (IMPL-PF-Q6 gap-fill)` (2/2 — auto-succeed below 30 MP, threshold 4 otherwise) | |
| IMPL-PF-Q7 | quest_tough_it_out | `quest_tough_it_out` (`quest_req_tough_it_out`) | GAP → CLOSED | Zero hits by either prong (confirmed independently — Plan 48-01 flagged this exact gap when it needed Q7 as IMPL-PF-P12's duplicate citation and found none). New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_tough_it_out (IMPL-PF-Q7 gap-fill, canonical for IMPL-PF-P12)` (2/2 — Resilient ★★★ → threshold 2, no trait → threshold 5) | **This is the canonical row `IMPL-PF-P12` duplicates** — `IMPL-PF-P12`'s slug (`quest_tough_it_out`) is a Quest id mis-filed under REQUIREMENTS.md's Piecie section (no Piecie by that id exists; confirmed in `src/data/piecies.js`). `IMPL-PF-P12` should now cite this row's evidence rather than remain unticked — see REQUIREMENTS.md annotation. |
| IMPL-AR-Q1 | quest_artistic_expression | `quest_artistic_expression` (`quest_req_artistic_expression`) | PARTIAL → CLOSED | Pre-existing evidence (`tests/abilities/quest-behaviors.test.ts::resolveQuest — drawOnSuccess`, 3 tests) proves the generic drawOnSuccess draw-2 mechanism is real, plus a direct field check confirms `quest_artistic_expression.drawOnSuccess === 2` — but nothing called `quest_req_artistic_expression` itself to prove the Creative ★★ auto-succeed gate (Pitfall 2 — the requirement's other defining clause). New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_artistic_expression (IMPL-AR-Q1 gap-fill — auto-succeed gate)` (2/2) closes the remaining slice | combined evidence (pre-existing + new) now covers both halves of the requirement text |
| IMPL-AR-Q2 | quest_improvise | `quest_improvise` (`quest_req_improvise`) | GAP → CLOSED | Zero hits by either prong. New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_improvise (IMPL-AR-Q2 gap-fill)` (2/2 — Creative ★★★ → threshold 2, no trait → threshold 5) | |
| IMPL-AR-Q3 | quest_create_masterpiece | `quest_create_masterpiece` (`quest_req_create_masterpiece`) | GAP → CLOSED | Only pre-existing hit is `tests/data/deck-balance.test.ts` (registry membership — D-01 T3, not per-card evidence). New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_create_masterpiece (IMPL-AR-Q3 gap-fill)` (2/2 — Creative ★★★ → threshold 3, no trait → threshold 6) | |
| IMPL-AR-Q4 | quest_lucky_break | `quest_lucky_break` (`quest_req_lucky_break`) | GAP → CLOSED | Zero hits by either prong. New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_lucky_break (IMPL-AR-Q4 gap-fill)` (1/1 — fixed threshold 3) | |
| IMPL-AR-Q5 | quest_synergy_mastery | `quest_synergy_mastery` (`quest_req_synergy_mastery`) | GAP → CLOSED | Zero hits by either prong. New: `tests/effects/phase48-place-quest-verification.test.ts::quest_req_synergy_mastery (IMPL-AR-Q5 gap-fill)` (2/2 — Synergy Mosje on field → threshold 3, none → threshold 5) | |

## Cross-cutting (4)

| Requirement ID | What it asks | Disposition | Evidence | Notes |
|---|---|---|---|---|
| IMPL-TEST | Unit tests exist for all new card effects | VERIFIED | Aggregate: the `tests/` tree (113 files as of this plan, including this fragment's new file) + `npm test` pass count — **739/739** at time of writing (716 baseline + 23 new from this plan) | evidence class = aggregate, not a single test, per D-01 |
| IMPL-LOBBY | Deck selection enabled for both decks in lobby | SUPERSEDED | `tests/ui/active-deck-lobby.spec.js` + `tests/ui/onboarding-starter-deck.spec.js` — both exist and exercise the CURRENT 5-duo-deck onboarding + active-deck lobby switcher (Phase 34, 2026-07-03) | the original "2-deck toggle" premise this requirement was written against no longer exists; verified against current behavior instead, per D-08 |
| IMPL-SIM | Simulation runs without crashes | VERIFIED | `tests/ui/simulation/sim-30-games.spec.js:67-68` — `expect(collector.getErrors(), 'No page errors').toHaveLength(0)` per game, plus `tests/ui/simulation/sim-botvsbot.spec.js` (same crash-count assertion shape) | real T2 assertion, not log-eyeballing |
| IMPL-REG | Cards registered in card registry correctly | VERIFIED | `tests/data/deck-balance.test.ts` — deck-membership `toContain`/`not.toContain` assertions (e.g. `expect(pf()?.piecies).toContain('piecie_boxing_gloves')`) | membership checks are legitimate evidence HERE ONLY — IMPL-REG literally asks about registration, per D-01's carve-out; never cited for a card's own effect row in this or any other Phase 48 fragment |

## Summary

- 18 Place/Quest rows classified. **7 already VERIFIED** with pre-existing qualifying
  evidence (PF-PL1, PF-PL3, AR-PL1, AR-PL3, PF-Q1, PF-Q2). **10 confirmed GAPs** closed
  with new focused tests in `tests/effects/phase48-place-quest-verification.test.ts`
  (23/23 green): PF-PL2, AR-PL2, PF-Q3, PF-Q4, PF-Q5, PF-Q6, PF-Q7, AR-Q2, AR-Q3, AR-Q4,
  AR-Q5. **1 PARTIAL row closed** by combining pre-existing + new evidence: AR-Q1.
- 4 cross-cutting rows classified: 3 VERIFIED (IMPL-TEST, IMPL-SIM, IMPL-REG), 1
  SUPERSEDED (IMPL-LOBBY, cites Phase 34).
- `IMPL-PF-Q7`'s new evidence resolves the open item Plan 48-01 left behind for
  `IMPL-PF-P12` (the mis-filed Piecie-section duplicate of this Quest row) — see
  REQUIREMENTS.md annotation update.
- Zero `src/` files touched (D-04 preserved) — confirmed via `git diff --stat`.
