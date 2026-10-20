// settleMosjePauses — answers the Mosje pauses (pendingChoice, pendingDrawStep) that belong to a bot,
// so the game can never stall on them. Stops at a human's pause. Returns { state, waiting }.
// Bot answer: first legal option for a choice; the normal draw (no draw-step ability) for a draw step.
import { resolvePendingChoice } from '../engine/mosje/resolvePendingChoice.js';
import { chooseTriggerChoice } from './strategy/chooseTriggerChoice.js';
import { finishDrawStep } from '../engine/mosje/finishDrawStep.js';
import { emitBotMetric } from './strategy/emitBotMetric.js';

export function settleMosjePauses(state, humanIds = []) {
	for (let n = 0; n < 12 && (state.pendingChoice || state.pendingDrawStep); n++) {
		if (state.pendingChoice) {
			if (humanIds.includes(state.pendingChoice.playerId)) return { state, waiting: true };
			const r = resolvePendingChoice(state, chooseTriggerChoice(state, state.pendingChoice.playerId) ?? state.pendingChoice.options[0]);
			if (r.ok) { state = r.state; continue; }
			emitBotMetric('engine-refused', { call: 'resolvePendingChoice', cardId: state.pendingChoice.key, error: r.error }); // BOT-02: the bot's answer was refused
			state = { ...state }; delete state.pendingChoice; // malformed: never loop
			continue;
		}
		if (humanIds.includes(state.pendingDrawStep.playerId)) return { state, waiting: true };
		const r = finishDrawStep(state, state.pendingDrawStep.playerId, {});
		if (r.ok) { state = r.state; continue; }
		emitBotMetric('engine-refused', { call: 'finishDrawStep', cardId: null, error: r.error }); // BOT-02
		state = { ...state }; delete state.pendingDrawStep;
	}
	return { state, waiting: false };
}
