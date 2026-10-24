// getMosjeTrayActions.js — the tray of one own Mosje: Attack · Quest · Ability (when it has one) · Details
// (63-UI-SPEC "Action tray", D-03). Every chip that cannot be used now carries its reason (engine strings where they exist).
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { getAttackTargets } from './getAttackTargets.js';
import { getQuestTargets } from './getQuestTargets.js';
import { getAbilityChip } from './getAbilityChip.js';
import { makeTrayChip } from './makeTrayChip.js';

function attackReason(state, playerId, slotIndex, slot) {
	const gate = canMosjeTakeAction(state, playerId, slotIndex);
	if (!gate.ok) return gate.error;
	if (isFresh(slot)) return "Fresh Mosjes can't attack";
	return getAttackTargets(state, playerId).some((t) => t.valid) ? '' : 'No valid target';
}

function questReason(state, playerId, slotIndex) {
	const gate = canMosjeTakeAction(state, playerId, slotIndex);
	if (!gate.ok) return gate.error;
	return getQuestTargets(state, playerId, slotIndex).some((t) => t.valid) ? '' : 'No Quest can be attempted';
}

export function getMosjeTrayActions(state, playerId, slotIndex) {
	const slot = state.players?.[playerId]?.activeSlots?.[slotIndex];
	if (!slot || slot.isDefeated) return [makeTrayChip('details', 'Details')];
	const chips = [
		makeTrayChip('attack', 'Attack', attackReason(state, playerId, slotIndex, slot)),
		makeTrayChip('quest', 'Quest', questReason(state, playerId, slotIndex)),
	];
	const ability = getAbilityChip(state, playerId, slotIndex);
	if (ability) chips.push(ability);
	chips.push(makeTrayChip('details', 'Details'));
	return chips;
}
