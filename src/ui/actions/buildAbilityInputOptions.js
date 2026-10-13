// buildAbilityInputOptions — the option list for ONE ability input (one rules `inputs[]` entry).
// Returns { title, options:[{ id, label, value, metaLabel?, disabled? }] }; `value` is what the ability reads
// from _pendingTargets[key]. List kinds only (orderTopN / pickFromTopN go through pickCardOrder).
// Hidden info: oppHandCard lists the opponent's hand, so this must only run in the acting player's client.
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

const nameOf = (cardId) => toGraveyardEntry(cardId, 'x').name;
const typeOf = (cardId) => toGraveyardEntry(cardId, 'x').type;
const withIds = (rows) => rows.map((r, i) => ({ id: String(i), ...r }));
export const opponentOf = (state, playerId) => Object.keys(state.players).find(id => id !== playerId);

const mosjeRows = (state, pid, { fresh = true } = {}) => (state.players[pid]?.activeSlots || [])
	.map((s, slotIndex) => ({ s, slotIndex }))
	.filter(({ s }) => s && !s.isDefeated)
	.map(({ s, slotIndex }) => ({
		label: s.name, value: slotIndex, metaLabel: `${s.mp} MP`,
		disabled: !fresh && s.entryProtected === true,
	}));

export function buildAbilityInputOptions(state, playerId, input, collected = {}) {
	const me = state.players[playerId];
	const oppId = opponentOf(state, playerId);
	switch (input.kind) {
		case 'ownMosje':
			return { title: 'Choose one of your Mosjes', options: withIds(mosjeRows(state, playerId)) };
		case 'oppMosje':
			// RULE-08: a fresh Mosje is safe from opponents.
			return { title: 'Choose an opponent Mosje', options: withIds(mosjeRows(state, oppId, { fresh: false })) };
		case 'anyMosje': {
			const rows = [playerId, oppId].flatMap(pid => mosjeRows(state, pid).map(r => ({ ...r, value: { playerId: pid, slotIndex: r.value }, label: `${r.label}${pid === playerId ? ' (yours)' : ''}` })));
			return { title: 'Choose a Mosje', options: withIds(rows) };
		}
		case 'choice':
			return { title: input.title || 'Choose', options: withIds(input.options.map(o => ({ label: String(o).replace(/^./, c => c.toUpperCase()), value: o }))) };
		case 'confirm':
			return { title: input.title || 'Confirm', options: withIds([{ label: 'Yes', value: true }, { label: 'No', value: false }]) };
		case 'number': {
			const rows = [];
			for (let v = input.min; v <= input.max; v += input.step || 1) rows.push({ label: String(v), value: v });
			return { title: input.title || 'Choose a number', options: withIds(rows) };
		}
		case 'deckOwner':
			return { title: 'Whose deck?', options: withIds([{ label: 'Your deck', value: playerId }, { label: "Opponent's deck", value: oppId }]) };
		case 'oppHandCard':
			return { title: "Pick a card from the opponent's hand", options: withIds((state.players[oppId]?.hand || []).map((c, i) => ({ label: nameOf(c.cardId), value: i }))) };
		case 'questStack':
			return { title: 'Choose a Quest stack', options: withIds(Object.keys(state.questStacks || {}).map(id => ({ label: id, value: id }))) };
		case 'ownPiecieSlot': {
			const rows = (me.piecieSlots || []).map((s, i) => ({ s, i })).filter(({ s }) => s && s.type === 'PIECIE' && !s.activated
				&& (input.filter !== 'faceDown' || s.faceDown)
				&& (input.filter !== 'placedThisTurn' || s.canActivateOnTurn === state.turnNumber + 1 || s.canActivateOnTurn === state.turnNumber))
				.map(({ s, i }) => ({ label: s.faceDown ? `Face-down Piecie (slot ${i + 1})` : nameOf(s.cardId), value: i }));
			return { title: 'Choose one of your Piecies', options: withIds(rows) };
		}
		case 'discardCard':
		case 'handCard': {
			const rows = (me.hand || []).map((c, i) => ({ c, i }))
				.filter(({ c }) => !input.filter || (c.type || typeOf(c.cardId)) === input.filter)
				.map(({ c, i }) => ({ label: nameOf(c.cardId), value: i }));
			return { title: input.count > 1 ? `Discard ${input.count} cards` : 'Choose a card from your hand', options: withIds(rows) };
		}
		default:
			return { title: 'Choose', options: [] };
	}
}
