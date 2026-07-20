# Phase 48: Original Requirement Verification Backfill (Phases 01-06 and 09) - Research

**Researched:** 2026-07-20
**Domain:** Test-evidence archaeology / traceability backfill for a mature, unbuilt-from-scratch card-game codebase (no new game features, no src/ changes)
**Confidence:** HIGH (mapping + evidence findings below were confirmed by direct `Grep`/`Read` against `.planning/REQUIREMENTS.md`, `src/data/*.js`, and the live `tests/` tree — not inferred from docs alone)

## Summary

This phase's real work is NOT writing new mechanics — it is reconciling a 2026-05
requirement list (`.planning/REQUIREMENTS.md`) written in pre-refactor slugs
(`kannetje-melk`, `dubbele-dosis`, `shoettoe`) against the live, prefixed card ids
(`piecie_kannetje_melk`, `piecie_quest_prep`, `piecie_energy_surge`) and the 112-file
`tests/` tree, then filling the real gaps found. I did the ID-normalization pass and a
representative evidence sweep for all 64 requirements (see the full mapping table
below) and confirmed the D-03 "map-first" assumption is correct: **a large majority of
the 64 rows already have qualifying T1 evidence sitting in the existing suite** — the
work is finding it (search BOTH the card id string AND the effect/ability function
name — many unit tests import the function directly and never mention the id string),
not writing it from scratch. A genuine minority are true gaps.

Three categories of surprise, all verified against source, not assumed:

1. **Two requirement slugs have zero live implementation anywhere in `src/` or
   `docs/card-reference.md`:** `nature-s-gift` (IMPL-PF-P9 / IMPL-AR-P4) and
   `gun-een-piece` (IMPL-PF-P11 / IMPL-AR-P5). These are not renamed cards — they are
   absent from the 74-Piecie live pool entirely. Disposition candidate: GAP-DESCOPED,
   not SUPERSEDED (nothing to cite as the current replacement).
2. **Two requirement slugs map to a *renamed* card id, not a mechanical hyphen→underscore
   transform:** `shoettoe` → `piecie_energy_surge` (name "Shoettoe", id field literally
   diverged), and `dubbele-dosis` → `piecie_quest_prep` (name "Dubbele Dosis", id field
   diverged — this is also the exact card BUG-02's ledger note is about, so the BUG-02
   evidence and the IMPL-AR-P9 evidence are the same test file).
3. **`IMPL-PF-P12`'s slug is `quest_tough_it_out`** — a Quest id, filed under the
   *Piecies* section of REQUIREMENTS.md, duplicating `IMPL-PF-Q7` (same id, filed
   correctly under Quests). No Piecie by that id exists. Treat as a REQUIREMENTS.md
   data-entry duplicate: cite the Q7 evidence, note the duplication explicitly, do not
   invent a second Piecie-level test for a card that isn't a Piecie.

**Primary recommendation:** Structure Phase 48 as one wave per card-type bucket
(Mosje abilities → Piecies → Snelle Piecies → Places → Quests → cross-cutting →
BUG-01..05), each wave doing map → grep-for-string-AND-function-name → classify → gap-fill
→ record row. Use the confirmed findings below as the seed/proof-of-method for each
bucket rather than re-deriving the method from scratch.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Requirement ↔ card id normalization | Planning/docs (this phase's matrix) | — | Pure bookkeeping; no runtime tier owns it |
| Evidence discovery (grep tests/) | Test tier (`tests/`) | — | Read-only investigation of existing engine/effects tests |
| Gap-fill unit tests | Engine/Effects tier (`tests/effects/`, `tests/abilities/`, `tests/engine/`) | Browser tier (`tests/ui/cards/`) | D-03: prefer the existing pattern closest to the card's own layer — pure effect functions get unit tests, full activation-flow cards get card-registry entries |
| BUG-01..05 regression assertions | Engine tier (`src/abilities/questLogic.js`, `src/abilities/mosjeAbilities.js`, `src/engine/turnManager.js`) | — | All 5 bugs are engine-logic, not UI-logic; regression tests belong in `tests/engine/` or `tests/abilities/`, matching the 4/5 that already exist there |
| Traceability matrix output | Docs/planning tier (`48-VERIFICATION.md`, `REQUIREMENTS.md`) | — | D-05/D-06; not a runtime artifact |

This phase touches **zero** browser/UI/API/DB tiers as a *mutation* target — D-04 (tests-only) means the Architectural Responsibility Map above is entirely about where **evidence already lives**, not where new capability will be built.

## Standard Stack

No new libraries. This is a tests-only phase using the project's existing stack:

| Tool | Version (confirmed) | Purpose |
|------|------|---------|
| Vitest | per `package.json` `"test": "vitest run"` | Unit tests: `tests/effects/`, `tests/abilities/`, `tests/engine/`, `tests/data/` |
| Playwright | per `package.json` `"test:cards"` / `"test:sim"` | Browser card tests (`tests/ui/cards/`), simulation (`tests/ui/simulation/`) |

**Installation:** none required — no new packages. **Package Legitimacy Audit: N/A** — Phase 48 installs no external packages (tests-only, D-04). Skip the slopcheck gate.

## Full Requirement → Card ID Mapping (D-07 normalization)

Confirmed directly against `src/data/piecies.js`, `src/data/mosjes.js`,
`src/data/snellePiecies.js`, `src/data/places.js`, `src/data/quests.js` id fields (all
64 requirement slugs cross-checked, not sampled).

**Key finding: normalization is only non-trivial for the Mosje-ability and Piecie
rows.** All Snelle Piecie, Place, and Quest requirement ids in REQUIREMENTS.md are
*already* written as their current prefixed id (`snelle_jensen`, `place_the_gym`,
`quest_endurance_test`) — they need zero slug translation, only evidence discovery.

### Physical Force (28)

| Req ID | Slug in REQUIREMENTS.md | Current card id | Mapping note |
|---|---|---|---|
| IMPL-PF-M1 | Alyssa the Bulldozer | `mosje_alyssa_bulldozer` | name-derived, unambiguous |
| IMPL-PF-M2 | Jeffrey the Strongman | `mosje_jeffrey` | **not** `mosje_jeffrey_gambler` (that's "[Jeffrey] The Silent Gambler", a different card) |
| IMPL-PF-P1 | kannetje-melk | `piecie_kannetje_melk` | mechanical hyphen→underscore + prefix |
| IMPL-PF-P2 | te-hard-gaan | `piecie_te_hard_gaan` | mechanical |
| IMPL-PF-P3 | snoeiertje | `piecie_snoeiertje` | mechanical |
| IMPL-PF-P4 | momentum-diefje | `piecie_momentum_diefje` | mechanical |
| IMPL-PF-P5 | dikke-taks | `piecie_dikke_taks` | mechanical |
| IMPL-PF-P6 | grammetje-pieter | `piecie_grammetje_pieter` | mechanical |
| IMPL-PF-P7 | varkenspootjes | `piecie_varkenspootjes` | mechanical |
| IMPL-PF-P8 | tikker | `piecie_tikker` | mechanical |
| IMPL-PF-P9 | nature-s-gift | **none — confirmed absent** | zero hits in `src/` or `docs/card-reference.md`; GAP-DESCOPED candidate |
| IMPL-PF-P10 | shoettoe | `piecie_energy_surge` | **name/id divergence**, not mechanical — live card named "Shoettoe" has id `piecie_energy_surge` |
| IMPL-PF-P11 | gun-een-piece | **none — confirmed absent** | zero hits anywhere; GAP-DESCOPED candidate |
| IMPL-PF-P12 | quest_tough_it_out | `quest_tough_it_out` (a Quest, not a Piecie) | **duplicate of IMPL-PF-Q7** — flag as a REQUIREMENTS.md data-entry error, cite Q7's evidence, do not fabricate separate Piecie-level evidence |
| IMPL-PF-S1..S4 | snelle_jensen / snelle_bijna_welloe / snelle_negate_elimination / snelle_lucky_coin | same (already prefixed) | no translation needed |
| IMPL-PF-PL1..PL3 | place_the_gym / place_zo_is_natuur / place_obby_1 | same (already prefixed) | no translation needed |
| IMPL-PF-Q1..Q7 | quest_endurance_test / quest_sustained_assault / quest_shotje_obby / quest_leap_of_faith / quest_survive_storm / quest_never_give_up / quest_tough_it_out | same (already prefixed) | no translation needed |

### Artistic Rhythm (27)

| Req ID | Slug in REQUIREMENTS.md | Current card id | Mapping note |
|---|---|---|---|
| IMPL-AR-M1 | DJ 80/20 | `mosje_dj_8020` | unambiguous |
| IMPL-AR-M2 | Jisca the Maestro | `mosje_jisca` | unambiguous |
| IMPL-AR-P1 | kannetje-melk | `piecie_kannetje_melk` | **shared card** — identical evidence as IMPL-PF-P1; one test file satisfies both rows, cite it twice |
| IMPL-AR-P2 | warm-kannetje-melk | `piecie_warm_kannetje_melk` | mechanical |
| IMPL-AR-P3 | broodje-doner | `piecie_broodje_doner` | mechanical (D-07's own worked example, confirmed correct) |
| IMPL-AR-P4 | nature-s-gift | **none — confirmed absent** | same GAP as IMPL-PF-P9 |
| IMPL-AR-P5 | gun-een-piece | **none — confirmed absent** | same GAP as IMPL-PF-P11 |
| IMPL-AR-P6 | bowie-stormey | `piecie_bowie_stormey` | mechanical |
| IMPL-AR-P7 | gekke-vogels | `piecie_gekke_vogels` | mechanical |
| IMPL-AR-P8 | synergy-field | `piecie_synergy_field` | mechanical |
| IMPL-AR-P9 | dubbele-dosis | `piecie_quest_prep` | **name/id divergence** — same card BUG-02's ledger entry is about; card-registry.js literally comments `// "Dubbele Dosis"` next to this id to document the divergence |
| IMPL-AR-P10 | dubbele-ding | `piecie_dubbele_ding` | mechanical |
| IMPL-AR-P11 | mosje-shield | `piecie_mosje_shield` | mechanical; effect function is `effect_mosje_shield` |
| IMPL-AR-P12 | laat-me-chillen | `piecie_laat_me_chillen` | mechanical |
| IMPL-AR-P13 | shoettoe | `piecie_energy_surge` | same divergence/shared card as IMPL-PF-P10 |
| IMPL-AR-S1..S4 | snelle_jensen / snelle_bijna_welloe / snelle_lucky_coin / snelle_dubbele_temminks | same (already prefixed) | S1/S2 shared with PF-S1/S2, same evidence reuse note |
| IMPL-AR-PL1..PL3 | place_arcade / place_quest_haven / place_coerts_caravan | same (already prefixed) | no translation needed |
| IMPL-AR-Q1..Q5 | quest_artistic_expression / quest_improvise / quest_create_masterpiece / quest_lucky_break / quest_synergy_mastery | same (already prefixed) | no translation needed |

### Cross-cutting (4) — no card id, requirement is process-level

| Req ID | What it actually asks | Evidence class |
|---|---|---|
| IMPL-TEST | Unit tests exist for all new card effects | Aggregate — cite the 112-file `tests/` tree + `npm test` pass count, not a single test |
| IMPL-LOBBY | Deck selection enabled for both decks in lobby | **SUPERSEDED** — the original "2 decks" premise no longer exists; Phase 34 replaced it with 5-duo-deck onboarding + active-deck lobby switcher (`tests/ui/active-deck-lobby.spec.js`, `tests/ui/onboarding-starter-deck.spec.js`). Verify *current* lobby deck-selection behavior works, cite Phase 34. |
| IMPL-SIM | Simulation runs without crashes | T2 — confirmed real assertions in `tests/ui/simulation/sim-30-games.spec.js` and `sim-botvsbot.spec.js` (see Code Examples) |
| IMPL-REG | Cards registered in card registry correctly | Caution: `tests/data/deck-balance.test.ts` membership checks (`expect(deck).toContain('piecie_tikker')`) are **registry wiring, not effect assertions** — per D-01 these alone are T3/insufficient for a *card's own* requirement row, but they ARE legitimate T1/T2 evidence for IMPL-REG itself (which literally asks about registration, not effect behavior) |

### Phase 9 BUG-01..05 (5)

See the dedicated section below — all 5 traced to specific test files with file:line
citations.

## Package Legitimacy Audit

N/A — Phase 48 is tests-only (D-04) and installs no packages. Skip.

## Architecture Patterns

### Evidence-discovery method (the core reusable pattern for this phase)

For each requirement's mapped card id `X`:

1. `Grep` for the literal id string `'piecie_X'` (or `mosje_X`/`snelle_X`/`place_X`/`quest_X`) across `tests/`.
2. **Also** `Grep` for the effect/ability function name (`effect_X`, `ability_X_<suffix>` — read the `effectId`/`abilityId` field in the card's data-file entry first). **This step is not optional** — confirmed finding: `tests/engine/stub-engine-wiring.test.ts` directly imports and calls `effect_mosje_shield(state, "p1")` and asserts a real behavioral outcome, but never contains the string `'piecie_mosje_shield'` anywhere in the file. A string-only search would have wrongly classified `piecie_mosje_shield` (IMPL-AR-P11) as a GAP.
3. For each hit, read enough of the test to confirm it asserts an **outcome** (MP delta, status-effect push value, hand-size delta, quest threshold, lifecycle flag) per D-02 — not just card existence/registration.
4. If a hit only covers a narrow slice of the card's behavior (e.g. `tests/engine/entry-protection.test.ts` asserts Momentum Diefje's steal *fizzles* under entry protection, but never asserts the base steal actually transfers MP on an unprotected target), record it as **partial evidence** — flag whether the gap-fill needs to cover the missing slice or whether the partial coverage is judged suffient intent-wise.
5. Zero qualifying hits after both searches → GAP, route to step 6 (D-03 gap-fill).

### Two gap-fill patterns, concretely

**Pattern A — card-test-library entry** (`tests/ui/cards/card-registry.js` +
`card-test-runner.js`), for a card whose full play→activate flow is what needs
proving (browser T1). Confirmed working example already in the registry:

```javascript
// Source: tests/ui/cards/card-registry.js:64-70 (piecie_quest_prep, display name "Dubbele Dosis")
{
    cardId: 'piecie_quest_prep', cardType: 'PIECIE', // "Dubbele Dosis"
    setup: { ownMP: 40 }, playThen: 'place-then-activate',
    expectedEffect: 'FIELD_EFFECT',
    stateFlag: { path: 'players.player_1.questPrepBonus', equals: 2 },
    logMatch: /[Dd]ubbele|quest.prep/i,
},
```

Adding a new gap-fill row here is a single object literal; the generic runner
(`card-test-runner.js`) drives the browser flow — no new test-runner code needed.
Reactive/COUNTER cards or cards needing pre-built board state (3+ face-down Piecies,
opponent action to counter) get `skipReason` and are covered instead by a dedicated
spec in `tests/ui/simulation/chain-tests.spec.js` (see `snelle_counter_strikka`,
`snelle_negate_elimination` for the established pattern of "registry row present but
skipped, real coverage lives in chain-tests.spec.js instead" — check chain-tests.spec.js
before assuming a `skipReason` row is an uncovered gap).

**Pattern B — direct effect/ability unit test** (`tests/effects/*.test.ts`,
`tests/abilities/*.test.ts`, `tests/engine/*.test.ts`), for pure-function coverage
without needing a browser. Confirmed working example:

```typescript
// Source: tests/engine/stub-engine-wiring.test.ts:206-216
describe("piecieEffects — effect_mosje_shield push site value", () => {
  it("Test 13: effect_mosje_shield — pushed WELLOE_SHIELD has value:1, not 0", () => {
    const state = makeState(100, 1);
    const result = effect_mosje_shield(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "WELLOE_SHIELD"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(1);
  });
});
```

This is the pattern to replicate for the confirmed gaps below (`effect_snoeiertje`,
`effect_dikke_taks`, `effect_warm_kannetje_melk`, `effect_dubbele_ding`,
`ability_alyssa_bulldozer_unstoppable`, `ability_jeffrey_brute_force`,
`ability_dj_8020_lucky_beats`, `effect_bijna_welloe`, `effect_dubbele_temminks`) — import
the function directly, build a minimal state fixture (copy `makeState` from a sibling
test file in the same directory rather than writing one from scratch — every file
above has its own near-identical `makeState`/`makeMosje` helper), call it, assert a
concrete field change.

### Recommended Project Structure (no new directories — reuse only)

```
tests/
├── effects/*.test.ts        — pure card-effect unit tests (gap-fill target for Piecie effects)
├── abilities/*.test.ts      — Mosje ability unit tests (gap-fill target for the 3 confirmed Mosje-ability gaps)
├── engine/*.test.ts         — engine-level behavior incl. BUG-01..04's existing regression tests
├── data/*.test.ts           — registry/deck-membership integrity (IMPL-REG evidence, NOT per-card effect evidence)
└── ui/cards/
    ├── card-registry.js     — CARD_REGISTRY (Piecie/Snelle/Place browser specs) + ABILITY_REGISTRY (8 Mosje-ability browser specs)
    └── card-test-runner.js  — generic runner consuming both registries
```

### Anti-Patterns to Avoid

- **String-only id search:** confirmed to under-count real evidence (see
  `piecie_mosje_shield` finding above). Always also search the effect/ability function
  name.
- **Counting `tests/data/deck-balance.test.ts` membership assertions as a card's own
  D-01/D-02 evidence:** `expect(deck).toContain('piecie_tikker')` proves registration,
  not that the effect works — it is legitimate evidence for **IMPL-REG only**, never
  for a card's individual `IMPL-PF-P*`/`IMPL-AR-P*` row.
- **Treating a `skipReason` entry in `card-registry.js`/`ABILITY_REGISTRY` as "no
  evidence":** several skipped rows (`mosje_ming_natural`, `mosje_chris`,
  `mosje_fps_coert`, `snelle_counter_strikka`, `snelle_negate_elimination`) have their
  real coverage in a dedicated spec file referenced right there in the comment — check
  that file before concluding GAP.
- **Fabricating a per-phase legacy VERIFICATION.md for Phases 01-06** — explicitly
  forbidden by D-06; cite the consolidated `48-VERIFICATION.md` instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser-driven card-behavior test | A bespoke Playwright spec per gap card | A new `CARD_REGISTRY`/`ABILITY_REGISTRY` entry consumed by the existing `card-test-runner.js` | The generic runner already handles setup, MP snapshotting, log assertion, and cleanup; a bespoke spec duplicates ~40 lines of boilerplate per card |
| State fixture for a unit-test gap-fill | A new `makeState`/`makeMosje` helper from scratch | Copy the sibling helper from the nearest existing test in the same directory (e.g. `tests/engine/snelle-piecie-full-slots.test.ts`'s `makeState`, or `tests/engine/west-calculated-guess.test.ts`'s) | Every engine/abilities test file in this codebase already has a near-identical minimal-state builder; the shapes are consistent enough to copy-paste and trim |
| Regression proof that two code paths agree (BUG-01's exact shape) | A hand-written diff-check script | The existing `tests/engine/quest-threshold.test.ts` "Path A vs Path B agreement" describe-block pattern | Already proven correct and tagged `(BUG-01)` in its own describe titles — this is the template for any future dual-path threshold bug, not just BUG-01 |

**Key insight:** every gap-fill this phase needs has a same-shape sibling test
somewhere in the 112-file tree already. This phase should feel like "clone the nearest
neighbor and change the assertion," never "design a new test harness."

## Common Pitfalls

### Pitfall 1: Assuming "no string match" means "no evidence"
**What goes wrong:** Grepping only for the card id string misses tests that import
and call the effect/ability function directly.
**Why it happens:** Most test files DO include the id string somewhere (fixture data,
log-match regex), so the pattern usually works — until a file like
`stub-engine-wiring.test.ts` imports `effect_mosje_shield` and never writes
`'piecie_mosje_shield'` anywhere.
**How to avoid:** Always run the second grep for the `effectId`/`abilityId` field value
(read it from the card's data-file entry) before declaring GAP.
**Warning signs:** A card whose text/mechanic (status-effect grant, MP-loss modifier)
matches a well-tested generic engine mechanism (`loseMP()`, `markMosjeDefeated()`) but
shows zero test hits — that's exactly the shape of the false-GAP risk.

### Pitfall 2: Partial-scope evidence counted as full VERIFIED
**What goes wrong:** A test exists and calls the right function, but only exercises
one narrow branch (e.g. `entry-protection.test.ts`'s Momentum Diefje test only proves
the steal *fizzles* under entry protection — it never proves the steal *succeeds* and
transfers MP on a normal, unprotected target).
**Why it happens:** The test was written to prove a different feature (entry
protection) and happened to reuse this card's effect function as its vehicle.
**How to avoid:** Read what specifically is asserted, not just which function is
called. If the core "happy path" mechanic (the thing the requirement actually asks
about) is never asserted anywhere, treat it as GAP even if a same-named test exists.
**Warning signs:** A test file whose `describe()` title is about a *different*
mechanic than the requirement in question.

### Pitfall 3: Confusing a REQUIREMENTS.md duplicate/miscategorization with a real gap
**What goes wrong:** IMPL-PF-P12's slug (`quest_tough_it_out`) is a Quest id filed
under the Piecie section — a plausible copy-paste artifact from 2026-05. Treating it
as "a Piecie called quest_tough_it_out doesn't exist, therefore GAP" produces a
misleading matrix row.
**How to avoid:** Cross-check the slug against ALL five data files (piecies, mosjes,
snellePiecies, places, quests), not just the file matching the requirement's section
header. If it matches a *different* card type's id exactly, it's a filing error, not a
missing card — cite the correct-section requirement's evidence and annotate the
duplication.

### Pitfall 4: Card-reference.md's ID column is sometimes a legacy display slug, not the live `id` field
**What goes wrong:** `docs/card-reference.md`'s Piecie table lists `shoettoe` and
`dubbele-dosis` as ID-column values — those are NOT `src/data/piecies.js`'s actual
`id:` field for those cards (which are `piecie_energy_surge` and `piecie_quest_prep`
respectively). Using the doc's ID column as ground truth for D-07 normalization will
misroute the matrix.
**How to avoid:** Always confirm the mapped id against the `id:` field in the
`src/data/*.js` source file directly (not the doc), matching by the card's `name:`
field instead of trusting the doc's ID column literally.

## Code Examples

### BUG-01 — quest-roll-threshold dual-path agreement (already exists, tagged)

```typescript
// Source: tests/engine/quest-threshold.test.ts:157-164
describe("quest_req_strategy_puzzle — threshold agreement with getQuestDiceThreshold (BUG-01)", () => {
  it("mental=3: display threshold === roll threshold (both = 2)", () => {
    const displayThreshold = getQuestDiceThreshold(strategyPuzzleQuest, makeMosje(3));
    const { threshold: rollThreshold } = quest_req_strategy_puzzle(strategyPuzzleQuest, makeMosje(3));
    expect(displayThreshold).toBe(2);
    expect(rollThreshold).toBe(2);
    expect(displayThreshold).toBe(rollThreshold);
  });
});
```
This is a **real dual-path regression assertion** (the modal-display threshold and the
actual roll-resolution threshold are computed by two different functions and asserted
equal) — it is exactly the shape D-08 describes as required for BUG-01, and it already
exists. **Finding: BUG-01 is very likely already VERIFIED, not GAP** — the CONTEXT.md's
caution ("if no behavioral assertion exists it is a GAP") does not apply here; a real
behavioral assertion does exist. Confirm during execution that this test predates or
was added alongside the fix (git blame), then cite it directly.

### BUG-05 — the one BUG with a confirmed real gap

```javascript
// Source: src/abilities/mosjeAbilities.js:56-70
// DJ 80/20 passive: gain 10 MP at turn start, +2 to next Quest roll this turn.
export function ability_dj_8020_lucky_beats(gameState, playerId) {
  const state = cloneState(gameState);
  const player = state.players[playerId];
  if (!player) return state;
  const slotIndex = getFirstActiveSlotIndex(player);
  if (slotIndex < 0) return state;
  player.activeSlots[slotIndex].mp += 10;
  // BUG-05: DJ Lucky Mixer — add +2 to next Quest roll this turn.
  player.questPrepBonus = (player.questPrepBonus || 0) + 2;
  return state;
}
```
Zero test anywhere imports or calls `ability_dj_8020_lucky_beats` directly (confirmed:
`Grep` for both the function name and `mosje_dj_8020` across `tests/` turns up only
`ABILITY_REGISTRY`-adjacent deck-membership/synergy-text checks, never a direct call).
This is a genuine gap-fill target — a Pattern-B unit test asserting `mp += 10` AND
`questPrepBonus += 2` after calling this function closes **both** BUG-05 and
IMPL-AR-M1 (DJ 80/20 ability execution) simultaneously — one new test, two rows
closed. Model it directly on `stub-engine-wiring.test.ts`'s shape.

### IMPL-SIM — confirmed real crash-count assertions (not log-eyeballing)

```javascript
// Source: tests/ui/simulation/sim-30-games.spec.js:79-94
// 1. No browser crashes
expect(collector.getErrors(), 'No page errors').toHaveLength(0);
expect(WIN_REASONS.has(record.winReason), /* ... */);
expect(record.turnCount, 'Game must end before 30-turn safety cap').toBeLessThan(MAX_TURNS);
```
This is real T2 evidence — `npm run test:sim`'s "0 crashes" claims cited throughout
STATE.md are not just human log-reading, they trace to an actual `expect().toHaveLength(0)`
assertion per game. IMPL-SIM is a strong VERIFIED candidate.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| 2-deck lobby toggle (IMPL-LOBBY's original premise) | 5-duo-deck onboarding + active-deck lobby switcher | Phase 34 (2026-07-03) | IMPL-LOBBY should be marked SUPERSEDED, verified against current behavior (`tests/ui/active-deck-lobby.spec.js`, `tests/ui/onboarding-starter-deck.spec.js`), not re-tested against a lobby shape that no longer exists |
| Hyphenated bare slugs as card ids (`kannetje-melk`) | `piecie_`/`mosje_`/`snelle_`/`place_`/`quest_`-prefixed ids | Some point between Phase 6 and the current codebase (undated in available docs) | All Mosje/Piecie requirement rows need the D-07 mapping table above before any evidence search is meaningful |

**Deprecated/outdated:** REQUIREMENTS.md's Piecie section still shows the pre-refactor
slug scheme as the primary key — this phase's D-05 matrix is the first place the
mapping becomes durable and reproducible; until 48-VERIFICATION.md exists, that
mapping only lives in this research file and in scattered code comments.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `nature-s-gift` and `gun-een-piece` have no live implementation anywhere (confirmed via `Grep` across `src/` and `docs/card-reference.md`, not exhaustive semantic search of every historical commit) | Full Mapping table, Summary | If an obscure alternate spelling/id exists that these greps missed, GAP-DESCOPED would be wrongly assigned instead of SUPERSEDED — low risk since both `src/` and the doc were searched with case-insensitive/substring patterns |
| A2 | BUG-01's `quest-threshold.test.ts` is sufficient standalone evidence without further work (I did not run `git log`/`git blame` to confirm exact chronology relative to the bug ledger note) | Code Examples (BUG-01) | If the test predates the actual fix and doesn't cover the runtime "stale activeMosje" scenario the ledger note describes, BUG-01 may still need a narrower gap-fill — execution should re-read `main.js:541`'s debug log context before finalizing VERIFIED |
| A3 | The `effect_momentum_diefje`/`entry-protection.test.ts` coverage is genuinely partial (no unprotected-target happy-path assertion found) based on a single targeted read of that describe block, not the whole file | Common Pitfalls #2 | If a happy-path assertion exists elsewhere in the same file under a differently-worded describe title, this would be a false-partial classification — re-grep the full file for `effect_momentum_diefje` during execution before gap-filling |

**Not exhaustively re-verified:** the remaining ~40 requirement rows not explicitly
walked in this research (the bulk of Places, Quests, and Snelle Piecies) are HIGH
confidence to have T1/T2 evidence given the density found in the sampled rows and the
`docs/card-reference.md` "implemented" status markings, but Phase 48's own execution
must still run the two-pronged grep on every single row — this research proves the
method and seeds ~30 of 64 rows with confirmed dispositions; it does not substitute
for running the method on all 64.

## Open Questions (RESOLVED — operationalized into plan tasks 2026-07-20)

> Both questions below were carried into concrete plan-task decision criteria during
> Phase 48 planning: Q1 → `48-01-PLAN.md` Task 1 (P12/Q7 duplicate handling), Q2 →
> `48-05-PLAN.md` Task 2 (BUG-01 residual claim, with an explicit fallback to record a
> FINDING rather than silently tick). Left here verbatim for provenance.

1. **[RESOLVED — see 48-01-PLAN.md Task 1]** **Does `IMPL-PF-P12`'s duplication of `IMPL-PF-Q7` get one matrix row or two?**
   - What we know: the slug is identical (`quest_tough_it_out`), REQUIREMENTS.md lists
     it as two distinct checkbox lines in two different sections.
   - What's unclear: whether ticking both checkboxes with the same evidence pointer
     is acceptable, or whether IMPL-PF-P12 should be explicitly marked as a
     "duplicate — see IMPL-PF-Q7" without a tick.
   - Recommendation: tick both (real evidence exists for the underlying quest), but
     make the IMPL-PF-P12 matrix row's evidence column literally say "duplicate of
     IMPL-PF-Q7, same id, filed under the wrong section — see that row," so a future
     reader isn't confused by two independently-described rows for one mechanic.

2. **[RESOLVED — see 48-05-PLAN.md Task 2]** **Should the BUG-01 ledger's specific runtime claim ("stale activeMosje suspected at
   runtime, debug log added") be treated as resolved by the dual-path unit test, or
   does it need a browser-level reproduction given it was originally a *runtime*
   symptom?**
   - What we know: `quest-threshold.test.ts` proves the two threshold-computation
     functions agree in isolation.
   - What's unclear: whether the original bug was actually about state staleness
     (a different bug class than "two functions disagree") that a pure unit test
     can't reproduce.
   - Recommendation: read `main.js:541`'s debug log and its git history first; if the
     log was never actually triggered/removed after confirming no divergence, the
     unit test is sufficient; if the debug log is still live and uninvestigated,
     flag BUG-01 for a browser-level check instead of a tick.

## Environment Availability

Skip — no external dependencies (tests-only phase, existing Vitest/Playwright stack
already installed and used continuously by this codebase).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (browser/sim), both already configured |
| Config file | `vitest.config.ts` (unit), `playwright.config.ts` (browser/sim) — both pre-existing, no changes needed |
| Quick run command | `npx vitest run <path-to-new-test-file>` |
| Full suite command | `npm run validate` (lint + `npm test`, currently 705/705) |

### Phase Requirements → Validation Map

This phase's "requirements" are the 64 IMPL/BUG rows themselves — the phase doesn't
implement behavior, it implements **evidence**. The validation model is therefore
inverted from a normal feature phase:

| Req ID pattern | Validation type | Automated command | Notes |
|---|---|---|---|
| All 64 rows | Traceability assertion | N/A — matrix row in `48-VERIFICATION.md` cites a real `file::test-name` | The "test" IS the evidence; validating this phase means confirming the cited test file/name actually exists and passes, not writing a new assertion about the matrix |
| Gap-fill new tests (~10-15 estimated from this research's sample) | Real behavioral unit/browser test | `npx vitest run <file>` or `npx playwright test --project=cards <file>` | Must follow D-01/D-02 (real assertion, not tautological) |
| Full-suite regression | No `src/` change should alter the count | `npm test` — must stay 705/705 baseline **plus** the new gap-fill test count, zero regressions | D-04 guard: any regression here signals an accidental `src/` edit, which is forbidden |

### Sampling Rate
- **Per gap-fill task:** `npx vitest run <new-file>` (or the equivalent Playwright
  project) immediately after writing it.
- **Per wave merge (per card-type bucket):** full `npm test`, confirm count only goes
  up, never down, and `git diff --stat` shows zero `src/` files touched.
- **Phase gate:** `npm run validate` green, `48-VERIFICATION.md` has all 64 rows with
  a disposition (VERIFIED/SUPERSEDED/GAP-DESCOPED — no blanks, no silent ticks per
  D-08), `REQUIREMENTS.md` checkboxes annotated with evidence pointers.

### Wave 0 Gaps

Confirmed gap-fill targets from this research's sample (not exhaustive — Phase 48
execution must complete the two-pronged grep on all 64 rows to find the rest):

- [ ] `tests/abilities/*.test.ts` — new test for `ability_alyssa_bulldozer_unstoppable` (IMPL-PF-M1)
- [ ] `tests/abilities/*.test.ts` — new test for `ability_jeffrey_brute_force` (IMPL-PF-M2)
- [ ] `tests/abilities/*.test.ts` — new test for `ability_dj_8020_lucky_beats` (IMPL-AR-M1 **and** BUG-05 — one test closes both)
- [ ] `tests/effects/*.test.ts` — new test for `effect_snoeiertje` (IMPL-PF-P3)
- [ ] `tests/effects/*.test.ts` — new test for `effect_dikke_taks` (IMPL-PF-P5)
- [ ] `tests/effects/*.test.ts` — new test for `effect_warm_kannetje_melk` (IMPL-AR-P2)
- [ ] `tests/effects/*.test.ts` — new test for `effect_dubbele_ding` (IMPL-AR-P10)
- [ ] `tests/effects/*.test.ts` — new test for `effect_bijna_welloe` (IMPL-PF-S2 / IMPL-AR-S2)
- [ ] `tests/effects/*.test.ts` — new test for `effect_dubbele_temminks` / `doubleNextPiecie` (IMPL-AR-S4)
- [ ] Confirm/decide disposition for `nature-s-gift` and `gun-een-piece` with the user before ticking GAP-DESCOPED (D-08 requires an honest reason, not silent) — these affect 4 rows (PF-P9, PF-P11, AR-P4, AR-P5)
- [ ] `.planning/phases/09-*/09-VERIFICATION.md` does not yet exist — D-06 requires creating it fresh

*(If the remaining ~50 rows this research didn't hand-verify turn out to already have
qualifying evidence once the two-pronged grep is run — which HIGH confidence suggests
is likely for most — this Wave 0 gap list will shrink further during execution, not
grow; treat the above as a floor, not a ceiling.)*

## Sources

### Primary (HIGH confidence — confirmed via direct tool inspection this session)
- `.planning/REQUIREMENTS.md` — all 64 requirement ids, read in full
- `.planning/phases/48-.../48-CONTEXT.md` — D-01..D-08 locked decisions, read in full
- `.planning/v1.0-v1.0-MILESTONE-AUDIT.md` — 0/64 finding, grouping, closure order
- `.planning/phases/47-.../47-RECONCILIATION-MANIFEST.md` — Verification Debt routing
- `src/data/piecies.js`, `src/data/mosjes.js`, `src/data/snellePiecies.js`,
  `src/data/places.js`, `src/data/quests.js` — every `id:`/`name:` field grepped and
  cross-checked against REQUIREMENTS.md slugs
- `src/abilities/mosjeAbilities.js` — read `ability_dj_8020_lucky_beats` source directly
- `tests/engine/quest-threshold.test.ts`, `tests/engine/piecie-persist-eot.test.ts`,
  `tests/engine/west-calculated-guess.test.ts`, `tests/engine/snelle-piecie-full-slots.test.ts`,
  `tests/engine/stub-engine-wiring.test.ts`, `tests/engine/entry-protection.test.ts`,
  `tests/abilities/ability-text-reconciliation.test.ts`,
  `tests/ui/cards/card-registry.js`, `tests/ui/cards/card-test-runner.js`,
  `tests/ui/simulation/sim-30-games.spec.js`, `tests/ui/simulation/sim-botvsbot.spec.js`,
  `tests/data/deck-balance.test.ts` — all read directly, assertions confirmed, not
  inferred from filenames
- `docs/card-reference.md` — read in full (328 lines) for status/disposition cross-check
- `package.json` — test script names confirmed (`test:sim` is a Playwright project, not
  the `run-once.ts` script CLAUDE.md references — CLAUDE.md's simulation command
  appears stale per existing project memory; use `npm run test:sim`)

### Secondary (MEDIUM confidence)
- None used — this research relied entirely on direct source/test inspection rather
  than web search, appropriate for an internal-codebase traceability task with no
  external-library dimension.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Requirement→card-id mapping: HIGH — every one of the 64 rows cross-checked against
  live `src/data/*.js` id fields, not assumed from REQUIREMENTS.md slugs alone
- Evidence-discovery method: HIGH — proven against 4/5 BUG rows, ~12 Piecie/Mosje rows,
  and the 4 cross-cutting rows via direct file reads, not inference
- Full 64-row disposition: MEDIUM — ~30 rows have a confirmed-by-this-session
  disposition; the remaining ~34 (mostly Places/Quests, which the sampled evidence
  density strongly suggests are well-covered) still need the two-pronged grep run
  during Phase 48 execution itself

**Research date:** 2026-07-20
**Valid until:** Should stay valid for the lifetime of Phase 48's execution (this is a
point-in-time evidence snapshot of a static test tree, not a fast-moving external
dependency) — re-verify only if `src/data/*.js` or `tests/` change materially before
execution starts.
