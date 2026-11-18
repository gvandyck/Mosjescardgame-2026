// FPS West — Tactical Analysis (activated half): once per turn, pay 1 Energy (useMosjeAbility): look at the opponent's
// whole hand (a Personal Quest too). Then the owner may lose 20 MP to put 1 card of it on the bottom of their deck; that
// second half is the private hook 'fpsWestBottom' (fpsWestBottomChoice.js) so the pick can pause.
import { revealCards } from '../../engine/hidden/revealCards.js';
import { runTriggerJobs } from '../../engine/mosje/runTriggerJobs.js';

export function fpsWestLookAndBottom(gameState, playerId, mosjeId = 'mosje_fps_west') {
	const state = JSON.parse(JSON.stringify(gameState));
	const slotIndex = state.players[playerId]?.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId) ?? -1;
	if (slotIndex < 0) throw new Error('FPS West is not on the field');
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	revealCards(state, playerId, 'ability_fps_west_tactical_analysis', (state.players[oppId]?.hand || []).map(c => c.cardId));
	return runTriggerJobs(state, 'fpsWestBottom', [{ triggerIdx: 0, playerId, slotIndex }], 0, { playerId });
}
