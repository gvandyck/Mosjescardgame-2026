// getNextFreeSlot.js — the slot index a card from the hand will really go into (64.1 D-06). Pure, no DOM.
// It mirrors the engine so the board marks where the card lands: playMosje and playPiecie in turnManager.js always fill
// the FIRST free slot and take no slot index, so exactly one slot per kind can ever be "the" slot. Returns -1 when the
// kind has no free slot (or the kind is unknown). The unit test cross-checks this against the real playMosje / playPiecie.
import { MAX_FIELD_MOSJES, PIECIE_SLOT_COUNT } from '../../engine/table/tableRules.js';

function padded(source, count) {
	const slots = source.slice(0, count).map((slot) => (slot === undefined ? null : slot));
	while (slots.length < count) slots.push(null);
	return slots;
}

function mosjeSlots(player) {
	// playMosje pads activeSlots up to 2 and never trims, so a longer array keeps all its entries.
	const slots = Array.isArray(player?.activeSlots) ? [...player.activeSlots] : [null, null];
	while (slots.length < MAX_FIELD_MOSJES) slots.push(null);
	return slots;
}

function piecieSlots(player) {
	const raw = player?.piecieSlots;
	let source = [];
	if (Array.isArray(raw)) source = raw;
	else if (raw && typeof raw === 'object') source = Array.from({ length: PIECIE_SLOT_COUNT }, (_, i) => raw[i] ?? null);
	return padded(source.map((slot) => (slot == null ? null : slot)), PIECIE_SLOT_COUNT);
}

export function getNextFreeSlot(player, kind) {
	if (kind === 'mosje') return mosjeSlots(player).findIndex((slot) => slot === null);
	if (kind === 'piecie') return piecieSlots(player).findIndex((slot) => slot === null);
	return -1;
}
