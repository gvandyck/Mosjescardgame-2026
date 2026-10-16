// afterPiecieEffect - the half of a Piecie activation that runs once its effect is completely done:
// on-draw Place effects, Perfect Rhythm draw, counters, Mosje piecieActivated triggers, discard or Stays.
// after: { handSizeBefore, rhythmWasArmed } snapshot taken before the effect. Returns { state, success, cardDef }.
import {
	applyPerfectRhythmDraw, normalizePiecieSlots,
} from '../turnManager.js';
import { finishPiecieActivation } from '../table/finishPiecieActivation.js';
import { runMosjeTriggers } from '../mosje/runMosjeTriggers.js';
import { checkVictory } from '../victoryChecker.js';
import * as placeEffects from '../../abilities/placeEffects.js';
import { placeGearDraw } from '../../abilities/place/placeTurnQuestEffects.js';

export function afterPiecieEffect(state, playerId, slotIndex, cardDef, after = {}, opts = {}) {
	const free = opts.free === true;
	const hasSlot = slotIndex >= 0;

	// Perfect Rhythm: eligibility comes from the pre-effect snapshot.
	state = applyPerfectRhythmDraw(state, playerId, after.rhythmWasArmed === true);

	// Chain Reaction: after a paid activation (not its own) the armed owner may activate one more Piecie for free.
	const owner = state.players[playerId];
	if (!free && owner.chainReactionFree > 0 && cardDef.effectId !== 'effect_chain_reaction') {
		owner.chainReactionFree = 0;
		owner.chainReactionOffer = 1;
	}

	state.players[playerId].pieciesActivatedThisTurn = (state.players[playerId].pieciesActivatedThisTurn || 0) + 1;
	const actions = Array.isArray(state.players[playerId].actionsThisTurn) ? state.players[playerId].actionsThisTurn : [];
	if (!actions.includes('PIECIE_ACTIVATED')) state.players[playerId].actionsThisTurn = [...actions, 'PIECIE_ACTIVATED'];
	state.players[playerId].lastCardPlayedType = cardDef.tags?.[0] || null;

	state = placeGearDraw(state, playerId, cardDef);

	// Momentum Factory bonus (first Piecie each turn)
	if (state.activePlace === 'place_momentum_factory') state = placeEffects.effect_momentum_factory(state);

	state = runMosjeTriggers(state, 'piecieActivated', { playerId, free, cardDef, slotIndex });

	// Piecie resolves - Stays cards keep their slot, others go to the discard pile.
	let player = state.players[playerId];
	if (!Array.isArray(player.graveyard)) player.graveyard = [];
	normalizePiecieSlots(player);
	if (hasSlot) state = finishPiecieActivation(state, playerId, slotIndex, cardDef);
	player = state.players[playerId];
	player.piecieActivationsThisTurn = (player.piecieActivationsThisTurn || 0) + 1;
	state = checkVictory(state);
	return { state, success: true, cardDef };
}
