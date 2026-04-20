# Phase 5 Report — Snelle Piecies

## Summary

Phase 5 implements the full Snelle Piecie (instant-response) subsystem for Mosjes Card Game 2026. All 19 Snelle Piecies from the card-spec are registered and tested. The response window, effect stack counter-chain, and timing guarantees are fully operational.

**Commits in Phase 5**

| Commit   | Message                                                              |
| -------- | -------------------------------------------------------------------- |
| `13a0b1c` | phase5-prep: double-trigger wiring + snelle window                  |
| `5d074b0` | phase5: step 1 - simple instant snelle piecies (8 cards)            |
| `5246c19` | phase5: step 2 - negation/counter snelle piecies (6 cards)          |
| `0e84139` | phase5: step 3 - chain/combo snelle piecies (4 cards)               |
| `0c170a7` | phase5: step 4 - snelle registry audit + step 5 - timing integration tests |

---

## Test Results

```
Test Files  47 passed (47)
     Tests  331 passed (331)
```

New tests added in Phase 5: **15** (Steps 4–5 contribution: 5 audit + 10 timing)

---

## File Tree — New Files Added in Phase 5

```
src/
  engine/
    resolve-effect-stack.ts        (new — effectStack + snelle window)
  cards/
    executor/
      resolve-target-reference.ts  (modified — +UntargetableError, +assertTargetable)
      execute-card.ts              (modified — +Step 2b untargetable pre-check)
    snelle-piecies/
      index.ts                     (new barrel — 18 exports)
      bijna-welloe.ts
      blensen.ts
      counter-strikka.ts
      drain-reversal.ts
      dubbele-temminks.ts
      emergency-healings.ts
      ff-haaltje-nemen.ts
      frenssen.ts
      gevalletje-klakkeloos.ts
      jammertje-gepakt.ts
      jantje-jantje-jantje.ts
      je-weet-niet.ts
      jensen.ts
      lucky-coin.ts
      not-today.ts
      perfect-dodge.ts
      sleutelpuntje.ts
      the-protector.ts
  types/
    pending-effect.ts              (modified — +respondingToEffectId)

tests/
  cards/
    phase5-step0-double-trigger.test.ts
    phase5-step1-simple-snelle.test.ts
    phase5-step2-negation-snelle.test.ts
    phase5-step3-chain-snelle.test.ts
    phase5-step4-registry-audit.test.ts    (new — Step 4)
  integration/
    phase5-timing.test.ts                  (new — Step 5)
```

---

## Registered Snelle Piecies (`getAllCards().filter(c => c.category === 'snelle-piecie')`)

| ID                          | Name                    | Step | Category      | Notes                              |
| --------------------------- | ----------------------- | ---- | ------------- | ---------------------------------- |
| `snelle_emergency_healings` | Emergency Healings      | 1    | snelle-piecie |                                    |
| `snelle_ff_haaltje_nemen`   | FF Haaltje Nemen        | 1    | snelle-piecie | Resilient-conditional draw         |
| `snelle_lucky_coin`         | Lucky Coin              | 1    | snelle-piecie |                                    |
| `snelle_jensen`             | Jensen!                 | 1    | snelle-piecie | Q10: send-to-discard stubbed       |
| `snelle_jeweetniet`         | Je Weet Niet            | 1    | snelle-piecie | Q11: immunity via reduceMPLossBy   |
| `snelle_sleutelpuntje`      | Sleutelpuntje           | 1    | snelle-piecie |                                    |
| `snelle_bijna_welloe`       | Bijna Welloe            | 1    | snelle-piecie | Resilient-3 conditional MP restore |
| `snelle_negate_elimination` | Not Today!              | 2    | snelle-piecie |                                    |
| `snelle_drain_reversal`     | Drain Reversal          | 2    | snelle-piecie | Q8: guard removed                  |
| `snelle_the_protector`      | The Protector           | 2    | snelle-piecie |                                    |
| `snelle_counter_strikka`    | Counter Strikka         | 2    | snelle-piecie | Q12: retarget stubbed as negate    |
| `snelle_perfect_dodge`      | Perfect Dodge           | 2    | snelle-piecie | Q13: threshold approximated        |
| `snelle_jammertje_gepakt`   | Jammertje Gepakt!       | 2    | snelle-piecie | Q7: sendToBottomOfDeck deferred    |
| `snelle_frenssen`           | Frenssen!               | 3    | snelle-piecie | canCounter=true; Q14: targetRef required |
| `snelle_blensen`            | Blensen!                | 3    | snelle-piecie | canCounter=true; Q15: fixed 50MP cost |
| `snelle_dubbele_temminks`   | Dubbele Temminks        | 3    | snelle-piecie |                                    |
| `snelle_jantje_jantje_jantje` | Jantje Jantje… Jantje? | 3   | snelle-piecie | Q9: discard cost is no-op          |
| `snelle_gevalletje_klakkeloos` | Gevalletje Klakkeloos | 3  | snelle-piecie |                                    |
| `momentum-rush`             | Momentum Rush           | —    | snelle-piecie | Lives in piecies/momentum-gaining/ |

**Missing snelle piecies: 0**

---

## Coverage (v8)

| Module                      | Stmts  | Branch | Funcs  | Lines  |
| --------------------------- | ------ | ------ | ------ | ------ |
| **All files**               | 98.78% | 91.27% | 98.7%  | 98.78% |
| cards/executor              | 94.32% | 92.22% | 100%   | 94.32% |
| cards/snelle-piecies        | 100%   | 100%   | 100%   | 100%   |
| cards/piecies/attack        | 100%   | 100%   | 100%   | 100%   |
| cards/piecies/conditional   | 100%   | 100%   | 100%   | 100%   |
| cards/piecies/momentum-gaining | 100% | 100%   | 100%   | 100%   |
| cards/registry              | 100%   | 100%   | 100%   | 100%   |
| effects/buffs               | 100%   | 96.22% | 100%   | 100%   |
| effects/mp                  | 99.61% | 88.7%  | 100%   | 99.61% |
| effects/board               | 100%   | 88.88% | 100%   | 100%   |
| effects/control             | 96.04% | 87.61% | 100%   | 96.04% |

---

## Step 5 Integration Scenarios (phase5-timing.test.ts)

| Scenario | Description                                            | Result  |
| -------- | ------------------------------------------------------ | ------- |
| A        | drain-reversal interrupt: negates loseMP, grants gain  | ✅ pass  |
| A (edge) | drain-reversal with empty stack fizzles                | ✅ pass  |
| B        | Jensen→Frenssen→Blensen full counter-chain             | ✅ pass  |
| C        | not-today blocks sendToWelloe elimination              | ✅ pass  |
| C (edge) | not-today with insufficient MP is rejected             | ✅ pass  |
| D        | laat-me-chillen untargetable buff blocks te-hard-gaan  | ✅ pass  |
| D        | resolveTargetReference throws UntargetableError        | ✅ pass  |
| D (edge) | expired untargetable buff does NOT block targeting     | ✅ pass  |
| E        | ChainDepthExceededError on 4th canCounter card         | ✅ pass  |
| E        | ChainDepthExceededError message is descriptive         | ✅ pass  |

---

## Deviations and Open Items

All deviations were flagged in `docs/phase5-questions.md` (Q7–Q15).

| ID  | Card                    | Deviation                                                       | Justification                                        |
| --- | ----------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Q7  | jammertje-gepakt        | `sendToBottomOfDeck` → `returnToHand` stub                      | Primitive not available; deferred                   |
| Q8  | drain-reversal          | Removed MP guard; `$pendingEffectDrainAmount` resolves from context | `$pendingEffectSource` cannot resolve to MosjeRef |
| Q9  | jantje-jantje-jantje    | `discard` cost is no-op                                         | Player choice collection not implemented in executor |
| Q10 | jensen                  | "Send piecie to discard" not implemented                        | Reverse-lookup from effectId → card on field not available |
| Q11 | je-weet-niet            | 2-turn MP immunity via `reduceMPLossBy(9999, 2)`               | No `mp_loss_immune` flag handler in loseMP          |
| Q12 | counter-strikka         | Retargets as negate instead of target-rewrite                   | `retargetPendingEffect` primitive not available      |
| Q13 | perfect-dodge           | Flat reduction; ≥30 threshold not enforced                      | Arithmetic/threshold primitive not available         |
| Q14 | frenssen                | Caller must supply `invocation.targetRef` manually              | Engine auto-resolution from pendingEffect.source deferred |
| Q15 | blensen                 | Fixed 50 MP cost; conditional free not implemented              | `checkEventLogThisTurn` condition not available      |

### Step 4 Finding
`momentum-rush` lives in `src/cards/piecies/momentum-gaining/` but has `category: "snelle-piecie"` — this is correct per card-spec.md. It is NOT in the `snelle-piecies/` barrel (intentional). The registry audit confirmed all 19 expected snelle-piecies are registered when both barrels are imported.

### New in Steps 4–5
- **`UntargetableError`** added to `resolve-target-reference.ts`: thrown when `opponent_active_mosje`/`any_mosje`/`required_mosje` targets a mosje with an active `buff:untargetable` flag.
- **Pre-cost targetability check** added to `execute-card.ts` (Step 2b): catches `UntargetableError` before the MP cost is deducted, returning a clean `rejected` outcome.
