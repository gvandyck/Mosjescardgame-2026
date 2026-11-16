// advanceQuestStack — after one attempt (win or fail, rules §6) the face-up Quest goes back into the stack,
// the stack is shuffled and a Quest is turned up. No fail tokens. `discard` stays an always-empty list (sync reads it).
import { shuffleDeck } from '../deckEngine.js';

export function advanceQuestStack(state, stackId, _outcome, shuffle = shuffleDeck) {
	const stack = state.questStacks[stackId];
	const pile = stack.faceUp ? [...stack.deck, stack.faceUp] : [...stack.deck];
	const deck = shuffle(pile);
	const faceUp = deck.length ? deck.shift() : null;
	state.questStacks[stackId] = { deck, faceUp, discard: [] };
	return state;
}
