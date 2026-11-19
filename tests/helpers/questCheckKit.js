// questCheckKit — before/after checks for the Quest card-test registry (tests/ui/cards/quest-registry-2-0.js).
// Each builder returns (before, after) => void that throws on a mismatch; `expect.check` runs it in tests/helpers/mosjeCardTest.js.
// 2.1 rule: after one attempt (win or fail) the Quest is shuffled back into its stack and a Quest is turned up (no fail tokens);
// "no attempt" means no action used, nothing paid, the face-up Quest unchanged.
const mine = (s) => s.players.player_1;
const fail = (msg) => { throw new Error(msg); };
const json = (x) => JSON.stringify(x);

/** Run several checks in order. */
export const all = (...fns) => (before, after) => { for (const f of fns) if (f) f(before, after); };

/** One attempt (win or fail, rules section 6): the Quest is shuffled back, so the stack still has a face-up Quest and as many cards as before. It may be the same Quest again. */
const shuffledBack = (stack) => (before, after) => {
	const count = (st) => (st.deck?.length || 0) + (st.faceUp ? 1 : 0);
	const st = after.questStacks[stack];
	if (!st.faceUp) fail('no Quest is face-up after the attempt');
	if (count(st) !== count(before.questStacks[stack])) fail(`stack has ${count(st)} Quests, expected ${count(before.questStacks[stack])}`);
	if (st.tokens) fail('a fail token was placed (tokens are gone)');
};

/** Won: the attempt shuffled the Quest back into its stack (the same Quest can come up again). */
export const replaced = (stack, _id) => shuffledBack(stack);

/** Failed: the same as a win for the stack, a Quest is shuffled back after any one attempt; no fail token. */
export const tokenOne = (stack, _id) => shuffledBack(stack);

/** These cards are in the acting player's discard pile (paid costs, discarded cards). */
export const discarded = (...ids) => (before, after) => {
	for (const id of ids) if (!mine(after).graveyard.some(g => g.cardId === id)) fail(`${id} is not in the discard pile`);
};

/** Piecie slot i is empty (the Piecie was discarded from the field). */
export const slotEmpty = (i) => (before, after) => { if (mine(after).piecieSlots[i]) fail(`Piecie slot ${i} is not empty`); };

/** No attempt: no fail token, the face-up Quest is unchanged, the Mosje still has its action. */
export const noAttempt = (stack) => (before, after) => {
	if (mine(after).activeSlots[0].actedThisTurn) fail('the Mosje used its action');
	if (after.questStacks[stack].tokens) fail('a fail token was placed');
	if (after.questStacks[stack].faceUp !== before.questStacks[stack].faceUp) fail('the face-up Quest changed');
};

/** Nothing happened at all: no attempt, and MP, hand, discard pile, Piecie slots and Energy are unchanged (nothing was paid). */
export const untouched = (stack) => (before, after) => {
	const b = mine(before), a = mine(after);
	noAttempt(stack)(before, after);
	if (a.activeSlots[0].mp !== b.activeSlots[0].mp) fail('MP changed');
	for (const k of ['hand', 'graveyard', 'piecieSlots', 'energy']) if (json(a[k]) !== json(b[k])) fail(`${k} changed`);
};

/** The ids of the top n cards of the acting player's draw deck, in order. */
export const deckTopIs = (ids) => (before, after) => {
	const top = mine(after).deck.slice(0, ids.length).map(c => c?.cardId ?? c);
	if (json(top) !== json(ids)) fail(`deck top is ${json(top)}, expected ${json(ids)}`);
};

/** The draw deck is n cards shorter than before. */
export const deckShorterBy = (n) => (before, after) => {
	const d = mine(before).deck.length - mine(after).deck.length;
	if (d !== n) fail(`deck is ${d} cards shorter, expected ${n}`);
};
