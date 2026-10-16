// MP Hemorrhage: the first Mosje the armed attacker attacks gets the Piecie next to it (the Stays card is bound to that
// Mosje) and loses 10 MP at the end of the attacker's next turn; then the card is discarded (sweepStaysSlots).
// If that Mosje leaves play first, the card is discarded and nothing is lost. An unused card is discarded at turn end.
import { discardPiecieSlotInPlace } from '../table/discardPiecieSlotInPlace.js';
import { scheduleEndOfTurnLoss } from '../../abilities/piecie/scheduleEndOfTurnLoss.js';

export function mpHemorrhageMark(ctx) {
	const { state, attackerPlayerId: byId } = ctx;
	const a = state.players[byId].activeSlots[ctx.attackerSlotIndex];
	if (!a?.mpHemorrhageArmed) return state;
	a.mpHemorrhageArmed = false;
	const entries = state.players[byId].piecieSlots || [];
	const at = entries.findIndex(e => e?.cardId === 'piecie_mp_hemorrhage' && e.stays === true && !e.marked);
	const t = state.players[ctx.targetPlayerId].activeSlots[ctx.targetSlotIndex];
	if (t && !t.isDefeated) t.hemorrhageMark = { byPlayerId: byId };
	if (at < 0) return state;
	if (!t || t.isDefeated) { discardPiecieSlotInPlace(state, byId, at); return state; }
	entries[at].marked = true;
	entries[at].boundTo = [{ playerId: ctx.targetPlayerId, slotIndex: ctx.targetSlotIndex, cardId: t.cardId, reduce: 0 }];
	scheduleEndOfTurnLoss(state, byId, { targetPlayerId: ctx.targetPlayerId, slotIndex: ctx.targetSlotIndex, amount: 10, dueRound: state.turnNumber + 1 });
	return state;
}
