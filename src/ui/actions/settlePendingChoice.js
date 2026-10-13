// settlePendingChoice — settle the Mosje pauses (state.pendingChoice, state.pendingDrawStep): a prompt for the
// local human, a default answer for bots (settleMosjePauses). Returns the settled state. Never stalls a bot.
import { resolvePendingChoice } from '../../engine/mosje/resolvePendingChoice.js';
import { settleMosjePauses } from '../../bot/settleMosjePauses.js';
import { runDrawStepPrompt } from './runDrawStepPrompt.js';

const labelOf = (o) => (o !== null && typeof o === 'object') ? (o.label ?? o.name ?? JSON.stringify(o)) : String(o);

export async function settlePendingChoice({ state, localPlayerId, modal, humanIds = [localPlayerId] }) {
	for (let n = 0; n < 12 && (state.pendingChoice || state.pendingDrawStep); n++) {
		const pc = state.pendingChoice;
		if (pc && pc.playerId === localPlayerId) {
			const id = await modal.showOptionSelect({
				title: 'Choose', prompt: pc.prompt || '',
				options: pc.options.map((o, i) => ({ id: String(i), label: labelOf(o) })),
			});
			const r = resolvePendingChoice(state, pc.options[id == null ? 0 : Number(id)]);
			state = r.ok ? r.state : state;
			if (!r.ok) break;
			continue;
		}
		if (!pc && state.pendingDrawStep?.playerId === localPlayerId) {
			const next = await runDrawStepPrompt({ state, localPlayerId, modal });
			if (next === state) break;
			state = next;
			continue;
		}
		const out = settleMosjePauses(state, humanIds);
		state = out.state;
		if (out.waiting) break; // a remote human's pause: their client answers
	}
	return state;
}
