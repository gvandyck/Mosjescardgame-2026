// Gandoe, The Cloude Wizard: once per turn, pay 1 Energy (useMosjeAbility): look at the top 3 cards of your deck, take 1
// into your hand, the other two go to the bottom in the same order. The pick pauses through the private hook
// 'wizardPick' (gandoeWizardPick.js). Refused (throws, nothing paid) when he is not on the field or the deck is empty.
import { runTriggerJobs } from '../../engine/mosje/runTriggerJobs.js';

export function gandoeWizardTopThree(gameState, playerId, mosjeId = 'mosje_gandoe_wizard') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const slotIndex = player?.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId) ?? -1;
	if (slotIndex < 0) throw new Error('Gandoe, The Cloude Wizard is not on the field');
	if (!player.deck.length) throw new Error('Your deck is empty');
	return runTriggerJobs(state, 'wizardPick', [{ triggerIdx: 0, playerId, slotIndex }], 0, { playerId });
}
