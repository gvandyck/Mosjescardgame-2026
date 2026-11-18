// getFriends - every friend name a Mosje card answers to: its own friend field, FRIEND_ALSO and the FRIEND_GROUPS it is in.
import { MOSJES } from '../../data/mosjes.js';
import { FRIEND_ALSO, FRIEND_GROUPS } from '../../rules/friendRules.js';

export function getFriends(cardId) {
	const def = MOSJES.find(m => m.id === cardId);
	if (!def) return [];
	const out = def.friend ? [def.friend] : [];
	for (const extra of FRIEND_ALSO[cardId] || []) out.push(extra);
	for (const [group, ids] of Object.entries(FRIEND_GROUPS)) if (ids.includes(cardId)) out.push(group);
	return out;
}
