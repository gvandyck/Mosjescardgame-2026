// createHandRaise.js — the phone tap-raise state machine (Phase 65-06, D-10). The first tap on a hand card RAISES it and plays nothing;
// only play() plays, and only when getHandCardState says the card can be played right now. At most one card is raised at a time.
// No DOM, no engine calls: everything the outside world sees goes through `effects` (renderRaiseDock draws the view, a toast shows
// a rejection) and the callbacks given to configure(). A view is { cardId, card, info } (info = getHandCardState) or null.
// configure({ onPlay(cardId, type), onDetails(card), getContext() }): getContext() -> { state, localPlayerId, isLocalTurn, cards }.
// refresh() recomputes the raised view from the CURRENT context (call it after every render); with nothing raised it does nothing,
// so the desktop, which never raises, never sees an effect.
import { getHandCardState } from './getHandCardState.js';

export function createHandRaise({ effects = {} } = {}) {
	let hooks = { onPlay: null, onDetails: null, getContext: null };
	let raisedId = null;

	function viewOf(cardId) {
		const ctx = hooks.getContext ? hooks.getContext() : null;
		const card = (ctx?.cards || []).find((c) => c.cardId === cardId);
		if (!card) return null;
		const info = getHandCardState({ state: ctx.state, playerId: ctx.localPlayerId, card, isLocalTurn: !!ctx.isLocalTurn });
		return { cardId, card, info };
	}

	function show(view) {
		if (typeof effects.onView === 'function') effects.onView(view);
	}

	function cancel() {
		if (raisedId === null) return;
		raisedId = null;
		show(null);
	}

	function toggle(cardId) {
		if (cardId === undefined || cardId === null) return; // a hand entry without a card id (unknown card) cannot be raised
		if (cardId === raisedId) { cancel(); return; }
		const view = viewOf(cardId);
		if (!view) return; // not in the hand: ignore
		raisedId = cardId;
		show(view);
	}

	function play() {
		const view = raisedId === null ? null : viewOf(raisedId);
		if (!view) return;
		if (!view.info.canPlay) {
			if (typeof effects.onReject === 'function') effects.onReject(view.info.reason);
			return;
		}
		raisedId = null;
		show(null); // the raise ends first, so a modal the play opens (a target pick) never sits under a stale dock
		if (typeof hooks.onPlay === 'function') hooks.onPlay(view.cardId, view.card.type);
	}

	function details() {
		const view = raisedId === null ? null : viewOf(raisedId);
		if (view && typeof hooks.onDetails === 'function') hooks.onDetails(view.card);
	}

	function refresh() {
		if (raisedId === null) return;
		const view = viewOf(raisedId);
		if (!view) raisedId = null; // the card left the hand
		show(view);
	}

	return {
		configure: (next = {}) => { hooks = { ...hooks, ...next }; },
		toggle,
		cancel,
		play,
		details,
		refresh,
		current: () => (raisedId === null ? null : viewOf(raisedId)),
	};
}
