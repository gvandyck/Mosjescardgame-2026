// getLobbyModes.js — the mode list the lobby shows, built from data and gated by the feature flags (D-15).
import { FEATURES } from '../../config/features.js';
import { LOBBY_MODES } from '../../config/lobbyModes.js';

export function getLobbyModes(modes = LOBBY_MODES, features = FEATURES) {
	return modes
		.filter(entry => !entry.requires || features[entry.requires] === true)
		.map(({ id, label, hint }) => ({ id, label, hint }));
}
