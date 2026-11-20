// pickStatusMessage.js — the ONE message the status strip shows (63-UI-SPEC "Status strip", D-17, D-19).
// Priority: an action mode passed in (choose-target / preview / choose-quest, built by the action flow) > the local
// player's cooldown turn > the opponent's turn (a Level 3 Mosje shows nothing: only a Personal Quest wins). A finished game shows nothing. Returns { kind, text } or null.
import { isCooldownBlocked } from '../../engine/turn/isCooldownBlocked.js';
import { COOLDOWN_TEXT } from './cooldownText.js';

export function pickStatusMessage(state, localId, mode = null) {
	if (!state || state.status === 'FINISHED') return null;
	if (mode) return mode;
	if (state.activePlayerId === localId && isCooldownBlocked(state, localId)) {
		return { kind: 'cooldown', text: COOLDOWN_TEXT };
	}
	if (state.activePlayerId && state.activePlayerId !== localId) {
		return { kind: 'bot-turn', text: `${state.players?.[state.activePlayerId]?.name || 'Opponent'}'s turn` };
	}
	return null;
}
