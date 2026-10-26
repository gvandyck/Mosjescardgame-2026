// sanitizePlayerName.js — a typed or stored player name, made safe (D-09).
// Strings only; newlines/tabs become spaces, other control characters go, whitespace collapses,
// 18 characters at most. Empty or junk becomes the default name.
import { DEFAULT_PLAYER_NAME, PLAYER_NAME_MAX } from '../../config/lobbyModes.js';

export function sanitizePlayerName(raw) {
	const text = typeof raw === 'string' ? raw : '';
	const name = text
		.replace(/[\r\n\t]/g, ' ')
		.replace(/[\u0000-\u001F\u007F]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, PLAYER_NAME_MAX)
		.trim();
	return name || DEFAULT_PLAYER_NAME;
}
