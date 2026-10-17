// Ronald, The Master Chef - Strategic Insight: once per turn, pay 2 Energy (charged by useMosjeAbility): look at the
// opponent's hand and choose 1 card. They set it face-down beside their field (player.setAside); it returns to their
// hand at the end of THEIR next turn (armSetAside at their start of turn, returnSetAside at their end of turn).
// Input: state._pendingTargets.locked_card = index into the opponent's hand.
import { revealCards } from '../../engine/hidden/revealCards.js';

export function ronaldChefStrategicInsight(gameState, playerId, mosjeId = 'mosje_ronald_chef') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player?.activeSlots.some(s => s && !s.isDefeated && s.cardId === mosjeId)) throw new Error('Ronald, The Master Chef is not on the field');
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const opp = state.players[oppId];
	if (!opp?.hand?.length) throw new Error('Strategic Insight: the opponent has no cards in hand');
	const pick = state._pendingTargets?.locked_card;
	if (!Number.isInteger(pick) || pick < 0 || pick >= opp.hand.length) throw new Error('Strategic Insight: choose a card from the opponent\'s hand');
	revealCards(state, playerId, 'ability_ronald_chef_strategic_insight', opp.hand.map(c => c.cardId)); // the whole hand is seen before the choice
	const [card] = opp.hand.splice(pick, 1);
	if (!Array.isArray(opp.setAside)) opp.setAside = [];
	opp.setAside.push({ card, armed: false, byPlayer: playerId });
	delete state._pendingTargets.locked_card;
	return state;
}
