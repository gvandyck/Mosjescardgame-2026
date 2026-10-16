// petPiecies - Card List 2.0 Pet line (Bowie & Stormey, ViannaPoes; Example-Deck cards). Stays until the end of the
// owner's next turn: the chosen Mosje loses 10 less per loss, a named Mosje 20 less. Bowie's pair bonus: Gandoe with
// Michelle (or a Tuk) are both covered (20 less) and each gains 10 MP at the start of the owner's next turn.
import { cloneState } from './cloneState.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

const GANDOES = ['mosje_gandoe_wizard', 'mosje_gandoe_destroyer'];
const PARTNERS = ['mosje_michelle', 'mosje_tuk_healer', 'mosje_tuk_architect'];
const BOWIE_NAMED = [...GANDOES, ...PARTNERS, 'mosje_dj_8020'];
const VIANNA_NAMED = ['mosje_azn_cless', 'mosje_cless_teacher'];

function liveIndexes(state, playerId, ids) {
	const out = [];
	state.players[playerId].activeSlots.forEach((s, i) => { if (s && !s.isDefeated && ids.includes(s.cardId)) out.push(i); });
	return out;
}

// Writes the cover onto the Stays entry. pair: slot indexes covered at 20 less that also gain 10 at the next turn start.
function cover(state, playerId, ctx, chosen, named, pair = []) {
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	if (!entry) return state;
	const slots = state.players[playerId].activeSlots;
	const item = (slotIndex, reduce) => ({ playerId, slotIndex, cardId: slots[slotIndex].cardId, reduce });
	const boundTo = pair.map(i => item(i, 20));
	if (!pair.includes(chosen)) boundTo.push(item(chosen, named.includes(slots[chosen].cardId) ? 20 : 10));
	entry.boundTo = boundTo;
	if (pair.length) entry.startGain = pair.map(i => ({ slotIndex: i, cardId: slots[i].cardId, amount: 10 }));
	return state;
}

export function effect_bowie_stormey(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_bowie_stormey');
	if (si < 0) return state;
	const gandoe = liveIndexes(state, playerId, GANDOES);
	const partner = liveIndexes(state, playerId, PARTNERS);
	const pair = gandoe.length && partner.length ? [gandoe[0], partner[0]] : [];
	return cover(state, playerId, ctx, si, BOWIE_NAMED, pair);
}

export function effect_vianna_poes(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_vianna_poes');
	return si < 0 ? state : cover(state, playerId, ctx, si, VIANNA_NAMED);
}
