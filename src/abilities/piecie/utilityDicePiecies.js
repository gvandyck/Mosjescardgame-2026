// utilityDicePiecies - Card List 2.0 Utility dice Piecies (Example-Deck cards).
import { addRerollGrant } from '../../engine/quests/piecieRerollGrant.js';
import { djTurnKey } from '../mosje/canDjReroll.js';
import { cloneState } from './cloneState.js';

// Dubbele Dosis: +1 die on one Quest this turn (getQuestDiceCount clamps at 4) and one reroll of a die of that
// Quest at its after-roll pause (the grant is tied to the next own Quest roll).
export function effect_quest_prep(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.questExtraDice = (player.questExtraDice || 0) + 1;
	addRerollGrant(player, { scope: 'ownQuest', uses: 1, turnKey: djTurnKey(state) });
	return state;
}
