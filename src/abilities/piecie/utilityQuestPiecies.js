// utilityQuestPiecies - Card List 2.0 Utility Piecies that bend Quest rules this turn: Perfect Setup and Battle Concert.
import { cloneState } from './cloneState.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { resolvePiecieOppSlot } from './resolvePiecieOppSlot.js';

const KEY = 'setup_mp';
const VALUES = [60, 65, 70, 75, 80, 85, 90];

// Perfect Setup: one of your Mosjes counts as having the MP you pick (60-90) for Quest requirements this turn
// (slot.questMpOverride, read by mpForQuest; its real MP does not change). Pause: the MP value.
export function effect_perfect_setup(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const me = state.players[playerId];
	const si = ctx.setupSlot ?? resolvePiecieOwnSlot(state, playerId, 'piecie_perfect_setup');
	if (si < 0) return state;
	const pick = me._pendingTargets?.[KEY];
	if (pick === undefined) {
		const options = VALUES.map(value => ({ label: `${value} MP`, value }));
		return { state, needChoice: { playerId, choiceKind: 'mpValue', key: KEY, options, prompt: 'Count as how much MP for Quest requirements?', ctx: { setupSlot: si } } };
	}
	delete me._pendingTargets[KEY];
	const slot = me.activeSlots[si];
	if (slot && !slot.isDefeated && VALUES.includes(pick.value)) slot.questMpOverride = pick.value;
	return state;
}

// Battle Concert (an Alyssa on your field - activation gate): this turn the first Quest fail of an Alyssa costs her
// nothing and the chosen opponent Mosje loses 15 instead (battleConcertRedirect in resolveQuestAttempt).
export function effect_battle_concert(gameState, playerId) {
	const state = cloneState(gameState);
	const { oppId, slotIndex } = resolvePiecieOppSlot(state, playerId, 'piecie_battle_concert');
	state._battleConcertActive = playerId;
	if (slotIndex >= 0) state._battleConcertTarget = { playerId: oppId, slotIndex, cardId: state.players[oppId].activeSlots[slotIndex].cardId };
	return state;
}
