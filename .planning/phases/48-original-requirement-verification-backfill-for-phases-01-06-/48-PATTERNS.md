# Phase 48: Original Requirement Verification Backfill — Pattern Map

**Mapped:** 2026-07-20
**Files analyzed:** 3 output/deliverable files + ~10 confirmed gap-fill test targets (floor, per RESEARCH.md — actual count may grow once the two-pronged grep runs on all 64 rows)
**Analogs found:** 3 / 3 (all three deliverable types have a strong, recent, in-repo analog)

This is a **tests-only + docs-only** phase (D-04). There is no controller/component/
service code to map — every "new file" is either (a) a unit test asserting an
existing `src/` effect/ability function's behavior, (b) a data-driven row in the
browser card-test-library, or (c) a traceability/verification markdown doc. Patterns
below are organized by those three shapes, not by a conventional role/data-flow table,
because every gap-fill in this phase is the same two shapes repeated ~10 times.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| New `tests/effects/*.test.ts` rows (e.g. `effect_snoeiertje`, `effect_dikke_taks`, `effect_warm_kannetje_melk`, `effect_dubbele_ding`, `effect_bijna_welloe`, `effect_dubbele_temminks`) | test (unit) | CRUD-ish (pure state-in → state-out transform) | `tests/effects/thematic-piecies.test.ts` | exact — same file type, same phase-cycle recency (Phase 46), same `effect_*` import + `makeState`/`makeMosje` shape |
| New `tests/abilities/*.test.ts` rows (`ability_alyssa_bulldozer_unstoppable`, `ability_jeffrey_brute_force`, `ability_dj_8020_lucky_beats` — the last one also closes BUG-05) | test (unit) | transform (pure state-in → state-out) | `tests/abilities/binti-creator-quick-sketch.test.ts` (shape) + `tests/engine/stub-engine-wiring.test.ts` (minimal-state idiom) | exact — same `ability_*` direct-import pattern, same describe/it/expect shape |
| New `CARD_REGISTRY` / `ABILITY_REGISTRY` rows in `tests/ui/cards/card-registry.js` (browser T1, used only if a unit test can't reach the full play→activate flow) | test (browser, data-driven) | request-response (drives the live game via Playwright, asserts on-screen/state outcome) | `tests/ui/cards/card-registry.js:64-70` (`piecie_quest_prep` row) and `:303-313` (`ABILITY_REGISTRY` rows) | exact — literally the same registry file, same object-literal shape |
| `48-VERIFICATION.md` (traceability matrix) | doc (verification/traceability) | batch (one row per requirement, static report) | `46-VERIFICATION.md` (goal-verification shape) + `36-VERIFICATION.md` (Requirements Coverage table shape) | role-match — neither existing file is a *per-requirement-id* matrix, but 36's "Requirements Coverage" table (`| Requirement | Description | Status | Evidence |`) is the closest structural precedent; 48 needs to extend it to a 64-row 1:1 id→evidence matrix per D-05 |
| `.planning/phases/09-ui-engine-bug-fixes/09-VERIFICATION.md` (new, D-06) | doc (verification) | batch | `46-VERIFICATION.md` (frontmatter + Observable Truths + Verification Commands shape), scoped down to BUG-01..05 only | role-match — same doc family, narrower scope (5 bugs, not a full phase goal) |
| `REQUIREMENTS.md` checkbox annotations | doc (ledger update) | batch (in-place edit, not a new file) | `REQUIREMENTS.md` itself (existing `- [ ] **IMPL-PF-P1:** kannetje-melk — effect execution` lines) | exact — same file, edited in place per D-05 |

## Pattern Assignments

### Gap-fill unit test — Piecie/Snelle Piecie effect functions (`tests/effects/*.test.ts`)

**Analog:** `tests/effects/thematic-piecies.test.ts` (Phase 46, most recently touched effect test file — matches "prefer recently modified" ranking rule)

**Imports pattern** (lines 1-16):
```typescript
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error - JavaScript module has no type declarations
import { PIECIES } from '../../src/data/piecies.js';
// @ts-expect-error - JavaScript module has no type declarations
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-expect-error - JavaScript module has no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';
// @ts-expect-error - JavaScript module has no type declarations
import {
  effect_boosterpackkie,
  effect_dikke_plaat,
  effect_loaded_dice,
  effect_perfect_rhythm,
} from '../../src/abilities/piecieEffects.js';
// @ts-expect-error - JavaScript module has no type declarations
import { activatePiecie, endTurn } from '../../src/engine/turnManager.js';
```
For the Phase 48 gap-fills, replace the imported effect names with the target
function(s) — e.g. `effect_snoeiertje`, `effect_dikke_taks`, `effect_warm_kannetje_melk`,
`effect_dubbele_ding`, `effect_bijna_welloe`, `effect_dubbele_temminks` (grep the
card's `effectId` field in `src/data/piecies.js` / `src/data/snellePiecies.js` first
to get the exact export name — do not guess it from the card id).

**State-fixture pattern** (lines 30-92) — `makeMosje` + `makePlayer` + `makeState`:
```typescript
function makeMosje(cardId: string, mp = 50, tags?: string[]) {
  return {
    cardId, name: cardId, subtype: 'ARTISTIC', tags, traits: {},
    mp, level: 1, isDefeated: false, statusEffects: [],
    abilityUsedThisTurn: false, mpLostThisTurn: 0,
  };
}
function makePlayer(options: StateOptions = {}) {
  return {
    playerId: 'player_1',
    hand: options.hand ?? [], deck: options.deck ?? [], graveyard: [],
    activeSlots: options.activeSlots ?? [makeMosje(options.cardId ?? 'mosje_chris', options.mp, options.tags), null],
    piecieSlots: options.piecieSlots ?? [null, null, null, null],
    questPrepBonus: 0, questsCompleted: 0, questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0, hasAttemptedQuestThisTurn: false,
    pieciesActivatedThisTurn: 0, pieciesPlayedThisTurn: 0, actionsThisTurn: [],
    totalDamageTaken: 0,
  };
}
function makeState(options: StateOptions = {}) {
  return {
    roomCode: 'TEST', status: 'PLAYING', activePlayerId: 'player_1', turnNumber: 2,
    activePlace: null, activeQuest: null, sharedPlaceSlot: null, winnerId: null, winReason: null,
    _snelleFlags: {}, _pendingTargets: {}, sharedGeneralQuestDiscard: [],
    players: {
      player_1: makePlayer(options),
      player_2: { ...makePlayer({ cardId: 'mosje_gandoe_destroyer' }), playerId: 'player_2' },
    },
  };
}
```
Simpler alternative (fewer fields, from `tests/engine/stub-engine-wiring.test.ts:26-52`)
when the target effect only touches `activeSlots`/`statusEffects` and doesn't need
questPrepBonus/piecieSlots/hand/deck — use this leaner shape instead of the full one above:
```typescript
function makeState(mp: number, level: number, statusEffects: unknown[] = []) {
  return {
    activePlace: null, _snelleFlags: {},
    players: { p1: { totalDamageTaken: 0, activeSlots: [
      { cardId: "mosje_test", name: "Test", mp, level, isDefeated: false, traits: {},
        statusEffects: [...statusEffects], immuneThisTurn: false, mpLostThisTurn: 0 },
      null,
    ], graveyard: [], questsCompleted: 0 } },
  };
}
```

**Core assertion pattern (D-01/D-02 — real behavioral assertion, not tautological)**
(lines 146-183, 234-266):
```typescript
describe('Loaded Dice and Dikke Plaat', () => {
  it('Loaded Dice gives +1 without a JEFFREY Mosje', () => {
    const result = effect_loaded_dice(makeState(), 'player_1');
    expect(result.players.player_1.questPrepBonus).toBe(1);
  });

  it('Loaded Dice gives +2 from canonical JEFFREY card data', () => {
    const result = effect_loaded_dice(makeState({ cardId: 'mosje_jeffrey_gambler' }), 'player_1');
    expect(result.players.player_1.questPrepBonus).toBe(2);
  });
});
```
Note the shape every gap-fill should replicate: (1) call the real effect function with
a minimal state, (2) assert a *concrete field delta* (MP value, status-effect push,
flag boolean, hand/deck length) that would fail if the effect body were deleted — never
just `expect(card).toBeDefined()`.

**Mock-driven (dice/RNG) assertion pattern** (lines 186-201) — needed for
`effect_dikke_taks`/`effect_bijna_welloe` if they involve a roll or randomness:
```typescript
it('draws one card on rolls 1-4 and rolls exactly once', () => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0);
  const result = effect_boosterpackkie(makeState({ deck: [...] }), 'player_1');
  expect(result.players.player_1.hand.map((c) => c.cardId)).toEqual(['draw_1']);
  expect(random).toHaveBeenCalledTimes(1);
});
```
Cleanup: `afterEach(() => { vi.restoreAllMocks(); })` (line 94-96) — required whenever
`vi.spyOn(Math, 'random')` is used in any test in the file.

---

### Gap-fill unit test — Mosje ability functions (`tests/abilities/*.test.ts`)

**Analog:** `tests/abilities/binti-creator-quick-sketch.test.ts` (shape/idiom) — this is
the closest same-role (Mosje ability, direct function import, `_pendingTargets` idiom
where relevant) analog for the three confirmed ability gaps:
`ability_alyssa_bulldozer_unstoppable`, `ability_jeffrey_brute_force`,
`ability_dj_8020_lucky_beats`.

**Imports pattern** (lines 1-5):
```typescript
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { ability_binti_creator_quick_sketch } from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
```
`createEngineState` (from `tests/helpers/testHelpers.js`) is a reusable full-state
builder that several `tests/abilities/*.test.ts` files already use (see also
`youri-chris-synergy.test.ts`, `ronald-chef-lock.test.ts`, `fps-west-guess.test.ts`,
`amplifier-hacker-rework.test.ts` — all import `ability_*` directly from
`src/abilities/mosjeAbilities.js` the same way). Prefer `createEngineState` over
hand-rolling `makeState` for ability tests since it is the established helper in this
directory.

**State + call + assertion pattern** (lines 11-50):
```typescript
function bintiState(): any {
  const state = createEngineState({
    players: {
      player_1: {
        activeSlots: [
          { cardId: "mosje_binti_creator", name: "[Binti] The Creator", mp: 60, level: 1,
            isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
          null,
        ],
      },
    },
  });
  state.players.player_1.hand = [ /* ... */ ];
  return state;
}

describe("Binti Creator — Quick Sketch (discard 2 FOOD → tutor 1 from deck)", () => {
  it("discards both chosen FOOD cards and pulls the chosen card from deck to hand", () => {
    const state = bintiState();
    state._pendingTargets = { bintiCreatorDiscard: [...], bintiCreatorTutor: "..." };
    const next = ability_binti_creator_quick_sketch(state, "player_1");

    const handIds = next.players.player_1.hand.map((c: any) => c.cardId ?? c);
    expect(handIds).toContain("piecie_pot_of_weed");
    expect(next.players.player_1.graveyard.length).toBe(2);
  });
});
```
Apply directly to `ability_dj_8020_lucky_beats` (source at
`src/abilities/mosjeAbilities.js:56-70`, per RESEARCH.md): build a minimal
`activeSlots[0]` Mosje at some MP, call the function, then assert BOTH
`player.activeSlots[0].mp` increased by exactly 10 AND `player.questPrepBonus`
increased by exactly 2 — this single test closes both IMPL-AR-M1 and BUG-05
simultaneously (per RESEARCH.md's confirmed finding). For
`ability_alyssa_bulldozer_unstoppable` / `ability_jeffrey_brute_force`, read each
function's body in `src/abilities/mosjeAbilities.js` first (their exact field-level
effect is not yet quoted in RESEARCH.md) and assert whatever concrete state change
each one performs.

---

### Gap-fill browser test — card-test-library row (`tests/ui/cards/card-registry.js`)

**Analog:** `tests/ui/cards/card-registry.js:64-70` (Piecie row) and `:303-313`
(`ABILITY_REGISTRY` rows) — use this ONLY when a requirement's "happy path" genuinely
needs the full play→activate browser flow and a unit test on the pure function isn't
sufficient evidence of the requirement's intent (per D-01, this is Pattern A, browser
T1 — the unit-test route, Pattern B, is preferred by RESEARCH.md's Wave 0 list for all
~10 confirmed gaps, but keep this pattern in reserve for any row execution finds needs
it).

**Piecie/Snelle/Place row shape:**
```javascript
{
    cardId: 'piecie_quest_prep', cardType: 'PIECIE', // "Dubbele Dosis"
    setup: { ownMP: 40 }, playThen: 'place-then-activate',
    expectedEffect: 'FIELD_EFFECT',
    stateFlag: { path: 'players.player_1.questPrepBonus', equals: 2 },
    logMatch: /[Dd]ubbele|quest.prep/i,
},
```

**Mosje-ability row shape:**
```javascript
{
    mosje: 'mosje_amplifier', abilityMosjeId: 'mosje_amplifier', playThen: 'ability',
    setup: { ownMP: 50 }, expectedEffect: 'MP_GAIN', mpDeltaMin: 10, mpDeltaMax: 10, // all own Mosjes +10
    cardId: 'ability_amplifier_power_boost', logMatch: /[Aa]mplifier/,
},
```

**Field reference** (from the runner's header comment, `card-test-runner.js:11-27`):
`cardId`, `cardType` ('PIECIE'|'SNELLE_PIECIE'|'PLACE'), `mosje`/`abilityMosjeId`,
`setup: { ownMP, opponentMP }`, `playThen` ('place-then-activate'|'play-direct'|
'ability'), `expectedEffect` (MP_GAIN|ATTACK|DRAW|FIELD_EFFECT|GAMBLE|...),
`mpDeltaMin/Max`, `oppDeltaMin/Max`, `handDelta`, `stateFlag: { path, equals }`,
`logMatch`, `skipReason` (non-null = skipped, real coverage lives elsewhere — check
`chain-tests.spec.js` / `card-chains.spec.js` before assuming a skipped row is
uncovered, per RESEARCH.md Anti-Pattern and the `skipReason` example at
`card-registry.js:314-318`).

**No new runner code needed** — adding a row is a single object literal; the generic
`card-test-runner.js` drives setup, activation, MP snapshotting, and log assertion.

---

### `48-VERIFICATION.md` — traceability matrix

**Analog:** `36-VERIFICATION.md`'s "Requirements Coverage" table (lines 61-75) is the
closest existing structural precedent for a per-requirement-id row, extended per D-05
to a full 64-row matrix (one row per `IMPL-*`/`BUG-*` id, not just per phase-scoped
requirement bucket like COST-01..09):

```markdown
### Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| COST-01 | Full Piecie text audit, ruling table | SATISFIED | Audit doc + data corrections confirmed |
```

Combine this table shape with `46-VERIFICATION.md`'s frontmatter + section
structure (lines 1-16, 55-64) for the doc's overall skeleton:
```markdown
---
phase: 48-original-requirement-verification-backfill-for-phases-01-06-and-09
verified: <date>
status: <passed|partial>
score: <n>/64 requirements VERIFIED (SUPERSEDED and GAP/DESCOPED counted separately)
overrides_applied: 0
---

# Phase 48: Original Requirement Verification Backfill Report
...
## Verification Commands
- `npx vitest run <new gap-fill files>` — ...
- `npm test` — N files, M/M passed (baseline 705 + new gap-fill count)
- `npm run validate` — ...
```

**Required per-row columns (per D-05/D-07/D-08 — not fully present in either analog,
must be synthesized):**
`Requirement ID | Original slug (2026-05) | Current card/effect id | Disposition
(VERIFIED / SUPERSEDED / GAP-DESCOPED) | Evidence (test file::test name, or
"gap → new test added <path>", or GAP reason) | Notes`.
Use RESEARCH.md's "Full Requirement → Card ID Mapping" table (the 64-row seed) as the
literal row source — do not re-derive the id mapping, copy it forward into the matrix.

---

### `09-VERIFICATION.md` — BUG-01..05 backfill (new, D-06)

**Analog:** `46-VERIFICATION.md`'s full shape (frontmatter, Observable Truths table,
Required Artifacts table, Verification Commands, Gaps Summary), scoped down to the 5
BUG rows only, written fresh into
`.planning/phases/09-ui-engine-bug-fixes/09-VERIFICATION.md` — confirmed via `Glob` that
this file does not yet exist in that directory (only `09-RESEARCH.md`, `09-0{1..5}-PLAN.md`,
`09-0{1..5}-SUMMARY.md` exist there currently).

**BUG-01 regression-test dual-path pattern** (already exists — cite directly, don't
duplicate, per RESEARCH.md's Code Examples section):
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
Before citing this as sufficient, execution must confirm (per RESEARCH.md Assumption
A2 / Open Question 2) whether the original bug's runtime "stale activeMosje" symptom
is actually reproduced by this isolated dual-function-agreement test, or whether it
needs a narrower browser-level check — read `main.js:541`'s debug log/git history
first (D-04 forbids fixing anything found; if genuinely unresolved, record it as a
FINDING, not a silent tick).

## Shared Patterns

### "Real assertion, not tautological" gate (D-01/D-02)
**Source:** every analog above (`thematic-piecies.test.ts`, `binti-creator-quick-sketch.test.ts`, `stub-engine-wiring.test.ts`)
**Apply to:** all new gap-fill tests
Every new test must call the real `effect_*`/`ability_*` function and assert a
concrete field delta (`toBe`, `toEqual`, `toContain`, `toHaveLength` on an actual
returned-state value) — never `toBeDefined()`/`not.toThrow()` alone, and never assert
only card-registry membership (`tests/data/deck-balance.test.ts`'s
`expect(deck).toContain('piecie_tikker')` style is explicitly **not** acceptable
per-card evidence — see RESEARCH.md Anti-Patterns).

### Minimal-state builder reuse (Don't Hand-Roll)
**Source:** `tests/effects/thematic-piecies.test.ts` (`makeState`/`makeMosje`/`makePlayer`), `tests/engine/stub-engine-wiring.test.ts` (leaner `makeState`), `tests/abilities/*.test.ts` (`createEngineState` from `tests/helpers/testHelpers.js`)
**Apply to:** all new gap-fill unit tests
Copy the nearest sibling file's state builder rather than writing one from scratch —
every test file in `tests/effects/`, `tests/abilities/`, `tests/engine/` already has a
near-identical minimal-state shape; trim to what the target effect/ability actually
reads.

### `@ts-expect-error` JS-import boundary comment
**Source:** every `.test.ts` file that imports from `src/*.js`
**Apply to:** all new `.test.ts` gap-fills
```typescript
// @ts-expect-error — JS module, no type declarations
import { effect_snoeiertje } from "../../src/abilities/piecieEffects.js";
```
Required immediately above every import line pulling from a `.js` source module
(project convention — TS tests importing untyped `.js` engine code).

### ID-normalization annotation (D-07)
**Source:** RESEARCH.md's Full Requirement → Card ID Mapping table
**Apply to:** every `48-VERIFICATION.md` row
Every row must show the explicit old-slug → current-id mapping even when mechanical
(hyphen→underscore + prefix), and flag the two non-mechanical divergences explicitly
(`shoettoe` → `piecie_energy_surge`, `dubbele-dosis` → `piecie_quest_prep`) plus the
two confirmed-absent slugs (`nature-s-gift`, `gun-een-piece`) and the one
mis-filed duplicate (`IMPL-PF-P12` == `IMPL-PF-Q7`'s `quest_tough_it_out`).

## No Analog Found

None. All three deliverable shapes (unit-test gap-fill, browser-registry gap-fill,
verification-matrix doc) have a strong, recently-touched, in-repo analog. The one
partial gap is structural, not missing: no existing VERIFICATION.md is a pure
1:1 requirement-id traceability matrix (they are phase-goal verification reports with
a requirements-coverage section bolted on) — `48-VERIFICATION.md` must synthesize the
64-row matrix shape from 36-VERIFICATION.md's Requirements Coverage table pattern
rather than copy an existing full matrix file. This is a format-extension, not a gap.

## Metadata

**Analog search scope:** `tests/effects/`, `tests/abilities/`, `tests/engine/`,
`tests/ui/cards/`, `.planning/phases/36-*/`, `.planning/phases/46-*/`,
`.planning/REQUIREMENTS.md`
**Files scanned:** 3 `tests/effects/*.test.ts`, 18 `tests/abilities/*.test.ts` (listed
via Glob, one read in full), `tests/engine/stub-engine-wiring.test.ts` (partial read,
per RESEARCH.md's own citation), `tests/ui/cards/card-registry.js` (partial read,
imports + 2 registries), `tests/ui/cards/card-test-runner.js` (header + first 80
lines), `46-VERIFICATION.md` (full), `36-VERIFICATION.md` (partial, requirements
section), `.planning/REQUIREMENTS.md` (partial, structure confirmation)
**Pattern extraction date:** 2026-07-20
