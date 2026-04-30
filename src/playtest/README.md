# Card Playtest Framework

Automated playtest suite for verifying individual card behavior against the game engine. Run any card in isolation, verify its effects execute correctly, and get detailed reports of what works and what doesn't.

## Quick Start

```bash
# Run all Physical Force specs
npx tsx src/playtest/run-all-playtests.ts

# Output: docs/playtest-report.md (human-readable results)
```

## How It Works

### 1. Write a Card Spec
Each card gets a `CardPlaytestSpec` that describes:
- **What card** to test
- **Deck composition** (minimal for determinism)
- **Starting state** (Mosje, MP, opponent Mosje)
- **Expected outcomes** (events that should fire, state changes)

```typescript
export const kannetjeMelkSpec: CardPlaytestSpec = {
  cardId: "kannetje-melk" as CardId,
  description: "Gains 25 MP on the active Mosje",
  deck: ["kannetje-melk", ...FILLER] as CardId[],
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 50 },
  opponentMosje: { cardId: "martin-the-historian" as CardId, startMP: 50 },
  expectations: [
    { type: "card_resolved", outcome: "success", description: "Card resolves successfully" },
    { type: "event_emitted", eventType: "mp_gained", 
      check: (e) => e.type === "mp_gained" && (e as any).amount === 25,
      description: "Emits mp_gained with amount=25" },
  ],
};
```

### 2. Run the Playtest
The framework:
1. Creates a game with the spec's deck and Mosjes
2. Injects the target card at the top of the deck (guaranteed to draw)
3. Runs **one AI turn** for player1
4. Scans the event log for card execution and effects
5. Checks each expectation against events and state
6. Builds a detailed result with pass/fail and diagnostics

### 3. Read the Report
```markdown
# Card Playtest Report

### ✅ kannetje-melk — Kannetje Melk
> Gains 25 MP on the active Mosje

**Expectations:**
- ✅ Card resolves successfully
- ✅ Emits mp_gained with amount=25
  > Found 2 matching event(s)
```

## Adding Tests for More Cards

### Pattern: One Spec Per Card

Create specs in `src/playtest/specs/{deck-name}.ts`. Example layout:

```typescript
// specs/digital-control.ts
export const potOfWeedSpec: CardPlaytestSpec = { ... };
export const baggazOfGreedSpec: CardPlaytestSpec = { ... };

export const DIGITAL_CONTROL_SPECS: readonly CardPlaytestSpec[] = [
  potOfWeedSpec,
  baggazOfGreedSpec,
  // ... more specs
];
```

Then add to `specs/index.ts`:
```typescript
export { DIGITAL_CONTROL_SPECS } from "./digital-control.js";
```

And update `run-all-playtests.ts`:
```typescript
const allSpecs = [
  ...PHYSICAL_FORCE_SPECS,
  ...DIGITAL_CONTROL_SPECS,  // add this
];
```

### Expectation Types

#### Card Resolution
```typescript
{ type: "card_resolved", outcome: "success", description: "Card executes" }
{ type: "card_resolved", outcome: "partial", description: "Card partially resolves" }
{ type: "card_resolved", outcome: "rejected", description: "Card is rejected" }
```

If outcome is omitted, any non-rejected result passes.

#### Event Emission
```typescript
{
  type: "event_emitted",
  eventType: "mp_gained",  // event.type === "mp_gained"
  check: (event, beforeState) => (event as any).amount >= 25,
  description: "Gains at least 25 MP"
}
```

The `check` function receives the event and pre-turn state. Return `true` to pass.

#### State Change
```typescript
{
  type: "state_change",
  check: (beforeState, afterState) => {
    const before = getActiveMosjeMP(beforeState, "player1");
    const after = getActiveMosjeMP(afterState, "player1");
    return after >= before + 25;
  },
  description: "Active Mosje MP increases by at least 25"
}
```

### Minimal Deck Construction

Use the shared `FILLER` constant to keep decks small and deterministic:

```typescript
const FILLER: CardId[] = [
  "kannetje-melk" as CardId,
  "kannetje-melk" as CardId,
  "shoettoe" as CardId,
  "shoettoe" as CardId,
];

deck: ["target-card-id", ...FILLER] as CardId[]
```

**Why minimal?** The AI picks alphabetically from `seemsPlayable` cards. A 4-card deck ensures the target card gets drawn and played first.

### Handling Card Requirements

Some cards have requirements (MP thresholds, level requirements, etc.):

```typescript
// shoettoe requires active Mosje MP <= 29
export const shoettoeSpec: CardPlaytestSpec = {
  mosje: { cardId: "alyssa-the-bulldozer" as CardId, startMP: 20 },
  // ... rest of spec
};
```

If a card is **rejected** at play, check its `requirements` field in the CardDefinition.

## Architecture

| File | Purpose |
|------|---------|
| `types.ts` | `CardPlaytestSpec`, `Expectation`, `PlaytestResult` types |
| `inject-card.ts` | Place card at top of deck, helper for MP queries |
| `run-card-playtest.ts` | Single spec runner — creates game, injects card, runs AI, checks expectations |
| `generate-report.ts` | Renders results to markdown |
| `run-all-playtests.ts` | Entry point — loads all specs, runs playtests, writes report |
| `bootstrap-registry.ts` | Imports all card registrations (side-effect) |
| `specs/*.ts` | Card specs by deck |

## Common Patterns & Troubleshooting

### Card Not Played
**Symptom:** "Not played" in report.

**Root cause:** Usually card creation failed or it's not in the shuffled deck.

**Check:**
- Does the spec's deck include the target card ID?
- Is the card registered? (`registerCard(CARD_DEFINITION)` called?)

### Card Rejected
**Symptom:** outcome: "rejected"

**Root cause:** Card requirements not met.

**Check:**
```typescript
const card = getCard("card-id");
console.log(card.requirements);
```

Then set `mosje.startMP` to satisfy `{ type: "mp", params: { operator: "<=", value: 29 } }`.

### Event Not Emitted
**Symptom:** mp_gained event expected, but not found.

**Root cause:** Effect primitive didn't fire, or fired to a different target.

**Check:**
- Is the effect in CardDefinition?
- Does the effect target resolve correctly (e.g. `$self` vs `$target`)?
- Did a guard condition (ifThenElse) prevent the effect?

### State Change Failed
**Symptom:** Card resolved, events matched, but state didn't change.

**Root cause:** Typical — other effects may have fired (endturn, place triggers).

**Solution:** Relax the check to use `>=` or `<=` instead of exact equality, or remove the state_change expectation if you already verify events.

## Running Individual Specs

To test just one card during development:

```typescript
// specs/physical-force.ts
import { runCardPlaytest } from "../run-card-playtest.js";

console.log(runCardPlaytest(kannetjeMelkSpec));
```

Then run with `npx tsx src/playtest/specs/physical-force.ts`.

## Integration with CI

The framework returns exit code 0 if all specs pass, non-zero on any failure. Can be added to CI:

```bash
npx tsx src/playtest/run-all-playtests.ts && echo "All playtests passed!" || exit 1
```

## Next Steps

- [ ] Add Digital Control specs (~12 cards)
- [ ] Add Artistic Rhythm specs (~12 cards)
- [ ] Extend to test Snelle Piecies, Places, Quests
- [ ] Add performance regression tracking (turn count, event count)
- [ ] Add multi-turn specs (card combos, synergies)
