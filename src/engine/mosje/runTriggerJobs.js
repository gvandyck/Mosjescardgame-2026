// runTriggerJobs — runs a prepared list of trigger jobs [{ triggerIdx, playerId, slotIndex }] in order,
// starting at `start`. Used by runMosjeTriggers and (to resume after a choice) resolvePendingChoice.
// A job may return state, { state }, or { needChoice, state? }; questWinAmount jobs return a number
// or { amount, state }. Returns state, or { state, amount } for the questWinAmount hook.
import { MOSJE_TRIGGERS } from './mosjeTriggers.js';
import { canMosjeAct } from '../mp/canMosjeAct.js';

const MAX_AUTO_PICKS = 3;

export function runTriggerJobs(state, hook, jobs, start, ctx, resume = null) {
	let amount = ctx.amount;
	for (let i = start; i < jobs.length; i++) {
		const job = jobs[i];
		const entry = MOSJE_TRIGGERS[hook]?.[job.triggerIdx];
		const slot = state.players[job.playerId]?.activeSlots?.[job.slotIndex];
		if (!entry || !slot || slot.isDefeated || slot.cardId !== entry.mosjeId || !canMosjeAct(slot)) continue;
		let tctx = { ...ctx, amount, ownerId: job.playerId, holderSlotIndex: job.slotIndex };
		if (resume && i === start) tctx.resume = true;
		const autoKeys = [];
		for (let pick = 0; ; pick++) {
			const res = entry.run(state, tctx);
			if (res && typeof res === 'object' && res.needChoice && hook !== 'questWinAmount') {
				if (res.state) state = res.state;
				const nc = res.needChoice;
				const options = nc.options || [];
				if (options.length === 0) break; // nothing to choose: the trigger fizzles
				const target = state.players[nc.playerId];
				tctx = { ...tctx, ...(nc.ctx || {}), resume: true };
				if (options.length === 1 && pick < MAX_AUTO_PICKS) {
					target._pendingTargets = { ...(target._pendingTargets || {}), [nc.key]: options[0] };
					autoKeys.push([nc.playerId, nc.key]);
					continue; // auto-pick: run again with the single option
				}
				state.pendingChoice = {
					playerId: nc.playerId, choiceKind: nc.choiceKind, options, key: nc.key,
					triggerId: `${hook}:${entry.mosjeId}`, hook, jobs, jobIndex: i,
					ctx: JSON.parse(JSON.stringify(tctx)),
				};
				return state;
			}
			if (hook === 'questWinAmount') {
				if (typeof res === 'number') amount = res;
				else if (res && typeof res === 'object') {
					if (res.state) state = res.state;
					if (typeof res.amount === 'number') amount = res.amount;
				}
			} else if (res && typeof res === 'object') {
				state = res.players ? res : (res.state || state);
			}
			break;
		}
		for (const [pid, key] of autoKeys) delete state.players[pid]?._pendingTargets?.[key];
		if (resume && i === start) {
			const t = state.players[resume.playerId]?._pendingTargets;
			if (t) delete t[resume.key]; // the chosen value is consumed once
		}
	}
	return hook === 'questWinAmount' ? { state, amount } : state;
}
