// placeEmptyFieldMosje — Obby 2.0 R1: a player with no Mosje on the field gets the
// cheapest Mosje from hand (else deck, then the deck is shuffled) placed free and fresh.
import { MOSJES } from '../../data/mosjes.js';
import { shuffleDeck } from '../deckEngine.js';
import { createMosjeSlot } from '../mp/createMosjeSlot.js';

function cheapestMosjeIndex(cards) {
	let best = -1;
	let bestCost = Infinity;
	(cards || []).forEach((c, i) => {
		const def = c && c.type === 'MOSJE' ? MOSJES.find(m => m.id === c.cardId) : null;
		if (!def) return;
		const cost = Number.isFinite(Number(def.cost)) ? Number(def.cost) : 99; // costless defs sort last
		if (cost < bestCost) { best = i; bestCost = cost; }
	});
	return best;
}

export function placeEmptyFieldMosje(state, playerId, shuffle = shuffleDeck) {
	const player = state.players[playerId];
	if (!player) return { state, placedSlotIndex: -1 };
	if (!Array.isArray(player.activeSlots)) player.activeSlots = [null, null];
	if (player.activeSlots.some(s => s && !s.isDefeated)) return { state, placedSlotIndex: -1 };
	let source = 'hand';
	let idx = cheapestMosjeIndex(player.hand);
	if (idx < 0) {
		source = 'deck';
		idx = cheapestMosjeIndex(player.deck);
	}
	if (idx < 0) return { state, placedSlotIndex: -1 };
	let slotIndex = player.activeSlots.findIndex(s => s === null);
	if (slotIndex < 0) slotIndex = player.activeSlots.findIndex(s => s && s.isDefeated);
	if (slotIndex < 0) return { state, placedSlotIndex: -1 };
	const [card] = (source === 'hand' ? player.hand : player.deck).splice(idx, 1);
	if (source === 'deck') player.deck = shuffle(player.deck);
	const def = MOSJES.find(m => m.id === card.cardId);
	player.activeSlots[slotIndex] = createMosjeSlot(def);
	console.log(`[ENGINE] R1: ${def.name} placed free and fresh`);
	return { state, placedSlotIndex: slotIndex, r1Event: { playerId, name: def.name, source } };
}
