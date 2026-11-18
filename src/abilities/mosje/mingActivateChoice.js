// Ming, The Natural (second half), as a MOSJE_TRIGGERS 'mingActivate' entry so the owner's answer can pause (pendingChoice).
// The card Ming just drew is in the hand. If it is a Piecie whose activation is allowed now (piecieActivationGate: Needs,
// Level, Attach target), the owner may activate it at once for 0 Energy as if ready, or keep it in the hand. First option is
// "activate". A refused activation leaves the card in the hand. A free activation opens no reaction window.
import { PIECIES } from '../../data/piecies.js';
import { piecieActivationGate } from '../../engine/table/piecieActivationGate.js';
import { activatePiecieFree } from '../../engine/table/activatePiecieFree.js';

const KEY = 'ming_activate';
export const MING_ACTIVATE = { label: 'Activate it for 0 Energy', choice: 'activate' };
export const MING_KEEP = { label: 'Keep it in your hand', choice: 'keep' };

export const mingActivateChoice = {
	mosjeId: 'mosje_ming_natural',
	run(state, ctx) {
		const player = state.players[ctx.ownerId];
		const def = PIECIES.find(p => p.id === ctx.cardId);
		if (!def || !player.hand.some(c => c.cardId === ctx.cardId) || piecieActivationGate(state, ctx.ownerId, def)) return state;
		const pick = player._pendingTargets?.[KEY];
		if (pick === undefined) {
			return { state, needChoice: { playerId: ctx.ownerId, choiceKind: 'mingActivate', key: KEY, options: [MING_ACTIVATE, MING_KEEP], prompt: `Ming drew ${def.name}` } };
		}
		if (player._pendingTargets) delete player._pendingTargets[KEY];
		if (pick.choice !== 'activate') return state;
		const res = activatePiecieFree(state, ctx.ownerId, { card: ctx.cardId, from: 'hand' }, { source: 'ming_natural', skipReactions: true });
		return res.success ? res.state : state;
	},
};
