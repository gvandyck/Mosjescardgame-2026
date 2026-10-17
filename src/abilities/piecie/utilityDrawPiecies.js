// utilityDrawPiecies - Card List 2.0 Utility "draw / look" Piecies (Example-Deck cards). Effects: (state, playerId, ctx).
// Pauses (return { state, needChoice }): Zie je die Dingetjes (pick for hand, then the order of the rest) and
// Stookerino (which card of the opponent's hand to discard). The answers live in the chooser's _pendingTargets.
import { rollDie } from '../../engine/deckEngine.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { getCardEnergyCost } from '../../engine/energy/getCardEnergyCost.js';
import { findTagSlot } from '../../engine/targets/findTagSlot.js';
import { cloneState } from './cloneState.js';
import { pieceDef } from './pieceDef.js';
import { gainFromPiecie } from './gainFromPiecie.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { revealCards } from '../../engine/hidden/revealCards.js';
import { discardChoice } from './discardChoice.js';

const nameOf = (cardId) => toGraveyardEntry(cardId, 'x').name;
// One option per distinct cardId (the first copy's position).
const distinct = (cards) => cards.map((c, index) => ({ label: nameOf(c.cardId), index, cardId: c.cardId }))
	.filter((o, i, all) => all.findIndex(x => x.cardId === o.cardId) === i);

export function effect_boosterpackkie(gameState, playerId) {
	let state = drawFromEffect(cloneState(gameState), playerId, 1);
	const si = findTagSlot(state.players[playerId], 'COERT');
	if (si < 0) return state;
	state = gainFromPiecie(state, playerId, si, 10, pieceDef('piecie_boosterpackkie'));
	return rollDie(6) >= 5 ? drawFromEffect(state, playerId, 1) : state;
}

// Zie je die Dingetjes: 1 of the top 3 to your hand, the rest back on top in the order you pick.
export function effect_zie_je_die_dingetjes(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	const n = Math.min(3, player.deck.length);
	if (!n) return state;
	const top = player.deck.slice(0, n);
	const targets = player._pendingTargets || {};
	if (targets.zie_pick === undefined) {
		return { state, needChoice: { playerId, choiceKind: 'handCard', key: 'zie_pick', options: distinct(top), prompt: 'Put 1 card in your hand' } };
	}
	const rest = top.filter((_, i) => i !== targets.zie_pick.index);
	if (targets.zie_top === undefined && distinct(rest).length > 1) {
		return { state, needChoice: { playerId, choiceKind: 'handCard', key: 'zie_top', options: distinct(rest), prompt: 'Put which card back on top?' } };
	}
	const first = rest.findIndex(c => c.cardId === targets.zie_top?.cardId);
	if (first > 0) rest.unshift(...rest.splice(first, 1));
	player.hand.push(top[targets.zie_pick.index]);
	player.deck.splice(0, n, ...rest);
	delete player._pendingTargets.zie_pick;
	delete player._pendingTargets.zie_top;
	return state;
}

// Stookerino: discard a card of your choice from the opponent's hand; one of your Mosjes gains 10 per Energy it
// cost (max 30), a Binti on your field +10 more (in the same gain when it is the chosen Mosje).
export function effect_stookerino(gameState, playerId, ctx = {}) {
	let state = cloneState(gameState);
	const me = state.players[playerId];
	const opp = state.players[Object.keys(state.players).find(id => id !== playerId)];
	if (!opp?.hand.length) return state;
	const si = ctx.stookSlot ?? resolvePiecieOwnSlot(state, playerId, 'piecie_stookerino');
	const pick = me._pendingTargets?.stook_card;
	if (pick === undefined) {
		revealCards(state, playerId, 'piecie_stookerino', opp.hand.map(c => c.cardId)); // the card shows the hand before the pick
		const options = distinct(opp.hand).map(({ label, cardId }) => ({ label, cardId }));
		return { state, needChoice: { playerId, choiceKind: 'handCard', key: 'stook_card', options, prompt: "Discard a card from your opponent's hand", ctx: { stookSlot: si } } };
	}
	delete me._pendingTargets.stook_card;
	const at = opp.hand.findIndex(c => c.cardId === pick.cardId);
	if (at < 0) return state;
	const [card] = opp.hand.splice(at, 1);
	opp.graveyard = [...(opp.graveyard || []), toGraveyardEntry(card.cardId, 'discarded')];
	const def = pieceDef('piecie_stookerino');
	const binti = findTagSlot(me, 'BINTI');
	const main = Math.min(30, 10 * getCardEnergyCost(card.cardId)) + (binti >= 0 && binti === si ? 10 : 0);
	if (si >= 0 && main > 0) state = gainFromPiecie(state, playerId, si, main, def);
	return binti >= 0 && binti !== si ? gainFromPiecie(state, playerId, binti, 10, def) : state;
}

// Bagga of Greed: draw 2, then discard 1 card from your hand (a pause over the whole hand; the draw is not repeated).
export function effect_bagga_of_greed(gameState, playerId, ctx = {}) {
	const state = ctx.baggaDrawn ? cloneState(gameState) : drawFromEffect(cloneState(gameState), playerId, 2);
	return discardChoice(state, playerId, 'bagga_discard', { baggaDrawn: true });
}

// Perfect Rhythm: this turn each later Piecie activation draws 1 card, at most 2 times (applyPerfectRhythmDraw counts
// perfectRhythmDraws down); a Dancing/DDR Chris on the field also gains 10 MP each time.
export function effect_perfect_rhythm(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.perfectRhythmDrawNextPiecie = true;
	player.perfectRhythmDraws = (player.perfectRhythmDraws || 0) + 2;
	return state;
}

// F1 Telemetry Data: one of your Mosjes gains 15 MP and you draw 1; with Martin, The Precision Driver on your field
// he gains 30 instead (not the chosen one) and you draw 2.
export function effect_f1_telemetry(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_f1_telemetry');
	const driver = state.players[playerId].activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === 'mosje_martin_driver');
	if (driver >= 0) return drawFromEffect(gainFromPiecie(state, playerId, driver, 30, pieceDef('piecie_f1_telemetry')), playerId, 2);
	if (si < 0) return state;
	return drawFromEffect(gainFromPiecie(state, playerId, si, 15, pieceDef('piecie_f1_telemetry')), playerId, 1);
}
