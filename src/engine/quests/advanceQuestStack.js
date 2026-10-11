// advanceQuestStack — apply a win/fail to a stack (E17). Win or 2nd token retires the face-up Quest.
import { shuffleDeck } from '../deckEngine.js';

export function advanceQuestStack(state, stackId, outcome, shuffle = shuffleDeck) {
	const stack = state.questStacks[stackId];
	if (outcome === 'fail' && stack.tokens < 1) {
		state.questStacks[stackId] = { ...stack, tokens: stack.tokens + 1 };
		return state;
	}
	let discard = stack.faceUp ? [...stack.discard, stack.faceUp] : [...stack.discard];
	let deck = [...stack.deck];
	if (deck.length === 0) {
		deck = shuffle(discard);
		discard = [];
	}
	const faceUp = deck.length ? deck.shift() : null;
	state.questStacks[stackId] = { deck, faceUp, tokens: 0, discard };
	return state;
}
