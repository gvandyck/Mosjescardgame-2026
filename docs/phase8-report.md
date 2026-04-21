# Phase 8 Report — Mosje Card Implementation

**Date:** 2026-04-21  
**Head commit:** `f7928eb`  
**Branch:** `main`

---

## 1. Summary

Phase 8 implemented all 34 Mosje cards across three subtypes (Fighting, Digital, Artistic) in seven batches of ≤5 cards each, with a full `npm test` gate after every batch. All cards are registered via the barrel export system and exercised by dedicated batch test files.

| Step | Batch | Cards | Commit |
|------|-------|-------|--------|
| 0 | Infra / executor scaffolding | — | `cc0809c` |
| 1 | Fighting batch 1 | 5 | `f73aafb` |
| 2 | Fighting batch 2 + Digital batch 1 | 5 | `ea93407` |
| 3 | Digital batch 2 | 5 | `4d06824` |
| 4 | Digital batch 3 + Artistic batch 1 | 5 | `3e4e697` |
| 5 | Artistic batch 2 | 5 | `2fa85ce` |
| 6 | Digital batch 4 + Artistic batch 3 start | 5 | `9185477` |
| 7 | Artistic batch 3 final | 4 | `04fbb51` |
| 8 | Registry audit + coverage report | — | `f7928eb` |

---

## 2. Registered Mosje List

### FIGHTING (7 cards)

| File | Card ID | Ability Summary |
|------|---------|-----------------|
| `alyssa-the-bulldozer.ts` | `mosje_alyssa_bulldozer` | Passive roll: 5-6 deal 20 MP damage |
| `azn-cless.ts` | `azn-cless` | Turn-end discard+gain+draw; partner synergies |
| `gandoe-the-destroyer.ts` | `gandoe-the-destroyer` | Once-per-game Welloe strike if target MP ≤ 60 |
| `gandoe-the-wizard.ts` | `mosje_gandoe_wizard` | Roll 1d6: 1-3 draw 1; 4-5 gain 15 MP; 6 both |
| `jeffrey-the-strongman.ts` | `mosje_jeffrey_strongman` | Pay 20 MP, deal 30 damage, draw 2 |
| `michelle-iron-tuk.ts` | `mosje_michelle_iron_tuk` | Passive 15% MP damage reduction buff |
| `parkour-west.ts` | `parkour-west` | Pay 15 MP, gain 25 MP; synergy +15 MP gain |

### DIGITAL (14 cards)

| File | Card ID | Ability Summary |
|------|---------|-----------------|
| `chris-the-all-rounder.ts` | `mosje_chris_all_rounder` | Requires 3+ face-down Piecies; gain 15 MP (activatePiecie deferred) |
| `coert-tech-savant.ts` | `mosje_coert_tech_savant` | Pay 10 MP → draw 1; unlimited uses |
| `fps-coert.ts` | `mosje_fps_coert` | Passive roll on quest complete: 6=+30 MP + opponent -15 MP |
| `fps-west.ts` | `mosje_fps_west` | Pay 10 MP, gain 20 MP (guess check deferred) |
| `jeffrey-the-silent-gambler.ts` | `mosje_jeffrey_gambler` | Wager X MP; rollBranch 3 outcomes |
| `martin-senor-west.ts` | `mosje_martin_senor_west` | Reveal top of deck (guess-branch deferred) |
| `martin-the-historian.ts` | `mosje_martin_historian` | Gain 15 MP, draw 2, lookAtTop any deck |
| `ming-the-natural.ts` | `mosje_ming_natural` | +15 MP if card_drawn event this turn |
| `ming-the-predictor.ts` | `mosje_ming_predictor` | Pay 10 MP, lookAtTop quest deck |
| `placeholder-the-drainer.ts` | `mosje_drainer` | Passive: opponent loses 5 MP each trigger |
| `placeholder-the-tactician.ts` | `mosje_tactician` | Pay 15 MP, set any Mosje MP to exactly 60 |
| `ronald-the-master-chef.ts` | `mosje_ronald_chef` | Reveals hand, applies card_locked_in_hand buff |
| `the-hacker.ts` | `mosje_the_hacker` | Free, lookAtTop 3 + gain 10 MP (cooldown label only) |
| `youri-the-speedrunner.ts` | `mosje_youri_speedrunner` | Pay 20 MP, apply piecie_same_turn_activate buff, draw 1 |

### ARTISTIC (13 cards)

| File | Card ID | Ability Summary |
|------|---------|-----------------|
| `binti-the-creator.ts` | `mosje_binti_creator` | Pay 20 MP, log ability used (searchDeck deferred) |
| `binti-the-sharp-tongue.ts` | `mosje_binti_tongue` | Discard cost; opponent loses 10 MP (discardRandom deferred) |
| `chris-ddr.ts` | `mosje_chris_ddr` | Passive roll on Piecie activation: 5-6 gain 10 MP (chain cap deferred) |
| `cless-the-teacher.ts` | `cless-the-teacher` | Passive roll: 5-6 draw 1 + gain 5 MP |
| `coert-kastelein.ts` | `mosje_coert_kastelein` | Applies damage_reduction_20 buff; Castle Builder deferred |
| `coert-kasteluck.ts` | `mosje_coert_kasteluck` | Passive roll: 4-6 applies next_piecie_free buff |
| `dj-8020.ts` | `mosje_dj_8020` | Passive turn-start: gain 10 MP |
| `jisca-the-maestro.ts` | `mosje_jisca_maestro` | Passive rollBranch: 1-3 lose 10; 4-6 opponent loses 15 |
| `martin-the-precision-driver.ts` | `mosje_martin_driver` | Draw 3 + gain 20 MP once per turn (discard cost deferred) |
| `placeholder-the-amplifier.ts` | `mosje_amplifier` | Pay 30 MP, apply double_trigger_this_turn buff (double-trigger enforcement deferred) |
| `ronald-the-mastermind.ts` | `mosje_ronald_mastermind` | Once-per-game activateFromDiscard (deferred) |
| `tuk-the-healing-spirit.ts` | `mosje_tuk_healer` | Gain 25 MP (ally-heal deferred) |
| `tuk-the-sims-architect.ts` | `mosje_tuk_architect` | Pay 15 MP, lookAtTop 5; extra Piecie slot deferred |

**Total: 34 Mosje cards**

---

## 3. Test Suite Results

```
Test Files  66 passed (66)
     Tests  451 passed (451)
  Start at  18:07:26
  Duration  6.49s
```

### Phase 8 test files

| File | Tests |
|------|-------|
| `phase8-step1-fighting-batch1.test.ts` | 6 |
| `phase8-step2-mixed-batch.test.ts` | 7 |
| `phase8-step3-digital-batch2.test.ts` | 7 |
| `phase8-step4-digital3-artistic1.test.ts` | 6 |
| `phase8-step5-artistic-batch2.test.ts` | 6 |
| `phase8-step6-digital3-artistic-start.test.ts` | 6 |
| `phase8-step7-artistic-final.test.ts` | 5 |
| **Total Phase 8** | **43** |

---

## 4. Coverage Report

Measured with `npm run coverage` (vitest v8 provider).

### By folder

| Folder | Stmts | Branch | Funcs | Lines |
|--------|-------|--------|-------|-------|
| **All files** | **98.36** | **88.16** | **95.09** | **98.36** |
| `cards/executor` | 89.24 | 85.11 | 87.87 | 89.24 |
| `cards/mosjes/artistic` | **100** | **100** | **100** | **100** |
| `cards/mosjes/digital` | **100** | **100** | **100** | **100** |
| `cards/mosjes/fighting` | **100** | **100** | **100** | **100** |
| `cards/piecies/pet` | 100 | 100 | 100 | 100 |
| `cards/places` | 100 | 100 | 100 | 100 |
| `cards/proof` | 100 | 100 | 100 | 100 |
| `cards/registry` | 100 | 100 | 100 | 100 |
| `effects/board` | 100 | 86.48 | 100 | 100 |
| `effects/buffs` | 100 | 94.64 | 100 | 100 |
| `effects/cards` | 94.11 | 88.69 | 100 | 94.11 |
| `effects/conditions` | 96.99 | 87.91 | 100 | 96.99 |
| `effects/control` | 97.29 | 88.79 | 100 | 97.29 |
| `effects/dice` | 100 | 100 | 100 | 100 |
| `effects/mp` | 99.63 | 89.92 | 100 | 99.63 |
| `effects/query` | 100 | 86.95 | 100 | 100 |

All three Mosje subtype barrels are at **100% across all metrics**.

---

## 5. Simulation Results

Each batch test file includes a multi-turn simulation test that runs 5 consecutive triggered-ability cycles and asserts no crash and correct type of result. All 7 simulation tests passed:

| Simulation | Card | Turns | Result |
|------------|------|-------|--------|
| step1 | Gandoe The Wizard (rollBranch) | 5 | `mp ≥ startMP` |
| step2 | AZN Cless (turn-end trigger) | 5 | no crash |
| step3 | Jeffrey Gambler (rollBranch) | 5 | `typeof mp === "number"` |
| step4 | Jisca The Maestro (rollBranch) | 5 | `typeof mp === "number"` |
| step5 | DJ 80/20 (passive +10 MP/turn) | 5 | `mp > 20` |
| step6 | Placeholder Drainer (-5 MP/trigger) | 5 | `opponent mp ≤ 25` |
| step7 | DDR Chris (rollBranch) | 5 | `typeof mp === "number"` |

---

## 6. Deferred Primitives / Known Limitations

Full details in `docs/phase8-questions.md`. Summary:

| Primitive / Feature | Used By | Status |
|---------------------|---------|--------|
| `activatePiecie` | Chris All-Rounder, DDR Chris | Deferred — no primitive |
| `activateFromDiscard` | Ronald Mastermind | Deferred — no primitive |
| `discardRandom` | Binti Sharp Tongue | Deferred — no primitive |
| `searchDeck` | Binti The Creator | Deferred — no primitive |
| `checkGuess` / prediction | Martin Senor West, FPS West | Deferred — no conditional |
| `checkPlayerChoice` | Tuk Healing Spirit | Deferred — no primitive |
| Castle token system | Coert Kastelein | Deferred — no token engine |
| Double-trigger dispatch | Placeholder Amplifier | Deferred — no dispatch loop |
| Damage reduction hooks | Coert Kastelein, Michelle Iron Tuk | Label-only buff applied |
| Extra Piecie slot / turn | Tuk Architect | Deferred — requires engine hook |
| Quest-hook passives | FPS Coert, Martin Driver, Cless Teacher | Label-only synergies |
| Discard costs (2-card) | Martin Precision Driver | Simplified to free |
| `$bench` placeholder | Tuk Healing Spirit | Changed to self-target |
| `$opponent` as MosjeRef | Placeholder Drainer | Changed to `$target` |

---

## 7. Full File Tree (src + tests + docs + styles)

```
docs/
  buff-stacking-rules.md
  multiplayer-caller-contracts.md
  phase1-questions.md  phase1-report.md
  phase2-questions.md  phase2-report.md
  phase3-questions.md  phase3-report.md
  phase4-questions.md  phase4a-report.md  phase4b-report.md  phase4c-report.md
  phase5-questions.md  phase5-report.md
  phase6-questions.md  phase6-report.md
  phase7-questions.md  phase7-report.md
  phase8-questions.md  phase8-report.md   ← this file

src/
  cards/
    executor/
      execute-card.ts
      execute-mosje-ability.ts
      index.ts
      resolve-effect-expression.ts
      resolve-target-reference.ts
      run-card-effects.ts
    mosjes/
      index.ts
      artistic/
        binti-the-creator.ts       binti-the-sharp-tongue.ts
        chris-ddr.ts               cless-the-teacher.ts
        coert-kastelein.ts         coert-kasteluck.ts
        dj-8020.ts                 index.ts
        jisca-the-maestro.ts       martin-the-precision-driver.ts
        placeholder-the-amplifier.ts  ronald-the-mastermind.ts
        tuk-the-healing-spirit.ts  tuk-the-sims-architect.ts
      digital/
        chris-the-all-rounder.ts   coert-tech-savant.ts
        fps-coert.ts               fps-west.ts
        index.ts                   jeffrey-the-silent-gambler.ts
        martin-senor-west.ts       martin-the-historian.ts
        ming-the-natural.ts        ming-the-predictor.ts
        placeholder-the-drainer.ts placeholder-the-tactician.ts
        ronald-the-master-chef.ts  the-hacker.ts
        youri-the-speedrunner.ts
      fighting/
        alyssa-the-bulldozer.ts    azn-cless.ts
        gandoe-the-destroyer.ts    gandoe-the-wizard.ts
        index.ts                   jeffrey-the-strongman.ts
        michelle-iron-tuk.ts       parkour-west.ts
    piecies/  (attack / conditional / momentum-gaining / pet / utility)
    places/   (16 place cards)
    proof/    (3 proof cards)
    quests/   (general: 44 + personal: 4)
    registry/
      card-registry.ts  freeze-after-boot.ts  index.ts
    schema/   (11 schema files)
    snelle-piecies/  (19 snelle cards)
    variable-cost-resolvers.ts
  effects/
    board/        (8 files)
    buffs/        (6 files)
    cards/        (9 files)
    conditions/   (11 files)
    control/      (9 files)
    dice/         (5 files)
    mp/           (7 files)
    query/        (3 files)
    effect-context.ts  primitive.ts  registry.ts
  engine/
    advance-phase.ts   append-event.ts   apply-victory-check.ts
    check-victory.ts   create-game.ts    place-manager.ts
    player-reducers.ts quest-manager.ts  resolve-effect-stack.ts
    turn-manager.ts
  firebase.js  main.js  version.js
  (legacy JS: abilities/, data/)

tests/  (66 test files, 451 tests)
  cards/
    execute-mosje-ability.test.ts
    executor.test.ts  executor-branch-coverage.test.ts
    expression-resolver.test.ts
    phase4a-step1 … phase4c-step2  (10 test files)
    phase5-step0 … phase5-step4    (5 test files)
    phase6-quest-registry.test.ts  phase6-step0-infra.test.ts
    phase7-place-registry.test.ts
    phase8-step1-fighting-batch1.test.ts
    phase8-step2-mixed-batch.test.ts
    phase8-step3-digital-batch2.test.ts
    phase8-step4-digital3-artistic1.test.ts
    phase8-step5-artistic-batch2.test.ts
    phase8-step6-digital3-artistic-start.test.ts
    phase8-step7-artistic-final.test.ts
    places/  (5 place test files)
    proof-cards.test.ts  registry.test.ts  schema.test.ts
  effects/  (12 effect test files)
  engine/   (7 engine test files)
  integration/  (5 integration test files)
  utils/    (3 utility test files)
```

---

## 8. Source / Test Counts

| Metric | Value |
|--------|-------|
| Total source files (`src/**/*.ts`) | 320 |
| Total test files (`tests/**/*.ts`) | 66 |
| Total Mosje card files | 34 |
| Total tests passing | 451 |
| Test failures | 0 |
| Overall statement coverage | 98.36% |
| Overall branch coverage | 88.16% |
| Overall function coverage | 95.09% |
| Mosje folder coverage (all three) | 100% / 100% / 100% / 100% |
