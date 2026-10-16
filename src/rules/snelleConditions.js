// snelleConditions - "Needs / Only if" per Snelle id (Card List 2.0). Each entry: (state, playerId, reaction) => true | error text.
// snelleConditionMet runs BEFORE Energy is paid, both when offering a Snelle in a reaction window and when playing it.
// reaction = { moments, preview, action, actorId } of the open window, or null when played freely.
import { heldPiecieDef } from './heldPiecieDef.js';

const alive = (s) => s && !s.isDefeated;
const mosjes = (state, pid) => (state.players[pid]?.activeSlots || []).filter(alive);
const stars = (s, trait) => s.traits?.[trait] || 0;
const hasStars = (trait, n) => (state, pid) => mosjes(state, pid).some(s => stars(s, trait) >= n);

function perfectDodge(state, pid, reaction) {
	const a = reaction?.action;
	if (a?.type !== 'attack') return 'Needs: one of your Mosjes is attacked';
	const target = a.args?.[1] || {};
	const slot = state.players[pid]?.activeSlots?.[target.targetSlotIndex];
	if (target.targetPlayerId !== pid || !alive(slot)) return 'Needs: one of your Mosjes is attacked';
	return stars(slot, 'physical') >= 2 || 'Needs: the attacked Mosje has Physical ★★';
}

// Dubbele Temminks / Gevalletje Klakkeloos: a Piecie was just activated, and it is not a five-star card.
function copyablePiecie(state, _pid, reaction) {
	const def = heldPiecieDef(state, reaction?.action);
	if (!def) return 'Needs: a Piecie was just activated';
	return def.rarity === '★★★★★' ? 'Not on a ★★★★★ card' : true;
}

export const SNELLE_CONDITIONS = {
	snelle_dubbele_temminks: copyablePiecie,
	snelle_gevalletje_klakkeloos: copyablePiecie,
	snelle_perfect_dodge: perfectDodge,
	snelle_lucky_coin: (s, p) => hasStars('creative', 1)(s, p) || 'Needs: one of your Mosjes has Creative ★',
	snelle_counter_strikka: (s, p) => hasStars('mental', 2)(s, p) || 'Needs: one of your Mosjes has Mental ★★',
	snelle_jammertje_gepakt: (s, p) => hasStars('mental', 2)(s, p) || 'Needs: one of your Mosjes has Mental ★★',
	snelle_bijna_welloe: (s, p) => mosjes(s, p).some(m => m.mp <= 10) || 'Only if one of your Mosjes has 10 MP or less',
	snelle_jantje_jantje_jantje: (s) => (s.activePlace?.id || s.activePlace) === 'place_bank_chilling' || 'Only while the Place is Bank Chilling',
	snelle_chillingsvoorbij: (s, p) => (s.players[p]?.graveyard || []).some(c => c?.type === 'PLACE') || 'No Place in your discard pile',
};

// true when the Snelle may be played now; otherwise the error text (nothing is paid, the card stays in hand).
export function snelleConditionMet(state, playerId, def, reaction = null) {
	const rule = SNELLE_CONDITIONS[def?.id];
	return rule ? rule(state, playerId, reaction) : true;
}
