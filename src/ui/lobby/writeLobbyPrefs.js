// writeLobbyPrefs.js — remember the normalized lobby choices in this browser (D-09).
// Returns false instead of throwing when storage is missing or blocked; the lobby works without it.
import { STORAGE_KEYS } from '../../config/storageKeys.js';
import { normalizeLobbyChoices } from './normalizeLobbyChoices.js';

export function writeLobbyPrefs(storage, choices, decks) {
	if (!storage) return false;
	try {
		storage.setItem(STORAGE_KEYS.lobbyPrefs, JSON.stringify(normalizeLobbyChoices(choices, decks)));
		return true;
	} catch {
		return false;
	}
}
