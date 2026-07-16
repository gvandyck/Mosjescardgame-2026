# Phase 37: General Quest Attempt Affordability Gate - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 4 (2 modified, 1 new test, 1 optional unit test)
**Analogs found:** 4 / 4

## Summary

This is a small, surgical engine/UI bugfix. It reuses an already-live affordability
convention verbatim — nothing new is designed. The single real code gap is the
**General-Quest single-Mosje path** (`src/main.js:1525-1528`), which skips the picker
and charges 20 MP with no affordability check. Every pattern the fix needs already
exists in the codebase (Welloe Force's Phase 36 block idiom, `showMosjeSelect`'s
`mp >= 20` disable, `getGeneralQuestBlockReason`'s reason enum, and the Phase 36
Playwright repro spec). The planner's job is wiring, not invention.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/main.js` (general single-Mosje branch, ~1525-1528) | UI controller (event handler) | request-response | Welloe Force block idiom `src/main.js:2767-2792` | exact (same file, same idiom) |
| `src/abilities/questLogic.js` (`getGeneralQuestBlockReason`) | engine / pure gate | transform (state → reason) | its own `negative-mp` / `no-active-mosje` reasons `:164-178` | exact |
| `tests/ui/general-quest-affordability.spec.js` (NEW) | test (Playwright, real-engine) | request-response | `tests/ui/welloe-force-tribute.spec.js` | exact |
| `tests/questLogic.*.test.js` (OPTIONAL unit) | test (unit) | transform | existing `questLogic` unit tests | role-match |

**Note on scope:** `showMosjeSelect` (`src/ui/modalManager.js:737-769`) and the personal
path (`src/main.js:2701`) are **read-only references** for this phase — they already
gate correctly (D-04, D-05) and must NOT be modified or regressed. They are analogs to
copy from, not files to change.

## Pattern Assignments

### `src/main.js` — General-Quest single-Mosje branch (UI controller, request-response)

**The gap (D-06):** `src/main.js:1525-1528` — when exactly one Mosje exists the picker is
skipped and `showQuestPreviewThenRoll` charges 20 MP (`:1511`) with no affordability check:

```javascript
// src/main.js:1525-1528 — THE GAP
if (gqSlots.length > 1) {
    modal.showMosjeSelect(gqSlots, showQuestPreviewThenRoll, questDef);
} else {
    showQuestPreviewThenRoll(gqSlots[0]?.slotIndex ?? 0);  // ← charges 20 MP unchecked
}
```

The 20 MP charge that self-destructs the Mosje (`showQuestPreviewThenRoll`, `:1507-1523`):

```javascript
// src/main.js:1511 — the unguarded charge
const costState = loseMP(gameState, localPlayerId, targetSlotIndex, 20, 'QUEST_COST');
```

**Primary analog — Phase 36 Welloe Force block idiom** (`src/main.js:2767-2792`). This is
the exact affordability-clamp pattern to mirror: build eligible slots, filter by
`mp >= amount`, block with `showInfo('Cannot Activate', …)` (no charge, no activation) when
none qualify, otherwise route through the picker:

```javascript
// src/main.js:2778-2790 — the block-when-unaffordable idiom to copy
const eligible = mosjeSlots.filter(s => s.mp >= 40);
if (eligible.length === 0) {
    modal.showInfo('Cannot Activate', 'Not enough MP — Welloe Force requires 40 MP tribute from one Mosje (none of yours can afford it).');
    return;
}
const payerSlotId = await modal.showTributePayerSelect({ title, prompt, mosjeSlots, amount: 40 });
```

**Cleanest fix option (D-06 Claude's Discretion, recommended):** route the single-Mosje
general path through `showMosjeSelect` too — it always shows its modal regardless of count
(`modalManager.js:734`) and already disables `mp < 20` options. This collapses the
`if (gqSlots.length > 1)` branch so both paths share one gated call. The `gqSlots` array is
already built with the exact `{ slotIndex, name, mp, traits }` shape `showMosjeSelect`
expects (`src/main.js:1420-1428`):

```javascript
// src/main.js:1420-1428 — gqSlots already carries mp per slot
const gqSlots = gameState.players[localPlayerId].activeSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot && !slot.isDefeated)
    .map(({ slot, index }) => ({
        slotIndex: index,
        name: slot.name || CARD_LOOKUP[slot.cardId]?.name || slot.cardId || 'Mosje',
        mp: slot.mp,
        traits: slot.traits || CARD_LOOKUP[slot.cardId]?.traits || {},
    }));
```

**Alternative fix option:** add an affordability reason to `getGeneralQuestBlockReason`
(below) and block upstream at the existing gate call (`src/main.js:1245`), mirroring the
Welloe `showInfo` block. Either satisfies D-02/D-06; planner picks.

---

### `src/abilities/questLogic.js` — `getGeneralQuestBlockReason` (engine, pure transform)

**Analog:** the function's own existing reason enum (`:148-186`). It already returns
string reasons (`no-player`, `first-turn-lock`, `no-active-mosje`, `quest-blocked-status`,
`negative-mp`, `momentum-master-range`, or `null` if attemptable). An affordability reason
slots in alongside `negative-mp` — same shape, pure, sharable by bot + tests:

```javascript
// src/abilities/questLogic.js:163-186 — the reason-enum pattern to extend
const activeMosje = getFirstActiveMosje(player);
if (!activeMosje) {
    return 'no-active-mosje';
}
if (activeMosje?.statusEffects?.some(e => e.type === 'QUEST_BLOCKED')) {
    return 'quest-blocked-status';
}
if (activeMosje.mp < 0) {
    return 'negative-mp';
}
// ← natural home for e.g.  if (activeMosje.mp < 20) return 'cannot-afford-fee';
if (questCard.requirementId === 'quest_req_momentum_master') { … }
return null;
```

**Caller integration (`canAttemptGeneralQuest`, `:190-198`):** a thin wrapper over
`getGeneralQuestBlockReason` — no change needed; it returns `false` for any non-null reason.
The UI caller at `src/main.js:1245-1250` currently maps blocks to a log line and would need
its `blockReason` copy extended if a `cannot-afford-fee` reason is added (its else-branch
today assumes `negative MP`).

> ⚠️ MP threshold caution (CLAUDE.md): any edit here touches Quest-cost affordability logic.
> Threshold is `mp >= 20` (D-03) — exactly 20 is allowed (pays to 0, survives), 19 blocks.
> Re-run the Ronald Kip stacking test + full sim per CLAUDE.md if MP logic changes.

---

### `tests/ui/general-quest-affordability.spec.js` (NEW test, Playwright real-engine)

**Analog:** `tests/ui/welloe-force-tribute.spec.js` — copy its structure verbatim. It is the
exact "affordable vs. unaffordable, make-it-fail-first" repro shape for an MP-gated action.

**Imports / helpers pattern** (`welloe-force-tribute.spec.js:1-14`):

```javascript
import { test, expect } from '@playwright/test';
import {
    GAME_URL_TEST, seedCustomDeck, waitForBoard, readLog,
    setMosjeOnField, setHand, unlockPiecies, clearEntryProtection,
    playCardFromHand, getGameState, ss,
} from './helpers.js';
```

**Seed-single-Mosje-under-20 pattern** (adapt `welloe-force-tribute.spec.js:94-107`):

```javascript
// Single own Mosje below the fee — the Michelle knockout repro (Phase 36 UAT)
await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 10, level: 0 });
await setMosjeOnField(page, 'player_1', 1, null);
// … attempt a General Quest …
// Assert (make-it-fail-first): the attempt is blocked/disabled and NO 20 MP is charged.
const state = await getGameState(page);
expect(state.players.player_1.activeSlots[0].mp).toBe(10);   // unchanged, not -10
expect(state.players.player_1.activeSlots[0].isDefeated).toBeFalsy();  // Michelle survives
```

**Two-test structure to mirror** (from the welloe spec):
1. Affordable Mosje (`mp >= 20`) → attempt proceeds, 20 MP charged as normal.
2. Unaffordable Mosje (`mp < 20`) → attempt blocked before any charge; assert MP unchanged
   and Mosje not defeated. Per CLAUDE.md, this test MUST fail on current code first
   (Michelle self-destructs), then pass after the fix.

**Disabled-option assertion (if picker route chosen)** — copy `welloe-force-tribute.spec.js:66-68`:

```javascript
const disabledOptions = page.locator('.modal-mosje-select-btn[disabled]');
await expect(disabledOptions).toHaveCount(1);
```

---

## Shared Patterns

### Affordability disable convention (green/red MP)
**Source:** `src/ui/modalManager.js:741-758` (`showMosjeSelect.getMpLabel`) and
`:777-790` (`showTributePayerSelect`).
**Apply to:** any picker option rendered for this phase.

```javascript
// modalManager.js:743-745 — the green/red label + mp>=cost disable convention
const hasEnoughMp = mosjeSlot.mp >= questCost;   // questCost = 20
const color = hasEnoughMp ? '#4ade80' : '#ef4444';
// … option.disabled = mosjeSlot.disabled || (isQuestAttempt && !hasEnoughMp)
```

Colors are fixed by the UI-SPEC: `#4ade80` affordable, `#ef4444` unaffordable. Do NOT
introduce new colors.

### Block-when-unaffordable (preventive, no charge)
**Source:** `src/main.js:2778-2782` (Welloe Force).
**Apply to:** the single-Mosje general path if a `showInfo` block (rather than a disabled
picker option) is chosen. Copy shape: filter eligible → if none, `showInfo('Cannot Activate', …)` +
`return` BEFORE any `loseMP` call. D-02 prefers the visible disabled control over this dialog,
but the `showInfo` block is a valid existing primitive (used at `main.js:2514,2578,2780`).

### Pure eligibility reason enum
**Source:** `src/abilities/questLogic.js:148-186`.
**Apply to:** any engine-level gate so the bot and unit tests share the same source of truth
(the bot already accounts for the fee via `QUEST_ATTEMPT_COST` — do not touch `botDriver.js`).

## No Analog Found

None. Every file to be touched or created has an exact in-repo analog.

## Regression Guardrails (must NOT change)

| File / Path | Why untouched |
|-------------|---------------|
| `src/main.js:1526` (multi-Mosje `showMosjeSelect`) | D-04 — already gates; must not regress |
| `src/main.js:2701` (personal `showMosjeSelect`) | D-05 — already gates single-Mosje; verify + regression-test only |
| `src/ui/modalManager.js:737-769` (`showMosjeSelect`) | Convention source; reuse verbatim, no rendering change |
| `src/bot/botDriver.js` | Bot already weighs `QUEST_ATTEMPT_COST`; out of scope |
| The 20 MP fee + its lethality (`phase0-rulings.md:126`) | Canonical; only the pre-attempt gate is added |

## Metadata

**Analog search scope:** `src/main.js`, `src/ui/modalManager.js`, `src/abilities/questLogic.js`, `tests/ui/`
**Files scanned:** 5 (2 modified targets, 2 analog sources, 1 test analog)
**Pattern extraction date:** 2026-07-16
