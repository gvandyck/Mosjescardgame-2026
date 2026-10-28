// getHandCardState.js — can this hand card be played right now, and if not, why (Phase 65-06, D-10). Pure: reads the engine state and
// the card, never changes either, no DOM. The phone raise dock shows `reason` for a card that cannot be played, and the board marks
// the slot `kind` / `slotIndex` (the slot the engine will fill, getNextFreeSlot) for one that can.
// kind: 'mosje' | 'piecie' | null (a Place takes no slot); a Snelle takes a Piecie slot, like playSnellie. slotIndex is -1 when none.
// Reasons, first match wins: returned Mosje, cooldown (everything but a Piecie), not your turn (everything but a Snelle), a type that
// is not played from the hand, a Place already in play, a refused Snelle, too little Energy, no free slot.
import { getHandPlayCost } from '../board/getHandPlayCost.js';
import { getNextFreeSlot } from '../board/getNextFreeSlot.js';
import { snelleRefused } from '../board/snelleRefused.js';
import { COOLDOWN_TEXT } from '../board/cooldownText.js';
import { isCooldownBlocked } from '../../engine/turn/isCooldownBlocked.js';

const KIND_BY_TYPE = { MOSJE: 'mosje', PIECIE: 'piecie', SNELLE_PIECIE: 'piecie' };
const FULL_TEXT = { mosje: 'Both Mosje slots are full', piecie: 'All 3 Piecie slots are full' };
const PLAYABLE_TYPES = ['MOSJE', 'PIECIE', 'SNELLE_PIECIE', 'PLACE'];

function refusal({ state, playerId, card, isLocalTurn, cost, kind, slotIndex }) {
	if (card.type === 'MOSJE' && card.returnedThisTurn) return 'Returned this turn; can be replayed next turn';
	if (card.type !== 'PIECIE' && isCooldownBlocked(state, playerId)) return COOLDOWN_TEXT;
	if (card.type !== 'SNELLE_PIECIE' && !isLocalTurn) return 'Not your turn';
	if (!PLAYABLE_TYPES.includes(card.type)) return 'Cannot be played from the hand';
	if (card.type === 'PLACE' && state?.activePlace) return 'A Place is already in play';
	if (snelleRefused(state, playerId, card)) return state._snelleBlocked === playerId ? 'Blocked this turn' : 'Its condition is not met right now';
	const energy = Number(state?.players?.[playerId]?.energy) || 0;
	if (cost > energy) return `Needs ${cost} Energy, you have ${energy}`;
	if (kind && slotIndex < 0) return FULL_TEXT[kind];
	return null;
}

export function getHandCardState({ state, playerId, card, isLocalTurn }) {
	const kind = KIND_BY_TYPE[card?.type] ?? null;
	const cost = getHandPlayCost(state, playerId, { cardId: card?.cardId, type: card?.type });
	const slotIndex = kind ? getNextFreeSlot(state?.players?.[playerId], kind) : -1;
	const reason = card ? refusal({ state, playerId, card, isLocalTurn, cost, kind, slotIndex }) : 'Cannot be played from the hand';
	return { canPlay: reason === null, reason, cost, kind, slotIndex };
}
