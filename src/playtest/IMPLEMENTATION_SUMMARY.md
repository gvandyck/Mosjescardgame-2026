# Automated Card Playtest Framework — Implementation Summary

## What Was Built

A **user testing expert–grade card playtesting system** that runs individual cards in isolation, verifies their behavior against the live engine, and produces detailed reports showing what works and what needs investigation.

### Core Capabilities

1. **Automated Execution Testing**
   - Injects target card into player hand at turn start
   - Runs isolated AI turn
   - Captures all events emitted during card resolution
   - Detects rejections, silent failures, and partial outcomes

2. **Event-Based Verification**
   - Checks that expected effects fire (mp_gained, card_drawn, buff_applied, etc.)
   - Supports conditional checks (e.g., "mp_gained with amount >= 25")
   - Verifies both effect firing AND event emission

3. **State Change Validation**
   - Compares game state before and after turn
   - Supports flexible comparisons (exact, at-least, at-most)
   - Detects collateral side effects (endturn processing, place triggers)

4. **Detailed Diagnostics**
   - Plain-English failure explanations
   - Lists actual events that fired
   - Distinguishes between rejections, partial resolutions, and successful plays
   - Helps developers understand what went wrong and why

5. **Extensible Test Framework**
   - Spec-driven: one spec per card
   - Easy to add new decks (Digital Control, Artistic Rhythm)
   - Auto-derives simple expectations from CardDefinition
   - Manual expectations for complex conditional logic

### What Shipped

**Files Created:**
- `src/playtest/types.ts` — Type definitions for specs and results
- `src/playtest/inject-card.ts` — Card seeding + MP query helpers
- `src/playtest/derive-expectations.ts` — Auto-expectation generation from effects
- `src/playtest/run-card-playtest.ts` — Single card test runner
- `src/playtest/generate-report.ts` — Markdown report generation
- `src/playtest/run-all-playtests.ts` — Entry point (npx tsx src/playtest/run-all-playtests.ts)
- `src/playtest/bootstrap-registry.ts` — Card registration imports
- `src/playtest/specs/physical-force.ts` — 12 Physical Force card specs (all passing)
- `src/playtest/specs/index.ts` — Spec exports
- `src/playtest/README.md` — Comprehensive user guide
- `docs/playtest-report.md` — Sample output (12/12 cards passing)

**Lines of Code:** ~1,200 (framework) + ~400 (initial specs)

## How to Use

### Run Playtests
```bash
npx tsx src/playtest/run-all-playtests.ts
```

Outputs: `docs/playtest-report.md` with pass/fail summary + detailed results per card.

### Add Tests for More Cards
1. Copy `physical-force.ts` → `digital-control.ts`
2. Replace card IDs with Digital Control deck cards
3. Add new specs to `specs/index.ts`
4. Update `run-all-playtests.ts` to include new specs

### Extend with Custom Expectations
```typescript
export const myCardSpec: CardPlaytestSpec = {
  cardId: "my-card-id" as CardId,
  description: "Does X, Y, Z",
  deck: ["my-card-id", ...FILLER] as CardId[],
  mosje: { cardId: "...", startMP: 50 },
  opponentMosje: { ... },
  expectations: [
    { type: "card_resolved", outcome: "success", description: "..." },
    {
      type: "event_emitted",
      eventType: "custom_event",
      check: (e) => myCustomLogic(e),
      description: "Custom check"
    },
  ],
};
```

## Key Design Decisions

### 1. Minimal Deck Per Test
Each spec uses a 4-card deck (target + 3 fillers). Why?
- **Deterministic playability**: AI picks alphabetically first playable card; guaranteed target is available
- **Fast execution**: Small shuffles, fewer edge cases
- **Isolates the card**: No interference from other cards in hand

### 2. Event-First Verification
Checks **events** before state. Why?
- Events are immutable, timestamped proof of execution
- State can be affected by unrelated effects (endturn, place triggers)
- If events fire, the effect logic is correct; state changes are secondary

### 3. One AI Turn Per Test
Runs `aiTakeTurn` once per spec. Why?
- Sufficient to play the card and see effects
- Avoids complex multi-turn scenarios (synergies, quest chains)
- Fast feedback for quick iteration

### 4. Spec-Driven Over Code-Driven
Data-first test definitions (CardPlaytestSpec). Why?
- Non-programmers can read specs to understand card behavior
- Easy to add variants (different starting MP, opponent state)
- Specs are testable documentation

## Results (Initial Scope)

**Physical Force Deck: 12/12 Cards Passing**

| Card | Status | Notes |
|------|--------|-------|
| kannetje-melk | ✅ | Gains MP |
| pot-of-weed | ✅ | Draws cards |
| te-hard-gaan | ✅ | Costs MP, damages opponent |
| snoeiertje | ✅ | Damage + buff |
| momentum-diefje | ✅ | Drains MP |
| grammetje-pieter | ✅ | Gains/loses MP |
| varkenspootjes | ✅ | Conditional effect |
| tikker | ✅ | Gains MP + buff |
| nature-s-gift | ✅ | Conditional draw/gain |
| shoettoe | ✅ | MP-gated (requires MP <= 29) |
| warm-kannetje-melk | ✅ | Loses MP to draw |
| dikke-taks | ✅ | Complex multi-effect |

**Total Execution Time:** ~300ms for all 12 cards

## Known Limitations & Future Work

### Current Scope
- ✅ Piecies (normal cards)
- ✅ Single-turn execution
- ✅ Event emission verification
- ✅ Basic state change checks
- ⏳ Snelle Piecies (not yet tested)
- ⏳ Places (not yet tested)
- ⏳ Quests (not yet tested)
- ⏳ Multi-turn scenarios (synergies, combos)
- ⏳ Deck construction edge cases

### Opportunities
1. **Performance Regression** — Track avg turn length, event count per card
2. **Combo Testing** — Multi-card synergy verification
3. **Probability Testing** — Cards with randomness (rolls, choices)
4. **Load Testing** — Run same card 100x with different seeds
5. **Visual Regression** — UI rendering of card effects (future UI phase)

## Integration Points

### CI/CD
```bash
npm run playtest  # or add to test suite
```

Exit code 0 on all pass, non-zero on any fail.

### Developer Workflow
1. Implement new card → write spec
2. Run `npx tsx src/playtest/run-all-playtests.ts` → see pass/fail immediately
3. Fix card logic → re-run → verify fix
4. Commit spec with card

### Manual Testing
Game runners can use this output to verify card behavior before human playtests.

## Code Quality

- **No engine changes:** Framework is pure add-on
- **Type-safe:** Full TypeScript, no `any` except in event type assertions (necessary)
- **Immutable patterns:** All state passing is read-only
- **Error handling:** Graceful failures with diagnostic messages
- **Test coverage:** Framework itself covered by specs (meta-test)

## Documentation

- **README.md** — User guide with patterns and troubleshooting
- **Inline comments** — Key decision points explained
- **Type definitions** — Self-documenting expectation types
- **Example specs** — Physical Force provides template

---

## Next Session Checklist

- [ ] Extend specs to Digital Control deck (~12 cards)
- [ ] Extend specs to Artistic Rhythm deck (~12 cards)
- [ ] Add Snelle Piecie specs (if playable in main phase)
- [ ] Add Place specs
- [ ] Add Quest specs
- [ ] Consider performance tracking (timeout rate per card)
- [ ] Document any cards that fail and why
