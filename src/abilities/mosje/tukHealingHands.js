// Tuk, The Healing Spirit — Healing Hands: once per turn, pay 1 Energy (charged by useMosjeAbility):
// one of her owner's Mosjes (herself included) gains 20 MP. Input: state._pendingTargets.own_slot_index
// (default: Tuk herself).
import { gainMP } from '../../engine/mpManager.js';

export function tukHealingHands(gameState, playerId, mosjeId = 'mosje_tuk_healer') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	const selfIndex = player.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId);
	if (selfIndex < 0) throw new Error('Tuk Healer not on field');
	const selected = state._pendingTargets?.own_slot_index;
	const targetIndex = Number.isInteger(selected) ? selected : selfIndex;
	if (state._pendingTargets) delete state._pendingTargets.own_slot_index;
	const target = player.activeSlots[targetIndex];
	if (!target || target.isDefeated) throw new Error('Target Mosje not on field');
	return gainMP(state, playerId, targetIndex, 20, 'TUK_HEALER_PRESENCE');
}
