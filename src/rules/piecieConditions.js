// piecieConditions - "Only if / Needs" conditions per Piecie id (data-like map; Card List 2.0 texts).
// Each entry: (state, playerId) => true | error text. The activation gate runs them before any Energy is paid,
// for normal and free activations. The Level 2+ gate is data too: cardDef.levelGate (see levelGateError).
import { PIECIES } from '../data/piecies.js';
import { canLeaveWelloePile } from '../engine/table/canLeaveWelloePile.js';

const alive = (s) => s && !s.isDefeated;
const mosjes = (state, pid) => (state.players[pid]?.activeSlots || []).filter(alive);
const hasName = (s, ...bits) => bits.some(b => String(s.cardId).includes(b));
const SUBSTANCE = new Set(PIECIES.filter(p => p.tag === 'substance').map(p => p.id));

const digital = (state, pid) => mosjes(state, pid).some(s => s.subtype === 'DIGITAL')
	|| 'Only if a Digital Mosje is on your field';
const welloeReturn = (state, pid) => {
	const p = state.players[pid];
	if (!canLeaveWelloePile(state)) return 'Welloe Graveyard keeps Mosjes in the Welloe pile';
	if (!(p?.welloePile || []).some(e => e.type === 'MOSJE')) return 'Needs a Mosje in your Welloe pile';
	if (!(p?.activeSlots || []).some(s => s === null)) return 'Needs a free Mosje spot';
	return true;
};

export const PIECIE_CONDITIONS = {
	piecie_keyboard: digital,
	piecie_mouse: digital,
	piecie_controller: digital,
	piecie_energy_surge: (state, pid) => mosjes(state, pid).some(s => s.mp <= 20)
		|| 'Only if one of your Mosjes has 20 MP or less',
	piecie_those_eyelashes: (state, pid) => mosjes(state, pid).some(s => hasName(s, 'martin', 'west'))
		|| 'Only if a Martin or a West is on your field',
	piecie_battle_concert: (state, pid) => mosjes(state, pid).some(s => hasName(s, 'alyssa'))
		|| 'Only if an Alyssa is on your field',
	piecie_popo_komt: (state) => Object.keys(state.players).reduce((n, id) => n + mosjes(state, id).length, 0) >= 3
		|| 'Only if there are 3 or more Mosjes on the field in total',
	piecie_huisbaas: (state) => Object.values(state.players).some((p) => {
		const top = (p.graveyard || [])[(p.graveyard || []).length - 1];
		return top && SUBSTANCE.has(top.cardId);
	}) || 'Only if the top card of any discard pile is a substance Piecie',
	piecie_mosje_reborn: welloeReturn,
	piecie_call_of_welloes: welloeReturn,
};
