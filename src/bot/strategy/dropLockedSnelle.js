// dropLockedSnelle - a table view whose pendingReaction.eligible no longer lists a Snelle the bot holds only as copies
// TemPiecie locked this turn (the engine refuses to play one: "you can't place or play that card this turn").
// The bot sees its own hand, so it could have known. Window ids with a ':' (djReroll:i) are not hand cards and stay,
// and so does an id the hand does not show. Called by chooseReaction with the bot's table view (BOT-04), never with the raw state.
import { turnLockKey } from '../../engine/hand/turnLockKey.js';

export function dropLockedSnelle(table, botId) {
	const p = table.pendingReaction;
	if (!p || !Array.isArray(p.eligible)) return table;
	const hand = table.players?.[botId]?.hand || [];
	const key = turnLockKey(table);
	const usable = (id) => {
		const copies = hand.filter(c => c.cardId === id);
		return copies.length === 0 || copies.some(c => c.lockedTurn !== key);
	};
	if (p.eligible.every(usable)) return table;
	return { ...table, pendingReaction: { ...p, eligible: p.eligible.filter(usable) } };
}
