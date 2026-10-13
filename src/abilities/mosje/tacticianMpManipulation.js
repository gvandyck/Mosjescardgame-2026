// The Tactician — MP Manipulation: once per turn, pay 2 Energy (useMosjeAbility): choose one Mosje (own, or an
// opponent's that is not fresh) and set its MP to 10-75 (5-grid) until the end of the turn. Real MP is stored in
// slot.tacticianSet; gains/losses this turn are tracked there too (snapBackTacticianSet restores real MP + delta).
// Inputs (state._pendingTargets): target {playerId, slotIndex}, mp. Anything else is refused (nothing is paid).
import { isFresh } from '../../engine/fresh/isFresh.js';

export function tacticianMpManipulation(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const targets = state._pendingTargets || {};
	const value = Number(targets.mp);
	if (!Number.isInteger(value) || value < 10 || value > 75 || value % 5 !== 0) {
		throw new Error('MP Manipulation sets a value from 10 to 75 in steps of 5');
	}
	const t = targets.target;
	const slot = t && state.players[t.playerId]?.activeSlots?.[t.slotIndex];
	if (!slot || slot.isDefeated) throw new Error('MP Manipulation needs a Mosje on the field');
	if (t.playerId !== playerId && isFresh(slot)) {
		throw new Error('Target Mosje just entered play — it is protected until their next turn');
	}
	delete targets.target;
	delete targets.mp;
	// A second set on the same Mosje keeps the first real MP.
	const realMp = slot.tacticianSet ? slot.tacticianSet.realMp : slot.mp;
	const delta = slot.tacticianSet ? slot.tacticianSet.delta : 0;
	slot.tacticianSet = { realMp, delta, turnNumber: state.turnNumber };
	slot.mp = value; // mp-direct-ok: Tactician temporary set, restored by snapBackTacticianSet
	console.log(`[ABILITY] Tactician: ${slot.name} MP set to ${value} (real ${realMp})`);
	return state;
}
