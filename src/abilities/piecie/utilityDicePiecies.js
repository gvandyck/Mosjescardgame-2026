// utilityDicePiecies - Card List 2.0 Utility dice Piecies. Dubbele Dosis / Loaded Dice / Dikke Plaat: +1 die on one
// Quest this turn (getQuestDiceCount clamps at 4) and, with the named Mosje on the field, one reroll of a die of that
// Quest at its after-roll pause (a grant tied to the next own Quest). TweedeKANs: one reroll of any Quest roll this turn.
import { rollDie } from '../../engine/deckEngine.js';
import { loseMP } from '../../engine/mpManager.js';
import { addRerollGrant } from '../../engine/quests/piecieRerollGrant.js';
import { djTurnKey } from '../mosje/canDjReroll.js';
import { cloneState } from './cloneState.js';
import { pieceDef } from './pieceDef.js';
import { gainFromPiecie } from './gainFromPiecie.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

// rerollMosjes: card id prefixes that unlock the reroll, null = always (Dubbele Dosis).
function extraDie(gameState, playerId, rerollMosjes) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.questExtraDice = (player.questExtraDice || 0) + 1;
	const named = rerollMosjes === null || player.activeSlots.some(s => s && !s.isDefeated && rerollMosjes.some(id => s.cardId.startsWith(id)));
	if (named) addRerollGrant(player, { scope: 'ownQuest', uses: 1, turnKey: djTurnKey(state) });
	return state;
}

export const effect_quest_prep = (gameState, playerId) => extraDie(gameState, playerId, null);
export const effect_loaded_dice = (gameState, playerId) => extraDie(gameState, playerId, ['mosje_jeffrey']);
export const effect_dikke_plaat = (gameState, playerId) => extraDie(gameState, playerId, ['mosje_dj_8020', 'mosje_alyssa_fissa']);

export function effect_tweede_kans(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (player) addRerollGrant(player, { scope: 'anyQuest', uses: 1, turnKey: djTurnKey(state) });
	return state;
}

// Kan het?!: roll a die for one of your Mosjes: 5-6 it gains 40 MP, 1-4 it loses 10 MP.
export function effect_kan_het(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_kan_het');
	if (si < 0) return state;
	const roll = ctx.roll ?? rollDie(6);
	return roll >= 5 ? gainFromPiecie(state, playerId, si, 40, pieceDef('piecie_kan_het')) : loseMP(state, playerId, si, 10, 'DRAIN', false, playerId);
}
