// QUEST_COSTS — "First you must" costs. canPay(ctx, choice) -> bool; pay(ctx, choice) mutates ctx.player (a clone).
// choice = { zone: 'ready' | 'hand', index }. Discards land in the owner's graveyard (discard pile rule).
import { PIECIES } from '../../data/piecies.js';
import { toGraveyardEntry } from '../graveyardUtils.js';
import { isReadyPiecieSlot } from './isReadyPiecieSlot.js';

const pieceTag = (cardId) => PIECIES.find(p => p.id === cardId)?.tag ?? null;

function pick({ player, state }, choice) {
	if (!choice || !Number.isInteger(choice.index)) return null;
	if (choice.zone === 'ready') {
		const e = player.piecieSlots?.[choice.index];
		return isReadyPiecieSlot(e, state.turnNumber) ? { zone: 'ready', index: choice.index, cardId: e.cardId } : null;
	}
	if (choice.zone === 'hand') {
		const c = player.hand?.[choice.index];
		return c ? { zone: 'hand', index: choice.index, cardId: c.cardId, type: c.type } : null;
	}
	return null;
}

function discarding(accepts, zones = ['ready', 'hand']) {
	return {
		canPay(ctx, choice) {
			const p = pick(ctx, choice);
			return !!p && zones.includes(p.zone) && accepts(p);
		},
		pay(ctx, choice) {
			const p = pick(ctx, choice);
			if (p.zone === 'ready') ctx.player.piecieSlots[p.index] = null;
			else ctx.player.hand.splice(p.index, 1);
			ctx.player.graveyard.push(toGraveyardEntry(p.cardId, 'discarded'));
			ctx.discarded = [...(ctx.discarded || []), p.cardId];
		},
	};
}

const isPiecie = (p) => p.zone === 'ready' || p.type === 'PIECIE';

export const QUEST_COSTS = {
	discard_ready_piecie: discarding(() => true, ['ready']),
	discard_food_piecie: discarding(p => isPiecie(p) && pieceTag(p.cardId) === 'food'),
	discard_substance_piecie: discarding(p => isPiecie(p) && pieceTag(p.cardId) === 'substance'),
	discard_hand_piecie: discarding(p => p.type === 'PIECIE', ['hand']),
	discard_snelle: discarding(p => p.type === 'SNELLE_PIECIE', ['hand']),
	reveal_top_3: {
		canPay: () => true,
		pay(ctx) { ctx.revealed = (ctx.player.deck || []).slice(0, 3).map(c => c?.cardId ?? c); },
	},
};
