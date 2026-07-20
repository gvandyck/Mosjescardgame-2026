# Card Implementation Requirements

## Physical Force Deck

### Mosje Abilities
- [ ] **IMPL-PF-M1:** Alyssa the Bulldozer — ability execution and effect resolution
- [ ] **IMPL-PF-M2:** Jeffrey the Strongman — ability execution and effect resolution

### Piecies (13 unique)
- [x] **IMPL-PF-P1:** kannetje-melk — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:17-21` (see `.planning/phases/48-.../48-FRAGMENT-01-pf-piecies.md`)
- [x] **IMPL-PF-P2:** te-hard-gaan — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:216-220` (see `48-FRAGMENT-01-pf-piecies.md`)
- [x] **IMPL-PF-P3:** snoeiertje — effect execution — VERIFIED (gap-filled 48-01): `tests/effects/phase48-pf-piecie-verification.test.ts::effect_snoeiertje`
- [x] **IMPL-PF-P4:** momentum-diefje — effect execution — VERIFIED (gap-filled 48-01): `tests/effects/phase48-pf-piecie-verification.test.ts::effect_momentum_diefje happy path` + pre-existing `tests/engine/entry-protection.test.ts` (fizzle branch)
- [x] **IMPL-PF-P5:** dikke-taks — effect execution — VERIFIED (gap-filled 48-01): `tests/effects/phase48-pf-piecie-verification.test.ts::effect_dikke_taks`
- [x] **IMPL-PF-P6:** grammetje-pieter — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:29-33` (see `48-FRAGMENT-01-pf-piecies.md`)
- [x] **IMPL-PF-P7:** varkenspootjes — effect execution — VERIFIED (gap-filled 48-01) WITH RESIDUAL NOTE: `tests/effects/phase48-pf-piecie-verification.test.ts::effect_varkenspootjes` covers the pending-target flag only; the +60/-30 MP swing itself is resolved by untested UI/bot logic — see `48-FRAGMENT-01-pf-piecies.md`
- [x] **IMPL-PF-P8:** tikker — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:135-139` (see `48-FRAGMENT-01-pf-piecies.md`)
- [ ] **IMPL-PF-P9:** nature-s-gift — effect execution — GAP-DESCOPED: no live card exists in `src/` or `docs/card-reference.md` (confirmed absent, not renamed) — see `48-FRAGMENT-01-pf-piecies.md`
- [x] **IMPL-PF-P10:** shoettoe — effect execution — VERIFIED (as `piecie_energy_surge`, name/id divergence): `tests/ui/cards/card-registry.js:174-178` (see `48-FRAGMENT-01-pf-piecies.md`)
- [ ] **IMPL-PF-P11:** gun-een-piece — effect execution — GAP-DESCOPED: no live card exists in `src/` or `docs/card-reference.md` (confirmed absent, not renamed) — see `48-FRAGMENT-01-pf-piecies.md`
- [ ] **IMPL-PF-P12:** quest_tough_it_out — effect execution (if needed) — NOT TICKED: REQUIREMENTS.md filing duplicate of `IMPL-PF-Q7` (a Quest, mis-filed here); `IMPL-PF-Q7` itself has zero test evidence as of Plan 48-01 — see `48-FRAGMENT-01-pf-piecies.md`

### Snelle Piecies (4 unique)
- [ ] **IMPL-PF-S1:** snelle_jensen — instant effect execution
- [ ] **IMPL-PF-S2:** snelle_bijna_welloe — instant effect execution
- [ ] **IMPL-PF-S3:** snelle_negate_elimination — instant effect execution
- [ ] **IMPL-PF-S4:** snelle_lucky_coin — instant effect execution

### Places (3 unique)
- [ ] **IMPL-PF-PL1:** place_the_gym — passive effect execution
- [ ] **IMPL-PF-PL2:** place_zo_is_natuur — passive effect execution
- [ ] **IMPL-PF-PL3:** place_obby_1 — passive effect execution

### Quests (7 unique)
- [ ] **IMPL-PF-Q1:** quest_endurance_test — quest requirement and reward logic
- [ ] **IMPL-PF-Q2:** quest_sustained_assault — quest requirement and reward logic
- [ ] **IMPL-PF-Q3:** quest_shotje_obby — quest requirement and reward logic
- [ ] **IMPL-PF-Q4:** quest_leap_of_faith — quest requirement and reward logic
- [ ] **IMPL-PF-Q5:** quest_survive_storm — quest requirement and reward logic
- [ ] **IMPL-PF-Q6:** quest_never_give_up — quest requirement and reward logic
- [ ] **IMPL-PF-Q7:** quest_tough_it_out — quest requirement and reward logic

---

## Artistic Rhythm Deck

### Mosje Abilities
- [ ] **IMPL-AR-M1:** DJ 80/20 — ability execution and effect resolution
- [ ] **IMPL-AR-M2:** Jisca the Maestro — ability execution and effect resolution

### Piecies (13 unique)
- [x] **IMPL-AR-P1:** kannetje-melk — effect execution — VERIFIED (shared with IMPL-PF-P1): `tests/ui/cards/card-registry.js:17-21` (see `48-FRAGMENT-02-ar-piecies.md`)
- [x] **IMPL-AR-P2:** warm-kannetje-melk — effect execution — VERIFIED (gap-filled 48-02): `tests/effects/phase48-ar-piecie-verification.test.ts::effect_warm_kannetje_melk`
- [x] **IMPL-AR-P3:** broodje-doner — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:141-145` (see `48-FRAGMENT-02-ar-piecies.md`)
- [ ] **IMPL-AR-P4:** nature-s-gift — effect execution — GAP-DESCOPED: no live card exists in `src/` or `docs/card-reference.md` (confirmed absent, not renamed; same absent card as `IMPL-PF-P9`) — see `48-FRAGMENT-02-ar-piecies.md`
- [ ] **IMPL-AR-P5:** gun-een-piece — effect execution — GAP-DESCOPED: no live card exists in `src/` or `docs/card-reference.md` (confirmed absent, not renamed; same absent card as `IMPL-PF-P11`) — see `48-FRAGMENT-02-ar-piecies.md`
- [x] **IMPL-AR-P6:** bowie-stormey — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:147-151` (see `48-FRAGMENT-02-ar-piecies.md`)
- [x] **IMPL-AR-P7:** gekke-vogels — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:234-238` (see `48-FRAGMENT-02-ar-piecies.md`)
- [x] **IMPL-AR-P8:** synergy-field — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:106-111` (see `48-FRAGMENT-02-ar-piecies.md`)
- [x] **IMPL-AR-P9:** dubbele-dosis — effect execution — VERIFIED (as `piecie_quest_prep`, name/id divergence, shared evidence with BUG-02): `tests/ui/cards/card-registry.js:65-70` (see `48-FRAGMENT-02-ar-piecies.md`)
- [x] **IMPL-AR-P10:** dubbele-ding — effect execution — VERIFIED (gap-filled 48-02): `tests/effects/phase48-ar-piecie-verification.test.ts::effect_dubbele_ding`
- [x] **IMPL-AR-P11:** mosje-shield — effect execution — VERIFIED (found via effect_mosje_shield function grep, not string-only): `tests/engine/stub-engine-wiring.test.ts:206-216` (see `48-FRAGMENT-02-ar-piecies.md`)
- [x] **IMPL-AR-P12:** laat-me-chillen — effect execution — VERIFIED: `tests/ui/cards/card-registry.js:93-97` (see `48-FRAGMENT-02-ar-piecies.md`)
- [x] **IMPL-AR-P13:** shoettoe — effect execution — VERIFIED (as `piecie_energy_surge`, name/id divergence, shared with IMPL-PF-P10): `tests/ui/cards/card-registry.js:174-178` (see `48-FRAGMENT-02-ar-piecies.md`)

### Snelle Piecies (4 unique)
- [ ] **IMPL-AR-S1:** snelle_jensen — instant effect execution
- [ ] **IMPL-AR-S2:** snelle_bijna_welloe — instant effect execution
- [ ] **IMPL-AR-S3:** snelle_lucky_coin — instant effect execution
- [ ] **IMPL-AR-S4:** snelle_dubbele_temminks — instant effect execution

### Places (2 unique)
- [ ] **IMPL-AR-PL1:** place_arcade — passive effect execution
- [ ] **IMPL-AR-PL2:** place_quest_haven — passive effect execution
- [ ] **IMPL-AR-PL3:** place_coerts_caravan — passive effect execution

### Quests (8 unique)
- [ ] **IMPL-AR-Q1:** quest_artistic_expression — quest requirement and reward logic
- [ ] **IMPL-AR-Q2:** quest_improvise — quest requirement and reward logic
- [ ] **IMPL-AR-Q3:** quest_create_masterpiece — quest requirement and reward logic
- [ ] **IMPL-AR-Q4:** quest_lucky_break — quest requirement and reward logic
- [ ] **IMPL-AR-Q5:** quest_synergy_mastery — quest requirement and reward logic

---

## Cross-Cutting Concerns

- [ ] **IMPL-TEST:** Unit tests for all new card effects
- [ ] **IMPL-LOBBY:** Enable deck selection for both decks in lobby
- [ ] **IMPL-SIM:** Simulation runs without crashes
- [ ] **IMPL-REG:** Cards registered in card registry correctly

---

---

## Phase 9 — UI & Engine Bug Fixes

- [x] **BUG-01:** Quest roll threshold tier mismatch — both code paths agree; stale activeMosje suspected at runtime, debug log added
- [x] **BUG-02:** Dubbele Dosis Piecie lifecycle — persistUntilEndOfTurn flag + endTurn sweep implemented
- [x] **BUG-03:** Senor West MP floor — wrong-guess routes through loseMP(); activation blocked at level 0 + MP 0
- [x] **BUG-04:** Lucky Coin activation guard — slot check runs before coin flip; blocks when all 4 slots full
- [x] **BUG-05:** DJ Lucky Mixer turn modifier — redesigned as questPrepBonus +2, cleared at endTurn

---

*Last updated: 2026-05-25*
