# MOSJES Card Game — Claude Code Instructions

## ⚠️ Most important rule: when in doubt, STOP and ask
Never assume, guess, or work around missing information. If something is unclear — a file is missing, a rule is ambiguous, instructions conflict — stop and ask the user before proceeding. A wrong assumption can silently break things. One clarifying question is always better than 20 minutes of work in the wrong direction.

---

## 🧩 New feature or bugfix? Start with `/gsd-discuss-phase` — don't wait to be told
Whenever the user asks for a new feature, or a bugfix that isn't a trivial one-liner, **kick off the `gsd-discuss-phase` skill yourself before writing any code or making a plan.** Do not wait for the user to type `/gsd-discuss-phase` — they've asked for this to be automatic because they kept forgetting to invoke it manually. The skill asks adaptive, scoped, multiple-choice-style questions (via `AskUserQuestion`) that pin down intent before implementation starts, which has repeatedly produced clearer, higher-confidence scope than diving straight into code.

Skip this step only for genuinely trivial changes (typo fixes, one-line tweaks, "just run X") where there's no real ambiguity to resolve — use judgment, but default to running it rather than skipping it.

---

## 🐛 Reproduce every reported bug in a live browser BEFORE fixing it
When the user reports a bug, **do not start coding a fix until you have reproduced it in a real browser** (Playwright, driving the actual `.js` game). Seeing the exact cause on a real board — not just reasoning from logs — is the whole point: it confirms the diagnosis for both of us before any code changes.

The workflow that works (we proved it on the deck-out turn-skip freeze):
1. **Diagnose from the report** (console log, battle log, repro steps) and form a hypothesis about the root cause.
2. **Write a Playwright spec under `tests/ui/`** that recreates the user's scenario as closely as possible — same matchup/cards/board state. Use `seedOfflineSession` + `GAME_URL_TEST` and the `window.__testHooks` (e.g. `setMosjeOnField`, `setHand`, `injectGraveyardCard`, `emptyDeck`, `getGameState`) to force the exact conditions. Add a new test hook if you need one (they're gated behind `testMode=true`, so they never affect real play).
3. **Make the spec FAIL on the current code** — it should hang/throw/assert-wrong, demonstrating the bug live. If it passes, you haven't reproduced it yet — keep going.
4. **Prove it's the real cause:** confirm the spec fails on the buggy code and passes once fixed. The strongest proof is running the same spec against the pre-fix code (e.g. temporarily `git revert` the fix) and watching it break, then restoring the fix and watching it pass.
5. **Only then fix the code**, keep the repro spec in the suite as a permanent regression guard, and run the full verification sequence below.

If a bug genuinely can't be reproduced in the browser (e.g. it lives in pure-engine logic with no UI surface), say so explicitly and fall back to a failing unit test that reproduces it — never skip the "make it fail first" step.

---

## What this project is
A card game engine for the Mosjes Card Game — a friend-group trading card game where players race to Level 3 by earning Momentum Points (MP) through Quests. **This is a digital prototype used to playtest the rules, card interactions, chains, and multiplayer before printing a physical card game.** Priorities: a clean prototype, easy editing of cards/abilities, working multiplayer (P2P + bot), and tests that verify *real* card behavior (not hallucinated).

## 🧭 Architecture: ONE engine — single source of truth
There used to be **two** engines defining every card (a duplication tax — every change needed two edits). We are consolidating to a **single source of truth: the imperative JavaScript engine** that actually runs the live game.

- **The live game = the imperative `.js` engine.** It runs raw `.js` in the browser (no build step), so a `.js` file can never import a `.ts` file. Everything players touch — cards, abilities, quests, bot, multiplayer, UI — lives in `.js`:
  - `src/data/*.js` (card data), `src/abilities/*.js` (effects), `src/engine/*.js` (game loop: mpManager, turnManager, victoryChecker, gameState, deckEngine, synergyResolver), `src/ui/*.js`, `src/bot/`, `src/multiplayer/`, `src/rules/`.
- **Tests that matter test the REAL engine** via the browser (Playwright): `tests/ui/cards/` (card-test-library), `tests/ui/cinema/` (narrated demos), `tests/ui/*.spec.js`. These boot the actual game and assert on-screen MP/results — the antidote to hallucinated tests. Plus the imperative-engine unit tests in `tests/` that import the `.js` modules.

### 🚫 `/_archive/` — do NOT read or scan it
The retired **declarative TypeScript engine** (the old second definition of every card) is being moved to **`/_archive/`**. It is parked, not deleted (recoverable any time from git history + the `backup-pre-ssot-*` tag).

**Never read, grep, scan, edit, or reason about anything under `/_archive/`.** It does not run, it is not the source of truth, and scanning it wastes tokens and risks confusing the live engine with dead code. If a search hits `/_archive/`, ignore those results. Only touch it if the user explicitly asks to restore something from the archive.

> The old "two card systems — reconcile both + docs" rule is **obsolete**. There is now ONE source of truth (the `.js` engine). When you add or change a card, edit it **once** in the `.js` engine + its docs. Do not create or maintain a parallel `.ts` definition.

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

### The full verification sequence — run this before every commit
Run these three commands in order. All three must pass before committing.

**Step 1 — Syntax check (catches parse errors in files the test suite never imports):**
```bash
node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js
```
No output = clean. Any output = syntax error, fix before continuing.

**Step 2 — Unit tests:**
```bash
npm test
```
If tests fail after your change, fix it before doing anything else. Do not stack changes on a broken base.

**Step 3 — After any change to MP gain/loss, quests, or level logic:**
Re-run the Ronald Kip stacking test specifically, then the full simulation:
```bash
node --loader ts-node/esm src/simulation/run-once.ts
```
Target: 0 crashes, timeout rate < 25%.

### Why syntax-checking UI files matters
The unit test suite does **not** import `src/main.js` or any `src/ui/` files. A syntax error in those files will not be caught by `npm test` — the game will simply fail to load in the browser. `node --check` catches parse errors in under a second. Always run it first.

### Every new feature or card gets a test
When you add something, add a test for it in the same PR/branch. The test must be added to the existing test suite so `npm test` catches it automatically.

A new card needs at minimum:
1. A test that the card definition is valid (correct fields, correct types)
2. A test that its effect does what it's supposed to do
3. If it touches MP, re-run the Ronald Kip stacking test

### When adding a new card
Follow the exact pattern in `/src/cards/proof/proof-simple-gain.ts`.

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
