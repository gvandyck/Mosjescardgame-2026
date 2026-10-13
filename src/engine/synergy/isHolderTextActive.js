// isHolderTextActive — the single gate for 2.0 synergy holder texts ("While <partner> is also on your field: ...").
// Live when the holder is on the player's field (not defeated) AND a partner Mosje from its synergyLabel is too.
// Synergy Chamber (shared Place) makes it live without the partner, except for a fresh holder (fresh ignores Places).
import { MOSJES } from '../../data/mosjes.js';
import { isFresh } from '../fresh/isFresh.js';

export function isHolderTextActive(state, playerId, holderId) {
	const data = MOSJES.find(m => m.id === holderId);
	if (!data || !data.synergyEffect) return false;
	const live = (state?.players?.[playerId]?.activeSlots || []).filter(s => s && !s.isDefeated);
	const holder = live.find(s => s.cardId === holderId);
	if (!holder) return false;
	const partners = (data.synergyLabel || []).filter(id => id.startsWith('mosje_'));
	if (partners.some(pid => live.some(s => s.cardId === pid))) return true;
	return state.activePlace === 'place_synergy_chamber' && !isFresh(holder);
}
