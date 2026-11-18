// DJ 80/20, The Lucky Mixer — Lucky Beats: at the after-roll pause of his owner's own Quest or Personal Quest roll,
// reroll one die of that roll (once per turn, twice from Level 2); the band is re-checked with the new die. Works on
// state.pendingQuestRoll (mutates the given, already cloned, state). Returns false when it cannot be used (nothing changes).
import { rollDie } from '../../engine/deckEngine.js';
import { isPendingRollWin } from '../../engine/quests/isPendingRollWin.js';
import { canDjReroll, djTurnKey, djRerollsUsed } from './canDjReroll.js';

export function djLuckyBeats(state, ownerId, dieIndex) {
	const pending = state.pendingQuestRoll;
	if (!pending || !Number.isInteger(dieIndex) || dieIndex < 0 || dieIndex >= pending.dice.length) return false;
	const slotIndex = canDjReroll(state, ownerId);
	if (slotIndex < 0) return false;
	pending.dice[dieIndex] = rollDie(6);
	pending.win = isPendingRollWin(pending, pending.dice);
	const slot = state.players[ownerId].activeSlots[slotIndex];
	slot.djRerollCount = djRerollsUsed(state, slot) + 1;
	slot.djRerollTurn = djTurnKey(state);
	return true;
}
