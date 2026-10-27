// getReplayChoices.js — the lobby choices Play again restarts with (D-20). Prefers the replay record the lobby stored
// (so a Random bot deck stays Random and is rolled again); falls back to the live session / URL when it is missing,
// broken or from another mode. Everything passes through the normalizeLobbyChoices whitelist (T-64-23).
import { normalizeLobbyChoices } from '../lobby/normalizeLobbyChoices.js';

function parseReplay(replayRaw, mode) {
	try {
		const parsed = JSON.parse(replayRaw);
		return parsed !== null && typeof parsed === 'object' && parsed.mode === mode ? parsed : null;
	} catch {
		return null;
	}
}

function fallbackChoices(mode, offlineData, urlParams) {
	if (mode === 'watchBots') {
		return { mode, bot1Choice: urlParams?.get('deck1'), bot2Choice: urlParams?.get('deck2'), fast: urlParams?.get('fast') === 'true' };
	}
	const offline = offlineData && typeof offlineData === 'object' ? offlineData : {};
	return { mode, name: offline.name, deckChoice: offline.deckId, botChoice: offline.botDeckId };
}

export function getReplayChoices({ replayRaw, offlineData, urlParams, mode, decks }) {
	if (mode !== 'vsBot' && mode !== 'watchBots') return null;
	const stored = parseReplay(replayRaw, mode);
	return normalizeLobbyChoices(stored || fallbackChoices(mode, offlineData, urlParams), decks);
}
