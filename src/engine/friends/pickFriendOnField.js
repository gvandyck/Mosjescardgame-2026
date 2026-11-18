// pickFriendOnField - the friend on your field a card means when it picks no Mosje.
// { none: true } | { slotIndex } | { needChoice } (two or more; the answer comes back in _pendingTargets[key]).
// Only an answer that is one of the offered options counts; the key is cleared once read.
import { friendSlotsOnField } from './friendSlotsOnField.js';

export function pickFriendOnField(state, playerId, names, key, prompt) {
	const slots = friendSlotsOnField(state, playerId, names);
	if (!slots.length) return { none: true };
	if (slots.length === 1) return { slotIndex: slots[0] };
	const player = state.players[playerId];
	const raw = player._pendingTargets?.[key];
	const given = raw && typeof raw === 'object' ? raw.slotIndex : raw; // a pause answer is the option object
	if (player._pendingTargets) delete player._pendingTargets[key];
	if (slots.includes(given)) return { slotIndex: given };
	const options = slots.map(slotIndex => ({ label: player.activeSlots[slotIndex].name, slotIndex }));
	return { needChoice: { playerId, choiceKind: 'ownMosje', key, options, prompt } };
}
