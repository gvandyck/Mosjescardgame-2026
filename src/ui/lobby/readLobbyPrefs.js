// readLobbyPrefs.js — the lobby choices remembered in this browser (D-09).
// Missing storage, a blocked read, broken JSON or tampered values all come back as safe defaults (T-64-01).
import { STORAGE_KEYS } from '../../config/storageKeys.js';
import { normalizeLobbyChoices } from './normalizeLobbyChoices.js';

export function readLobbyPrefs(storage, decks) {
	if (!storage) return normalizeLobbyChoices(null, decks);
	let parsed = null;
	try {
		parsed = JSON.parse(storage.getItem(STORAGE_KEYS.lobbyPrefs));
	} catch {
		parsed = null;
	}
	return normalizeLobbyChoices(parsed, decks);
}
