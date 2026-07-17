// boosterEngine.js — Weighted random card draw for the booster pack store.
//
// Pool: all Mosjes, Piecies, Snelle Piecies, Places, and Personal Quests.
// General Quests are excluded — they belong to the shared game deck, not player collections.
//
// Rarity → drop weight mapping (4-tier star system):
//   ★=60  ★★=30  ★★★=10  ★★★★=4

import { MOSJES }        from './mosjes.js';
import { PIECIES }       from './piecies.js';
import { SNELLE_PIECIES } from './snellePiecies.js';
import { getPlayerFacingPlaces } from './playerFacingPlaces.js';
import { QUESTS }        from './quests.js';

function rarityToWeight(rarity) {
	if (!rarity) return 30;
	const stars = (rarity.match(/★/g) || []).length;
	return { 1: 60, 2: 30, 3: 10, 4: 4 }[stars] ?? 30;
}

// Full weighted pool — built once at module load.
const POOL = [
	...MOSJES.map(c => ({ ...c, cardType: 'MOSJE' })),
	...PIECIES.map(c => ({ ...c, cardType: 'PIECIE' })),
	...SNELLE_PIECIES.map(c => ({ ...c, cardType: 'SNELLE_PIECIE' })),
	...getPlayerFacingPlaces().map(c => ({ ...c, cardType: 'PLACE' })),
	...QUESTS.filter(c => c.questType === 'PERSONAL').map(c => ({ ...c, cardType: 'QUEST' })),
]
	.filter(c => !c.disabled) // hidden cards (e.g. Coert Kastelein, Drainer) never drop
	.map(c => ({ card: c, weight: rarityToWeight(c.rarity) }));

const TOTAL_WEIGHT = POOL.reduce((s, e) => s + e.weight, 0);

function pickOne() {
	let roll = Math.random() * TOTAL_WEIGHT;
	for (const entry of POOL) {
		roll -= entry.weight;
		if (roll <= 0) return entry.card;
	}
	return POOL[POOL.length - 1].card;
}

/**
 * Draw `count` cards from the weighted pool.
 * Returns an array of card objects (duplicates possible).
 */
export function drawPack(count = 5) {
	const drawn = [];
	for (let i = 0; i < count; i++) drawn.push(pickOne());
	return drawn;
}

export const PACK = {
	name: 'Boosteros',
	cost: 150,
	cardCount: 5,
	description: '5 random cards from the full card pool.',
};
