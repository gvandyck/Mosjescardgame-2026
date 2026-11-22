// describeReactionTargetMp.js - 72.1-12: the second half of the phone reaction line. On a phone the bottom sheet covers the player's
// own Mosjes, so for an attack window it also states the attacked Mosje's current MP: "Alyssa has 60 MP." Any other window, or a
// missing target, returns ''. Pure: reads the state, never changes it.
import { parseMosjeName } from '../cardV1/parseMosjeName.js';

export function describeReactionTargetMp(state) {
	const window = state?.pendingReaction;
	if (!window || window.action?.type !== 'attack') return '';
	const params = (window.action.args || [])[1];
	const target = state.players?.[params?.targetPlayerId]?.activeSlots?.[params?.targetSlotIndex];
	if (!target || typeof target.mp !== 'number') return '';
	return `${parseMosjeName(target.name).firstName} has ${target.mp} MP.`;
}
