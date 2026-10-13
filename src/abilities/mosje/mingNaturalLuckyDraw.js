// Ming, The Natural — Lucky Draw: once per turn, reveal the top card of your deck. A Piecie: activate it for free
// (no Energy, no face-down wait, no chain roll - the chain rule) or add it to your hand. Anything else: draw it and
// gain 15 MP. Input: state._pendingTargets.choice = 'activate' | 'hand' (only read when the top card is a Piecie).
// A free activation that is refused (Jeffrey's gate, no free slot for a Stays Piecie) throws: nothing happens.
import { gainMP } from '../../engine/mpManager.js';
import { activatePiecieFree } from '../../engine/table/activatePiecieFree.js';
import { PIECIES } from '../../data/piecies.js';

const PIECIE_IDS = new Set(PIECIES.map(p => p.id));

export function mingNaturalLuckyDraw(gameState, playerId, mosjeId = 'mosje_ming_natural') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const slotIndex = player?.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId) ?? -1;
	if (slotIndex < 0) throw new Error('Ming, The Natural is not on the field');
	if (!player.deck.length) return { state, success: true }; // empty deck: nothing to reveal
	const top = player.deck[0];
	if (!PIECIE_IDS.has(top.cardId)) {
		player.hand.push(player.deck.shift());
		return gainMP(state, playerId, slotIndex, 15, 'ABILITY');
	}
	const choice = state._pendingTargets?.choice;
	if (choice === 'hand') {
		player.hand.push(player.deck.shift());
		return { state, success: true };
	}
	if (choice !== 'activate') throw new Error('Lucky Draw: choose to activate the Piecie or add it to your hand');
	const res = activatePiecieFree(state, playerId, { card: top.cardId, from: 'deck' }, { source: 'ming_natural' });
	if (!res.success) throw new Error(res.error || 'Lucky Draw: the Piecie cannot be activated');
	return { state: res.state, success: true, reactionPending: res.reactionPending === true };
}
