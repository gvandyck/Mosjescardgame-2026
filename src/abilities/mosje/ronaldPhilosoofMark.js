// Ronald, Dr. Phill-osoof - Master Plan: once per turn, pay 1 Energy (useMosjeAbility); target 1 opponent Mosje (not
// fresh, not shielded): it rolls 1 die less on its next Quest. The mark is a -1 die grant bound to that Mosje that lasts
// until it rolls (a Personal Quest roll counts too; the dice count never goes under 1). Input: _pendingTargets.opp_slot_index
// (default: the first legal Mosje). Refused (throws, nothing spent) with no legal target. Works on a clone.
import { markTargeted } from '../../engine/targets/markTargeted.js';
import { addQuestDiceGrant } from '../../engine/quests/addQuestDiceGrant.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { isShielded } from '../../engine/targets/isShielded.js';

export function ronaldPhilosoofMark(gameState, playerId, mosjeId = 'mosje_ronald_mastermind') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player?.activeSlots.some(s => s && !s.isDefeated && s.cardId === mosjeId)) throw new Error('Ronald, Dr. Phill-osoof is not on the field');
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const open = isShielded(state, oppId, playerId) ? [] : (state.players[oppId]?.activeSlots || [])
		.map((s, i) => ({ s, i })).filter(({ s }) => s && !s.isDefeated && !isFresh(s));
	const chosen = state._pendingTargets?.opp_slot_index;
	if (state._pendingTargets) delete state._pendingTargets.opp_slot_index;
	const target = Number.isInteger(chosen) ? open.find(({ i }) => i === chosen) : open[0];
	if (!target) throw new Error('Master Plan: no opponent Mosje to target (fresh and shielded Mosjes are protected)');
	markTargeted(state, oppId, target.i);
	addQuestDiceGrant(state, oppId, { amount: -1, lasts: 'untilUsed', slotIndex: target.i, cardId: target.s.cardId, sourceCardId: mosjeId });
	return state;
}
