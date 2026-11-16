// runPiecieEffect - runs one Piecie effect with ctx { slotIndex, free, resume } (effects keep (state, playerId, ctx);
// old 2-argument bodies just ignore ctx). An effect returns a state, or { state, needChoice: { playerId, key, options,
// choiceKind, prompt?, ctx? } }. One option is auto-picked (max 3), no option ends the effect, otherwise the
// activation pauses on state.pendingChoice (hook 'piecie') and resumePiecieChoice carries on after the answer.
// Dubbele Temminks: when its reactionMods entry is set, a finished effect runs a second time (the second run may pause too).
// extra: { after, autoKeys } - saved into the pause so the post-effect half runs once, after the last answer.
// Returns { state, paused }.
import * as piecieEffects from '../../abilities/piecieEffects.js';
import { takeHeldMod } from '../reactions/takeHeldMod.js';
import { withAttach } from '../attachments/withAttach.js';
import { withCosts } from '../costs/withCosts.js';
import { isCombo } from '../keywords/isCombo.js';
import { runKeywordHook } from '../keywords/runKeywordHook.js';

const MAX_AUTO_PICKS = 3;

function runOnce(state, playerId, cardDef, ctx, extra) {
	const own = piecieEffects[cardDef.effectId];
	if (typeof own !== 'function') console.warn(`[ENGINE] No effect function found for: ${cardDef.effectId}`);
	// An Attach card moves onto a Mosje first (attachStep), then the price is paid (costStep), then its own effect runs, if it has one.
	const priced = cardDef.activationCost?.length ? withCosts(own, cardDef) : own;
	const fn = cardDef.attach ? withAttach(priced, cardDef) : priced;
	if (typeof fn !== 'function') return { state, paused: false };
	const autoKeys = [...(extra.autoKeys || [])];
	let tctx = { ...ctx };
	for (let pick = 0; ; pick++) {
		const res = fn(state, playerId, tctx);
		const nc = res && typeof res === 'object' ? res.needChoice : null;
		if (nc) {
			if (res.state) state = res.state;
			const options = nc.options || [];
			if (options.length === 0) break; // nothing to choose: the effect ends
			tctx = { ...tctx, ...(nc.ctx || {}), resume: true };
			const chooser = state.players[nc.playerId];
			if (options.length === 1 && pick < MAX_AUTO_PICKS) {
				chooser._pendingTargets = { ...(chooser._pendingTargets || {}), [nc.key]: options[0] };
				autoKeys.push([nc.playerId, nc.key]);
				continue; // auto-pick: run again with the single option
			}
			const saved = JSON.parse(JSON.stringify(tctx));
			delete saved.resume;
			state.pendingChoice = {
				hook: 'piecie', playerId: nc.playerId, actorId: playerId, key: nc.key, options,
				choiceKind: nc.choiceKind, prompt: nc.prompt, ctx: saved,
				piecie: {
					cardDef: JSON.parse(JSON.stringify(cardDef)), slotIndex: ctx.slotIndex, free: ctx.free === true,
					after: extra.after || null, autoKeys, copy: extra.copy === true,
				},
			};
			return { state, paused: true };
		}
		if (res && typeof res === 'object') state = res.players ? res : (res.state || state);
		break;
	}
	for (const [pid, key] of autoKeys) delete state.players[pid]?._pendingTargets?.[key];
	return { state, paused: false };
}

export function runPiecieEffect(state, playerId, cardDef, ctx = {}, extra = {}) {
	const out = runWithCombo(state, playerId, cardDef, { ...ctx, combo: extra.copy !== true && isCombo(state, playerId) }, extra);
	// Combo (70-07): the card's combo hook runs once, when the effect is completely done and this was the 2nd Piecie
	if (!out.paused && out.state && extra.copy !== true && isCombo(out.state, playerId)) {
		out.state = runKeywordHook(out.state, 'combo', cardDef.id, { playerId, slotIndex: ctx.slotIndex, free: ctx.free === true, combo: true });
	}
	return out;
}

function runWithCombo(state, playerId, cardDef, ctx, extra) {
	const first = runOnce(state, playerId, cardDef, ctx, extra);
	if (first.paused) return first;
	state = first.state;
	// Dubbele Temminks never doubles the attach itself (a second run would attach the same card twice): it is used up.
	if (takeHeldMod(state, 'double', playerId) && !cardDef.attach) {
		// The second run picks its targets again (same or new): every pick of the first run is used up.
		for (const pl of Object.values(state.players)) pl._pendingTargets = {};
		// The price is paid once: the second run skips the cost step (costPaidBy is not carried over).
		const second = runOnce(state, playerId, cardDef, { ...ctx, resume: false, ...(cardDef.activationCost?.length ? { costPaid: true } : {}) }, { after: extra.after, copy: extra.copy });
		console.log('[ENGINE] Dubbele Temminks: effect triggered twice');
		return second;
	}
	return { state, paused: false };
}
