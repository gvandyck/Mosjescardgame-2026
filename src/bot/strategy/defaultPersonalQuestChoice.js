// defaultPersonalQuestChoice - the bot's default `choice` for a Personal Quest: the engine's own defaults (first qualifying
// Piecies and hand cards), plus, for an "any amount of Energy" Pay, all the Energy the bot has rounded down to even.
import { getPersonalQuestDef } from '../../engine/personalQuests/getPersonalQuestDef.js';

export function defaultPersonalQuestChoice(state, playerId, cardId) {
	const def = getPersonalQuestDef(cardId);
	if (!(def?.pay || []).some(c => c.kind === 'energyAny')) return {};
	const energy = Number(state.players[playerId]?.energy) || 0;
	return { energy: energy - (energy % 2) };
}
