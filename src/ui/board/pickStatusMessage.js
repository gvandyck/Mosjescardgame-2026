// pickStatusMessage.js — the ONE message the status strip shows (63-UI-SPEC "Status strip", D-17, D-19).
// Priority: an action mode passed in (choose-target / preview / choose-quest, built by the action flow) > the local
// player's cooldown turn > Level 3 hold > the opponent's turn. A finished game shows nothing. Returns { kind, text } or null.
import { isCooldownBlocked } from '../../engine/turn/isCooldownBlocked.js';
import { parseMosjeName } from '../cardV1/parseMosjeName.js';

function findHold(state, localId) {
	const ids = [localId, ...Object.keys(state.players || {}).filter(id => id !== localId)];
	for (const id of ids) {
		const holder = (state.players?.[id]?.activeSlots || []).find(s => s && !s.isDefeated && s.level === 3);
		if (holder) return { holder, ownerName: state.players[id].name || 'A player' };
	}
	return null;
}

export function pickStatusMessage(state, localId, mode = null) {
	if (!state || state.status === 'FINISHED') return null;
	if (mode) return mode;
	if (state.activePlayerId === localId && isCooldownBlocked(state, localId)) {
		return { kind: 'cooldown', text: 'Cooldown turn: you can only place face-down Piecies' };
	}
	const hold = findHold(state, localId);
	if (hold) {
		const { firstName } = parseMosjeName(hold.holder.name);
		return { kind: 'hold', text: `${firstName} is at Level 3: ${hold.ownerName} wins at the start of their next turn` };
	}
	if (state.activePlayerId && state.activePlayerId !== localId) {
		return { kind: 'bot-turn', text: `${state.players?.[state.activePlayerId]?.name || 'Opponent'}'s turn` };
	}
	return null;
}
