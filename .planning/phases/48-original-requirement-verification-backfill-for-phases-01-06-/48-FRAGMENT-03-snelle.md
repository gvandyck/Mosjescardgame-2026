# Fragment 03 — Snelle Piecie Requirement Verification

Two-pronged evidence map (card id string grep + `effect_snelle_*` function-name grep across
`tests/`) for the 8 Snelle Piecie requirement rows. Two rows are the literal same card filed
twice (once per deck bucket) — evidence is intentionally identical for those pairs.

| Requirement ID | Original slug | Current effect id | Disposition | Evidence | Notes |
|---|---|---|---|---|---|
| IMPL-PF-S1 | snelle_jensen | effect_snelle_jensen | VERIFIED | `tests/ui/cards/card-registry.js:276-279` (`SNELLE_REGISTRY` entry, `expectedEffect: 'MP_GAIN'`, `mpDeltaMin/Max: 20`, `logMatch: /Jensen/`), executed live by `tests/ui/cards/card-test-runner.js`; also exercised in `tests/ui/simulation/chain-tests.spec.js:271-272` (chain-3 deck list) | SHARED card with IMPL-AR-S1 — identical evidence |
| IMPL-AR-S1 | snelle_jensen | effect_snelle_jensen | VERIFIED | Same as IMPL-PF-S1 (`card-registry.js:276-279`, `card-test-runner.js`) | SHARED card with IMPL-PF-S1 |
| IMPL-PF-S2 | snelle_bijna_welloe | effect_snelle_bijna_welloe | GAP → CLOSED | Was a confirmed gap (no `tests/` hit for the id string or the effect function pre-Task-2). Closed by `tests/effects/phase48-snelle-verification.test.ts` ("effect_snelle_bijna_welloe heals the active Mosje by +20 MP when at or below 10 MP" and "does not heal when the active Mosje is above 10 MP") | SHARED card with IMPL-AR-S2 — identical evidence, same 2 new tests cover both rows |
| IMPL-AR-S2 | snelle_bijna_welloe | effect_snelle_bijna_welloe | GAP → CLOSED | Same as IMPL-PF-S2 (`tests/effects/phase48-snelle-verification.test.ts`) | SHARED card with IMPL-PF-S2 |
| IMPL-PF-S3 | snelle_negate_elimination | effect_snelle_negate_elimination | VERIFIED | `tests/ui/simulation/chain-tests.spec.js:264-329` ("chain-3: Not Today! fires on bot elimination — Mosje survives at 5 MP") — real browser assertion `expect(mpAfter).toBeGreaterThan(0)` plus a battle-log match, on the actual reactive/PROTECT flow. `tests/ui/cards/card-registry.js:296` explicitly `skipReason`s the generic proactive runner for this card and points to chain-3 as the real coverage (checked per RESEARCH.md's Anti-Pattern warning before concluding GAP) | Unique to PF bucket only — no AR row exists for this card |
| IMPL-PF-S4 | snelle_lucky_coin | effect_snelle_lucky_coin | VERIFIED | `tests/engine/snelle-piecie-full-slots.test.ts:105-123` ("Lucky Coin — Full Slot Guard (BUG-04)") — two real assertions on `playSnellie`'s return value (`success:false` + slot-full error when 4/4 slots full; not blocked when a slot is free), exercising the card's real play-path guard | SHARED card with IMPL-AR-S3 — identical evidence. The coin-flip *effect body* itself (`effect_snelle_lucky_coin`'s heads/tails branches) has no additional dedicated unit test beyond this slot-guard regression; not reclassified as a gap because the BUG-04 regression is genuine outcome-asserting evidence for the requirement's "instant effect execution" claim (the play path fires), consistent with this plan's own interfaces section |
| IMPL-AR-S3 | snelle_lucky_coin | effect_snelle_lucky_coin | VERIFIED | Same as IMPL-PF-S4 (`tests/engine/snelle-piecie-full-slots.test.ts:105-123`) | SHARED card with IMPL-PF-S4 |
| IMPL-AR-S4 | snelle_dubbele_temminks | effect_snelle_dubbele_temminks | GAP → CLOSED | Was a confirmed gap (no `tests/` hit for the id string or the effect function pre-Task-2). Closed by `tests/effects/phase48-snelle-verification.test.ts` ("effect_snelle_dubbele_temminks sets the doubleNextPiecie flag for the acting player") | Unique to AR bucket only — no PF row exists for this card |

## Summary

- 8/8 rows classified with real evidence; 0 fabricated citations.
- 2 confirmed gaps (`effect_snelle_bijna_welloe`, `effect_snelle_dubbele_temminks`) closed via
  `tests/effects/phase48-snelle-verification.test.ts` (false-green guarded per D-02 — each test
  asserts a concrete field delta on the actual returned state and fails if the effect body is
  removed).
- `snelle_negate_elimination` was checked against `tests/ui/simulation/chain-tests.spec.js`
  before any GAP verdict, per RESEARCH.md's Anti-Pattern warning (skipReason rows can still have
  real coverage elsewhere) — confirmed VERIFIED via chain-3.
- Zero `src/` files touched (D-04 preserved).
