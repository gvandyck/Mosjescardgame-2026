// piecieEffects.js — One function per Piecie card's effect.
// Filled in Phase 4.

console.log('[ABILITY] piecieEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

function getFirstActiveSlotIndex(player) {
	return player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
}

export function effect_kannetje_melk(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const slotIndex = getFirstActiveSlotIndex(player);
	if (slotIndex < 0) return state;

	player.activeSlots[slotIndex].mp += 25;
	console.log('[ABILITY] Kannetje Melk: +25 MP');
	return state;
}

export function effect_affoe(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const opponentId = Object.keys(state.players).find(id => id !== playerId);
	if (!opponentId) return state;

	const ownSlotIndex = getFirstActiveSlotIndex(player);
	const oppSlotIndex = getFirstActiveSlotIndex(state.players[opponentId]);

	if (oppSlotIndex >= 0) state.players[opponentId].activeSlots[oppSlotIndex].mp -= 15;
	if (ownSlotIndex >= 0) player.activeSlots[ownSlotIndex].mp += 10;

	console.log('[ABILITY] Affoe: opponent -15 MP, self +10 MP');
	return state;
}

export function effect_broodje_doner(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	const slotIndex = getFirstActiveSlotIndex(player);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	if (mosje.level < 1) {
		console.log('[ABILITY] Broodje Doner blocked: requires level 1+');
		return state;
	}

	mosje.mp += 35;
	console.log('[ABILITY] Broodje Doner: +35 MP');
	return state;
}

export function effect_gun_een_piece(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	const drawCount = Math.min(2, player.deck.length);
	const drawn = player.deck.splice(0, drawCount);
	player.hand.push(...drawn);

	console.log('[ABILITY] Gun een Piece: drew', drawCount, 'card(s)');
	return state;
}

export function effect_quest_prep(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	player.questPrepBonus = (player.questPrepBonus || 0) + 2;
	console.log('[ABILITY] Quest Prep: next quest roll gets +2');
	return state;
}

export function effect_slecht_gezet(gameState) {
	const state = cloneState(gameState);
	state.activePlace = null;
	console.log('[ABILITY] Slecht Gezet: active Place destroyed');
	return state;
}
