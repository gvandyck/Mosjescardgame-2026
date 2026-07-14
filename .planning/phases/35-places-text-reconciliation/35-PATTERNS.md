# Phase 35: Places Text-vs-Engine Reconciliation (Round 1) - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 8 source files modified (no new source files — this is a reconciliation phase,
not a new-feature phase) + ~10-12 new test files
**Analogs found:** 8 / 8 source files (all self-referential — every pattern needed already lives
inside the same file being edited, or one file over in the same directory)

**Scope note:** All 12 cards' target code lives in the *same* 8 files listed below (no new modules
are created). "Analog" therefore usually means "a sibling function in the same file" rather than a
different file — this is normal for a reconciliation phase and is called out explicitly per card.
The effective implementation set this phase is **10 cards** (PLACE-01,02,03,04,06,07,08,09,10,11)
**+ 2 dead-code-only cleanups** (PLACE-05, PLACE-12 — hidden from play, only their untexted extras
are removed). PLACE-06 requires no code change (draw-1 already correct, cost-0 clause deferred to
Phase 36).

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|-----------------|---------------|
| `src/data/places.js` (edit `trigger`/`description` fields for PLACE-01,08,09,10,11) | model (pure data) | CRUD (static record edit) | other entries in the same array (`place_boxing_ring`, `place_eendjes_voeren`) | exact — same file, same shape |
| `src/abilities/placeEffects.js` (edit/replace 8 effect functions + dispatcher `switch`) | service (state-transform effect handler) | transform (reducer: `(state, context) → state`) | `effect_the_gym`, `effect_zo_is_natuur`, `effect_the_void` (loop-all-slots idiom, same file) | exact — same file, established idiom |
| `src/engine/mpManager.js` (remove 2 dead-code blocks) | service (MP transform) | transform | same file (`gainMP`/`loseMP`) | exact — self, deletion only |
| `src/engine/turnManager.js` (remove 3 dead-code sites; possibly add PLACE-11 once-per-turn flag) | controller (turn lifecycle / dispatch) | event-driven (turn phases, player actions) | same file, `kasteLuckSameTurnActivation` flag idiom (`turnManager.js:212`) | exact — established once-per-turn pattern already in this file |
| `src/main.js` (edit quest-dice-bonus sum at 2 call sites; remove `getSkiffaRerolls` + 4 call sites) | controller/UI (player-action handlers) | request-response | same file, `placeDiceBonus`/`questPrepBonus` inline sum (`main.js:1249-1251`, `2486-2488`) | exact — self |
| `src/abilities/questLogic.js` (remove Void MP-nullify gate; verify/remove dead Synergy Chamber dice consumer) | service (quest resolution) | transform | same file, `getPartnerSynergyQuestBonus`/`PARTNER_QUEST_SYNERGIES` pattern (`questLogic.js:52-66`) for any future partner-gated logic | exact — self |
| `src/engine/synergyResolver.js` (read-only reference for PLACE-11's partner-gating hook) | service (pure query) | transform | same file, `getActiveSynergies`/`hasSynergy` (no edit needed — just the consumer sites in `piecieEffects.js`/`questLogic.js` change) | exact — self, reference only |
| `src/data/playerFacingDecks.js` pattern → new equivalent for Places (hide Drain Zone/Void) | config/service (whitelist filter) | filter/CRUD | `getPlayerFacingDecks()` (`playerFacingDecks.js:21-23`) | exact — literally the reuse precedent named in CONTEXT.md |
| `tests/engine/place-*.test.ts` (NEW, ~8-10 files, one per implemented card) | test | CRUD / dispatcher-level assertions | `tests/engine/coert-kasteluck-morning-luck.test.ts` (full file — same "text-vs-engine reconciliation" shape) + `tests/engine/quest-haven-double-quest.test.ts` (dispatcher-level Place test) | exact — both are the established precedent for this exact phase type |

## Pattern Assignments

### `src/data/places.js` (model, CRUD)

**Analog:** other entries in the same file (self-referential — no external analog needed).

**Trigger-string values in use** (verified working strings — copy exactly, do not invent new ones):
```js
// Working precedents already in the file:
{ id: "place_boxing_ring", trigger: "START_PHASE", ... }   // fires via applyPlaceEffectsOnStart
{ id: "place_the_gym",     trigger: "END_PHASE",   ... }   // fires via applyPlaceEffectsOnEnd
{ id: "place_obby_1",      trigger: "ON_QUEST",    ... }   // fires via applyPlaceEffectsOnQuest
{ id: "place_dierenasiel", trigger: "PASSIVE",     ... }   // fires once via activatePlace
```
**Critical Finding 2 (from research):** `"TURN_START"` is a **dead string** — never dispatched
anywhere in `src/`. `place_bank_chilling` (line 31) and `place_coerts_caravan` (line 156) both
currently use it and therefore never fire in live play. Fix per ruling:
- **PLACE-01** `places.js:31` — change `trigger: "TURN_START"` → `trigger: "START_PHASE"` (matches Bank Chilling's per-player, per-turn-start semantics, same as `place_boxing_ring`/`place_tesla`).
- **PLACE-08** `places.js:156` — change `trigger: "TURN_START"` → `trigger: "END_PHASE"` (per ruling D-08, moves the effect to end-of-turn — this single change happens to also fix the dead-dispatch bug for this card).

**Description text edits needed** (rework cards only — PLACE-01/02/03/04 keep existing text, code is what changes):
- `places.js:159` (PLACE-08) → `"End of Turn: all Mosjes lose 10 MP. Coert Mosjes are immune."`
- `places.js:264` (PLACE-09) → `"On Quest: DIGITAL-EQUIPMENT Piecies give +10 MP while active."`
- `places.js:69` (PLACE-10) → `"Social Quests: all players get +2 to the dice roll."` (and `trigger: "END_PHASE"` → `"ON_QUEST"`)
- `places.js:174` (PLACE-11) → `"Once per turn, activate a Mosje's synergy ability without its partner on field."`
- `places.js:249` (PLACE-07) → drop the `"PET protection bonuses +25%"` clause, keep `"All PET Piecies cost 0 MP"` (text itself stays; only the +25% clause is removed per the Phase-36 supersession note in CONTEXT.md).

**Card definitions are pure data — no logic** (per CLAUDE.md): all `description`/`trigger`/`tags`
edits stay in this file; all behavior changes go in `placeEffects.js`/`turnManager.js`/etc.

---

### `src/abilities/placeEffects.js` (service, transform — the dispatcher + per-card effect functions)

**Analog:** this file's own established idioms — every card in this phase reuses a pattern that
already exists elsewhere in the same file.

**Imports pattern** (lines 1-11):
```js
import { PLACES } from '../data/places.js';
import { getCardById } from '../data/cardIndex.js';

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

function applyDamage(mosje, amount) {
	if (!mosje || mosje.isDefeated || amount <= 0) return;
	if (mosje.entryProtected === true) { /* U8 entry-protection fizzle */ return; }
	mosje.mp -= amount;
	while (mosje.mp < 0) { /* level regression / defeat-at-0 */ }
	mosje.mp = Math.max(0, mosje.mp);
	mosje.mpLostThisTurn = (mosje.mpLostThisTurn || 0) + amount;
}
```
Every effect function clones state via `cloneState`/`JSON.parse(JSON.stringify(...))` (immutable
reducer convention) and applies MP loss via the shared `applyDamage` helper — never mutate `mosje.mp`
directly for losses; always route through `applyDamage` so entry-protection/level-regression apply.

**Loop-all-active-slots pattern (PLACE-01, PLACE-02, PLACE-03)** — copy from `effect_the_gym`
(lines 34-60) or `effect_zo_is_natuur` (lines 189-201):
```js
// Source: placeEffects.js:189-201 (effect_zo_is_natuur, existing live code)
export function effect_zo_is_natuur(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const bonus = (mosje.traits?.resilient || 0) >= 1 ? 15 : 10;
			mosje.mp += bonus;
			console.log(`[ABILITY] Zo is Natuur: +${bonus} MP`);
		}
	}
	return state;
}
```
Bank Chilling is **single-player-scoped** (signature `effect_bank_chilling(gameState, playerId)`,
not a full `Object.keys(state.players)` loop) — only its *inner* slot loop needs to change from
`findIndex(first slot)` to `for (const mosje of player.activeSlots)`; the outer per-player structure
stays as-is (current buggy version at lines 95-113):
```js
// CURRENT (single-slot bug) — placeEffects.js:95-113
export function effect_bank_chilling(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;
	const mosje = player.activeSlots[slotIndex];
	const social = mosje.traits?.social || 0;
	if (social >= 2) { mosje.mp += 15; /* ... */ }
	return state;
}
// TARGET shape — replace the single-slot block with the inner loop from effect_zo_is_natuur:
// for (const mosje of player.activeSlots) { if (!mosje || mosje.isDefeated) continue; ... }
```
Same fix shape applies to `effect_obby_1` (lines 141-162, success/fail branching — `+20`/`applyDamage(mosje,10)`)
and `effect_arcade` (lines 168-183, `technical >= 2 && didSucceed` → `+15`) — both currently use
the identical `findIndex(first slot)` bug pattern.

**`id.includes(...)` substring-matching idiom (PLACE-04, PLACE-08)** — the established pattern
throughout this file for Mosje-family checks. Copy exactly this style, do not build a lookup table:
```js
// Source: placeEffects.js:492-518 (effect_de_box, existing live code — CURRENT, pre-fix)
export function effect_de_box(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		let gandoeSlot = null;
		let michelleSlot = null;
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const id = String(mosje.cardId).toLowerCase();
			if (id.includes('gandoe')) {
				mosje.mp += 20;
				gandoeSlot = mosje;
				console.log('[ABILITY] Toennoe: +20 MP (GANDOE)');       // ← cosmetic bug: fix to 'De Box'
			} else if (id.includes('michelle')) {                          // ← widen to: id.includes('michelle') || id.includes('tuk')
				mosje.mp += 15;
				michelleSlot = mosje;
				console.log('[ABILITY] Toennoe: +15 MP (MICHELLE/TUK)');  // ← cosmetic bug: fix to 'De Box'
			}
		}
		if (gandoeSlot && michelleSlot) {
			gandoeSlot.mp += 10;
			michelleSlot.mp += 10;
			console.log('[ABILITY] Toennoe: +10 bonus each (Gandoe & Michelle together)'); // ← fix to 'De Box'
		}
	}
	return state;
}
```
Confirmed live ids: `mosje_gandoe_wizard`, `mosje_gandoe_destroyer` (both `includes('gandoe')`);
`mosje_michelle`, `mosje_tuk_healer`, `mosje_tuk_architect` (all match `includes('michelle')` or
`includes('tuk')`). Only the `else if` condition and the 3 log strings need editing — the
both-together bonus already generalizes automatically once the condition widens (per research).

**PLACE-08 replacement** — reuse `effect_the_void`'s "all Mosjes lose N MP" shape (lines 207-219)
as the closest precedent, adding an immunity branch:
```js
// Source: placeEffects.js:207-219 (effect_the_void, existing live code — shape to copy)
export function effect_the_void(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			applyDamage(mosje, 15);
			console.log('[ABILITY] The Void: -15 MP drain');
		}
	}
	return state;
}
// PLACE-08 target: same loop shape, -10 instead of -15, skip when id.includes('coert').
// Confirmed live Coert ids: mosje_coert_tech, mosje_coert_kasteluck, mosje_coert_kastelein
// (verify 'mosje_fps_coert' does NOT exist before assuming it needs a separate check — research
// flagged this id as referenced in CONTEXT.md but not found by grep).
```
Also **delete** the `freePiecieActivationAvailable` write (current lines 267-270) — its only
consumer (`turnManager.js:797-804`, see below) is being removed in the same commit.

**PLACE-09 rework** (signature change — needs `playerId` threaded through):
```js
// CURRENT — placeEffects.js:423-436
export function effect_digital_gaming_stop(gameState, questCard, mosje) {
	const state = cloneState(gameState);
	const isDigital = mosje?.traits?.digital >= 2;
	const isPhysicalQuest = questCard?.questRequirement?.includes('physical');
	if (isDigital && !isPhysicalQuest) {
		return { ...state, questAutoSuccess: true };   // ← DEAD FLAG, zero read sites — delete
	}
	return state;
}
```
Target: drop the auto-succeed branch entirely; check the questing player's `piecieSlots` for any
`activated === true` slot whose card def `subtype === 'DIGITAL-EQUIPMENT'` (live cards:
`piecie_keyboard`, `piecie_mouse`, `piecie_controller`), and `+10` to the questing Mosje if found.
**Requires `playerId` added to the function signature AND to the dispatcher's `case` block**
(the switch statement, lines 651-653 currently reads `effect_digital_gaming_stop(state, questCard, mosje)`
— must become `effect_digital_gaming_stop(state, questCard, mosje, playerId)`; `playerId` is
already available via `context` destructuring at the top of `resolvePlaceEffect`, line 580).

**PLACE-10 rework** — replace `effect_skiffa` (currently lines 120-136, all-players `-15`-unless-SUBSTANCE
loop) entirely. The new mechanic (flat Social-quest dice bonus) is **not** implemented inside
`placeEffects.js` at all — it lives in `main.js` (see below), matching how Synergy Chamber's own
dice bonus is inlined there rather than routed through the dispatcher. `effect_skiffa` itself can
likely be deleted, and its `case 'place_skiffa':` removed from the dispatcher switch, if the new
mechanic needs no `ON_QUEST`-dispatched state mutation (verify no other state change is needed
before deleting the case entirely — if in doubt, keep a no-op passthrough case rather than letting
`resolvePlaceEffect`'s `default:` warn-and-return-unchanged fire for an id it should recognize).

**PLACE-11 rework** (`effect_synergy_chamber`, lines 280-286, plus its 3 bonus-accessor functions):
```js
// CURRENT — placeEffects.js:280-296 (dead flag + first of 3 undocumented bonus accessors)
export function effect_synergy_chamber(gameState) {
	const state = cloneState(gameState);
	state.synergyChamberActive = true;   // ← DEAD, nothing reads this — delete
	console.log('[ABILITY] Synergy Chamber: passive synergy triggers unlocked');
	return state;
}
export function getSynergyChambercostReduction(gameState) {
	return gameState?.activePlace === 'place_synergy_chamber' ? 5 : 0;   // ← DELETE (undocumented -5 cost)
}
export function getSynergyChamberDiceBonus(gameState) {
	return gameState?.activePlace === 'place_synergy_chamber' ? 1 : 0;   // ← DELETE (undocumented +1 dice)
}
export function getSynergyChamberDurationBonus(gameState) {
	return gameState?.activePlace === 'place_synergy_chamber' ? 1 : 0;   // ← DELETE (verify zero consumers first — A4)
}
```
Delete all 3 accessor functions and their consumers (see `turnManager.js`/`main.js`/`questLogic.js`
sections below). New headline mechanic ("once per turn, activate a synergy ability without its
partner on field") gates `synergyResolver.js:39` (`activeMosjeIds.includes(partnerId)`) — see the
**once-per-turn flag pattern** under Shared Patterns for the reset/consume idiom to copy, and the
**No Analog Found** section below for the missing UI-trigger piece.

**Dispatcher envelope (Pitfall 4 — do not forget this)** — every `case` in the `switch` (lines
582-670) must still flow into the shared return wrapper at the bottom (lines 672-681):
```js
// Source: placeEffects.js:672-681
return {
	...nextState,
	_lastPlaceEffect: {
		placeId,
		placeName: placeDef.name,
		phase: triggerPhase,
		description: placeDef.description || 'Place effect triggered',
		time: Date.now(),
	},
};
```
Whenever an effect function's signature changes (PLACE-09's new `playerId` param), the matching
`case` block in the `switch` (lines 582-670) must be updated in the same commit or the call silently
passes `undefined`.

---

### `src/engine/mpManager.js` (service, transform — dead-code removal only)

**Analog:** same file, self.

**Drain Zone +5-to-all-gains removal** (`gainMP`, lines 28-59; the block to delete is lines 37-40):
```js
// Source: mpManager.js:37-40 — DELETE this block (untexted, applies to ALL MP gains while
// Drain Zone is active, unrelated to the card's actual text)
let gainAmount = amount;
if (placeId === 'place_drain_zone') {
	gainAmount += 5;
}
```
Independent of the PLACE-05 hide decision — this cleanup happens regardless (per the
plan-phase amendment: "still removed this phase — independent dead-code cleanup").

**Dierenasiel typo'd dead-code removal** (`loseMP`, block at lines 197-201):
```js
// Source: mpManager.js:197-201 — DELETE (reads state.dierenasielActive, but the SETTER at
// placeEffects.js:413 writes state.dienasielActive — missing "r" — so this branch is
// permanently unreachable in live play; confirms the audit's "entirely inert" finding)
if (state.dierenasielActive) {
	lossAmount = roundToFive(lossAmount * 0.75);
	console.log('[MP] Dierenasiel: PET protection — reduced loss to', lossAmount);
}
```

---

### `src/engine/turnManager.js` (controller, event-driven — turn lifecycle + player actions)

**Analog:** same file — `kasteLuckSameTurnActivation` is the established once-per-turn-flag idiom
(see Shared Patterns below); `activatePiecie`/`useMosjeAbility` are the sites needing cleanup.

**Turn-start reset block** (`startTurn`, lines 198-213) — every per-turn flag lives here; any new
PLACE-11 waiver flag must be added to this same block, following the existing boolean-flag idiom:
```js
// Source: turnManager.js:198-213 (existing live code)
activePlayer.questsCompletedThisTurn = 0;
activePlayer.pieciesPlayedThisTurn = 0;
activePlayer.pieciesActivatedThisTurn = 0;
activePlayer.actionsThisTurn = [];
activePlayer.freePiecieActivationAvailable = false;
activePlayer.kasteLuckSameTurnActivation = false;
// ...
```

**Dead-code removal in `activatePiecie`** (lines 797-804 — the `freePiecieActivationAvailable`
consumer, now orphaned once PLACE-08 stops writing the flag):
```js
// Source: turnManager.js:797-804 — DELETE (no writer remains once effect_coerts_caravan
// stops setting freePiecieActivationAvailable)
if (
	state.activePlace === 'place_coerts_caravan' &&
	player.freePiecieActivationAvailable === true &&
	player.activeSlots.some(s => s && !s.isDefeated && String(s.cardId || '').includes('coert'))
) {
	player.freePiecieActivationAvailable = false;
	console.log('[PLACE] Coert\'s Caravan — free Piecie activation consumed');
}
```
Also note the neighboring **Void restriction block is CORRECT and should NOT be touched**
(lines 806-813 — `blocked = ['RESTORE', 'FOOD']` check) — research confirms this is already
correctly wired, contradicting the audit's "unimplemented" note. Leave alone.

**Dead-code removal in `useMosjeAbility`** (lines 1149-1186):
```js
// Source: turnManager.js:1149-1157 — DELETE (typo'd dead stub, STUB-09 never completed)
const dierenasielWaiver = gameState.dierenasielActive === true;
if (dierenasielWaiver) {
	console.log('[ENGINE] Dierenasiel: 0-MP PET ability activation allowed for', mosjeId);
}
// ...
// Source: turnManager.js:1177-1186 — DELETE (Synergy Chamber -5 cost-discount consumer,
// paired with getSynergyChambercostReduction removal in placeEffects.js)
const synergyDiscount = placeEffects.getSynergyChambercostReduction(gameState);
let stateForAbility = gameState;
if (synergyDiscount > 0 && mosjeDef.abilityCost > 0) {
	stateForAbility = JSON.parse(JSON.stringify(gameState));
	const s = stateForAbility.players[playerId].activeSlots[slotIndex];
	s.mp += synergyDiscount;
	console.log('[ENGINE] Synergy Chamber: ability cost reduced by', synergyDiscount, 'for', mosjeId);
}
```
Also delete the code-comment lines referencing `STUB-09`/`dierenasielWaiver` at 1136 and 1152-1153
(doc-comment cleanup, not just code).

**`actionsThisTurn` scaffold — reusable for PLACE-12 (if/when un-descoped)**, currently write-only
with zero readers (confirmed by research):
```js
// Source: turnManager.js:890-897 (existing live code, the ONLY writer of actionsThisTurn today)
const actions = Array.isArray(state.players[playerId].actionsThisTurn)
	? state.players[playerId].actionsThisTurn
	: [];
if (!actions.includes('PIECIE_ACTIVATED')) {
	state.players[playerId].actionsThisTurn = [...actions, 'PIECIE_ACTIVATED'];
}
```
Not touched this phase (PLACE-12 is hidden/descoped) but this is the pre-existing scaffold a
future phase should extend rather than inventing a new counter.

---

### `src/main.js` (controller/UI, request-response — quest-attempt handlers)

**Analog:** same file, self — the `placeDiceBonus`/`questPrepBonus` inline-sum idiom is the exact
pattern PLACE-10's new bonus slots into.

**Quest dice-bonus stacking pattern** (2 call sites — General Quest at lines 1249-1253, Personal
Quest at lines 2486-2490 — both must be edited identically):
```js
// Source: main.js:1249-1253 (existing live code, General Quest attempt site)
const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
const skiffaRerolls = getSkiffaRerolls(gameState, localPlayerId);   // ← Critical Finding 3: DELETE this line + the function
const forceReroll = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;
```
Target for PLACE-10: add a Social-quest-gated `+2` term to the same sum, e.g.
`(gameState.activePlace === 'place_skiffa' && questDef.category === 'Social' ? 2 : 0)`. `questDef`
is already in scope at both call sites (confirmed — used one line above at `getQuestDiceThreshold(questDef, activeMosje)`).

**`getSkiffaRerolls` — Critical Finding 3, disposition: remove** (function body + all 4 call sites):
```js
// Source: main.js:3338-3346 — DELETE this whole function
function getSkiffaRerolls(gameState, playerId) {
	if (gameState?.activePlace !== 'place_skiffa') return 0;
	const activeMosje = gameState?.players?.[playerId]?.activeSlots?.find(s => s && !s.isDefeated);
	if (!activeMosje) return 0;
	const card = CARD_LOOKUP[activeMosje.cardId];
	if (card?.subtype !== 'ARTISTIC') return 0;
	const creative = Number(activeMosje?.traits?.creative || 0);
	return creative >= 3 ? 2 : 1;
}
```
4 call sites to remove alongside it: `main.js:1252`, `~1474`, `main.js:2489`, `~2642` (grep for
`getSkiffaRerolls(` after editing to confirm all are gone and nothing downstream still reads a
`skiffaRerolls` variable that no longer exists).

---

### `src/abilities/questLogic.js` (service, transform — quest resolution)

**Analog:** same file, self.

**The Void quest-MP-nullify gate — remove** (inside `resolveQuest`, line 338, consumed through the
rest of the function at lines 349/367/393+):
```js
// Source: questLogic.js:337-338 — DELETE this line and its consumers throughout resolveQuest
// The Void nullifies direct Quest MP gain/loss; quest still resolves.
const baseQuestMpBlocked = state.activePlace === 'place_the_void';
```
Grep every use of `baseQuestMpBlocked` in the function body after this line (confirmed present at
minimum at 349, 367, 393 in this research pass — "likely more below," per RESEARCH.md — verify
exhaustively with `Grep "baseQuestMpBlocked"` before committing) and remove each gate. This is
independent PLACE-12 dead-code cleanup, done regardless of the Void-hide decision.

**Synergy Chamber dice-bonus consumer — verify then remove** (`quest_req_perfect_timing`,
around line 981, per RESEARCH.md — **not yet directly read this session; re-verify the exact call
site and its `questCard?.gameState || null` argument before deleting**, since research flags this
may already be effectively dead due to `questCard` never carrying a `gameState` property).

**Reference pattern for any future partner-gated bonus** (not edited this phase, but the shape
PLACE-11's synergy-waiver interacts with):
```js
// Source: questLogic.js:52-66 (existing live code)
const PARTNER_QUEST_SYNERGIES = [
	{ pair: ['mosje_martin_senor_west', 'mosje_azn_cless'], category: 'Physical', bonus: 15 },
];
export function getPartnerSynergyQuestBonus(gameState, playerId, category) {
	if (!category) return 0;
	const activeIds = new Set(getActiveMosjes(gameState?.players?.[playerId]).map(m => m.cardId));
	let bonus = 0;
	for (const entry of PARTNER_QUEST_SYNERGIES) {
		if (entry.category === category && entry.pair.every(id => activeIds.has(id))) bonus += entry.bonus;
	}
	return bonus;
}
```

---

### `src/engine/synergyResolver.js` (service, transform — reference only, not edited)

**Analog:** self — the partner-gating check PLACE-11's waiver needs to bypass.

```js
// Source: synergyResolver.js:17-55 (getActiveSynergies, existing live code — full function)
export function getActiveSynergies(gameState, playerId) {
	const player = gameState.players[playerId];
	if (!player) return [];
	const activeMosjeIds = player.activeSlots
		.filter(slot => slot !== null && !slot.isDefeated)
		.map(slot => slot.cardId);
	// ...
	for (const partnerId of mosjeData.synergyWith) {
		// Synergy only triggers if the partner is also on the field
		if (activeMosjeIds.includes(partnerId)) {   // ← the check PLACE-11's waiver bypasses
			synergies.push({ mosjeAId: mosjeId, mosjeBId: partnerId, synergyEffect: mosjeData.synergyEffect });
		}
	}
	return synergies;
}
```
Real consumers of this partner-gate (2 total, per exhaustive grep in RESEARCH.md):
1. `hasFoodDoubleSynergy` (`synergyResolver.js:78-88`) → consumed in `piecieEffects.js:97,110,125`
2. `getPartnerSynergyQuestBonus` (`questLogic.js:56-67`, shown above)

PLACE-11's waiver is a new, narrowly-scoped bypass for whichever of these 2 is relevant to the
player's active Mosjes — this file itself is not edited; the waiver's flag-check goes in the
consumer call sites (`piecieEffects.js`/`questLogic.js`), following the once-per-turn flag pattern
below.

---

### Hide mechanism (PLACE-05 Drain Zone, PLACE-12 The Void)

**Analog:** `src/data/playerFacingDecks.js` — this is the exact reuse precedent named in
CONTEXT.md ("same pattern as `getPlayerFacingDecks()`").

```js
// Source: src/data/playerFacingDecks.js (full file, existing live code)
import { STARTER_DECKS } from './starterDecks.js';

const PLAYER_FACING_DECK_IDS = [
	'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE', 'DUO_CHRIS_YOURI', 'DUO_JISCA_ALYSSA', 'DUO_WEST_CLESS',
];

export function getPlayerFacingDecks() {
	return STARTER_DECKS.filter(deck => PLAYER_FACING_DECK_IDS.includes(deck.id));
}
```
**Insertion points found for the Places equivalent** — `PLACES` is imported raw (not filtered) in
these player-facing-pool builders (confirmed by grep, all in `src/`):
```js
// src/deck-builder.js:23,35
import { PLACES } from './data/places.js';
...PLACES.map(c => ({ ...c, cardType: 'PLACE' })),

// src/data/boosterEngine.js:12,26
import { PLACES }        from './places.js';
...PLACES.map(c => ({ ...c, cardType: 'PLACE' })),
```
Target: add a `getPlayerFacingPlaces()`-style export (new function, same file as `places.js` or a
new tiny file next to `playerFacingDecks.js`, following the "small files" convention) filtering out
`place_drain_zone` and `place_the_void` by id, then swap the raw `PLACES` import for the filtered
export at both spread sites above. Do **not** filter `src/engine/turnManager.js`, `graveyardUtils.js`,
`placeEffects.js`, `cardIndex.js`, `modalManager.js`, or `botDriver.js`'s `PLACES` imports — those
need the full unfiltered list to still resolve card definitions for any Drain Zone/Void instances
that already exist in a game (card data/effect code stays in the codebase, just unreachable from
new deck-building/boosters).

---

## Shared Patterns

### Immutable-reducer state cloning (applies to every `placeEffects.js`/`mpManager.js` function touched)
**Source:** `src/abilities/placeEffects.js:9-11`, used identically throughout the file.
```js
function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}
```
Every effect function starts `const state = cloneState(gameState);` and returns the new `state` —
never mutate the incoming `gameState` argument in place. `mpManager.js` uses the equivalent
`deepCloneState` (already imported, not re-shown here — same convention).

### `id.includes(...)` substring matching for Mosje-family checks
**Source:** `placeEffects.js` (`effect_de_box`, `effect_coerts_caravan`, `effect_the_gym`'s
`isWest`/`isCless` checks), `synergyResolver.js`'s Coert-family list.
**Apply to:** PLACE-04 (widen to `id.includes('michelle') || id.includes('tuk')`), PLACE-08
(`id.includes('coert')` immunity check).
```js
const id = String(mosje.cardId).toLowerCase();
if (id.includes('gandoe')) { /* ... */ }
```
**Pitfall (from research):** always verify the full `mosjes.js` id list before adding a new
substring check — a later-added Mosje id could silently start matching an existing Place bonus.

### Once-per-turn flag pattern (reference for PLACE-11's waiver)
**Source:** `src/engine/turnManager.js:212` (reset in `startTurn`), consumption idiom mirrored
across the codebase (`playPiecie` reads `kasteLuckSameTurnActivation`).
```js
// Reset every turn (turnManager.js:212, inside startTurn):
activePlayer.kasteLuckSameTurnActivation = false;
// Set by the triggering condition:
kasteLuckPlayer.kasteLuckSameTurnActivation = true;
// Consumed once, then cleared, at the point of use:
const kasteLuckBonus = player.kasteLuckSameTurnActivation === true;
if (kasteLuckBonus) player.kasteLuckSameTurnActivation = false;
```
This is the idiom to copy for PLACE-11's "once per turn, activate a synergy ability without its
partner" waiver flag — add the new boolean to the `startTurn` reset block (`turnManager.js:198-213`)
alongside the existing ones, following the exact same shape.

### Quest dice-bonus stacking (reference for PLACE-10's Skiffa +2)
**Source:** `src/main.js:1249-1251` / `2486-2488` (2 call sites, must stay in sync).
```js
const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
// combined later: diceBonus + questPrepBonus + placeDiceBonus
```
**Apply to:** PLACE-10 — add one more additive term to the same sum at both call sites, gated on
`gameState.activePlace === 'place_skiffa' && questDef.category === 'Social'`.

### MP-touching-change validation (applies to PLACE-01,02,03,04,05,08,09)
**Source:** CLAUDE.md + CONTEXT.md Process section — not a code pattern but a required gate:
after any commit touching MP gain/loss, re-run the Ronald Kip stacking test
(`tests/ui/cards/card-registry.js:164-169`, `cardId: 'piecie_ronald_kip'`) via `npm run test:cards`,
then `npm run test:sim` (the correct current command — CLAUDE.md's
`node --loader ts-node/esm src/simulation/run-once.ts` no longer exists per RESEARCH.md).

---

## Test Pattern (the "reconciliation-todo precedent")

**Analog:** `tests/engine/coert-kasteluck-morning-luck.test.ts` (full file, read this session) —
this is the established shape for a "text-vs-engine reconciliation" test in this codebase, written
for the exact same kind of phase (2026-07-12 audit round). Reuse its 3-part shape for every
PLACE-01..11 test file:

1. **State builder helper** — a local `buildXState(opts)` function wrapping `createEngineState`
   from `tests/helpers/testHelpers.js` (imported, not reinvented):
```ts
// Source: tests/engine/coert-kasteluck-morning-luck.test.ts:19-57 (pattern to copy)
import { createEngineState } from "../helpers/testHelpers.js";

function buildKasteLuckState(opts: { kasteLuckAlive?: boolean; ... } = {}) {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    players: { player_1: { /* activeSlots, piecieSlots, etc. */ } },
  });
}
```

2. **Dispatcher-level assertions, not raw-function calls** (Pitfall 1 from research — critical for
   PLACE-01 and PLACE-08 specifically, since their bug is in the *dispatch*, not the effect body):
```ts
// Source: tests/engine/coert-kasteluck-morning-luck.test.ts:64-71 (pattern to copy)
import { startTurn, playPiecie } from "../../src/engine/turnManager.js";

it("rolling 4-6 at turn start sets kasteLuckSameTurnActivation on the active player", () => {
  const state = buildKasteLuckState();
  const next = startTurn(state);   // ← goes through the REAL dispatch path, not the raw effect fn
  expect(next.players.player_1.kasteLuckSameTurnActivation).toBe(true);
});
```
For PLACE-01 specifically: assert `next.activePlace === 'place_bank_chilling'` is set, call
`startTurn(state)` (which internally calls `applyPlaceEffectsOnStart` → `resolvePlaceEffect(state, 'START_PHASE', ...)`),
and check `_lastPlaceEffect.placeId === 'place_bank_chilling'` fired — per Wave 0 Gap 2 in RESEARCH.md.
Alternative dispatcher entry points already exported for direct testing: `applyPlaceEffectsOnEnd`,
`applyPlaceEffectsOnQuest`, `applyPlaceEffectsOnStart` (all in `turnManager.js`, lines 1298-1335).

3. **Data-shape assertions** for text/description changes:
```ts
// Source: tests/engine/coert-kasteluck-morning-luck.test.ts:119-130 (pattern to copy)
import { MOSJES } from "../../src/data/mosjes.js";
// (use PLACES instead of MOSJES for this phase)
it("description no longer describes the old X mechanic", () => {
  const place = PLACES.find((p) => p.id === "place_coerts_caravan");
  expect(place.description.toLowerCase()).not.toContain("binti");
});
```

**Secondary analog:** `tests/engine/quest-haven-double-quest.test.ts` — closest existing example of
a Place-effect test that already exercises `ON_QUEST`-triggered Place behavior end-to-end through
`attemptGeneralQuest`/`attemptPersonalQuest` (useful reference for PLACE-02/03/09/10's `ON_QUEST`
dispatch tests specifically).

**Card-test-library gap (Wave 0):** no `tests/ui/cards/card-registry.js` entry exists yet for any
of the 21 Place cards — only Piecies/Snelle/Mosjes are represented there today (confirmed —
existing entry shape shown below is Piecie-only). CONTEXT.md's "Claude's Discretion" note covers
"exact test shapes," so either an engine-level `tests/engine/place-*.test.ts` (faster, described
above) or a new card-registry entry format is acceptable — but a new card-registry Place entry
format would be a **novel pattern with no existing Place analog**, so the engine-level test route
(with mandatory dispatcher-level assertions per Pitfall 1) is the lower-risk choice this phase.
```js
// Source: tests/ui/cards/card-registry.js:164-169 (existing Piecie entry shape, for reference only
// — NOT a direct analog for a Place entry; no card-registry entries exist for the PLACE cardType)
{
	cardId: 'piecie_ronald_kip', cardType: 'PIECIE',
	setup: { ownMP: 40, ownLevel: 2 }, playThen: 'place-then-activate',
	expectedEffect: 'MP_GAIN', mpDeltaMin: 50, mpDeltaMax: 100,
	logMatch: /[Rr]onald|[Kk]ip/,
},
```

---

## No Analog Found

| File/Area | Role | Data Flow | Reason |
|-----------|------|-----------|--------|
| PLACE-11's new "activate synergy without partner" **UI trigger point** (button/prompt) | UI (new player action) | request-response | Research confirms this is "a genuinely new player-facing action" — no existing Place effect requires an explicit player-initiated button click (all 21 Places today are either passive/auto-triggered on turn/quest/draw events, or PASSIVE-on-activation). The closest structural precedent is the generic `useMosjeAbility(state, playerId, mosjeId)` call-and-render pattern used at 14 call sites in `main.js` (e.g. `main.js:1708`) for *ability* buttons, but there is no existing "Place-triggered optional once-per-turn action" button anywhere in `src/ui/` to copy directly. Flagged as an open design question in RESEARCH.md — do not silently invent UI without a scoping check. |
| PLACE-12's 9-function activation-cap gating (which of `playPiecie`/`activatePiecie`/`playMosje`/`useMosjeAbility`/etc. count) | controller | event-driven | Descoped/hidden this phase per the plan-phase amendment (Open Question 3 in RESEARCH.md — genuinely ambiguous, not a research gap). No pattern is needed since only the dead-code cleanup (`questLogic.js:338`) ships this phase. |
| PLACE-05's "ATTACK Piecies deal +10 damage" (11 separate `piecieEffects.js` functions) | service (effect functions outside `placeEffects.js`) | transform | Descoped/hidden this phase (deferred until a Piecie-touching phase). If un-descoped later, the closest analog would be `effect_welloe_force` (`piecieEffects.js:804-816`, self-charging `applyDamage` idiom) as a model for "one effect function conditionally adds a Place-based bonus to its own `applyDamage` call" — but this phase does not implement it. |

## Metadata

**Analog search scope:** `src/data/places.js`, `src/abilities/placeEffects.js`, `src/engine/mpManager.js`,
`src/engine/turnManager.js`, `src/main.js`, `src/abilities/questLogic.js`, `src/engine/synergyResolver.js`,
`src/data/playerFacingDecks.js`, `src/deck-builder.js`, `src/data/boosterEngine.js`, `tests/engine/*.test.ts`,
`tests/helpers/testHelpers.js`, `tests/ui/cards/card-registry.js`. `/_archive/` was never read or scanned
(per CLAUDE.md).
**Files scanned:** 13 (all read this session; no re-reads of the same range)
**Pattern extraction date:** 2026-07-14
