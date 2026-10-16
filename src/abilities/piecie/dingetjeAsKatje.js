// dingetjeAsKatje - Gekke Vogels' "KatjeGang is also in play" can be met by discarding Dingetje toch?! (hand, or a
// ready placed one). Only asked when it would matter (needed = the pair is there, KatjeGang is not).
// Returns { ask, key, options, counts }: ask -> pause with options; counts -> the player discarded it (done on state).
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { isPiecieReady } from '../../engine/table/isPiecieReady.js';

const DINGETJE = 'piecie_dingetje_toch';
const KEY = 'gekke_dingetje';

export function dingetjeAsKatje(state, playerId, needed) {
	const none = { ask: false, counts: false };
	if (!needed) return none;
	const me = state.players[playerId];
	const inHand = (me.hand || []).findIndex(c => c.cardId === DINGETJE);
	const placed = (me.piecieSlots || []).findIndex(e => e?.cardId === DINGETJE && isPiecieReady(e, state.turnNumber));
	if (inHand < 0 && placed < 0) return none;
	const pick = me._pendingTargets?.[KEY];
	if (pick === undefined) {
		return { ask: true, key: KEY, options: [{ label: 'Yes, discard Dingetje toch?!', use: true }, { label: 'No', use: false }] };
	}
	delete me._pendingTargets[KEY];
	if (!pick.use) return none;
	if (inHand >= 0) me.hand.splice(inHand, 1);
	else me.piecieSlots[placed] = null;
	me.graveyard = [...(me.graveyard || []), toGraveyardEntry(DINGETJE, 'discarded')];
	return { ask: false, counts: true };
}
