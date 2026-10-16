// useRerollGrant - reroll one die of the held Quest roll (state.pendingQuestRoll) with a Piecie grant; the band is
// re-checked. Mutates the given, already cloned, state. Returns false (nothing changes) when it cannot be used.
import { rollDie } from '../deckEngine.js';
import { getQuestDef } from './getQuestDef.js';
import { isBandWin } from './isBandWin.js';
import { findRerollGrant } from './findRerollGrant.js';

export function useRerollGrant(state, ownerId, dieIndex) {
	const pending = state.pendingQuestRoll;
	if (!pending || !Number.isInteger(dieIndex) || dieIndex < 0 || dieIndex >= pending.dice.length) return false;
	const at = findRerollGrant(state, ownerId, pending.playerId === ownerId);
	if (at < 0) return false;
	const grants = state.players[ownerId].rerollGrants;
	grants[at].uses -= 1; // consumed before the reroll (T-59-06)
	if (grants[at].uses <= 0) grants.splice(at, 1);
	pending.dice[dieIndex] = rollDie(6);
	pending.win = isBandWin(getQuestDef(pending.questId).band, pending.dice);
	return true;
}
