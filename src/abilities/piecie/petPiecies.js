// petPiecies - the booster Pet line (ViannaPoes, Tony, Gekke Vogels, KatjeGang). Stays until the end of the owner's next
// turn: the chosen Mosje loses 10 less per loss, a named Mosje 20 less. (Bowie & Stormey is a step card: stepPiecies.js.)
import { cloneState } from './cloneState.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { coverMosje } from './coverMosje.js';
import { dingetjeAsKatje } from './dingetjeAsKatje.js';

const VIANNA_NAMED = ['mosje_azn_cless', 'mosje_cless_teacher'];

function liveIndexes(state, playerId, ids) {
	const out = [];
	state.players[playerId].activeSlots.forEach((s, i) => { if (s && !s.isDefeated && ids.includes(s.cardId)) out.push(i); });
	return out;
}

// Writes the cover onto the Stays entry: 20 less for a named Mosje, else 10 less.
function cover(state, playerId, ctx, chosen, named) {
	const slot = state.players[playerId].activeSlots[chosen];
	return coverMosje(state, playerId, ctx, chosen, named.includes(slot?.cardId) ? 20 : 10);
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
	const si = ctx.gekkeSlot ?? resolvePiecieOwnSlot(state, playerId, 'piecie_gekke_vogels');
	if (si < 0) return state;
	const slotsNow = state.players[playerId].activeSlots;
	const pairHere = liveIndexes(state, playerId, JISCA).length > 0 && slotsNow.some(x => x && !x.isDefeated && isAlyssa(x.cardId));
	const katjeIn = (state.players[playerId].piecieSlots || []).some(e => e?.stays === true && e.cardId === 'piecie_katjegang');
	const wild = dingetjeAsKatje(state, playerId, pairHere && !katjeIn);
	if (wild.ask) return { state, needChoice: { playerId, choiceKind: 'dingetje', key: wild.key, options: wild.options, prompt: 'Discard Dingetje toch?! to count as KatjeGang?', ctx: { gekkeSlot: si } } };
	cover(state, playerId, ctx, si, JISCA);
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	const slots = state.players[playerId].activeSlots;
	const jisca = liveIndexes(state, playerId, JISCA);
	const alyssa = slots.findIndex(s => s && !s.isDefeated && isAlyssa(s.cardId));
	const katje = wild.counts || (state.players[playerId].piecieSlots || []).some(e => e?.stays === true && e.cardId === 'piecie_katjegang');
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
