// QUEST_DICE_SOURCES — each (ctx) => extra dice; ctx = { state, playerId, slot, quest }. Pure.
import { isFresh } from '../fresh/isFresh.js';

const hasWord = (slot, word) => String(slot?.name || '').split(/[^A-Za-z]+/).includes(word);

function placeDice({ state, slot, quest }) {
	if (isFresh(slot)) return 0;
	const trait = quest?.rollTrait;
	switch (state?.activePlace) {
		case 'place_the_gym': return trait === 'physical' ? 1 : 0;
		case 'place_arcade': return trait === 'technical' ? 1 : 0;
		case 'place_de_box':
			return trait === 'physical' && ['Gandoe', 'Michelle', 'Tuk'].some(n => hasWord(slot, n)) ? 1 : 0;
		case 'place_tesla': return hasWord(slot, 'Coert') || hasWord(slot, 'Binti') ? 1 : 0;
		default: return 0;
	}
}

function playerExtraDice({ state, playerId }) {
	return state?.players?.[playerId]?.questExtraDice || 0;
}

export const QUEST_DICE_SOURCES = [placeDice, playerExtraDice];
