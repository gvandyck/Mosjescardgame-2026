# Phase 48 Fragment 02 — Artistic Rhythm Piecies (IMPL-AR-P1..P13)

**Bucket:** Artistic Rhythm Piecies
**Rows:** 13 (`IMPL-AR-P1` .. `IMPL-AR-P13`)
**Method:** two-pronged grep (card id string AND effect function name) across `tests/`,
per D-07/RESEARCH.md; each disposition below is backed by a direct read of the cited
test's assertion, not just a filename match (D-01/D-02). Ids/effect names confirmed
directly against `src/data/piecies.js` `id:`/`effectId:` fields (not `docs/card-reference.md`'s
legacy ID column — Pitfall 4).

## Matrix

| Req ID | Original slug (2026-05) | Current card id | Effect fn | Disposition | Evidence | Notes |
|---|---|---|---|---|---|---|
| IMPL-AR-P1 | kannetje-melk | `piecie_kannetje_melk` | `effect_kannetje_melk` | VERIFIED | `tests/ui/cards/card-registry.js:17-21` — `expectedEffect: 'MP_GAIN', mpDeltaMin: 25, mpDeltaMax: 50`, real assertion via `card-test-runner.js:244-247`; also `tests/engine/food-double-synergy.test.ts` | Mechanical hyphen→underscore + prefix. **Shared card with `IMPL-PF-P1`** — identical evidence, same citation as `48-FRAGMENT-01-pf-piecies.md` row P1. |
| IMPL-AR-P2 | warm-kannetje-melk | `piecie_warm_kannetje_melk` | `effect_warm_kannetje_melk` | VERIFIED (gap-filled this plan) | Zero hits anywhere in `tests/` for `piecie_warm_kannetje_melk` OR `effect_warm_kannetje_melk` prior to this plan (confirmed GAP by both grep prongs) → closed by new test `tests/effects/phase48-ar-piecie-verification.test.ts::Phase 48 gap-fill — effect_warm_kannetje_melk (IMPL-AR-P2)` | Mechanical mapping. Per project memory + direct read of `src/abilities/piecieEffects.js:215-225`: this card **loses** 10 MP (`applyDamage(activeSlots[si], 10)`), then draws `min(2, deck.length)` cards. Not a MP-gain card despite the "Kannetje Melk" family name. |
| IMPL-AR-P3 | broodje-doner | `piecie_broodje_doner` | `effect_broodje_doner` | VERIFIED | `tests/ui/cards/card-registry.js:141-145` — `expectedEffect: 'MP_GAIN', mpDeltaMin: 35, mpDeltaMax: 70`, real assertion via `card-test-runner.js:244-247` | Mechanical mapping (D-07's own worked example). |
| IMPL-AR-P4 | nature-s-gift | **none — confirmed absent** | — | GAP-DESCOPED | Zero hits in `src/data/piecies.js`, `src/data/snellePiecies.js`, `src/data/places.js`, or `docs/card-reference.md` for `nature`/`nature-s-gift` (case-insensitive); confirmed identically by `48-FRAGMENT-01-pf-piecies.md` row IMPL-PF-P9 (same slug, cross-listed under both PF and AR requirement sections). | No live card exists to test — same underlying absent card as `IMPL-PF-P9`. Genuinely absent from the 74-Piecie live pool, not renamed. GAP-DESCOPED, never ticked. |
| IMPL-AR-P5 | gun-een-piece | **none — confirmed absent** | — | GAP-DESCOPED | Zero hits in `src/data/piecies.js`, `src/data/snellePiecies.js`, `src/data/places.js`, or `docs/card-reference.md` for `gun-een-piece`/`gun een piece` (case-insensitive); confirmed identically by `48-FRAGMENT-01-pf-piecies.md` row IMPL-PF-P11 (same slug, cross-listed under both PF and AR requirement sections). | Same underlying absent card as `IMPL-PF-P11`. GAP-DESCOPED, never ticked. |
| IMPL-AR-P6 | bowie-stormey | `piecie_bowie_stormey` | `effect_bowie_stormey` | VERIFIED | `tests/ui/cards/card-registry.js:147-151` — `expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0` (MP_LOSS_HALVED status), real assertion via `card-test-runner.js` status-effect branch | Mechanical mapping. |
| IMPL-AR-P7 | gekke-vogels | `piecie_gekke_vogels` | `effect_gekke_vogels` | VERIFIED | `tests/ui/cards/card-registry.js:234-238` — `expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0`, real assertion via `card-test-runner.js` status-effect branch | Mechanical mapping. |
| IMPL-AR-P8 | synergy-field | `piecie_synergy_field` | `effect_synergy_field` | VERIFIED | `tests/ui/cards/card-registry.js:106-111` — `expectedEffect: 'FIELD_EFFECT'`, `stateFlag: { path: 'synergyFieldOwner', equals: 'player_1' }`, a concrete state-field assertion (D-02) | Mechanical mapping. |
| IMPL-AR-P9 | dubbele-dosis | `piecie_quest_prep` | `effect_quest_prep` | VERIFIED | `tests/ui/cards/card-registry.js:65-70` — `expectedEffect: 'FIELD_EFFECT'`, `stateFlag: { path: 'players.player_1.questPrepBonus', equals: 2 }`, real assertion via `card-test-runner.js` | **Name/id divergence, not mechanical:** the live card is named "Dubbele Dosis" (confirmed via the registry's own inline comment `// "Dubbele Dosis"`) but its `id:` field is `piecie_quest_prep` (confirmed against `src/data/piecies.js`'s `id:` field per Pitfall 4, not `docs/card-reference.md`'s stale ID column). **This is the exact same card BUG-02's ledger note is about** — the `piecie_quest_prep` evidence above is shared/cited between this row and BUG-02's Phase 09 backfill row. |
| IMPL-AR-P10 | dubbele-ding | `piecie_dubbele_ding` | `effect_dubbele_ding` | VERIFIED (gap-filled this plan) | Zero hits anywhere in `tests/` for `piecie_dubbele_ding` OR `effect_dubbele_ding` prior to this plan (confirmed GAP by both grep prongs) → closed by new test `tests/effects/phase48-ar-piecie-verification.test.ts::Phase 48 gap-fill — effect_dubbele_ding (IMPL-AR-P10)` | Mechanical mapping. Per direct read of `src/abilities/piecieEffects.js:492-500`: sets `player.instantPiecieThisTurn = true` and `player.dubbeleActivations = 2` (a UI-consumed counter enabling 2 instant Piecie activations from hand this turn). |
| IMPL-AR-P11 | mosje-shield | `piecie_mosje_shield` | `effect_mosje_shield` | VERIFIED | `tests/engine/stub-engine-wiring.test.ts:206-216` — `effect_mosje_shield(state, "p1")` called directly, asserts the pushed `WELLOE_SHIELD` status effect has `value: 1` (not the default 0) | **Found via the effect-function grep, not string-only** — this file never contains the string `'piecie_mosje_shield'` anywhere (confirmed by re-grep); a string-only search would have wrongly classified this row GAP (per RESEARCH.md Pitfall 1, the seed example for this exact card). |
| IMPL-AR-P12 | laat-me-chillen | `piecie_laat_me_chillen` | `effect_laat_me_chillen` | VERIFIED | `tests/ui/cards/card-registry.js:93-97` — `expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0` (MP_LOSS_REDUCTION status), real assertion via `card-test-runner.js` status-effect branch | Mechanical mapping. |
| IMPL-AR-P13 | shoettoe | `piecie_energy_surge` | `effect_energy_surge` | VERIFIED | `tests/ui/cards/card-registry.js:174-178` — `expectedEffect: 'MP_GAIN', mpDeltaMin: 20, mpDeltaMax: 20`, real assertion via `card-test-runner.js:244-247` | **Name/id divergence, not mechanical** — live card named "Shoettoe" (`src/data/piecies.js`) with `id: piecie_energy_surge`. **Shares this exact evidence/divergence with `IMPL-PF-P10`** — cite the same test for both rows. |

## Summary

- **VERIFIED (pre-existing evidence):** P1, P3, P6, P7, P8, P9, P12, P13 — 8 rows
- **VERIFIED (gap-filled this plan, new test):** P2, P10 — 2 rows
- **GAP-DESCOPED (confirmed absent, no live card):** P4, P5 — 2 rows
- **Correctly VERIFIED via function-name grep (not string-only, avoiding a false GAP):** P11 — 1 row

13/13 rows classified, none blank, none silently ticked (D-08).

## Cross-references

- `IMPL-AR-P1` shares its evidence citation with `48-FRAGMENT-01-pf-piecies.md` row `IMPL-PF-P1` (same card, `piecie_kannetje_melk`).
- `IMPL-AR-P4`/`IMPL-AR-P5` share their GAP-DESCOPED reasoning with `48-FRAGMENT-01-pf-piecies.md` rows `IMPL-PF-P9`/`IMPL-PF-P11` (same absent slugs, filed under both requirement sections).
- `IMPL-AR-P9`'s `piecie_quest_prep` evidence is shared with BUG-02's Phase 09 backfill (same card, same divergence note).
- `IMPL-AR-P13` shares its evidence/divergence with `48-FRAGMENT-01-pf-piecies.md` row `IMPL-PF-P10` (same card, `piecie_energy_surge`/"Shoettoe").
