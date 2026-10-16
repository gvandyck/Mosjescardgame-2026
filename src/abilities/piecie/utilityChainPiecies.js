// utilityChainPiecies - Card List 2.0 Utility chain Piecies (Example-Deck cards).
import { cloneState } from './cloneState.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { resolvePiecieOppSlot } from './resolvePiecieOppSlot.js';
import { grantExtraAbilityUse } from '../../engine/abilities/grantExtraAbilityUse.js';
import { dubbeleDingOptions } from '../../engine/piecies/dubbeleDingOptions.js';
import { continueDubbeleDing } from '../../engine/piecies/continueDubbeleDing.js';
import { PIECIES } from '../../data/piecies.js';

// Chain Reaction: arms the owner for this turn. afterPiecieEffect turns it into a free offer after the next paid
// Piecie activation (not this card's own); activatePiecie then makes one more ready Piecie free (once).
export function effect_chain_reaction(gameState, playerId) {
	const state = cloneState(gameState);
	if (state.players[playerId]) state.players[playerId].chainReactionFree = 1;
	return state;
}

// MP Amplifier: arms the owner's next MP gain this turn (applyMpAmplifier in gainMP doubles it, max +40 extra).
// Not "giving MP": Jeffrey allows it. An unused amplifier ends with the turn (expireThisTurnEffects).
export function effect_mp_amplifier(gameState, playerId) {
	const state = cloneState(gameState);
	if (state.players[playerId]) state.players[playerId].mpAmplifierThisTurn = true;
	return state;
}

// Synergy Field: Stays (data: endOfNextTurn). The effect itself is passive: gainMP asks synergyFieldBonus for
// +10 per staying copy on an ability gain. Not "giving MP" either.
export const effect_synergy_field = (gameState) => cloneState(gameState);

// Redbull: the chosen Mosje (an activated once-per-turn ability) may use it one more time this turn; the second use
// pays the ability's Energy again (useMosjeAbility). No eligible Mosje: nothing happens.
export function effect_redbull(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_redbull');
	if (si >= 0) grantExtraAbilityUse(state.players[playerId].activeSlots[si]);
	return state;
}

// Double Trigger: both of your Mosjes with such an ability get the extra use (each pays its Energy again).
export function effect_double_trigger(gameState, playerId) {
	const state = cloneState(gameState);
	for (const slot of state.players[playerId].activeSlots) if (slot) grantExtraAbilityUse(slot);
	return state;
}

// Leipe Swap: one of your Mosjes and one non-fresh opponent Mosje swap their MP for good. Not a gain or a loss, so
// no level-up, no getemt / sideways at 0, nothing reverts.
export function effect_leipe_swap(gameState, playerId) {
	const state = cloneState(gameState);
	const mine = resolvePiecieOwnSlot(state, playerId, 'piecie_leipe_swap');
	const theirs = resolvePiecieOppSlot(state, playerId, 'piecie_leipe_swap');
	if (mine < 0 || theirs.slotIndex < 0) return state;
	const a = state.players[playerId].activeSlots[mine];
	const b = state.players[theirs.oppId].activeSlots[theirs.slotIndex];
	const tmp = a.mp;
	a.mp = b.mp; // mp-direct-ok: swap is never a gain or loss, handoff §2b
	b.mp = tmp; // mp-direct-ok: swap is never a gain or loss, handoff §2b
	return state;
}

// Dubbele Ding: pick up to 2 Piecies from your hand (each must pass the gate, be affordable and find a free slot);
// they are activated right away, one after the other, as normal paid activations (continueDubbeleDing).
export function effect_dubbele_ding(gameState, playerId) {
	const state = cloneState(gameState);
	const me = state.players[playerId];
	const cost = (id) => Number(PIECIES.find(p => p.id === id)?.cost) || 0;
	const done = { label: 'Done', cardId: 'done' };
	const cards = [];
	let energyLeft = me.energy;
	for (const key of ['dubbele_1', 'dubbele_2']) {
		let pick = me._pendingTargets?.[key];
		if (pick === undefined) {
			const options = dubbeleDingOptions(state, playerId, energyLeft, cards[0] || null);
			if (!options.length) break;
			return { state, needChoice: { playerId, choiceKind: 'handCard', key, options: [...options, done], prompt: 'Dubbele Ding: choose a Piecie from your hand to activate' } };
		}
		if (pick.cardId === 'done') break;
		cards.push(pick.cardId);
		energyLeft -= cost(pick.cardId);
	}
	delete me._pendingTargets?.dubbele_1;
	delete me._pendingTargets?.dubbele_2;
	if (!cards.length) return state;
	state._dubbeleQueue = { playerId, cards };
	return continueDubbeleDing(state);
}
