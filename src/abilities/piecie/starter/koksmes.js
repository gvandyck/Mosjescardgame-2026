// Koksmes: "Attach: +10 Power. A Ronald gets +20 instead." On a Ronald (D-06 "On a <Friend>") = the Mosje it sits on.
import { attachedPower } from './attachedPower.js';
import { isFriend } from '../../../engine/friends/isFriend.js';

export function effect_koksmes(gameState, playerId, ctx = {}) {
	return attachedPower(gameState, playerId, ctx, 'piecie_koksmes', (slot) => (isFriend(slot, ['Ronald']) ? 20 : 10));
}
