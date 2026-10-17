// questCheckKit — before/after checks for the Quest card-test registry (tests/ui/cards/quest-registry-2-0.js).
// Each builder returns (before, after) => void that throws on a mismatch; `expect.check` runs it in tests/helpers/mosjeCardTest.js.
// The rules come from the Card List Quest intro: a failed attempt puts a token on the Quest; a Quest is replaced when it is won
// or has 2 tokens; "no attempt" means no token, no action used, nothing paid.
const mine = (s) => s.players.player_1;
const fail = (msg) => { throw new Error(msg); };
const json = (x) => JSON.stringify(x);

/** Run several checks in order. */
export const all = (...fns) => (before, after) => { for (const f of fns) if (f) f(before, after); };

/** Won: the Quest left its stack's face-up spot and no token is left on a new one. */
export const replaced = (stack, id) => (before, after) => {
	if (after.questStacks[stack].faceUp === id) fail(`${id} is still face-up after a win`);
};

/** Failed once: the same Quest stays face-up with exactly 1 token. */
export const tokenOne = (stack, id) => (before, after) => {
	const st = after.questStacks[stack];
	if (st.faceUp !== id) fail(`${id} was replaced after one failure`);
	if (st.tokens !== 1) fail(`expected 1 fail token, got ${st.tokens}`);
};

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
