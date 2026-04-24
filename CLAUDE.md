# MOSJES Card Game — Claude Code Instructions

## ⚠️ Most important rule: when in doubt, STOP and ask
Never assume, guess, or work around missing information. If something is unclear — a file is missing, a rule is ambiguous, instructions conflict — stop and ask the user before proceeding. A wrong assumption can silently break things. One clarifying question is always better than 20 minutes of work in the wrong direction.

---

## What this project is
A TypeScript card game engine for the Mosjes Card Game — a friend-group trading card game where players race to Level 3 by earning Momentum Points (MP) through Quests. The engine is feature-complete (Phase 11). Current work areas: UI layer, Firebase multiplayer, additional cards.

Read these docs before touching anything:
- `/docs/developer-handoff.md` — full architecture overview
- `/docs/card-reference.md` — what is and isn't implemented
- `/docs/phase0-rulings.md` — canonical game rules
- `/docs/phase10-report.md` — latest simulation results

### 🛑 If a doc file is missing — STOP
If any of the above files do not exist, **do not proceed**. Do not guess, do not infer from the code, do not work around it. Stop and tell the user which file is missing and ask them how to proceed. Example: "I can't find `/docs/phase0-rulings.md`. Should I continue without it, or can you add it first?" Never silently fall back to reading source code as a substitute for missing documentation.

---

## Git: always work on branches

**Never commit directly to `main`.** Every feature, fix, or experiment gets its own branch.

```bash
git checkout -b feature/selection-modal
git checkout -b fix/mp-calculation-overflow
git checkout -b card/new-jisca-ability
```

Name branches clearly: `feature/`, `fix/`, `card/`, `ui/`, `test/`. Only merge to `main` when tests are green and the work is complete.

---

## File and code structure rules

### One function per file
Every exported function lives in its own file. No barrel files with multiple function exports.

```
src/effects/apply-mp-gain.ts       ✅
src/effects/index.ts (re-exports only, no logic)  ✅
src/effects/mp-utils.ts (3 functions)  ❌
```

### Small files are better files
Prefer many small files over few large ones. A file over ~80 lines is a warning sign. If it's getting long, split it. Smaller files are easier to test, easier to find bugs in, and easier to reason about.

### Keep card definitions as pure data
No logic inside card definition files. Card files describe *what* a card is (name, type, cost, traits, effect references). All behaviour lives in `/src/effects/`.

```typescript
// ✅ Card file — data only
export const jiscaCard: CardDefinition = {
  id: 'jisca',
  name: 'Jisca',
  type: 'Mosje',
  mpCost: 3,
  effects: [applyHealEffect, drawCardEffect],
};

// ❌ Never put logic in a card file
export const jiscaCard: CardDefinition = {
  effects: [(state) => { /* inline logic */ }],
};
```

### Pure functions in engine and effects
`/src/engine/` and `/src/effects/` must contain only pure functions: same input → same output, no side effects, no mutation.

---

## Modular UI components: build once, reuse everywhere

When building UI, **always ask: could this component be used in more than one context?** If yes, make it generic and reusable.

### The golden example: SelectionModal
A modal that asks the player to pick something from a list should work for *all* of these cases:
- Picking which Mosje to play
- Choosing a card type (Fighting / Digital / Artistic)
- Guessing a card in an opponent's hand
- Selecting a target player
- Picking a Place card

Build it once as a generic `<SelectionModal>` with configurable title, options, and callback — not as four separate modals.

```typescript
// ✅ Generic, reusable
<SelectionModal
  title="Choose a card type"
  options={['Fighting', 'Digital', 'Artistic']}
  onSelect={(choice) => handleCardTypeGuess(choice)}
/>

// ❌ Don't build one-off modals
<GuessCardTypeModal onGuess={...} />
<PickMosjeModal onPick={...} />
```

Apply this principle broadly: lists, selection UIs, confirmation dialogs, player pickers — if a pattern appears more than once, abstract it.

---

## Testing rules

### Run tests after every change — never move forward on red
```bash
npm test
```
If tests fail after your change, fix it before doing anything else. Do not stack changes on a broken base.

### Every new feature or card gets a test
When you add something, add a test for it in the same PR/branch. The test must be added to the existing test suite so `npm test` catches it automatically.

A new card needs at minimum:
1. A test that the card definition is valid (correct fields, correct types)
2. A test that its effect does what it's supposed to do
3. If it touches MP, re-run the Ronald Kip stacking test

### When adding a new card
Follow the exact pattern in `/src/cards/proof/proof-simple-gain.ts`.

### Running the simulation
```bash
node --loader ts-node/esm src/simulation/run-once.ts
```
Target: 0 crashes, timeout rate < 25%.

---

## MP calculation: extra caution required

If your change touches MP gain, MP costs, level thresholds, or Quest completion logic:
1. Re-run the Ronald Kip stacking test specifically
2. Run the full simulation after
3. Check `/docs/phase0-rulings.md` to confirm the ruling before assuming something is a bug

---

## Current project state at a glance

| Layer | Status |
|---|---|
| TypeScript engine | ✅ Feature-complete (Phase 11) |
| Tests | ✅ 536 passing |
| Card implementations | ✅ All cards, Phases 1–11 |
| UI layer | 🔨 In progress |
| Firebase multiplayer | 📋 Planned |
| Additional cards | 📋 Planned |

Architecture: immutable reducer pattern. State is never mutated — every action returns a new state object.

---

## Quick reference: key paths

```
/src/engine/          — core game loop, pure functions only
/src/effects/         — card effect implementations, pure functions only
/src/cards/           — card definitions (data only, no logic)
/src/simulation/      — simulation runner
/src/ui/              — UI layer (in progress)
/docs/                — all design docs, read before changing things
```
