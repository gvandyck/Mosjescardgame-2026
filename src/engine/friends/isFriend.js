// isFriend - is this Mosje (a slot or a card id) one of the named friends? Names compare without case; any name matches.
// The three friend forms of rules section 9 (D-06), one helper each:
//   "A <Friend> ..."                 -> isFriend on the Mosje the card picked.
//   "With a <Friend> on your field"  -> friendSlotsOnField(...).length > 0.
//   "On a <Friend>" (gear)           -> isFriend on the Mosje the gear is attached to.
//   "A <Friend> also" (no Mosje picked) -> pickFriendOnField.
import { getFriends } from './getFriends.js';

export function isFriend(slotOrCardId, names) {
	if (!slotOrCardId) return false;
	const cardId = typeof slotOrCardId === 'string' ? slotOrCardId : slotOrCardId.cardId;
	if (typeof slotOrCardId !== 'string' && slotOrCardId.isDefeated) return false;
	const wanted = (names || []).map(n => String(n).toLowerCase());
	return getFriends(cardId).some(f => wanted.includes(f.toLowerCase()));
}
