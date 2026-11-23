// runBotPersonalQuest - one bot Personal Quest attempt through the engine (roll, then resolve when no reaction window holds
// the roll). Returns { ok: false, error } on a refusal, { ok: true, state, reactionPending: true } when a window opened (the
// driver settles it and calls finishHeldQuest), or { ok: true, state, pending, win } when the roll was resolved here.
import { rollPersonalQuestAttempt } from '../engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolvePersonalQuestAttempt } from '../engine/personalQuests/resolvePersonalQuestAttempt.js';

export function runBotPersonalQuest(state, botPlayerId, pick) {
	const roll = rollPersonalQuestAttempt(state, botPlayerId, { cardId: pick.cardId, slotIndex: pick.slotIndex, choice: pick.choice, puntoBanco: pick.puntoBanco });
	if (!roll.ok) return { ok: false, error: roll.error };
	if (roll.reactionPending) return { ok: true, state: roll.state, reactionPending: true };
	const done = resolvePersonalQuestAttempt(roll.state, roll.pending);
	if (!done.ok) return { ok: false, error: done.error };
	return { ok: true, state: done.state, pending: roll.pending, win: done.win };
}
