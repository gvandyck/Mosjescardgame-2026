// continueDubbeleDing - runs the queued hand activations of Dubbele Ding (state._dubbeleQueue = { playerId, cards })
// one by one: each card needs a free Piecie slot and its Energy cost (otherwise it is skipped), goes into the slot
// and resolves as a normal paid activation (chain rolls may follow). When an activation pauses on a choice the
// loop stops; resumePiecieChoice calls this again once that answer is in. Returns the state.
import { PIECIES } from '../../data/piecies.js';
import { resolvePiecieActivation } from '../turnManager.js';
import { piecieActivationGate } from '../table/piecieActivationGate.js';
import { findPlayableHandIndex } from '../hand/findPlayableHandIndex.js';
import { payEnergy } from '../energy/payEnergy.js';
import { getEffectiveCost } from '../energy/getEffectiveCost.js';

const DEFS = Object.fromEntries(PIECIES.map(p => [p.id, p]));

export function continueDubbeleDing(state) {
	while (state._dubbeleQueue && !state.pendingChoice) {
		const q = state._dubbeleQueue;
		if (!q.cards.length) { delete state._dubbeleQueue; break; }
		const cardId = q.cards.shift();
		const me = state.players[q.playerId];
		const def = DEFS[cardId];
		const slotIndex = (me.piecieSlots || []).findIndex(s => s === null || s === undefined);
		const found = findPlayableHandIndex(state, me.hand, c => c.cardId === cardId);
		if (!def || slotIndex < 0 || found.index < 0 || piecieActivationGate(state, q.playerId, def)) continue;
		if (!payEnergy(state, q.playerId, getEffectiveCost(state, q.playerId, def.id, 'piecie')).success) continue;
		me.hand.splice(found.index, 1);
		me.piecieSlots[slotIndex] = { cardId, type: 'PIECIE', faceDown: false, activated: true, playedOnTurn: state.turnNumber };
		const res = resolvePiecieActivation(state, q.playerId, slotIndex, def, { free: false });
		state = res.state;
		if (res.paused) break;
	}
	return state;
}
