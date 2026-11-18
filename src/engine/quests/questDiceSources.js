// QUEST_DICE_SOURCES — each (ctx) => extra dice; ctx = { state, playerId, slot, quest }. Pure.
import { isFresh } from '../fresh/isFresh.js';
import { ATTACHMENT_RULES } from '../../rules/attachmentRules.js';
import { questDiceGrantTotal } from './questDiceGrantTotal.js';

const hasWord = (slot, word) => String(slot?.name || '').split(/[^A-Za-z]+/).includes(word);

function placeDice({ state, slot, quest }) {
	if (isFresh(slot)) return 0;
	const trait = quest?.rollTrait;
	switch (state?.activePlace) {
		case 'place_the_gym': return trait === 'strength' ? 1 : 0;
		case 'place_arcade': return trait === 'technical' ? 1 : 0;
		case 'place_de_box':
			return trait === 'strength' && ['Gandoe', 'Michelle', 'Tuk'].some(n => hasWord(slot, n)) ? 1 : 0;
		case 'place_tesla': return hasWord(slot, 'Coert') || hasWord(slot, 'Binti') ? 1 : 0;
		default: return 0;
	}
}

function playerExtraDice({ state, playerId }) {
	return state?.players?.[playerId]?.questExtraDice || 0;
}

function cardGrantDice({ state, playerId, slot }) {
	return questDiceGrantTotal(state, playerId, slot);
}

// an attached card with a questDie rule for the Quest's rolled trait (Dumbbells); a fresh Mosje still gets it
function attachmentDice({ slot, quest }) {
	let sum = 0;
	for (const a of slot?.attachments || []) {
		const rule = ATTACHMENT_RULES[a.cardId]?.questDie;
		if (rule && rule.trait === quest?.rollTrait) sum += rule.amount;
	}
	return sum;
}

export const QUEST_DICE_SOURCES = [placeDice, playerExtraDice, cardGrantDice, attachmentDice];
