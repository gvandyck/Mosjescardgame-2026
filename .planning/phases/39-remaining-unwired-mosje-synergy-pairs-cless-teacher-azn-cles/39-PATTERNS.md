# Phase 39: Gandoe↔Michelle synergy (The Box deck) - Pattern Map

**Mapped:** 2026-07-18
**Files analyzed:** 3 (2 modified engine files + 1 new test file)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/abilities/questLogic.js` (`PARTNER_QUEST_SYNERGIES` — D-05, Gandoe→Michelle) | engine/data-table | CRUD (table row) | Same file — existing `mosje_martin_senor_west` + `mosje_azn_cless` row (line 52) | exact (same file, same mechanism — add one array entry) |
| `src/abilities/questLogic.js` (Michelle Tough Gamble block — D-01..D-04, Michelle→Gandoe) | ability/event-handler | event-driven (dice-roll outcome → cross-slot MP grant) | Same file — Jeffrey Brute Force append pattern (lines 541-561) + Phase 38 cross-slot `gainMP` grant (`src/engine/turnManager.js` lines 53-69) | role-match (event handler shape from Jeffrey; grant mechanics from Alyssa/Jisca) |
| `tests/ui/cards/gandoe-michelle-synergy.spec.js` (new) | test (Playwright repro) | request-response (browser E2E) | `tests/ui/cards/alyssa-jisca-synergy.spec.js` (Phase 38 repro spec, full file) | exact (same repro-first pattern, same helpers, same duo-deck seeding) |

## Pattern Assignments

### `src/abilities/questLogic.js` — D-05 Gandoe→Michelle (`PARTNER_QUEST_SYNERGIES` row)

**Analog:** same file, `PARTNER_QUEST_SYNERGIES` array (lines 51-53)

**Current table** (line 51-53):
```javascript
const PARTNER_QUEST_SYNERGIES = [
	{ pair: ['mosje_martin_senor_west', 'mosje_azn_cless'], category: 'Physical', bonus: 15 },
];
```

**Change:** add one entry — exact mirror shape:
```javascript
const PARTNER_QUEST_SYNERGIES = [
	{ pair: ['mosje_martin_senor_west', 'mosje_azn_cless'], category: 'Physical', bonus: 15 },
	{ pair: ['mosje_gandoe_destroyer', 'mosje_michelle'], category: 'Physical', bonus: 15 },
];
```

No other code path needs to change — `getPartnerSynergyQuestBonus` (lines 55-69) and `getActivePartnerSynergyBonuses` (lines 75-87) both iterate the table generically (`entry.pair.every(id => activeIds.has(id))` / waiver check), and are already called from the quest-resolution stack at line 399 (`getPartnerSynergyQuestBonus(state, playerId, questCard.category)`) inside `resolveQuestOutcome`. Confirmed live and wired — this is data-only.

---

### `src/abilities/questLogic.js` — D-01..D-04 Michelle→Gandoe (Tough Gamble kicker)

**Analog:** same file, `applyMosjeFieldEffectsOnQuest` function (lines 501-600), specifically:
- The **Michelle Tough Gamble block** itself (lines 508-539) — this IS the hook point; the new logic is a sub-branch inside it.
- The **Jeffrey Brute Force append pattern** (lines 541-561) — the `if (state._autoAbilityLog) { …append… } else { …create… }` shape to follow when adding a second ability's log entry onto the same `_autoAbilityLog` object within one call.

**Function signature / imports already in file** (lines 1-11):
```javascript
import { rollDie } from '../engine/deckEngine.js';
import { gainMP, loseMP } from '../engine/mpManager.js';
import { checkVictory } from '../engine/victoryChecker.js';
import { roundToFive } from '../engine/roundToFive.js';
import { applyPlaceEffectsOnQuest } from '../engine/turnManager.js';
```
`gainMP` is already imported — no new import needed for the cross-slot Gandoe grant.

**Existing Michelle Tough Gamble block** (lines 508-539) — the roll and the `roll >= 4` success branch this hooks into:
```javascript
	// ── Michelle — Tough Gamble ─────────────────────────────────────────────
	// After each quest: roll d6. 4-6 → double the quest reward. 1-3 → half it.
	// Only modifies success rewards (questMpGained > 0); failure is unaffected.
	if (mosje.cardId === 'mosje_michelle') {
		const roll = rollDie(6);
		let adjustment = 0;
		let label = '';

		if (questMpGained > 0) {
			if (roll >= 4) {
				adjustment = questMpGained;           // add same amount again → 2× total
				mosje.mp += adjustment;
				label = `rolled ${roll} (4+) ✦ DOUBLED! +${adjustment} extra MP (total +${questMpGained * 2})`;
			} else {
				adjustment = -roundToFive(questMpGained / 2);  // take back half → ½ total (5-grid)
				mosje.mp = Math.max(0, mosje.mp + adjustment);  // clamp: level-up may have reset mp to 0 before this fires
				label = `rolled ${roll} (1-3) ✦ Halved. ${adjustment} MP (total +${questMpGained + adjustment})`;
			}
		} else {
			label = `rolled ${roll} — no success reward to modify`;
		}

		console.log(`[ABILITY] Michelle Tough Gamble: ${label} | base=${questMpGained} adj=${adjustment} mp=${mosje.mp}`);
		mosje.abilityUsedThisTurn = true;
		state._autoAbilityLog = {
			mosje: mosje.name,
			ability: 'Tough Gamble',
			roll,
			adjustment,
			label: `[Michelle] Tough Gamble: ${label}`,
		};
	}
```

**Key design point per D-01:** the `roll >= 5` Gandoe-kicker check is a SEPARATE, higher threshold from the existing `roll >= 4` double band — do NOT change the `roll >= 4` condition. Add the kicker as an independent `if (roll >= 5)` sub-check using the SAME `roll` variable, inside (or immediately after) the existing block, so it fires alongside the double/half logic without altering it. It fires on roll 5 or 6 regardless of whether `questMpGained > 0` — D-02 says "every Tough Gamble roll of 5-6", not gated on the quest having a reward (re-check against CONTEXT.md if ambiguous; the printed text does not condition the kicker on `questMpGained > 0` the way the double/half is).

**Cross-slot grant pattern to copy** — from Phase 38 Alyssa/Jisca precedent, `src/engine/turnManager.js` lines 53-69 (`applyAlyssaJiscaPiecieBonus`):
```javascript
function applyAlyssaJiscaPiecieBonus(state, playerId) {
  const player = state.players[playerId];
  if (!player) return state;
  if (player.alyssaJiscaPiecieBonusUsedThisTurn) return state;
  if (player.pieciesPlayedThisTurn !== 1) return state;
  if (!hasAlyssaJiscaSynergy(state, playerId)) return state;

  const jiscaIndex = player.activeSlots.findIndex(
    s => s && !s.isDefeated && s.cardId === 'mosje_jisca'
  );
  if (jiscaIndex < 0) return state;

  state = gainMP(state, playerId, jiscaIndex, 10, 'GAIN', { allowLevelUp: false });
  player.alyssaJiscaPiecieBonusUsedThisTurn = true;
  console.log(`[SYNERGY] Alyssa+Jisca: first Piecie this turn → Jisca +10 MP → ${state.players[playerId].activeSlots[jiscaIndex].mp} MP`);
  return state;
}
```
Adapt for D-04 (find Destroyer slot, guard against `mosje_gandoe_wizard`):
```javascript
const gandoeDestroyerIndex = player.activeSlots.findIndex(
	s => s && !s.isDefeated && s.cardId === 'mosje_gandoe_destroyer'
);
if (gandoeDestroyerIndex >= 0) {
	state = gainMP(state, playerId, gandoeDestroyerIndex, 10, 'GAIN', { allowLevelUp: false });
	// ...append to _autoAbilityLog, Jeffrey-append style...
}
```
Note: `applyMosjeFieldEffectsOnQuest` already re-assigns/threads `state` via `cloneState` at the top (line 502: `let state = cloneState(gameState);`) and mutates `state.players[playerId]` directly for Michelle's own MP (`mosje.mp += ...`), but calls `gainMP`/`loseMP` (which internally deep-clone and return a NEW state) for FPS Coert's opponent-loseMP (lines 579-580) and should do the same for this cross-slot Gandoe grant — `state = gainMP(state, ...)`, not direct mutation, since Gandoe is a DIFFERENT slot than `mosje` (the Michelle slot this function is scoped to).

**Jeffrey Brute Force `_autoAbilityLog` append pattern** (lines 545-561) — the pattern to copy for appending the Gandoe-kicker line onto the same log entry Michelle's own Tough Gamble block just created:
```javascript
	if (mosje.cardId === 'mosje_jeffrey' && questMpGained > 0) {
		mosje.mp += 10;
		const label = `Brute Force: +10 MP bonus (total quest gain ${questMpGained + 10})`;
		console.log(`[ABILITY] Jeffrey ${label} | mp=${mosje.mp}`);
		// Append to existing auto-ability log if Michelle also fired (edge case),
		// otherwise start a new entry.
		if (state._autoAbilityLog) {
			state._autoAbilityLog.label += ` · [Jeffrey] ${label}`;
		} else {
			state._autoAbilityLog = {
				mosje: mosje.name,
				ability: 'Brute Force',
				adjustment: 10,
				label: `[Jeffrey] ${label}`,
			};
		}
	}
```
Since the Gandoe kicker fires WITHIN the same Michelle block (not a separate `mosje.cardId ===` branch elsewhere), `state._autoAbilityLog` will already exist (Michelle's own block sets it unconditionally at line 532) — so the append form (`state._autoAbilityLog.label += ...`) is the one to use, no need for the `else` branch.

**`rollDie` signature** (`src/engine/deckEngine.js` lines 77-81):
```javascript
export function rollDie(sides = 6) {
  const result = Math.floor(Math.random() * sides) + 1;
  console.log(`[ENGINE] Rolled d${sides}: ${result}`);
  return result;
}
```
Already called as `rollDie(6)` at line 512 — reuse the SAME `roll` variable already captured for the double/half check; do not roll twice.

**`gainMP` signature** (`src/engine/mpManager.js` lines 28-55):
```javascript
export function gainMP(gameState, playerId, slotIndex, amount, source = 'GAIN', { allowLevelUp = true } = {}) {
  if (amount <= 0) return gameState;
  ...
  if (allowLevelUp) { ... return checkLevelUp(state, playerId, slotIndex); }
  // Non-quest path: cap at 100, never level up.
  mosje.mp = Math.min(100, mosje.mp + gainAmount);
  ...
  return state;
}
```
D-03 requires `allowLevelUp: false` — call as `gainMP(state, playerId, gandoeDestroyerIndex, 10, 'GAIN', { allowLevelUp: false })`, exactly mirroring the Alyssa/Jisca call.

---

### `tests/ui/cards/gandoe-michelle-synergy.spec.js` (new repro spec)

**Analog:** `tests/ui/cards/alyssa-jisca-synergy.spec.js` (full file, 151 lines) — copy structure wholesale, swap cards/assertions.

**Imports** (lines 23-35 of analog):
```javascript
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	waitForBoard,
	setMosjeOnField,
	setHand,
	clearEntryProtection,
	playCardFromHand,
	getGameState,
	endTurnAndWait,
	mockDiceRoll,
	ss,
} from '../helpers.js';
```
(This new spec won't need `setHand`/`playCardFromHand` since the trigger is a Quest attempt, not a Piecie play — check `tests/ui/helpers.js` for a quest-attempt helper, e.g. `attemptQuest`/`playQuestCard`, before assuming; grep `helpers.js` for `Quest` exports if none of the above cover it.)

**Duo-deck seeding pattern** (lines 42-81 of analog) — reusable verbatim, just swap `mosjes: ['mosje_alyssa_bulldozer', 'mosje_jisca']` for `mosjes: ['mosje_gandoe_destroyer', 'mosje_michelle']`, and swap the harmless bot deck's self-only Mosje (analog uses `mosje_michelle` for the bot — pick a different self-only Mosje like `mosje_jeffrey` or similar non-opponent-targeting card for THIS spec's bot side, since Michelle is now the player's own card under test):
```javascript
const PLAYER_DECK = {
	id: 'custom_alyssa_jisca_synergy_player',
	name: 'Alyssa/Jisca Synergy Test — Player',
	mosjes: ['mosje_alyssa_bulldozer', 'mosje_jisca'],
	piecies: ['piecie_katjegang', 'piecie_katjegang'],
	snellePiecies: [],
	places: [],
	quests: [],
};

const BOT_DECK_HARMLESS = {
	id: 'custom_alyssa_jisca_synergy_bot',
	name: 'Alyssa/Jisca Synergy Test — Harmless Bot',
	mosjes: ['mosje_michelle'], // self-only ability (Tough Gamble) — no opponent-targeting card
	piecies: [],
	snellePiecies: [],
	places: [],
	quests: [],
};

async function seedDuoScenario(page, playerDeck, botDeck) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	await page.addInitScript((opts) => {
		sessionStorage.setItem('mosjes:offline', JSON.stringify({
			name: 'TestPlayer',
			deckId: opts.playerDeck.id,
			botDeckId: opts.botDeck.id,
		}));
		sessionStorage.setItem(`mosjes:customDeck:${opts.playerDeck.id}`, JSON.stringify(opts.playerDeck));
		sessionStorage.setItem(`mosjes:customDeck:${opts.botDeck.id}`, JSON.stringify(opts.botDeck));
	}, { playerDeck, botDeck });
}
```

**`mockDiceRoll` helper** (`tests/ui/helpers.js` lines 286-299) — forces `Math.random` to a fixed value, NOT the die roll directly:
```javascript
// value = 0 → die rolls 1 (always fail most quests)
// value = 1 → die rolls 6 (always success most quests) — note: Math.floor(1*6)+1 = 7, so use 0.9999
export async function mockDiceRoll(page, value) {
	await page.addInitScript((v) => {
		const original = Math.random;
		Math.random = () => v;
		setTimeout(() => { Math.random = original; }, 30000);
	}, value);
}
```
Since `rollDie(6) = Math.floor(Math.random() * 6) + 1`, use these `value` args to hit each CONTEXT.md-required roll:
- roll = 6: `value` in `[5/6, 1)` e.g. `0.99`
- roll = 5: `value` in `[4/6, 5/6)` e.g. `0.7`
- roll = 4: `value` in `[3/6, 4/6)` e.g. `0.55`
- roll ≤ 3: `value = 0` (existing analog constant, rolls 1)

CAUTION: because this scenario needs a QUEST to succeed first (Michelle's Tough Gamble only fires after a quest resolves, per `applyMosjeFieldEffectsOnQuest`'s call site in `resolveQuestOutcome`), and quest success/failure ALSO uses `rollDie`/`Math.random` upstream, a single fixed `mockDiceRoll` value drives BOTH the quest roll and the Tough Gamble roll — verify in the live quest-resolution code (`canAttemptPersonalQuest`/`resolveQuestOutcome`, same file) whether quest success is roll-based or requirement-based, and pick a `value` that satisfies both the quest's own success condition AND lands the die in the target 5-6/4/≤3 band for Tough Gamble. If the two rolls can't share one fixed `Math.random` value cleanly, consider a test hook that stubs `rollDie` directly instead (check `window.__testHooks` in `src/main.js` for an existing dice-related hook before adding a new one).

**Assertion shape** (lines 83-114, 116-150 of analog) — `getGameState` before/after, compute MP delta, `expect(delta).toBe(N)`:
```javascript
const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;
await ss(page, 'scenario-before');
// ...trigger the quest attempt...
const after = (await getGameState(page)).players.player_1.activeSlots[0].mp;
const delta = after - before;
await ss(page, 'scenario-after');
expect(delta).toBe(EXPECTED);
```

**`setMosjeOnField` + `clearEntryProtection` pattern** (lines 93-96 of analog):
```javascript
await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_destroyer', { mp: 20, level: 1 });
await setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 20, level: 1 });
await clearEntryProtection(page); // U8 — model an established board, not fresh-entry-protection
```

---

## Shared Patterns

### Cross-slot MP grant (`allowLevelUp: false`)
**Source:** `src/engine/turnManager.js` lines 53-69 (`applyAlyssaJiscaPiecieBonus`, Phase 38 precedent)
**Apply to:** the Michelle→Gandoe D-04 grant in `applyMosjeFieldEffectsOnQuest` (`src/abilities/questLogic.js`)
```javascript
state = gainMP(state, playerId, targetSlotIndex, 10, 'GAIN', { allowLevelUp: false });
```

### `_autoAbilityLog` multi-ability append
**Source:** `src/abilities/questLogic.js` lines 541-561 (Jeffrey Brute Force block, appends onto Michelle's log if both fire same call)
**Apply to:** the Gandoe kicker sub-branch inside the SAME Michelle Tough Gamble block — Michelle's own block already creates `state._autoAbilityLog` unconditionally, so the kicker only ever needs the append arm:
```javascript
state._autoAbilityLog.label += ` · [Gandoe] Destroyer Kicker: +10 MP (roll ${roll})`;
```

### Data-driven quest-category synergy table
**Source:** `src/abilities/questLogic.js` lines 51-69 (`PARTNER_QUEST_SYNERGIES` + `getPartnerSynergyQuestBonus`)
**Apply to:** D-05 Gandoe→Michelle — one new array entry, zero new logic, already wired into `resolveQuestOutcome` line 399.

### Repro-first Playwright spec (duo-deck + testHooks)
**Source:** `tests/ui/cards/alyssa-jisca-synergy.spec.js` (full file)
**Apply to:** the new `gandoe-michelle-synergy.spec.js` — same `seedDuoScenario`, `setMosjeOnField`, `clearEntryProtection`, `mockDiceRoll`, `getGameState` delta-assertion shape.

## No Analog Found

None — all 3 files have strong same-file or same-phase-precedent analogs; no gaps requiring fallback to first-principles design.

## Metadata

**Analog search scope:** `src/abilities/questLogic.js`, `src/engine/mpManager.js`, `src/engine/turnManager.js`, `src/engine/deckEngine.js`, `src/data/mosjes.js`, `tests/ui/cards/alyssa-jisca-synergy.spec.js`, `tests/ui/helpers.js`
**Files scanned:** 7
**Pattern extraction date:** 2026-07-18
