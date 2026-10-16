// petPiecies - Card List 2.0 Pet line (Bowie & Stormey, ViannaPoes, Tony, Gekke Vogels, KatjeGang). Stays until the end of the
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

const KASTELUCK = ['mosje_coert_kasteluck'];
const JISCA = ['mosje_jisca'];
const isAlyssa = (cardId) => String(cardId).startsWith('mosje_alyssa');

// Tony: named Coert, KasteLuck (20 less). While Coert, KasteLuck is on your field, his Morning Luck works on a 3-6
// (coertKasteLuckMorningLuck reads the staying Tony).
export function effect_tony(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_tony');
	return si < 0 ? state : cover(state, playerId, ctx, si, KASTELUCK);
}

// Gekke Vogels: named Jisca. While Jisca and an Alyssa are both on your field and KatjeGang is also in play (staying),
// each of them gains 15 MP at the start of your next turn (entry.startGain, paid by sweepStaysSlots).
export function effect_gekke_vogels(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_gekke_vogels');
	if (si < 0) return state;
	cover(state, playerId, ctx, si, JISCA);
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	const slots = state.players[playerId].activeSlots;
	const jisca = liveIndexes(state, playerId, JISCA);
	const alyssa = slots.findIndex(s => s && !s.isDefeated && isAlyssa(s.cardId));
	const katje = (state.players[playerId].piecieSlots || []).some(e => e?.stays === true && e.cardId === 'piecie_katjegang');
	if (entry && jisca.length && alyssa >= 0 && katje) {
		entry.startGain = [jisca[0], alyssa].map(i => ({ slotIndex: i, cardId: slots[i].cardId, amount: 15 }));
	}
	return state;
}

// KatjeGang: named an Alyssa (20 less). Its synergy with Gekke Vogels is on that card.
export function effect_katjegang(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_katjegang');
	if (si < 0) return state;
	const alyssas = state.players[playerId].activeSlots.map((s, i) => (s && !s.isDefeated && isAlyssa(s.cardId) ? s.cardId : null)).filter(Boolean);
	return cover(state, playerId, ctx, si, alyssas);
}
