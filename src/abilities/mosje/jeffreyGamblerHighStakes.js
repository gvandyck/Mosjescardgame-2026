// Jeffrey, The Silent Gambler — High Stakes: once per turn, stake 1 or 2 Energy and roll a die. 1-2: the Energy is
// lost. 3-4: you get it back. 5-6: you get it back, draw 1 card, gain 10 MP per Energy staked, and your next Quest
// success this turn gives +15 MP extra (player.gamblerQuestBonusTurn, read by jeffreyGamblerQuestBonus).
// The stake is paid INSIDE the effect (charged 0 up front); refused (throws, nothing happens) if the player is short.
// Input: _pendingTargets.stake = 1 | 2.
import { rollDie, drawCards } from '../../engine/deckEngine.js';
import { canPay } from '../../engine/energy/canPay.js';
import { gainMP } from '../../engine/mpManager.js';

export function jeffreyGamblerHighStakes(gameState, playerId, mosjeId = 'mosje_jeffrey_gambler') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const slotIndex = player?.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId) ?? -1;
	if (slotIndex < 0) throw new Error('Jeffrey, The Silent Gambler is not on the field');
	const stake = state._pendingTargets?.stake;
	if (state._pendingTargets) delete state._pendingTargets.stake;
	if (stake !== 1 && stake !== 2) throw new Error('High Stakes: stake 1 or 2 Energy');
	if (!canPay(player, stake)) throw new Error('High Stakes: not enough Energy for that stake');
	const roll = rollDie(6);
	console.log(`[ABILITY] Jeffrey Gambler: staked ${stake}, rolled ${roll}`);
	if (roll <= 2) { player.energy -= stake; return { state, success: true }; } // lost
	if (roll <= 4) return { state, success: true };                                 // back
	const { drawn, remaining } = drawCards(player.deck, 1);
	player.deck = remaining;
	player.hand.push(...drawn);
	player.gamblerQuestBonusTurn = state.turnNumber;
	return { state: gainMP(state, playerId, slotIndex, 10 * stake, 'ABILITY'), success: true };
}
