// getPiecieTrayActions.js — the tray of one own Piecie slot: Activate · N Energy · Details (63-UI-SPEC "Action tray", D-03).
// A Piecie that is already face-up / used only offers Details. Reasons mirror activatePiecie, which re-checks everything.
import { PIECIES } from '../../data/piecies.js';
import { isPiecieReady } from '../../engine/table/isPiecieReady.js';
import { piecieActivationGate } from '../../engine/table/piecieActivationGate.js';
import { getEffectiveCost } from '../../engine/energy/getEffectiveCost.js';
import { delluftFee } from '../../engine/energy/delluftFee.js';
import { isCooldownBlocked, COOLDOWN_ERROR } from '../../engine/turn/isCooldownBlocked.js';
import { makeTrayChip } from './makeTrayChip.js';

function activateReason(state, playerId, slot, def, cost) {
	if (state.activePlayerId !== playerId) return 'You can only activate Piecies on your own turn';
	if (isCooldownBlocked(state, playerId)) return COOLDOWN_ERROR;
	if (!isPiecieReady(slot, state.turnNumber)) return 'Ready from your next turn';
	const gate = def ? piecieActivationGate(state, playerId, def) : null;
	if (gate) return gate;
	return (state.players[playerId].energy ?? 0) < cost ? `Not enough Energy (need ${cost})` : '';
}

export function getPiecieTrayActions(state, playerId, slotIndex) {
	const details = makeTrayChip('details', 'Details');
	const player = state.players?.[playerId];
	const slot = player?.piecieSlots?.[slotIndex];
	if (!slot || slot.type !== 'PIECIE' || slot.activated === true || slot.faceDown !== true) return [details];
	const def = PIECIES.find((p) => p.id === slot.cardId);
	const base = player.chainReactionOffer > 0 ? 0 : getEffectiveCost(state, playerId, slot.cardId, 'piecie', { caravan: true });
	const cost = base + delluftFee(state, playerId, base);
	const activate = makeTrayChip('activate', cost > 0 ? `Activate · ${cost} Energy` : 'Activate', activateReason(state, playerId, slot, def, cost));
	return [{ ...activate, cost }, details];
}
