# Phase 25: UI Polish & Feel — Research

**Researched:** 2026-06-05
**Domain:** Browser UI / CSS animations / game-over screen
**Confidence:** HIGH (all findings verified by reading live source files)

---

## Summary

Phase 25 consists of three independent UI improvements: quest result animations (E1), deck archetype identity labels (E2), and an end-game stats screen (E3). All three are pure presentation changes — no engine functions, no state schema changes, no test-suite impact beyond the node --check pass.

**E1 (Quest result animations)** requires hooking into the existing `animateStateDelta` / `renderAndAnimate` call sites in `src/main.js`. The animation infrastructure already supports MP floats, damage shake, and level-up bursts via `src/ui/boardRenderer.js`. What is missing is a distinct "quest success" green flash CSS class and an overlay/banner path for the level-up celebratory event. The `actionLabel: 'quest-resolution'` option is already passed at every quest resolve site, so detection requires no new flags.

**E2 (Deck archetype identities)** requires two changes: (a) add a `tagline` field to each entry in `src/data/starterDecks.js`, and (b) render that tagline below the deck `<option>` or via a dynamic description `<div>` that updates when the select changes. The `<select id="deck-select">` element in `index.html` currently uses plain `<option>` tags that cannot contain child HTML, so the standard pattern for this is a companion `<div id="deck-tagline">` updated via a `change` listener in `initLobbyPage()` in `src/main.js`.

**E3 (End-game stats screen)** requires two things: (a) a stats accumulator tracking quests attempted/succeeded, peak MP per Mosje, biggest single MP gain, and Mosjes lost across the game — none of these are tracked in current state, so they must be computed incrementally as the game runs or computed from the final `gameState` at game-over time — and (b) injecting those stats into `showRewardOverlay` in `src/ui/rewardOverlay.js`, which is the single game-over rendering function already called at `handleGameOver()`.

**Primary recommendation:** Implement the three features in dependency order: E2 (data-only), then E1 (CSS + small hook in actionAnimations.js), then E3 (accumulator + overlay expansion).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Quest result flash/shake animation | Browser / Client | — | Pure DOM + CSS animation triggered after resolveQuest |
| Level-up celebratory event | Browser / Client | — | Visual overlay, no engine state needed |
| Deck archetype label | Browser / Client | — | Static data in starterDecks.js rendered to DOM |
| End-game stats accumulation | Browser / Client | — | Computed from state snapshots already in main.js scope |
| End-game stats display | Browser / Client | — | Extension of existing rewardOverlay.js |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UIPOL-01 | Quest result animations — green flash + MP float on success; red shake on fail; celebratory level-up event | `animateStateDelta` + `actionLabel:'quest-resolution'` already plumbed at every quest resolve site; need new CSS classes and a quest-overlay banner function |
| UIPOL-02 | Deck archetype identities — one-line identity shown on deck select screen | `STARTER_DECKS` entries already have `description` field; need a `tagline` field (or reuse `description`) + `<div id="deck-tagline">` + `change` listener in `initLobbyPage` |
| UIPOL-03 | End-game stats screen — quests attempted, succeeded, peak MP, biggest gain, Mosjes lost | `showRewardOverlay` is the single game-over entry point; stats must be computed during game flow or from final `gameState` at `handleGameOver` time |
</phase_requirements>

---

## Standard Stack

No new libraries required. All animation is plain CSS + DOM. All rendering is the existing vanilla JS UI layer.

| File | Purpose | Status |
|------|---------|--------|
| `src/ui/actionAnimations.js` | `animateStateDelta` — diff-based animation dispatcher | Exists, extend |
| `src/ui/boardRenderer.js` | `showMPFloat`, `animateCardDamage`, `animateLevelUp`, `animateCardPlay` | Exists, extend with new exports |
| `src/ui/rewardOverlay.js` | `showRewardOverlay` — only game-over entry point | Exists, extend |
| `src/data/starterDecks.js` | `STARTER_DECKS` array — deck definitions | Exists, add `tagline` field |
| `index.html` | Lobby HTML — `<select id="deck-select">` | Exists, add companion `<div>` |
| `src/main.js` | `initLobbyPage`, `handleGameOver`, quest resolve callbacks | Exists, add hooks |
| `styles/main.css` (or equivalent) | CSS for new animation classes | Exists, add new keyframes |

---

## Architecture Patterns

### E1 — Quest Result Animations

**What currently happens:**

Every quest resolution in `src/main.js` calls one of these two patterns:

```javascript
// General quest dice roll callback (line ~995):
renderAndAnimate(beforeResolve, { actionLabel: 'quest-resolution' });

// Personal quest (line ~1722):
renderAndAnimate(beforeResolve, { actionLabel: 'quest-resolution' });
```

`renderAndAnimate` calls `animateStateDelta(beforeState, afterState, options)` in `src/ui/actionAnimations.js`.

Inside `animateMosjeDeltas` (actionAnimations.js line 46), there is already:

```javascript
const isQuestOutcome = String(options.actionLabel || '').includes('quest');
// ...
showMPFloat(cardEl, mpDelta, { emphasis: isQuestOutcome && mpDelta > 0 ? 'huge' : undefined });
if (mpDelta < 0) animateCardDamage(cardEl);
if (levelIncreased) animateLevelUp(cardEl);
```

**What is missing for UIPOL-01:**

1. A `quest-success-flash` CSS animation on the Mosje card element (distinct green flash, separate from the generic `mp-float--huge`).
2. A `quest-fail-shake` CSS animation that is more visible than the existing `taking-damage` shake — or just reuse `taking-damage` (already exists) but ensure it fires on quest fail specifically.
3. A "level-up celebratory" overlay/banner that is visually distinct from the `animateLevelUp` + `LEVEL UP!` text already in boardRenderer — the existing `animateLevelUp` fires on every level change; the ask is for a special variant when the level-up comes from a quest success resolve.

**Detection point for level-up-from-quest:** `animateMosjeDeltas` already receives `isQuestOutcome` and checks `levelIncreased`. A new `animateLevelUpCelebration(cardEl)` export can be called in place of `animateLevelUp` when `isQuestOutcome && levelIncreased`.

**Recommended implementation:**

- Add `animateQuestSuccess(cardEl)` to `boardRenderer.js` — adds a `.quest-success-flash` class, removes on `animationend`.
- Add `animateQuestFail(cardEl)` to `boardRenderer.js` — adds a `.quest-fail-shake` class (can reuse or extend the existing `taking-damage` keyframe).
- Add `animateLevelUpCelebration(cardEl)` to `boardRenderer.js` — a larger, longer version of `animateLevelUp`, possibly with a full-screen banner overlay.
- Import new exports in `actionAnimations.js` and call them inside `animateMosjeDeltas` when `isQuestOutcome` is true.

No new call sites in `main.js` needed — the `actionLabel` flag already flows through.

**Existing CSS animation classes (verified in boardRenderer.js):**

- `.just-played` — card entry
- `.taking-damage` — red shake
- `.level-up` — burst + ring
- `.card-activating` — pulse
- `.card-activation-burst` — radial burst overlay
- `.mp-float`, `.mp-float--big`, `.mp-float--huge` — floating numbers

New classes to add: `.quest-success-flash`, `.quest-fail-shake`, `.quest-level-up-celebration`.

---

### E2 — Deck Archetype Identities

**Current state of `STARTER_DECKS`:**

Each entry already has a `description` field (verified in `src/data/starterDecks.js`):

```javascript
{
  id: "PHYSICAL_FORCE",
  name: "Physical Force",
  description: "Couple power: Gandoe and Michelle's boxing chemistry...",
  // ...
}
```

The description is a full sentence, not a punchy one-liner tagline. The ROADMAP says "one-line identity label." Options:

- **Option A:** Add a `tagline` field to each `STARTER_DECKS` entry (e.g. `"High risk, high reward questing"`) and use that. Clean, explicit.
- **Option B:** Reuse the existing `description` field and just display it as-is. No data change needed.

Given the roadmap explicitly says "one-line identity," Option A is cleaner — descriptions are already multi-sentence.

**Rendering pattern:**

The lobby `<select>` uses plain `<option>` elements. HTML `<option>` elements do not support child elements or multiline content. Standard pattern:

```html
<!-- index.html — add below the <select> -->
<div id="deck-tagline" class="deck-tagline"></div>
```

```javascript
// initLobbyPage() in main.js — add after the deck select is wired
const deckTaglineEl = document.getElementById('deck-tagline');
const deckSelect = document.getElementById('deck-select');

function updateDeckTagline(deckId) {
  const deck = STARTER_DECKS.find(d => d.id === deckId);
  if (deckTaglineEl) deckTaglineEl.textContent = deck?.tagline ?? '';
}
deckSelect?.addEventListener('change', (e) => updateDeckTagline(e.target.value));
updateDeckTagline(deckSelect?.value); // set on page load
```

This requires importing `STARTER_DECKS` in `main.js` — already done (`import { STARTER_DECKS } from './data/starterDecks.js'` at line 18).

---

### E3 — End-Game Stats Screen

**Current game-over flow:**

```
resolveQuest / victory check → gameState.status = 'FINISHED'
    → renderAndCheckWin() detects FINISHED
    → handleGameOver(gameState) [line ~553 in main.js]
        → showRewardOverlay({ outcome, winnerName, winReason, muntenAwarded, isOnline })
```

`showRewardOverlay` is in `src/ui/rewardOverlay.js`. It currently shows: outcome icon, Victory/Defeat title, subtitle, optional Munten line, Back to Lobby button.

**What stats are needed (UIPOL-03):**

| Stat | Where to get it |
|------|----------------|
| Quests attempted | NOT tracked globally — only `questsAttemptedThisTurn` per player (resets each turn) |
| Quests succeeded | NOT tracked |
| Peak MP reached | NOT tracked — must be observed incrementally |
| Biggest single MP gain | NOT tracked — must be observed incrementally |
| Mosjes lost | NOT tracked globally — must be inferred or tracked |

**Key finding:** None of the four primary stats for UIPOL-03 are directly available in the final `gameState`. They must be either:

1. **Accumulated in `handleGameOver` by scanning the game log** — the log entries are stored in the `log` object (`createLogRenderer`). Entries have a type (`'gain'`, `'loss'`, `'quest'`, `'win'`) and a text string. Scanning log entries for quest outcomes is possible but fragile (string parsing).

2. **Accumulated during game play** by a lightweight stats tracker object local to `initGamePage()`. This is cleaner and more reliable.

**Recommended approach — local stats accumulator:**

Declare a `gameStats` object in `initGamePage()` scope:

```javascript
let gameStats = {
  questsAttempted: 0,
  questsSucceeded: 0,
  peakMP: 0,
  biggestSingleGain: 0,
  mosjesLost: 0,
};
```

Update it at the existing call sites:

- After each `resolveQuest` call (success/fail path) — increment `questsAttempted`, conditionally `questsSucceeded`, compare MP gain to `biggestSingleGain`.
- After each `renderFromState` / `renderAndAnimate` call — scan `gameState.players[localPlayerId].activeSlots` for current MP, update `peakMP`.
- In `markMosjeDefeated`-related outcome — or detect in the `animateMosjeDeltas` diff where a slot goes to `isDefeated`.

For `mosjesLost`: the cleanest approach is to compare `beforeResolve` and `afterState` at each `renderAndAnimate` call — if any `activeSlots[i]` transitions from non-defeated to defeated/null, increment `mosjesLost`.

**Passing stats to `showRewardOverlay`:**

Extend the function signature:

```javascript
showRewardOverlay({ outcome, winnerName, winReason, muntenAwarded, isOnline, stats })
```

And render them in a new stats section inside `reward-card`.

**Mosjes lost detection:** The `animateMosjeDeltas` diff in `actionAnimations.js` already compares `beforeSlot` and `afterSlot`. The same logic can be used in a `statsTracker` helper to detect defeats.

---

### Anti-Patterns to Avoid

- **Don't add new quest-outcome state fields to `gameState`.** All stats tracking belongs in `initGamePage()` local scope — no engine changes.
- **Don't parse log strings for stats.** The log is display-only and not a structured data source. Use state diffs instead.
- **Don't use `animateLevelUp` for the celebratory event.** The existing `animateLevelUp` already fires on non-quest level-ups. Add a new `animateLevelUpCelebration` export rather than conflating the two.
- **Don't put archetype taglines in `index.html` `<option>` elements.** They cannot contain child HTML and are truncated by the browser. Use the companion `<div>` pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation keyframes | Custom JS animation loop | CSS `@keyframes` + class toggle | Already the project pattern; prefersReducedMotion check in place |
| Quest success/fail detection | New engine flag | `actionLabel: 'quest-resolution'` already flows through `animateStateDelta` | Sufficient discrimination without engine changes |
| Mosje defeat detection | New engine event | Before/after state diff already used in `animateMosjeDeltas` | Same pattern, no new mechanism needed |

---

## Common Pitfalls

### Pitfall 1: CSS animation class not removed after quest flash
**What goes wrong:** The `.quest-success-flash` class stays on the element permanently, causing all subsequent actions to show the flash.
**Why it happens:** Forgetting to remove the class on `animationend`.
**How to avoid:** Use `cardEl.addEventListener('animationend', () => cardEl.classList.remove('quest-success-flash'), { once: true })` — same pattern used by all other animation helpers in `boardRenderer.js`.

### Pitfall 2: Level-up celebration fires on non-quest level-ups
**What goes wrong:** Any MP gain that crosses a threshold triggers the big celebration, including Piecie plays.
**Why it happens:** `animateLevelUp` is called whenever `levelIncreased` is true, not only on quests.
**How to avoid:** Only call `animateLevelUpCelebration` when `isQuestOutcome && levelIncreased`. The existing `animateLevelUp` continues to fire for non-quest level-ups.

### Pitfall 3: `questsAttemptedThisTurn` is a per-turn counter, not a game total
**What goes wrong:** Reading `gameState.players[localPlayerId].questsAttemptedThisTurn` from the final state gives the count for the last turn only.
**Why it happens:** `startTurn()` resets it to 0 at every turn start (turnManager.js line 80).
**How to avoid:** Increment `gameStats.questsAttempted` at each `resolveQuest` call site in `main.js` rather than reading from state.

### Pitfall 4: node --check fails on syntax error in main.js after editing large handler blocks
**What goes wrong:** Any unterminated function or bracket in `main.js` breaks the game without test coverage.
**Why it happens:** `main.js` is not imported by the test suite; `npm test` does not catch syntax errors in it.
**How to avoid:** Run `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` before every commit (CLAUDE.md mandatory step).

### Pitfall 5: `<select>` archetype display breaks for custom decks
**What goes wrong:** Custom decks loaded from Firebase are dynamically appended to the `<select>` and won't have a matching entry in `STARTER_DECKS`.
**Why it happens:** Custom decks use `custom_` prefixed IDs not in `STARTER_DECKS`.
**How to avoid:** In `updateDeckTagline`, guard with `if (!deck) { deckTaglineEl.textContent = ''; return; }` — custom decks show no tagline, which is fine.

---

## Code Examples

### Existing quest-resolution animation call sites (VERIFIED: src/main.js)

There are exactly four call sites that resolve quests and animate:

1. **General quest dice roll** (line ~995): `renderAndAnimate(beforeResolve, { actionLabel: 'quest-resolution' })`
2. **Geen Raad quest** (line ~901): `renderAndAnimate(beforeResolve, { actionLabel: 'quest-resolution' })`
3. **Personal quest** (line ~1722): `renderAndAnimate(beforeResolve, { actionLabel: 'quest-resolution' })`
4. **Geen Raad recovery** (line ~949): `renderAndAnimate(beforeResolve, { actionLabel: 'quest-recovery' })`

The `didSucceed` boolean is in scope at every site — it can be passed into the animation options as `questDidSucceed: didSucceed`.

### Existing animation helpers (VERIFIED: src/ui/boardRenderer.js)

```javascript
// boardRenderer.js — existing exports
export function showMPFloat(cardEl, amount, options = {})   // floating number
export function animateCardPlay(cardEl)                      // entry animation
export function animateCardDamage(cardEl)                    // red shake
export function animateLevelUp(cardEl)                       // burst + LEVEL UP! text
```

Pattern to follow for new animations:
```javascript
export function animateQuestSuccess(cardEl) {
  if (!cardEl) return;
  cardEl.classList.add('quest-success-flash');
  cardEl.addEventListener('animationend', () => cardEl.classList.remove('quest-success-flash'), { once: true });
}
```

### Existing `animateMosjeDeltas` detection hook (VERIFIED: src/ui/actionAnimations.js lines 46-74)

```javascript
const isQuestOutcome = String(options.actionLabel || '').includes('quest');
// mpDelta and levelIncreased already computed per slot
// New hook point: pass options.questDidSucceed to differentiate success/fail
```

### `showRewardOverlay` current signature (VERIFIED: src/ui/rewardOverlay.js)

```javascript
export function showRewardOverlay({ outcome, winnerName, winReason, muntenAwarded, isOnline })
// Called from handleGameOver() in main.js line ~570
showRewardOverlay({ outcome, winnerName, winReason: gs.winReason, muntenAwarded, isOnline });
```

### `STARTER_DECKS` current shape (VERIFIED: src/data/starterDecks.js)

```javascript
{
  id: "PHYSICAL_FORCE",
  name: "Physical Force",
  description: "Couple power: Gandoe and Michelle's boxing chemistry. Physical quests...",
  mosjes: [...],
  piecies: [...],
  // tagline field does NOT yet exist — add it
}
```

---

## State of the Art

No external libraries or framework upgrades involved. Project uses vanilla CSS animations throughout.

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| n/a — this is greenfield UI | CSS class-toggle on `animationend` | Already established pattern; follow it |

---

## Environment Availability

Step 2.6: SKIPPED — this phase makes no use of external tools, databases, or CLI utilities beyond the project's own files.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via `npm test`) |
| Config file | `vitest.config.js` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| Syntax check command | `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| UIPOL-01 | Quest animations fire and clean up | manual-only | — | DOM animation; no unit-test primitive |
| UIPOL-02 | Tagline updates on deck select change | manual-only | — | DOM event; no unit-test primitive |
| UIPOL-03 | Stats screen shows correct counts | manual-only | — | End-to-end game state; no unit-test primitive |

All three are browser-DOM interactions that cannot be unit-tested in the Vitest suite. The acceptance criterion is manual verification: run the game, complete a quest, observe animation; select a deck in lobby, observe tagline; finish a game, observe stats. `npm test` must remain green with 920+ tests passing as a regression gate.

### Wave 0 Gaps

None — no new test files are needed. The three features are UI-only with no engine logic. Existing 920+ tests serve as regression protection.

---

## Security Domain

Not applicable — this phase adds only visual effects and static text labels. No user input is processed, no authentication or authorization changes, no data persistence.

---

## Project Constraints (from CLAUDE.md)

- **Branch discipline:** Never commit to `main`. Create `feature/phase-25-ui-polish-feel`.
- **Pre-commit mandatory:** Run `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` then `npm test` before every commit.
- **One function per file:** Any new exported function goes in its own file or is added to the appropriate existing module (e.g., new animation exports belong in `boardRenderer.js`, not a new `questAnimations.js` unless the file stays under ~80 lines).
- **Small files:** `boardRenderer.js` is already 619 lines. Adding 3 small animation functions (~12 lines each) is acceptable; do not add unrelated logic.
- **No logic in data files:** `starterDecks.js` is pure data — adding a `tagline` string field is compliant.
- **Pure functions in engine:** This phase touches no engine files.
- **Modular UI:** If a "celebration overlay" function could be used more than once, make it generic — parameterize it rather than hard-coding "quest level-up."

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `didSucceed` is in scope at every quest resolve site and can be passed as `questDidSucceed` in animation options without refactoring | Architecture Patterns — E1 | If any resolve path lacks `didSucceed` in scope, the animation options object cannot be enriched without code restructure. Verified by reading main.js lines ~896, ~989, ~1722 — `didSucceed` is in scope at all three. LOW risk. |
| A2 | The CSS file loaded by `index.html` is `styles/main.css` and animation keyframes for the board are also there | Standard Stack | If animations live in a separate `game.css` imported only by `game.html`, quest-flash CSS must go in that file instead. Verified: `index.html` links `styles/main.css`; `game.html` was not checked. Need to verify at plan time. |

---

## Open Questions (RESOLVED)

1. **Where does `game.html` load its CSS?**
   RESOLVED: `game.html` loads `styles/cards.css` (verified in 25-01 plan interfaces block). New animation keyframes go in `styles/cards.css`.

2. **Should stats be tracked for both players or just the local player?**
   RESOLVED: Local player's stats only (confirmed in 25-03 must_haves truths). Less code, cleaner output for v1.

---

## Sources

### Primary (HIGH confidence)
- `src/ui/actionAnimations.js` — full source read; animation dispatch flow verified
- `src/ui/boardRenderer.js` — full source read; existing animation exports verified
- `src/ui/rewardOverlay.js` — full source read; game-over entry point verified
- `src/ui/modalManager.js` — full source read; no quest-animation hooks needed here
- `src/main.js` (lines 1–150, 360–1010, grep results) — quest resolve call sites, handleGameOver, initLobbyPage verified
- `src/data/starterDecks.js` — deck definition shape and `description` field verified
- `index.html` — deck-select markup verified
- `.planning/ROADMAP.md` — Phase 25 requirements verified
- `.planning/STATE.md` — current phase and test count verified

### Secondary (MEDIUM confidence)
- `src/engine/turnManager.js` (grep) — `questsAttemptedThisTurn` reset behaviour confirmed
- `src/engine/gameState.js` (grep) — `questsAttemptedThisTurn` initial value confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly
- Architecture: HIGH — all hook points verified in source
- Pitfalls: HIGH — derived from reading actual code patterns
- Stats accumulation: MEDIUM — the "no global quest stats" finding is verified; the accumulator design is a recommended pattern, not tested yet

**Research date:** 2026-06-05
**Valid until:** 2026-07-05 (stable codebase; no external dependencies)
