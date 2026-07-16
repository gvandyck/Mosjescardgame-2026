# Phase 36: Piecie/Snelle Piecie/Place/Personal Quest MP Cost Model Redesign - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 8 code files (+ 1 new audit doc, docs-only)
**Analogs found:** 8 / 8 — this phase is a rework of files that already exist; every "new" thing
(tribute picker, Welloe Force fix, new card-registry rows) has a live in-file analog to copy from,
not a from-scratch pattern.

**Framing note (carried from RESEARCH.md):** this is NOT a ~35-card build-out. Expected code
surface is small: 1 rework (Welloe Force) + 0-2 newly-ruled tribute cards + ~44-46 data-only
`mpCost` corrections + one new reusable modal helper. Do not over-build a generic engine-level
cost-enforcement hook (see RESEARCH.md "Don't Hand-Roll").

---

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|-----------------|----------------|
| `src/data/piecies.js` (mpCost field edits, ~46 cards) | model/config (pure data) | CRUD (data update) | itself — pattern is the existing per-card object literal shape | exact |
| `src/data/snellePiecies.js` (mpCost field edits, ~10 cards) | model/config (pure data) | CRUD (data update) | itself | exact |
| `src/data/places.js` (Delluft/Dierenasiel `description` text, maybe) | model/config (pure data) | CRUD (data update) | itself | exact |
| `src/abilities/piecieEffects.js` → `effect_welloe_force` rework | service (card effect fn) | request-response (state transform) | itself (existing buggy version is the direct analog to fix) | exact |
| `src/abilities/snelleEffects.js` → `effect_snelle_blensen` (pending ruling) | service (card effect fn) | request-response (state transform) | `effect_snelle_frenssen` (`snelleEffects.js:276-283`, same file, same counter-chain shape) | exact |
| `src/ui/modalManager.js` → new `showTributePayerSelect` | component/UI helper | request-response (Promise-resolving modal) | `showMosjeSelect` (`modalManager.js:733-765`) — generalize its hardcoded `questCost` | exact |
| `src/main.js` → pre-activation tribute-picker wiring (Welloe Force click handler) | controller (UI orchestration / event handler) | event-driven (click → await modal → mutate pending state → dispatch engine call) | the existing "own-Mosje target picker before `activatePiecie`" branch (`main.js:2767-2780`, Kannetje Melk/Dikke Jonko/Tikker) | exact |
| `tests/ui/cards/card-registry.js` → new `piecie_welloe_force` entry (+ any newly-ruled card) | test (data-driven spec) | CRUD (declarative test row) | any existing `ATTACK`/self-cost-shaped entry, e.g. `piecie_harde_didde` (`card-registry.js:182-187`) | role-match |
| `.planning/audits/2026-07-XX-piecie-snelle-cost-audit.md` (new) | docs (ruling table) | N/A (docs, not code) | `.planning/audits/2026-07-14-places-text-audit.md` (format precedent) | exact |

---

## Pattern Assignments

### `src/data/piecies.js` / `src/data/snellePiecies.js` (model, CRUD — data-only edits)

**Analog:** the existing object-literal shape already used for every card, e.g. Welloe Force itself
(`src/data/piecies.js:720-734`):

```javascript
{
  id: "piecie_welloe_force",
  type: "PIECIE",
  subtype: "UTILITY",
  name: "Welloe Force",
  mpCost: 40,
  requirement: "level1",
  effectId: "effect_welloe_force",
  tags: ["REDIRECT"],
  description: "Pay 40 MP. For 3 turns, all damage your Mosje would take is redirected to a chosen opponent Mosje instead.",
  flavourText: "",
  artPath: "assets/piecies/placeholder.png",
  rarity: "★★★★",
  isBoosterOnly: false,
},
```

**Pattern to apply:** for each of the ~46 non-zero-`mpCost` cards the audit rules "no tribute in
text," change only the `mpCost:` numeric literal to `0`. Do not touch `description`, `effectId`,
`tags`, or any other field unless the audit's ruling explicitly calls for a text rewrite (Common
Pitfall 3 in RESEARCH.md — Delluft/Dierenasiel only). **Card definitions are pure data (CLAUDE.md)
— no logic, no computed values, ever land in these files.**

**Reminder (D-08):** the corrected value must land on the MP-five-grid (`0/5/10/15/20/25/40/50`);
every current value already is, so corrections to `0` trivially satisfy this — no `roundToFive`
call needed for a plain `0`.

---

### `src/data/places.js` (Delluft/Dierenasiel `description` — conditional, pending Gandoe's COST-04 decision)

**Analog:** current text at `src/data/places.js:234` (Delluft) and `:249` (Dierenasiel):

```javascript
description: "End Phase: All players draw 1 card. SUBSTANCE Piecies cost 0 MP this turn.",   // Delluft
description: "Passive: All PET Piecies cost 0 MP.",                                          // Dierenasiel
```

**Pattern to apply:** ONLY if Gandoe decides (per RESEARCH.md Open Question 2) to rewrite these
once the Piecie audit lands — this is a plain string edit to the `description` field, same file,
same shape as above. **No `effectId`/behavior change required or expected**: `effect_delluft`
(`src/abilities/placeEffects.js:329-339`) already only handles the draw-1 clause (the cost-0
clause has never had a consumer — confirmed inert in the Places audit, `2026-07-14-places-text-audit.md`
row #7), and `effect_dierenasiel` (`placeEffects.js:349-352`) is a complete no-op:

```javascript
export function effect_dierenasiel(gameState) {
	const state = cloneState(gameState);
	return state;
}
```

If the ruling is "leave as harmless flavor text" (the other option RESEARCH.md poses), this file
needs zero edits at all for these two Places.

---

### `src/abilities/piecieEffects.js` → `effect_welloe_force` rework (service, request-response)

**Analog:** its own current (buggy) implementation, `piecieEffects.js:804-816`:

```javascript
export function effect_welloe_force(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);   // BUG (D-05): hardcoded, no player choice
	if (si < 0) return state;
	// Pay 40 MP activation cost from active Mosje
	applyDamage(player.activeSlots[si], 40);       // BUG (D-06): no affordability pre-check
	state._welloeForceActive = { ownerId: playerId, turnsRemaining: 3, targetSlotId: null };
	console.log('[ABILITY] Welloe Force: paid 40 MP, 3-turn redirect active, target pending UI');
	return state;
}
```

**Fix pattern — read the payer choice from a pending-state field set BEFORE this function runs**
(see the `main.js` pre-activation picker pattern below, which is the actual mechanism that
populates it):

```javascript
export function effect_welloe_force(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	// Payer is chosen by the player BEFORE activatePiecie() is called — see main.js's
	// pre-activation picker branch, which stashes the choice here (same idiom as the
	// existing own-Mosje-target picker for Kannetje Melk/Dikke Jonko/Tikker, main.js:2767-2780).
	const si = state._pendingTargets?.welloeForcePayerSlot;
	if (typeof si !== 'number' || !player.activeSlots[si] || player.activeSlots[si].isDefeated) return state;
	// Affordability was already gated before this function ran (main.js blocks the whole
	// action if nobody can pay) — applyDamage is now safe, its defeat-at-0 path can't fire.
	applyDamage(player.activeSlots[si], 40);
	state._welloeForceActive = { ownerId: playerId, turnsRemaining: 3, targetSlotId: null };
	console.log('[ABILITY] Welloe Force: paid 40 MP from chosen Mosje, 3-turn redirect active, target pending UI');
	return state;
}
```

**Local helper reused unchanged:** `applyDamage` (`piecieEffects.js:29-42`) — do not modify this
function (per RESEARCH.md Pattern 3 — the fix is "never call it with an unaffordable amount," not
"change what it does"). This is the same primitive Welloe Force already uses.

**Any newly-ruled tribute Piecie** (expected: 0 more, per RESEARCH.md Critical Finding 1) follows
this exact same corrected shape, not the original buggy one (RESEARCH.md Pitfall 1).

---

### `src/abilities/snelleEffects.js` → `effect_snelle_blensen` (pending ruling only — do not touch until Gandoe rules Open Question 1)

**Analog:** `effect_snelle_frenssen` (`snelleEffects.js:276-283`) — same counter-chain-stack shape,
already in the same file, zero tribute logic (a clean "no cost" card to model against if Blensen
rules to `mpCost: 0`):

```javascript
export function effect_snelle_frenssen(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.counterChain = state._snelleFlags.counterChain || [];
	state._snelleFlags.counterChain.push({ playerId, card: 'frenssen' });
	console.log('[ABILITY] Frenssen: counter-chain stack entry added');
	return state;
}
```

**Current Blensen implementation** (`snelleEffects.js:286-301`) already has a conditional-waiver
shape (no charge at all today, just a `blensenIsFreeThisActivation` flag) — if the audit rules
"Blensen has a real self-paid cost otherwise," apply the exact same `effect_welloe_force` fix
pattern above (read payer slot from `_pendingTargets`, charge via `applyDamage` only after an
affordability gate). If ruled "no cost, vacuous flavor text," this file needs **zero** changes —
only `snellePiecies.js`'s `mpCost` field drops to `0`.

---

### `src/ui/modalManager.js` → new `showTributePayerSelect` (component, request-response modal)

**Analog:** `showMosjeSelect` (`modalManager.js:733-765`) — generalize its hardcoded `questCost`:

```javascript
// Existing (modalManager.js:733-765) — the direct template. Note the exact bug UI-SPEC.md
// calls out: `const questCost = 20;` is a hardcoded local constant, not a parameter.
function showMosjeSelect(mosjeSlots, onSelected, questDef, overrides = {}) {
	const isQuestAttempt = Boolean(questDef);
	const questCost = 20;   // <-- generalize this into a parameter for the tribute variant

	function getMpLabel(mosjeSlot) {
		if (mosjeSlot.disabled) return `<span style="color: #ef4444;">Not eligible</span>`;
		const hasEnoughMp = mosjeSlot.mp >= questCost;
		const color = hasEnoughMp ? '#4ade80' : '#ef4444';
		return `<span style="color: ${color};">${mosjeSlot.mp} MP</span>`;
	}

	const options = mosjeSlots.map(mosjeSlot => {
		const hasEnoughMp = mosjeSlot.mp >= questCost;
		return {
			id: String(mosjeSlot.slotIndex),
			label: mosjeSlot.name,
			metaLabel: isQuestAttempt ? getMpLabel(mosjeSlot) : undefined,
			disabled: mosjeSlot.disabled || (isQuestAttempt && !hasEnoughMp),
			slotIndex: mosjeSlot.slotIndex,
			mp: mosjeSlot.mp,
		};
	});
	showOptionSelect({
		title: overrides.title ?? 'Choose Mosje for Quest',
		prompt: overrides.prompt ?? (isQuestAttempt ? `Select Mosje to attempt quest (costs 20 MP).` : 'Select which Mosje will attempt the quest.'),
		options,
		allowCancel: true,
	}).then(selected => {
		if (selected !== null) onSelected(Number.parseInt(selected, 10));
	});
}
```

**Underlying primitive (unchanged, reused):** `showOptionSelect` (`modalManager.js:648-689`) —
every option row supports `{ id, label, metaLabel, disabled }` already; disabled rows get the
`modal-mosje-select-btn--disabled` class for free (no new CSS needed — confirmed by
`36-UI-SPEC.md`, which points at the exact same existing rule, `styles/board.css:1483-1496`).

**36-UI-SPEC.md's exact recommended new function** (Component 1 in the UI-SPEC — copy this shape,
async/Promise-returning like `showOptionSelect`, unlike callback-based `showMosjeSelect`):

```javascript
function showTributePayerSelect({ title, prompt, mosjeSlots, amount }) {
	const options = mosjeSlots.map(slot => {
		const canAfford = slot.mp >= amount;
		return {
			id: String(slot.slotIndex),
			label: slot.name,
			metaLabel: `<span style="color: ${canAfford ? '#4ade80' : '#ef4444'};">${slot.mp} MP</span>`,
			disabled: !canAfford,
		};
	});
	return showOptionSelect({ title, prompt, options, allowCancel: false });
}
```

**Registration reminder:** every modal function (`showInfo`, `showOptionSelect`, `showMosjeSelect`,
etc.) is returned from `initModalManager(container)`'s object literal AND has a no-op fallback in
the `!container` early-return branch at the top of the file (`modalManager.js:13-38`) — the new
function needs an entry in **both** places, matching the existing pattern (e.g. add
`showTributePayerSelect: async (config = {}) => { const opts = ...; return opts[0]?.id ?? null; }`
to the fallback object, same shape as the existing `showOptionSelect` fallback at line 20-23).

---

### `src/main.js` → pre-activation tribute-picker wiring (controller, event-driven)

**Analog:** the existing "ask before calling `activatePiecie`" branch for own-Mosje-target cards
(`main.js:2760-2782`) — this is the correct idiom for Welloe Force's payer picker too, NOT the
post-hoc pending-flag pattern used for its own redirect *target* (see below) — because D-06
requires the affordability block to happen **before** the card activates, and this branch already
runs, and can `return` early, before `activatePiecie` is ever called:

```javascript
// main.js:2767-2780 — existing pattern: await a modal BEFORE calling activatePiecie(),
// stash the answer into a cloned state's `_pendingTargets`, then call activatePiecie()
// synchronously with that pre-populated state. The effect function reads `_pendingTargets`
// instead of prompting itself (effect functions are synchronous, modals are async — this
// is how the codebase already bridges that gap).
} else if (piecieCardDef?.effectId === 'effect_kannetje_melk'
		|| piecieCardDef?.effectId === 'effect_dikke_jonko'
		|| piecieCardDef?.effectId === 'effect_tikker') {
	const ownTargets = getPlayerMosjes(gameState, localPlayerId);
	if (ownTargets.length > 1) {
		const selectedId = await modal.showTargetSelector(ownTargets, 'Choose your Mosje to receive MP:');
		if (!selectedId) return;
		const mosjeSlotIndex = parseInt(selectedId.split('_slot_')[1], 10);
		if (!Number.isNaN(mosjeSlotIndex)) {
			stateForActivation = JSON.parse(JSON.stringify(gameState));
			stateForActivation._pendingTargets = { own_slot_index: mosjeSlotIndex };
		}
	}
}

const { state: newState, success, error, cardDef, negated } = activatePiecie(stateForActivation, localPlayerId, slotIndex);
if (!success) {
	modal.showInfo('Cannot Activate', error || 'That Piecie cannot be activated right now.');
	return;
}
```

**Applied to Welloe Force** (add an `else if (piecieCardDef?.effectId === 'effect_welloe_force')`
branch alongside the one above, following 36-UI-SPEC.md's exact copy/state contract):

```javascript
} else if (piecieCardDef?.effectId === 'effect_welloe_force') {
	const activeMosjeSlots = getPlayerMosjes(gameState, localPlayerId); // { slotIndex, name, mp, disabled }
	const eligible = activeMosjeSlots.filter(s => s.mp >= 40);
	if (eligible.length === 0) {
		// D-06 — hard block, existing showInfo blocked-action pattern (same shape as
		// the unrelated Elimination Strike affordability check at main.js:1988).
		modal.showInfo(
			'Cannot Activate',
			'Not enough MP — Welloe Force requires 40 MP tribute from one Mosje (none of yours can afford it).'
		);
		return;
	}
	const payerSlotId = await modal.showTributePayerSelect({
		title: 'Welloe Force — Pay Tribute',
		prompt: 'Choose which Mosje pays the 40 MP tribute to activate Welloe Force.',
		mosjeSlots: activeMosjeSlots,
		amount: 40,
	});
	const payerSlotIndex = parseInt(String(payerSlotId), 10);
	if (Number.isNaN(payerSlotIndex)) return;   // picker unexpectedly resolved null — abort, don't activate
	stateForActivation = JSON.parse(JSON.stringify(gameState));
	stateForActivation._pendingTargets = { welloeForcePayerSlot: payerSlotIndex };
}
```

**Contrast — the pattern NOT to copy for the payer picker:** Welloe Force's own *redirect target*
uses a different, post-hoc idiom (`main.js:2816-2845`) — it checks `gameState._welloeForceActive
?.targetSlotId === null` in a later render pass, AFTER the card already activated and paid, and
awaits the target picker then. This is correct for the *target* (irrelevant to affordability, can
be resolved after payment) but wrong for the *payer* (D-06 requires blocking the whole action
before any MP moves) — use the pre-activation pattern above for tribute, keep the existing
post-hoc pattern for the redirect target untouched:

```javascript
// main.js:2816-2845 — KEEP AS-IS. Do not use this shape for payer selection.
if (gameState._welloeForceActive?.targetSlotId === null) {
	const oppId = Object.keys(gameState.players).find(id => id !== localPlayerId);
	const oppSlots = [];
	if (oppId) {
		gameState.players[oppId].activeSlots.forEach((slot, idx) => {
			if (slot && !slot.isDefeated && slot.entryProtected !== true) {
				oppSlots.push({ id: `${oppId}_slot_${idx}`, label: slot.name, metaLabel: `${slot.mp} MP` });
			}
		});
	}
	if (oppSlots.length === 1) {
		gameState._welloeForceActive.targetSlotId = oppSlots[0].id;
	} else if (oppSlots.length > 1) {
		const targetId = await modal.showOptionSelect({
			title: 'Welloe Force — Redirect Damage',
			prompt: 'Choose a Mosje to redirect all incoming damage to (3 turns).',
			options: oppSlots,
			allowCancel: false,
		});
		gameState._welloeForceActive.targetSlotId = targetId;
	} else {
		delete gameState._welloeForceActive;
	}
}
```

---

### `tests/ui/cards/card-registry.js` → new entries (test, CRUD data-driven spec)

**Analog:** any existing self-cost-shaped or `ATTACK`-shaped entry — e.g. `piecie_harde_didde`
(`card-registry.js:182-187`):

```javascript
{
	cardId: 'piecie_harde_didde', cardType: 'PIECIE',
	setup: { ownMP: 50, opponentMP: 90 }, playThen: 'place-then-activate',
	expectedEffect: 'ATTACK', oppDeltaMin: -50, oppDeltaMax: -50,
	logMatch: /[Hh]arde|[Dd]idde/,
},
```

**Pattern to apply for Welloe Force** (closes the Wave-0 gap RESEARCH.md flags — zero existing
coverage today): needs (at minimum) two entries/cases per RESEARCH.md's Validation Architecture —
"can afford, tribute charged" and "nobody can afford, action blocked, 0 MP change." The registry's
existing schema (`setup: { ownMP, opponentMP, ownLevel }`, `expectedEffect`, `mpDeltaMin/Max`,
`logMatch`) supports the "can afford" case directly (own Mosje loses exactly 40 MP); the "blocked"
case is a new shape not yet represented anywhere in the registry — flag this for the planner as a
possible card-test-runner extension (e.g. an `expectedEffect: 'BLOCKED'` case, or a bespoke
Playwright spec under `tests/ui/` if the generic runner can't drive the affordability-gate/no-op
path). Do not guess the runner's capability — check `tests/ui/cards/card-test-runner.js` during
planning before committing to a registry-only test shape for the blocked case.

---

### `.planning/audits/2026-07-XX-piecie-snelle-cost-audit.md` (new, docs — not code)

**Analog (format precedent):** `.planning/audits/2026-07-14-places-text-audit.md` — reuse its
exact structure: YAML frontmatter (`created`, `title`, `branch`, `scope`, `sensitivity`) → Method
note → 🔴/🟡/✅ legend → flagged-divergence table → clean list → cross-cutting theme → **"Ruling
status" line** → `# RULINGS (date)` section with numbered per-card decisions and a suggested
implementation order. RESEARCH.md's "Code Examples" section already contains the full verbatim
text of all 46 non-zero-cost Piecies/Snelle Piecies — use that as the audit's raw input rows,
not a fresh re-read from scratch.

---

## Shared Patterns

### "Text wins" reconciliation (cross-cutting — applies to every data-correction file)
**Source:** `.planning/audits/2026-07-14-places-text-audit.md`, `36-CONTEXT.md` D-01/D-02.
**Apply to:** `src/data/piecies.js`, `src/data/snellePiecies.js`, `src/data/places.js` (if
touched). The card's own `description` text is the ruling; `mpCost` is corrected to match it, not
the other way around.

### Self-charge idiom, not a generic engine hook (cross-cutting — the whole phase's architecture)
**Source:** `src/abilities/piecieEffects.js:804-816` (Welloe Force, the only precedent).
**Apply to:** any card the audit confirms needs tribute. Do **not** add a cost-check to the
dispatch points in `src/engine/turnManager.js` (`activatePiecie` line 878, `playSnellie` line
1005) — those single-line `effectFn = ...[cardDef.effectId]; state = effectFn(state, playerId);`
call sites stay untouched. All charging logic lives inside the paying card's own effect function.

### Pre-activation async picker → `_pendingTargets` → synchronous effect fn read (cross-cutting)
**Source:** `src/main.js:2767-2780` (Kannetje Melk/Dikke Jonko/Tikker own-target picker).
**Apply to:** Welloe Force's payer picker, and any newly-ruled tribute card that needs a player
choice before its effect function runs. This is the established bridge between async UI (modals
return Promises) and synchronous engine effect functions (`effectFn(state, playerId)` — no
`await` at the call site in `turnManager.js`).

### Affordability gate precedes the charge, never follows it (cross-cutting, D-06)
**Source:** `36-UI-SPEC.md` Component 1/2, `36-RESEARCH.md` Pattern 3 / Pitfall 4.
**Apply to:** every tribute charge. Gate on `mp >= amount` in the picker's `disabled` list AND
before `activatePiecie`/`playSnellie` is even called (main.js blocks the whole action with
`showInfo` if zero Mosjes qualify) AND inside the effect function itself before `applyDamage`
fires (defense in depth against stale-state races). `applyDamage` itself (`piecieEffects.js:29-42`)
is never modified — its defeat-at-0 combat-damage behavior is correct and must be preserved for
non-tribute callers.

### Blocked-action dialog — reuse `showInfo` verbatim
**Source:** `src/ui/modalManager.js:47-59` (`showInfo`), existing call at `main.js:1988`
(Elimination Strike's unrelated MP-affordability block — same shape, same pattern).
**Apply to:** the "nobody can afford tribute" path for every ruled tribute card. Zero changes to
`showInfo` itself.

---

## No Analog Found

None — every file in this phase's scope is a modification of existing, already-analyzed code.
There is no genuinely new architectural surface (confirmed by RESEARCH.md's own recommendation
against building a generic engine-level hook, which would have been the one piece with no
analog).

---

## Metadata

**Analog search scope:** `src/data/*.js`, `src/abilities/*.js`, `src/ui/modalManager.js`,
`src/main.js`, `src/engine/turnManager.js`, `tests/ui/cards/card-registry.js`,
`.planning/audits/*.md` — all directly named by `36-CONTEXT.md`/`36-RESEARCH.md`'s "Data/code
files the audit will need to read" and "Recommended Project Structure" sections; no broader glob
search was needed since RESEARCH.md had already exhaustively located every relevant file and line
number in this internal-only, no-external-library phase.
**Files scanned:** 8 code files read directly (targeted, non-overlapping ranges) + 1 audit-format
doc + 1 CSS rule block.
**Pattern extraction date:** 2026-07-16
