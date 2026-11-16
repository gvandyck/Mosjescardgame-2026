// DJ 80/20, The Lucky Mixer — Lucky Beats: once per turn, at the after-roll pause of any Quest (either player's),
// reroll one die of that roll; the band is re-checked with the new die. Works on state.pendingQuestRoll (mutates the
// given, already cloned, state). Returns false when it cannot be used (nothing changes).
import { rollDie } from '../../engine/deckEngine.js';
import { isPendingRollWin } from '../../engine/quests/isPendingRollWin.js';
import { canDjReroll, djTurnKey } from './canDjReroll.js';

export function djLuckyBeats(state, ownerId, dieIndex) {
	const pending = state.pendingQuestRoll;
	if (!pending || !Number.isInteger(dieIndex) || dieIndex < 0 || dieIndex >= pending.dice.length) return false;
	const slotIndex = canDjReroll(state, ownerId);
	if (slotIndex < 0) return false;
	pending.dice[dieIndex] = rollDie(6);
	pending.win = isPendingRollWin(pending, pending.dice);
	state.players[ownerId].activeSlots[slotIndex].djRerollTurn = djTurnKey(state);
	return true;
}
