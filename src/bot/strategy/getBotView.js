// getBotView - the table view of one seat (BOT-04): what `botId` can see, every count and position unchanged.
// Hidden: the opponent's hand (except cards revealed to the bot THIS turn), both decks, the Quest stack decks, the
// opponent's face-down Piecie ids, revealed[opponent], the opponent's pending pick/reaction options and _pendingTargets.
// Built so hidden data is never read: a NEW object is assembled from public parts (only `.length` of hidden arrays is
// read), then JSON-cloned, so the caller's state is untouched. A stand-in keeps a string cardId ('hidden_card') so
// engine string operations never crash on it.
import { getRevealedFor } from '../../engine/hidden/getRevealedFor.js';

const HIDDEN = { cardId: 'hidden_card', type: 'HIDDEN', hidden: true };
const standIns = (n) => Array.from({ length: n > 0 ? n : 0 }, () => HIDDEN);

// The opponent's hand: stand-ins, except cards that are still in the multiset of ids revealed to the bot.
function openHand(hand, seenIds) {
	if (!seenIds.length) return standIns(hand.length);
	const left = new Map();
	for (const id of seenIds) left.set(id, (left.get(id) || 0) + 1);
	return hand.map((card) => {
		const n = left.get(card.cardId) || 0;
		if (!n) return HIDDEN;
		left.set(card.cardId, n - 1);
		return card;
	});
}

// A face-down slot keeps what the table shows (back, state, timing) but never its id. Built field by field, never spread.
function coverSlot(slot, atTable) {
	if (!slot || slot.faceDown !== true || atTable) return slot;
	return { cardId: HIDDEN.cardId, hidden: true, type: slot.type, faceDown: true, activated: slot.activated, playedOnTurn: slot.playedOnTurn, canActivateOnTurn: slot.canActivateOnTurn };
}

function coverPlayer(p, id, seenIds, shown) {
	const q = { ...p };
	delete q._pendingTargets;
	if (p.hand) q.hand = openHand(p.hand, seenIds);
	if (p.deck) q.deck = standIns(p.deck.length);
	if (p.piecieSlots) q.piecieSlots = p.piecieSlots.map((s, i) => coverSlot(s, shown && shown[0] === id && shown[1] === i));
	return q;
}

export function getBotView(state, botId) {
	if (!state || typeof state !== 'object') return state;
	const out = { ...state };
	const seenIds = getRevealedFor(state, botId).flatMap((e) => e.cardIds || []);
	const pr = state.pendingReaction;
	const shown = pr && pr.action && pr.action.type === 'activatePiecie' ? pr.action.args : null; // [ownerId, slotIndex]: face-up at the table
	if (state.players) {
		out.players = {};
		for (const [id, p] of Object.entries(state.players)) {
			if (id !== botId) out.players[id] = coverPlayer(p, id, seenIds, shown);
			else out.players[id] = p.deck ? { ...p, deck: standIns(p.deck.length) } : { ...p };
		}
	}
	if (state.questStacks) {
		out.questStacks = {};
		for (const [id, stack] of Object.entries(state.questStacks)) out.questStacks[id] = { ...stack, deck: standIns(stack?.deck?.length ?? 0) };
	}
	if (state.revealed) out.revealed = state.revealed[botId] ? { [botId]: state.revealed[botId] } : {};
	const pc = state.pendingChoice;
	if (pc && pc.playerId !== botId) out.pendingChoice = { ...pc, options: [], ...(pc.after?.p ? { after: { ...pc.after, p: { ...pc.after.p, eligible: [] } } } : {}) };
	if (pr && pr.responderId !== botId) out.pendingReaction = { ...pr, eligible: [] };
	const view = JSON.parse(JSON.stringify(out));
	view.__botView = botId;
	return view;
}
