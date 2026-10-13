// activatePiecieFree — activate a Piecie WITHOUT paying its Energy (Jisca, DDR Chris, Ming Natural,
// Chris The All-Rounder, Master Plan, Chain Reaction). It is still a real activation: same resolver as
// activatePiecie (counters, Dubbele Temminks, Places, after-activation reaction windows), but the
// piecieActivated triggers see ctx.free = true so it never starts a chain / Teaching Moment roll, and
// the Level / tag gates (piecieActivationGate) still apply.
// source: { slotIndex } (a placed Piecie) | { card, from: 'deck'|'discard'|'hand' } (a card outside a slot).
// opts: { ignoreReadiness, source (label), returnTo: 'discard'(default)|'deck'|'hand', skipReactions }.
// A card from outside a slot goes to `returnTo` afterwards; a Stays card takes a free slot (refused if none).
// NOTE (Phase 60): Coert's Caravan's 0-Energy activation is a NORMAL activation (activatePiecie), not this.
import { withReactionWindow } from '../reactions/withReactionWindow.js';
import { resolvePiecieActivation } from '../turnManager.js';
import { piecieActivationGate } from './piecieActivationGate.js';
import { isPiecieReady } from './isPiecieReady.js';
import { toGraveyardEntry } from '../graveyardUtils.js';
import { PIECIES } from '../../data/piecies.js';

const DEFS = Object.fromEntries(PIECIES.map(p => [p.id, p]));
const PILES = { deck: 'deck', discard: 'graveyard', hand: 'hand' };

function freeCore(gameState, playerId, source, opts) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const fail = (error) => ({ state: gameState, success: false, error });
	if (!player) return fail('Player not found');
	if (!Array.isArray(player.piecieSlots)) player.piecieSlots = [null, null, null];

	if (Number.isInteger(source?.slotIndex)) {
		const i = source.slotIndex;
		const slot = player.piecieSlots[i];
		if (!slot) return fail('No Piecie in that slot');
		if (slot.activated) return fail('Piecie already activated');
		if (!opts.ignoreReadiness && !isPiecieReady(slot, state.turnNumber)) return fail('This Piecie is not ready');
		const def = DEFS[slot.cardId];
		if (!def) return fail('Unknown Piecie definition');
		const gate = piecieActivationGate(state, playerId, def);
		if (gate) return fail(gate);
		return resolvePiecieActivation(state, playerId, i, def, { free: true });
	}

	const cardId = source?.card?.cardId ?? source?.card;
	const pileKey = PILES[source?.from];
	if (!cardId || !pileKey) return fail('Invalid free activation source');
	const pile = player[pileKey] || [];
	const at = pile.findIndex(c => c.cardId === cardId);
	if (at < 0) return fail('That card is not in the ' + source.from);
	const def = DEFS[cardId];
	if (!def) return fail('Unknown Piecie definition');
	const gate = piecieActivationGate(state, playerId, def);
	if (gate) return fail(gate);
	let slotIndex = -1;
	if (def.stays) {
		slotIndex = player.piecieSlots.findIndex(s => s === null);
		if (slotIndex < 0) return fail('No free Piecie slot for a Stays Piecie');
	}
	const [card] = pile.splice(at, 1);
	if (slotIndex >= 0) {
		player.piecieSlots[slotIndex] = { cardId, type: 'PIECIE', faceDown: false, activated: true, playedOnTurn: state.turnNumber };
	}
	const res = resolvePiecieActivation(state, playerId, slotIndex, def, { free: true });
	if (slotIndex < 0 && res.success && !res.negated) {
		const me = res.state.players[playerId];
		const back = opts.returnTo || 'discard';
		if (back === 'deck') me.deck.push({ ...card, faceDown: false });
		else if (back === 'hand') me.hand.push({ cardId, type: 'PIECIE' });
		else (me.graveyard ||= []).push(toGraveyardEntry(cardId, 'played'));
	}
	return res;
}

export function activatePiecieFree(gameState, playerId, source, opts = {}) {
	const { skipReactions, ...rest } = opts;
	return withReactionWindow(gameState, playerId, { type: 'activatePiecieFree', args: [playerId, source, rest], skipReactions },
		(st) => freeCore(st, playerId, source, rest));
}
