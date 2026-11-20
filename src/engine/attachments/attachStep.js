// attachStep - the "move onto a Mosje" half of activating an Attach card. Asks which own Mosje (attach_mosje), and
// - only when that Mosje is full - which attached card to replace (attach_replace). Nothing changes until every answer
// is in the player's _pendingTargets. Then the card is attached, its Piecie slot is emptied and the two keys are removed.
// Returns { state, needChoice } while it needs an answer, { state, attachedTo } when done (attachedTo = Mosje slot
// index), or { state } when there is no Mosje to attach to.
import { attachToMosje } from './attachToMosje.js';
import { getMaxAttachments } from './getMaxAttachments.js';
import { toGraveyardEntry } from '../graveyardUtils.js';

const nameOf = (cardId) => toGraveyardEntry(cardId, 'discarded').name;

export function attachStep(state, playerId, ctx, cardDef) {
	const player = state.players[playerId];
	const targets = player._pendingTargets || {};
	const mosjes = (player.activeSlots || []).map((s, slotIndex) => ({ s, slotIndex })).filter(({ s }) => s && !s.isDefeated);
	if (mosjes.length === 0) return { state };

	const pick = targets.attach_mosje;
	if (pick === undefined) {
		const options = mosjes.map(({ s, slotIndex }) => ({ label: s.name, slotIndex }));
		return { state, needChoice: { playerId, choiceKind: 'ownMosje', key: 'attach_mosje', options, prompt: 'Attach to which Mosje?' } };
	}
	const slot = player.activeSlots[pick.slotIndex];
	let replaceIndex;
	if (slot && (slot.attachments || []).length >= getMaxAttachments(slot)) {
		const rpick = targets.attach_replace;
		if (rpick === undefined) {
			const options = slot.attachments.map((a, attachIndex) => ({ label: nameOf(a.cardId), attachIndex, cardId: a.cardId }));
			return { state, needChoice: { playerId, choiceKind: 'attachedCard', key: 'attach_replace', options, prompt: 'Replace which attached card?' } };
		}
		replaceIndex = rpick.attachIndex;
	}
	delete player._pendingTargets.attach_mosje;
	delete player._pendingTargets.attach_replace;
	const res = attachToMosje(state, playerId, pick.slotIndex, cardDef.id, { replaceIndex });
	if (!res.ok) return { state };
	if (Number.isInteger(ctx.slotIndex) && ctx.slotIndex >= 0) player.piecieSlots[ctx.slotIndex] = null;
	return { state, attachedTo: pick.slotIndex };
}
