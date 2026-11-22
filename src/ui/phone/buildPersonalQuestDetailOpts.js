// buildPersonalQuestDetailOpts.js - the options of a Personal Quest's detail view (72-04 on desktop, 72.1-05 on the phone Details):
// one Play action, disabled with the engine's reason when it cannot be played now. Pure: reads the state, builds an object, no DOM.
// Returns { actions: [{ id, label, disabled, title, onClick }], reason } for modalManager's showCardPreview.
import { getPersonalQuestPlayState } from '../personalQuests/getPersonalQuestPlayState.js';

export function buildPersonalQuestDetailOpts({ card, state, playerId, isLocalTurn, onPlay }) {
	const st = state ? getPersonalQuestPlayState(state, playerId, card.cardId, { isLocalTurn }) : { ok: false, reason: '' };
	const canPlay = Boolean(onPlay) && st.ok;
	const reason = canPlay ? '' : (st.reason || 'It cannot be played now');
	return {
		actions: [{ id: 'play', label: 'Play', disabled: !canPlay, title: reason, onClick: () => onPlay(card.cardId, card.type) }],
		reason,
	};
}
