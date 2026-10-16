// runSnelleEffect - runs one Snelle effect with ctx { reaction, resume }. An effect returns a state, or
// { state, needChoice: { playerId, key, options, choiceKind?, prompt? } }. No option ends the effect; otherwise the play
// pauses on state.pendingChoice (hook 'snelle') and resumeSnelleChoice carries on after the answer. Returns { state, paused }.
import * as snelleEffects from '../../abilities/snelleEffects.js';

export function runSnelleEffect(state, playerId, cardDef, ctx = {}, cardId = cardDef.id) {
	const fn = snelleEffects[cardDef.effectId];
	if (typeof fn !== 'function') {
		console.warn(`[ENGINE] No snelle effect function found for: ${cardDef.effectId}`);
		return { state, paused: false };
	}
	const res = fn(state, playerId, ctx);
	const nc = res && typeof res === 'object' ? res.needChoice : null;
	if (!nc) return { state: res && res.players ? res : (res?.state || state), paused: false };
	const next = res.state || state;
	if (!nc.options?.length) return { state: next, paused: false };
	next.pendingChoice = {
		hook: 'snelle', playerId: nc.playerId, actorId: playerId, key: nc.key, options: nc.options,
		choiceKind: nc.choiceKind, prompt: nc.prompt, ctx: JSON.parse(JSON.stringify({ reaction: ctx.reaction || null })),
		snelle: { cardDef: JSON.parse(JSON.stringify(cardDef)), cardId },
	};
	return { state: next, paused: true };
}
