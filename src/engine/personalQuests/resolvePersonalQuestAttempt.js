// resolvePersonalQuestAttempt - step 2 of a Personal Quest attempt: a win ends the game at once and records which
// Personal Quest and Mosje won (state.winningQuest, D-04); a fail goes to failPersonalQuest (D-05). `pending` comes from
// rollPersonalQuestAttempt, or is the held roll in state.pendingQuestRoll.
import { checkVictory } from '../victoryChecker.js';
import { failPersonalQuest } from './failPersonalQuest.js';

export function resolvePersonalQuestAttempt(state, pending) {
	if (state.pendingReaction) return { ok: false, state, error: 'A reaction window is still open' };
	const s = JSON.parse(JSON.stringify(state));
	if (s.pendingQuestRoll) { pending = s.pendingQuestRoll; delete s.pendingQuestRoll; }
	if (!pending || pending.kind !== 'personal') return { ok: false, state, error: 'No Personal Quest roll to resolve' };
	const { playerId, slotIndex, cardId, dice, win } = pending;
	const player = s.players[playerId];
	if (player?.rerollGrants) player.rerollGrants = player.rerollGrants.filter(g => !g.forRoll); // that roll is over
	const slot = player?.activeSlots?.[slotIndex];
	if (win) {
		s.status = 'FINISHED';
		s.winnerId = playerId;
		s.winReason = 'PERSONAL_QUEST';
		s.winningQuest = { cardId, playerId, mosjeCardId: slot?.cardId ?? null, mosjeName: slot?.name ?? null, slotIndex, dice: [...dice] };
		console.log(`[QUEST] Personal Quest ${cardId}: ${slot?.name} dice [${dice.join(',')}] -> WIN`);
		return { ok: true, state: s, win: true };
	}
	failPersonalQuest(s, pending);
	console.log(`[QUEST] Personal Quest ${cardId}: ${slot?.name} dice [${dice.join(',')}] -> FAIL`);
	return { ok: true, state: checkVictory(s), win: false };
}
