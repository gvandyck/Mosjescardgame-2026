# Phase 26: Debug Logging System - Research

**Researched:** 2026-06-05
**Domain:** UI observability layer — log panel, MP change tracing, level-up detection
**Confidence:** HIGH

---

## Summary

Phase 26 is a pure observability layer that hooks into already-executing call sites and emits structured `log.add()` entries to the existing log panel. No engine changes are required. The log panel API (`logRenderer.js`) is trivial: `log.add(type, message)` where `type` is one of `gain | loss | quest | level | info | win | attack`. The `log` object is created once in `initGamePage()` and is already accessible throughout `main.js`.

MP changes happen through exactly two central engine functions: `gainMP(state, playerId, slotIndex, amount, source)` and `loseMP(state, playerId, slotIndex, amount, source, _redirected)`, both in `src/engine/mpManager.js`. These functions already emit `console.log` with player name, amount, and source. The `source` parameter is already threaded through every call site. **These functions are NOT directly observable in `main.js` — they return new states but do not call `log.add`.** All logging must happen at the UI call sites in `main.js` (or via the existing `logStateOutcome` helper), not inside the engine.

Level-ups are detected inside `checkLevelUp()` in `mpManager.js` — called automatically by `gainMP`. They are not separately signalled to the UI; the planner must use the `summarizeStateOutcome` / `logStateOutcome` mechanism already in `main.js`, or add a dedicated level-up log pass that compares `beforeState` and `afterState` slot levels.

Quest resolution already logs `${questName}: Success/Failed → ±N MP` at the resolution call sites. The threshold vs result is **not** currently logged. The dice roll result is available inside the `showDiceRoll` callback (it comes from the `modalManager.js` dice modal), but `didSucceed` is the only value passed back to the calling code — the raw roll number is not exposed to the resolution callback.

**Primary recommendation:** Wire DBLOG-01 by enriching the existing `logStateOutcome` calls (already present for every action) with explicit `log.add('gain'|'loss', ...)` entries that include source names. Wire DBLOG-02 by adding a level-up detection pass using before/after state comparison at each `renderAndAnimate` call. Wire DBLOG-03 by passing the `diceRoll` and `threshold` out of the `showDiceRoll` modal callback.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Log panel rendering | Browser / Client (logRenderer.js) | — | DOM manipulation, in-page UI |
| MP delta detection | Browser / Client (main.js) | — | Before/after state diff — already done by summarizeStateOutcome |
| Level-up detection | Browser / Client (main.js) | — | checkLevelUp only fires inside engine; UI must diff before/after |
| Quest roll/threshold | Browser / Client (main.js) | modalManager | threshold computed by getQuestDiceThreshold; roll produced by modal |
| Source attribution | API / Backend (mpManager.js) | — | source param already present on gainMP/loseMP |

---

## Standard Stack

No new libraries. Everything reuses existing project code.

| Component | File | Current State |
|-----------|------|---------------|
| Log panel API | `src/ui/logRenderer.js` | `log.add(type, message)` — fully implemented |
| MP engine | `src/engine/mpManager.js` | `gainMP`, `loseMP`, `checkLevelUp` — all have `console.log` already |
| State diff helper | `src/main.js` (bottom) | `summarizeStateOutcome` + `logStateOutcome` — already used by all action handlers |
| Quest threshold | `src/abilities/questLogic.js` | `getQuestDiceThreshold(questDef, activeMosje)` — returns numeric threshold |
| Dice modal | `src/ui/modalManager.js` | `showDiceRoll(questDef, threshold, callback, options)` — callback receives `didSucceed` only |

---

## Architecture Patterns

### How the log panel works

`createLogRenderer(container)` returns `{ add, clear, asText, attachBuffer }`.

- `log.add(type, message)` — prepends a `<div class="log-row {type}">` with an icon prefix
- Types: `gain` (💥), `loss` (📉), `quest` (🎯), `level` (⬆️), `win` (🏆), `info` (ℹ️), `attack` (⚔️)
- Every call also fires `console.log('[UI] Log:', type, message)` — so new entries will automatically show in devtools too
- The `log` object is scoped inside `initGamePage()` — it is accessible to all nested functions including `logTurnTrickle`, `logStateOutcome`, action handlers, `handleGameOver`, etc.

**To add a new log entry from any action handler:** `log.add('gain', 'Some message')` — no plumbing required.

### How MP changes reach main.js (VERIFIED by reading source)

`gainMP` and `loseMP` are pure functions in `mpManager.js`. They:
1. Take `source` as a string parameter (e.g. `'QUEST'`, `'DRAIN'`, `'ATTACK'`, `'QUEST_COST'`, `'ABILITY'`, `'FPS_WEST_GUESS'`, `'RONALD_INSIGHT'`, `'BATTLE_CONCERT'`, `'QUEST_ELIMINATION'`)
2. Return a new state — they do NOT call `log.add`
3. Print to console: `[ENGINE] 💥 ${mosje.name} gains ${amount} MP (${source}) → now ${mosje.mp} MP`

The caller in `main.js` is responsible for emitting `log.add`. All action handlers already do a before/after snapshot and call `logStateOutcome`, which diffs all active slots and emits `+/- N MP` lines. **The diff exists but it does NOT include the source (card name / effect name).**

### logStateOutcome — the existing diff helper

```javascript
// Source: src/main.js line 2661
function logStateOutcome(log, beforeState, afterState, actorId, label = 'Action') {
  const lines = summarizeStateOutcome(beforeState, afterState, actorId);
  if (!lines.length) {
    log.add('info', `${label}: no visible stat changes.`);
    return;
  }
  log.add('info', `${label}:`);
  for (const line of lines.slice(0, 6)) {
    log.add('info', `- ${line}`);
  }
}
```

`summarizeStateOutcome` diffs MP, level, defeated status, and card counts for both players across all active slots. It already detects level changes: `lines.push(`${prefix} ${a.name}: level ${beforeLevel} -> ${afterLevel}.`)`.

**Problem:** it uses `'info'` type for all lines including level-ups. Level-ups should use `'level'` type so they get the ⬆️ icon and the CSS class. The planner must patch `summarizeStateOutcome` to emit level change lines separately with the `'level'` type.

### Where MP actually changes — complete call site map

[VERIFIED: reading src/main.js, src/engine/mpManager.js, src/abilities/mosjeAbilities.js, src/abilities/questLogic.js]

| Call site | Source string | Context available |
|-----------|--------------|-------------------|
| `gainMP(state, pid, i, 10)` in `startTurn` (turnManager.js line 154) | no source | turn trickle — already logged by `logTurnTrickle()` in main.js |
| `loseMP(state, pid, slotIndex, 20, 'QUEST_COST')` in `showQuestPreviewThenRoll` (main.js ~1089) | `'QUEST_COST'` | `questDef.name` available |
| `resolveQuest(...)` → internally calls `gainMP`/`loseMP` with `'QUEST'` | engine-internal | `questDef.name`, `didSucceed`, mpDelta all available to caller in main.js |
| `loseMP(state, oppId, osi, questCard.opponentLoseMP, 'QUEST_ELIMINATION')` in resolveQuest | `'QUEST_ELIMINATION'` | caller has `questDef.name` |
| `loseMP(state, pid, idx, 20, 'RONALD_INSIGHT')` in mosjeAbilities.js | `'RONALD_INSIGHT'` | main.js already logs "Ronald Strategic Insight: paid 20 MP..." |
| `gainMP/loseMP` in mosjeAbilities.js for FPS_WEST_GUESS, Binti, etc. | various | main.js already logs per-ability messages |
| `gainMP/loseMP` in piecieEffects.js — uses local `applyDamage` helper (NOT the mpManager functions) | — | main.js logs via `logStateOutcome` after piecie activation |
| `applyMosjeFieldEffectsOnQuest` (Michelle, Jeffrey) — mutates `mosje.mp` directly | none | result surfaced via `state._autoAbilityLog`; main.js already reads and logs this |

**Key finding:** `piecieEffects.js` does NOT call `gainMP`/`loseMP` from `mpManager.js` — it has its own `applyDamage` local helper that mutates slots directly. The `source` string is not available for piecie-sourced MP changes. The existing `logStateOutcome` diff already catches the numeric delta; the source attribution must come from the card name in the calling context.

### How level-ups are detected

`checkLevelUp()` is called inside `gainMP` automatically. It modifies `mosje.level` and resets `mosje.mp` to 0. The UI detects this by comparing `beforeState.players[pid].activeSlots[i].level` with `afterState.players[pid].activeSlots[i].level` — which `summarizeStateOutcome` already does. The text it generates is correct but the log type is `'info'` (grey) instead of `'level'` (⬆️).

### How quest roll threshold vs result reaches main.js

`modal.showDiceRoll(questDef, threshold, callback, options)` in `modalManager.js` shows the dice roll UI. The `callback` receives a single boolean `didSucceed`. The raw dice roll and threshold are NOT passed back. To log "rolled X, needed Y", the planner must either:

1. Extend the `showDiceRoll` callback signature to pass `{ didSucceed, roll, threshold }` — requires a change to `modalManager.js` and all three call sites
2. Log the threshold before calling `showDiceRoll` (already available from `getQuestDiceThreshold`) and compute a label from `didSucceed` only (no roll number)

Option 2 is safer (no modal API change) but gives less detail. Option 1 gives full `roll vs threshold` visibility. The planner must choose.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| State diff / MP delta | Custom diff logic | `summarizeStateOutcome` already in main.js |
| Log entry formatting | Custom DOM manipulation | `log.add(type, message)` from logRenderer |
| Level-up detection | Hook inside engine | Compare `.level` between before/after state snapshots |
| Source attribution | Parsing engine logs | The `source` param on `gainMP`/`loseMP`, plus card names available at call sites |

---

## Common Pitfalls

### Pitfall 1: Trying to hook inside gainMP/loseMP
**What goes wrong:** Adding `log.add(...)` calls inside `mpManager.js` — but `log` is not in scope there, and engine functions must remain pure (no side effects, per CLAUDE.md rules).
**Why it happens:** The engine console.logs look like they're already "close" to the right place.
**How to avoid:** All `log.add` calls must be in `main.js` action handlers (or in logRenderer-aware UI code), never inside engine files.
**Warning signs:** Any import of `logRenderer` appearing in `src/engine/` or `src/abilities/`.

### Pitfall 2: Logging duplicates from logStateOutcome + new explicit logs
**What goes wrong:** Action handlers already call `logStateOutcome` which emits `+/- N MP` diffs. Adding a new explicit `log.add` for the same event creates two entries for the same change.
**Why it happens:** `logStateOutcome` is called for every action unconditionally.
**How to avoid:** Replace the relevant `logStateOutcome` `info` lines with a purpose-built log function that includes the source, OR suppress `logStateOutcome` for the specific events that now have dedicated entries.

### Pitfall 3: Dice roll number not available in showDiceRoll callback
**What goes wrong:** Trying to log `rolled 4, needed 3 — success` but the callback only receives `didSucceed` boolean.
**Why it happens:** `showDiceRoll` API was designed for a simple pass/fail UI flow.
**How to avoid:** Either extend the callback signature (requires modalManager.js change) or limit the log to `${questDef.name}: needed ${threshold}+ — ${didSucceed ? 'Success' : 'Failed'}`.

### Pitfall 4: piecieEffects.js uses applyDamage, not loseMP
**What goes wrong:** Assuming all MP changes go through `mpManager.loseMP` and trying to centralize logging there.
**Why it happens:** The natural instinct is to hook the central function.
**How to avoid:** Piecie-sourced MP changes are already caught by `logStateOutcome` diffing before/after state. The card name is available from `cardDef.name` at the activation call site.

### Pitfall 5: Level-up log uses 'info' type instead of 'level'
**What goes wrong:** Level-up events appear with ℹ️ instead of ⬆️ and are styled as info rows.
**Why it happens:** `summarizeStateOutcome` uses `log.add('info', ...)` for all lines.
**How to avoid:** Patch `logStateOutcome` (or `summarizeStateOutcome`) to emit level-change lines with `log.add('level', ...)` separately from the info lines.

---

## Code Examples

### Adding a log entry (log panel API)
```javascript
// Source: src/ui/logRenderer.js — createLogRenderer return value
log.add('gain', 'Quest attempt cost: -20 MP');      // 💥 icon, .gain CSS class
log.add('loss', 'Strategy Puzzle: Failed → -30 MP'); // 📉 icon
log.add('level', 'Gandoe levelled up! Level 1 → 2'); // ⬆️ icon
log.add('quest', 'Attempting: Strategy Puzzle');      // 🎯 icon
log.add('info', 'Needed 3+, rolled 5 — Success');    // ℹ️ icon
```

### Detecting level-up in before/after comparison
```javascript
// Source: pattern from summarizeStateOutcome (src/main.js line 2714)
const beforeSlot = beforeState.players[pid]?.activeSlots?.[i];
const afterSlot  = afterState.players[pid]?.activeSlots?.[i];
if (beforeSlot && afterSlot && (beforeSlot.level || 0) !== (afterSlot.level || 0)) {
  log.add('level', `${afterSlot.name}: Level ${beforeSlot.level} → ${afterSlot.level}`);
}
```

### Logging quest roll with threshold (option 2 — no modal API change)
```javascript
// Inside runGeneralQuestDiceRoll callback, after resolveQuest:
const sign = mpDelta >= 0 ? '+' : '';
log.add(didSucceed ? 'gain' : 'loss',
  `${questDef.name}: needed ${threshold}+ → ${didSucceed ? 'Success' : 'Failed'} (${sign}${mpDelta} MP)`
);
```

### Logging quest roll with threshold (option 1 — extend showDiceRoll callback)
```javascript
// In modalManager.js showDiceRoll, change callback signature:
// callback(didSucceed)  →  callback(didSucceed, { roll, threshold })
// Then in main.js:
modal.showDiceRoll(questDef, threshold, (didSucceed, rollInfo) => {
  log.add(didSucceed ? 'gain' : 'loss',
    `${questDef.name}: rolled ${rollInfo.roll}, needed ${rollInfo.threshold}+ → ${didSucceed ? 'Success' : 'Failed'}`
  );
});
```

### logTurnTrickle — existing pattern to follow for MP source logging
```javascript
// Source: src/main.js line 447 — already does source-attributed MP logging
function logTurnTrickle(activePlayerId) {
  const player = gameState.players[activePlayerId];
  if (!player) return;
  for (const slot of player.activeSlots) {
    if (slot && !slot.isDefeated) {
      log.add('gain', `Turn trickle: ${slot.name} +10 MP`);
    }
  }
}
```

---

## Phase Requirements Map

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DBLOG-01 | MP changes show source in log | Source param on gainMP/loseMP already available; card names accessible at all call sites in main.js; `logStateOutcome` already shows delta but not source — enrich existing log calls |
| DBLOG-02 | Level-ups show before/after state | `checkLevelUp` fires inside `gainMP`; `summarizeStateOutcome` already detects level changes but uses 'info' type — patch to emit 'level' type with before/after text |
| DBLOG-03 | Quest rolls show threshold vs result | `threshold` computed by `getQuestDiceThreshold` before `showDiceRoll` call; `didSucceed` available in callback; raw roll number requires modalManager callback extension (option) |
</phase_requirements>

---

## Open Questions (RESOLVED)

1. **DBLOG-03: Expose raw roll number in showDiceRoll callback?**
   RESOLVED: YES — extend callback to `onResolved(didSucceed, { roll, threshold })`. Small change to modalManager.js, high observability payoff. Implemented in Plan 26-03.

2. **Bot step logging — source attribution for bot actions**
   RESOLVED: OUT OF SCOPE for Phase 26. Bot already logs per-step labels via `playBotSteps`. DBLOG-01 focuses on human player actions only.

3. **Piecie effect source attribution**
   RESOLVED: Diff is sufficient. The card name is already in the "Activated X" line immediately before `logStateOutcome` runs. No new log entries needed for piecie MP changes in Phase 26.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node test runner via `npm test` |
| Config file | package.json scripts |
| Quick run command | `node --check src/main.js src/ui/logRenderer.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DBLOG-01 | MP changes appear in log with source label | manual-only | n/a — UI log panel, browser-only | N/A |
| DBLOG-02 | Level-up log entry uses 'level' type with before/after | manual-only | n/a — UI log panel, browser-only | N/A |
| DBLOG-03 | Quest roll log shows threshold and result | manual-only | n/a — UI dice modal callback | N/A |

**Rationale for manual-only:** The log panel and modal system are browser UI. The existing test suite does not import `main.js` or `logRenderer.js`. CLAUDE.md verification sequence requires `node --check` on all UI files after changes.

### Wave 0 Gaps
- None — no new test files needed. Existing `npm test` + `node --check` covers verification.

---

## Security Domain

Phase 26 is pure observability UI. No authentication, session management, input validation, or cryptography is involved. Security domain: NOT APPLICABLE.

---

## Environment Availability

Phase 26 requires no external tools beyond the existing project runtime. Step 2.6 SKIPPED — no external dependencies identified.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `piecieEffects.js` does NOT call `mpManager.gainMP/loseMP` — it has a local `applyDamage` helper | Don't Hand-Roll / Pitfalls | If wrong, centralized logging in mpManager would reach piecie effects — but CLAUDE.md prohibits adding side effects there anyway, so still not the right approach |

**Notes:** A1 is marked ASSUMED because I confirmed the grep shows only 1 `gainMP/loseMP` call site in piecieEffects.js (the comment line) but did not read the full file. The conclusion is safe either way since engine-level logging is architecturally prohibited.

---

## Sources

### Primary (HIGH confidence)
- `src/ui/logRenderer.js` — full file read; `log.add(type, message)` API confirmed
- `src/engine/mpManager.js` — full file read; `gainMP`, `loseMP`, `checkLevelUp` signatures and behavior confirmed; `source` param confirmed on both
- `src/abilities/questLogic.js` — full file read; `resolveQuest`, `getQuestDiceThreshold` confirmed
- `src/main.js` lines 1–2795 — `logStateOutcome`, `summarizeStateOutcome`, `logTurnTrickle`, all `log.add` call sites mapped
- `src/engine/turnManager.js` lines 1–120 — `startTurn` turn trickle gainMP call confirmed
- `src/abilities/mosjeAbilities.js` — gainMP/loseMP call sites in abilities confirmed

### Secondary (MEDIUM confidence)
- `ROADMAP.md` Phase 26 entry — requirement IDs and scope confirmed

---

## Metadata

**Confidence breakdown:**
- Log panel API: HIGH — full source read
- MP call site inventory: HIGH — grep + source read across all ability files
- Level-up detection: HIGH — checkLevelUp source read
- Quest roll architecture: HIGH — showDiceRoll call sites read; gap in callback signature confirmed
- Piecie effect source attribution: MEDIUM — piecieEffects.js not fully read, but grep confirmed no mpManager import

**Research date:** 2026-06-05
**Valid until:** 2026-07-05 (stable codebase, no fast-moving dependencies)
