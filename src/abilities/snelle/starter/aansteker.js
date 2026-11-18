// Aansteker (snelle_momentum_rush): "When an opponent's Mosje attacks: the attacker loses 15 MP." A card effect (Resilient does
// not shrink it). Played from the attacked window, the held attack then replays and fizzles if the attacker can no longer act.
// Outside an attack window it changes nothing.
import { loseMP } from '../../../engine/mpManager.js';

const ATTACK_LOSS = 15;

export function effect_snelle_momentum_rush(gameState, pid, ctx = {}) {
	const action = ctx.reaction?.action;
	const attackerId = ctx.reaction?.actorId;
	const params = action?.type === 'attack' ? action.args?.[1] : null;
	if (!params || !attackerId || attackerId === pid || !Number.isInteger(params.attackerSlotIndex)) return gameState;
	return loseMP(gameState, attackerId, params.attackerSlotIndex, ATTACK_LOSS, 'SNELLE', false, pid);
}
