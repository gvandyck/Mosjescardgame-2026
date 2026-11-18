// MagicPrompt: "Search your deck for a gear Piecie and put it in your hand. With a Gandoe on your field: it gains 10 MP."
// The search runs once (ctx.searchDone carries "done" across the friend pause); the MP gain also happens with no gear found.
// With two Gandoes (Wizard, DJ 80/20) the player picks which one gains.
import { searchDeckForTag } from '../searchDeckForTag.js';
import { gainFromPiecie } from '../gainFromPiecie.js';
import { pieceDef } from '../pieceDef.js';
import { cloneState } from '../cloneState.js';
import { pickFriendOnField } from '../../../engine/friends/pickFriendOnField.js';

export function effect_magicprompt(gameState, playerId, ctx = {}) {
	let state = cloneState(gameState);
	if (!ctx.searchDone) {
		const res = searchDeckForTag(state, playerId, 'gear', 'magicprompt_search', {});
		if (res.needChoice) return res;
		state = res.state;
	}
	const friend = pickFriendOnField(state, playerId, ['Gandoe'], 'magicprompt_friend', 'Which Gandoe gains 10 MP?');
	if (friend.needChoice) return { state, needChoice: { ...friend.needChoice, ctx: { searchDone: true } } };
	if (friend.none) return state;
	return gainFromPiecie(state, playerId, friend.slotIndex, 10, pieceDef('piecie_magicprompt'));
}
