// finishDrawStep — settle state.pendingDrawStep. choices = { use: [mosjeId, ...], [mosjeId]: {inputs} }.
// Each used draw-step entry runs (run(state, { playerId, choices }) -> state | { state, replacesDraw });
// without a replacing option the normal draw happens, then the rest of the turn start.
import { MOSJE_TRIGGERS } from './mosjeTriggers.js';
import { finishStartTurn } from '../turnManager.js';

export function finishDrawStep(state, playerId, choices = {}) {
	const pending = state.pendingDrawStep;
	if (!pending || pending.playerId !== playerId) return { ok: false, success: false, state, error: 'No draw step to finish' };
	let s = JSON.parse(JSON.stringify(state));
	delete s.pendingDrawStep;
	let skipDraw = false;
	for (const mosjeId of choices.use || []) {
		if (!pending.options.some(o => o.mosjeId === mosjeId)) continue;
		const entry = MOSJE_TRIGGERS.drawStep.find(e => e.mosjeId === mosjeId);
		if (!entry) continue;
		const res = entry.run(s, { playerId, choices: choices[mosjeId] || {} });
		if (res?.state) { s = res.state; if (res.replacesDraw) skipDraw = true; }
		else if (res?.players) s = res;
	}
	return { ok: true, success: true, state: finishStartTurn(s, playerId, { skipDraw }) };
}
