// hiddenTrap.js - makeTrapState(state, botId): a clone of `state` in which everything `botId` may not see is booby-trapped.
// The opponent hand, both decks and every Quest stack deck keep their real length but THROW on any element read
// (index get / has / descriptor, so map, filter, find, spread and JSON.stringify all trip). Each opponent face-down Piecie
// throws when its cardId is read, and revealed[opponentId] throws when read. A chooser that only works on a getBotView
// projection never touches a trap. Test helper (BOT-04), not a test file.
const isIndex = (prop) => typeof prop === 'string' && /^\d+$/.test(prop);

function hiddenArray(zone, length) {
	const boom = () => { throw new Error(`hidden read: ${zone}`); };
	return new Proxy([], {
		get(target, prop, receiver) { if (prop === 'length') return length; if (isIndex(prop)) boom(); return Reflect.get(target, prop, receiver); },
		has(target, prop) { if (isIndex(prop)) boom(); return Reflect.has(target, prop); },
		getOwnPropertyDescriptor(target, prop) { if (isIndex(prop)) boom(); return Reflect.getOwnPropertyDescriptor(target, prop); },
		ownKeys(target) { return [...Array.from({ length }, (_, i) => String(i)), ...Reflect.ownKeys(target)]; },
	});
}

export function makeTrapState(state, botId) {
	const trap = JSON.parse(JSON.stringify(state));
	const throwing = (what) => ({ enumerable: true, configurable: true, get() { throw new Error(`hidden read: ${what}`); } });
	for (const [id, player] of Object.entries(trap.players)) {
		if (player.deck) player.deck = hiddenArray(`${id} deck`, player.deck.length);
		if (id === botId) continue;
		if (player.hand) player.hand = hiddenArray(`${id} hand`, player.hand.length);
		(player.piecieSlots || []).forEach((slot, i) => {
			if (slot && slot.faceDown === true) Object.defineProperty(slot, 'cardId', throwing(`${id} face-down piecie ${i}`));
		});
		trap.revealed = trap.revealed || {};
		Object.defineProperty(trap.revealed, id, throwing(`revealed[${id}]`));
	}
	for (const [stackId, stack] of Object.entries(trap.questStacks || {})) {
		if (stack.deck) stack.deck = hiddenArray(`quest stack ${stackId} deck`, stack.deck.length);
	}
	return trap;
}
