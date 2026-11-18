// QUEST_DICE_SOURCES — each (ctx) => extra dice; ctx = { state, playerId, slot, quest }. Pure.
import { isFresh } from '../fresh/isFresh.js';
import { ATTACHMENT_RULES } from '../../rules/attachmentRules.js';
import { questDiceGrantTotal } from './questDiceGrantTotal.js';
import { isFriend } from '../friends/isFriend.js';

const hasWord = (slot, word) => String(slot?.name || '').split(/[^A-Za-z]+/).includes(word);

// live Digital Mosjes on the player's field (Woonkamer (Discord))
const digitalCount = (state, playerId) => (state?.players?.[playerId]?.activeSlots || []).filter(s => s && !s.isDefeated && s.subtype === 'DIGITAL').length;

function placeDice({ state, playerId, slot, quest }) {
	if (isFresh(slot)) return 0;
	const trait = quest?.rollTrait;
	switch (state?.activePlace) {
		case 'place_the_gym': return trait === 'strength' ? 1 : 0;
		case 'place_arcade': return trait === 'technical' ? 1 : 0;
		case 'place_de_box':
			return trait === 'strength' && isFriend(slot, ['Gandoe', 'Michelle', 'Tuk']) ? 1 : 0;
			case 'place_woonkamer_discord': return trait === 'technical' && digitalCount(state, playerId) >= 2 ? 1 : 0;
			case 'place_nieuwe_gimma': return (state.questRollsThisTurn || 0) === 0 ? 1 : 0; // the first Quest roll of the turn
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
