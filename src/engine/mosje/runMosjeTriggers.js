// runMosjeTriggers — fire one MOSJE_TRIGGERS hook for the Mosjes it belongs to.
// Owner of the field: oppStartOfTurn = every non-active player; placeDestroyed = ctx.destroyingPlayerId;
// all other hooks = ctx.playerId (default: the active player); entry.onOpponent = the other players. Returns state, or { state, amount }
// for questWinAmount (ctx.amount is the running amount). No registered trigger = same state back.
import { MOSJE_TRIGGERS } from './mosjeTriggers.js';
import { runTriggerJobs } from './runTriggerJobs.js';

function ownersOf(state, hook, ctx, entry) {
	if (entry.onOpponent) return Object.keys(state.players).filter(id => id !== (ctx.playerId ?? state.activePlayerId));
	if (hook === 'oppStartOfTurn') return Object.keys(state.players).filter(id => id !== state.activePlayerId);
	if (hook === 'placeDestroyed') return [ctx.destroyingPlayerId];
	return [ctx.playerId ?? state.activePlayerId];
}

export function runMosjeTriggers(state, hook, ctx = {}) {
	const entries = MOSJE_TRIGGERS[hook] || [];
	const done = (s) => (hook === 'questWinAmount' ? { state: s, amount: ctx.amount } : s);
	if (!entries.length) return done(state);
	const jobs = [];
	entries.forEach((entry, triggerIdx) => {
		for (const playerId of ownersOf(state, hook, ctx, entry)) {
			(state.players[playerId]?.activeSlots || []).forEach((slot, slotIndex) => {
				if (slot && slot.cardId === entry.mosjeId && !slot.isDefeated) jobs.push({ triggerIdx, playerId, slotIndex });
			});
		}
	});
	if (!jobs.length) return done(state);
	return runTriggerJobs(JSON.parse(JSON.stringify(state)), hook, jobs, 0, ctx);
}
