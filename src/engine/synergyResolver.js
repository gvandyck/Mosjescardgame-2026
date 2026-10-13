// synergyResolver.js — which 2.0 synergy holder texts are live for a player (see isHolderTextActive).
import { MOSJES } from '../data/mosjes.js';
import { isHolderTextActive } from './synergy/isHolderTextActive.js';

// Returns [{ holderId, partnerId, synergyEffect }] for every live holder. partnerId is the on-field partner, or null (Synergy Chamber).
export function getActiveSynergies(gameState, playerId) {
	const live = (gameState?.players?.[playerId]?.activeSlots || []).filter(s => s && !s.isDefeated);
	const result = [];
	for (const slot of live) {
		const data = MOSJES.find(m => m.id === slot.cardId);
		if (!data?.synergyEffect || !isHolderTextActive(gameState, playerId, slot.cardId)) continue;
		const partner = (data.synergyLabel || []).find(id => id.startsWith('mosje_') && live.some(s => s.cardId === id));
		result.push({ holderId: slot.cardId, partnerId: partner || null, synergyEffect: data.synergyEffect });
	}
	return result;
}

export function hasSynergy(gameState, playerId, holderId) {
	return isHolderTextActive(gameState, playerId, holderId);
}
