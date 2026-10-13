// Tuk "The Builder", The Sims Architect - Perfect Placement: once per turn, pay 1 Energy (charged by useMosjeAbility):
// look at the top 5 cards of your deck, put 2 in your hand and the rest on the bottom in any order.
// Inputs (state._pendingTargets): pick = the 2 chosen indices into the top N; order = the new order of the rest
// (indices into the remaining cards, in their original order). Without order the rest keep their order.
export function tukArchitectPerfectPlacement(gameState, playerId, mosjeId = 'mosje_tuk_architect') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player?.activeSlots.some(s => s && !s.isDefeated && s.cardId === mosjeId)) throw new Error('Tuk is not on the field');
	const targets = state._pendingTargets || {};
	const n = Math.min(5, player.deck.length);
	const want = Math.min(2, n);
	const pick = targets.pick;
	const okPick = Array.isArray(pick) && pick.length === want && new Set(pick).size === want && pick.every(i => Number.isInteger(i) && i >= 0 && i < n);
	if (!okPick) throw new Error('Perfect Placement: choose 2 of the top 5 cards');
	const top = player.deck.slice(0, n);
	const rest = top.filter((_, i) => !pick.includes(i));
	const order = targets.order;
	const okOrder = Array.isArray(order) && order.length === rest.length && [...order].sort((a, b) => a - b).every((v, i) => v === i);
	if (order !== undefined && !okOrder) throw new Error('Perfect Placement: put the other cards on the bottom in some order');
	const bottom = okOrder ? order.map(i => rest[i]) : rest;
	player.hand.push(...pick.map(i => top[i]));
	player.deck = [...player.deck.slice(n), ...bottom];
	delete targets.pick; delete targets.order;
	return state;
}
