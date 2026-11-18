// Youri, The Speedrunner - Speed Activate: once per turn, pay 1 Energy (useMosjeAbility): a Piecie you placed this turn
// may be activated now (its own Energy cost is still paid when you activate it); from Level 2 then draw 1 card.
// Input: _pendingTargets.piecie_slot = a face-down, not-yet-ready Piecie slot placed this turn. Refused = throws.
import { drawCards } from '../../engine/deckEngine.js';

export function youriSpeedActivate(gameState, playerId, mosjeId = 'mosje_youri') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player?.activeSlots.some(s => s && !s.isDefeated && s.cardId === mosjeId)) throw new Error('Youri is not on the field');
	const i = state._pendingTargets?.piecie_slot;
	if (state._pendingTargets) delete state._pendingTargets.piecie_slot;
	const slot = Number.isInteger(i) ? player.piecieSlots?.[i] : null;
	const waiting = slot && slot.type === 'PIECIE' && slot.faceDown && !slot.activated
		&& slot.playedOnTurn === state.turnNumber && slot.canActivateOnTurn > state.turnNumber;
	if (!waiting) throw new Error('Speed Activate: choose a Piecie you placed this turn that is not ready yet');
	slot.canActivateOnTurn = state.turnNumber;
	const youri = player.activeSlots.find(s => s && !s.isDefeated && s.cardId === mosjeId);
	if ((youri.level ?? 1) >= 2) { // "From Level 2" reads the slot's current level (D-20)
		const { drawn, remaining } = drawCards(player.deck, 1);
		player.deck = remaining;
		player.hand.push(...drawn);
	}
	return { state, success: true };
}
