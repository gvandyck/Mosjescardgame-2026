// placeTurnQuestEffects - Obby 2.0 Places that act at turn start, on Quest results, on Skiffa rolls, on gear
// activation and (Tesla) on the owner's field. Fresh Mosjes ignore Places. Power parts live in placePower.js.
import { gainMP, loseMP } from '../../engine/mpManager.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { destroyActivePlace } from '../../engine/gameState.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { djTurnKey } from '../mosje/canDjReroll.js';

const live = (slot) => slot && !slot.isDefeated && !isFresh(slot);
const isMichelle = (slot) => String(slot.cardId || '').toLowerCase().includes('michelle');

// Start of `playerId`'s turn: The Gym / Bank Chilling / Eendjes Voeren act on that player's Mosjes only.
export function placeTurnStart(state, playerId) {
	const place = state.activePlace;
	if (!['place_the_gym', 'place_bank_chilling', 'place_eendjes_voeren'].includes(place)) return state;
	const owner = state.activePlacePlayedBy || playerId;
	const count = state.players[playerId]?.activeSlots?.length || 0;
	for (let i = 0; i < count; i++) {
		const slot = state.players[playerId].activeSlots[i];
		if (!live(slot)) continue;
		if (place === 'place_the_gym' && slot.subtype !== 'FIGHTING') state = loseMP(state, playerId, i, 10, 'PLACE', false, owner);
		else if (place === 'place_bank_chilling' && (slot.traits?.social || 0) >= 2) state = gainMP(state, playerId, i, 10, 'PLACE');
		else if (place === 'place_eendjes_voeren' && isMichelle(slot)) state = gainMP(state, playerId, i, 10, 'PLACE');
	}
	return state;
}

// MP the Place adds to one Quest result (win: more gained, loss: more lost). 0 for a fresh slot.
export function placeQuestBonus(state, slot, questId, win) {
	if (!slot || isFresh(slot)) return 0;
	switch (state.activePlace) {
		case 'place_quest_haven': return win ? 10 : 0;
		case 'place_obby_1': return 10;
		case 'place_delluft': return win && questId === 'quest_parkeren_delft' ? 20 : 0;
		default: return 0;
	}
}

// Skiffa: an Artistic Mosje rolling for a Quest may reroll 1 die once (a grant for that Quest only).
export function placeSkiffaGrant(state, player, slot) {
	if (state.activePlace !== 'place_skiffa' || !live(slot) || slot.subtype !== 'ARTISTIC') return;
	player.rerollGrants = [...(player.rerollGrants || []),
		{ scope: 'ownQuest', uses: 1, turnKey: djTurnKey(state), forRoll: true, source: 'place_skiffa' }];
}

// Digital Gaming Stop: whoever activates a gear Piecie also draws 1 card (empty deck: nothing).
export function placeGearDraw(state, playerId, cardDef) {
	if (state.activePlace !== 'place_digital_gaming_stop' || cardDef?.tag !== 'gear') return state;
	return drawFromEffect(state, playerId, 1);
}

// Tesla: destroyed (to its owner's discard) as soon as its owner has no Coert on their field.
export function placeTeslaCheck(state) {
	if (state.activePlace !== 'place_tesla') return state;
	const owner = state.players[state.activePlacePlayedBy];
	if (!owner || hasCoert(owner)) return state;
	console.log('[PLACE] Tesla: owner has no Coert - Tesla destroyed');
	return destroyActivePlace(state);
}

export function hasCoert(player) {
	return (player?.activeSlots || []).some(s => s && !s.isDefeated && String(s.cardId || '').toLowerCase().includes('coert'));
}
