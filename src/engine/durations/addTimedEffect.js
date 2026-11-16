// addTimedEffect - store one timed effect on the (already cloned) state. Entry: { id, target: { playerId, slotIndex, cardId },
// kind ('power'), amount, duration, ownerId, startedRound, sourceCardId, tie, endsAfterTurnOf, skipEnds, active }.
// tie = attachment card id (whileAttached) or Place id (whilePlaceStays). Instant effects are refused: they are not stored.
// Returns { ok, error? }.
import { STORED_DURATIONS, DURATIONS } from './durationKinds.js';

export function addTimedEffect(state, { target, kind = 'power', amount, duration, ownerId, sourceCardId = null, tie = null }) {
	if (!STORED_DURATIONS.includes(duration)) return { ok: false, error: 'An instant effect is not stored' };
	if (!target || target.playerId == null || !Number.isInteger(target.slotIndex) || !target.cardId) return { ok: false, error: 'No target Mosje' };
	if ((duration === DURATIONS.WHILE_ATTACHED || duration === DURATIONS.WHILE_PLACE_STAYS) && !tie) return { ok: false, error: 'This duration needs a tie' };
	const list = Array.isArray(state.timedEffects) ? state.timedEffects : [];
	const owner = ownerId ?? target.playerId;
	const entry = {
		id: `te_${(state.timedEffectSeq || 0) + 1}`,
		target: { playerId: target.playerId, slotIndex: target.slotIndex, cardId: target.cardId },
		kind, amount: Number(amount) || 0, duration, ownerId: owner,
		startedRound: state.turnNumber ?? 0, sourceCardId, tie,
		endsAfterTurnOf: state.activePlayerId, // "this turn" ends with this player's turn
		// "until the end of your next turn": added on the owner's own turn, that turn does not count
		skipEnds: duration === DURATIONS.UNTIL_END_OF_NEXT_TURN && state.activePlayerId === owner ? 1 : 0,
		active: duration !== DURATIONS.OPPONENT_NEXT_TURN, // the opponent's-next-turn effect waits for their turn start
	};
	state.timedEffectSeq = (state.timedEffectSeq || 0) + 1;
	state.timedEffects = [...list, entry];
	return { ok: true, entry };
}
