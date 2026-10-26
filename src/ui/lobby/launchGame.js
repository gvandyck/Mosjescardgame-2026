// launchGame.js — write the session keys for a lobby start and navigate to the game page (D-04, D-20).
// Storage and navigation are injected, so Start, Play again and Phase 67 share one tested path.
import { STORAGE_KEYS } from '../../config/storageKeys.js';
import { pickBotDeck } from '../../bot/pickBotDeck.js';
import { buildStartTarget } from './buildStartTarget.js';

export function launchGame(choices, { decks, session, navigate, pick = pickBotDeck }) {
	const target = buildStartTarget(choices, decks, pick);
	try {
		// A V4 online session left in this tab would otherwise make the game page go online.
		session.removeItem(STORAGE_KEYS.v4LobbySession);
		if (target.offlineSession) session.setItem(STORAGE_KEYS.offlineSession, JSON.stringify(target.offlineSession));
		session.setItem(STORAGE_KEYS.replay, JSON.stringify(target.replay));
	} catch (err) {
		console.warn('[Lobby] could not write the session keys', err);
	}
	navigate(target.url);
	return target;
}
