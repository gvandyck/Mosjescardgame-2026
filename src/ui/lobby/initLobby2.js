// initLobby2.js — boot the 2.0 lobby (D-02, D-04, D-09, D-11): remembered choices -> render -> Start -> launchGame.
// No Firebase, no auth, no redirect. Storage and navigation are injectable so the pure layer stays testable; the defaults
// read the browser storages inside try/catch (a blocked storage is null and the lobby works without it, T-64-15).
import { getPlayerFacingDecks } from '../../data/playerFacingDecks.js';
import { getLobbyModes } from './getLobbyModes.js';
import { launchGame } from './launchGame.js';
import { normalizeLobbyChoices } from './normalizeLobbyChoices.js';
import { readLobbyPrefs } from './readLobbyPrefs.js';
import { renderLobby2 } from './renderLobby2.js';
import { writeLobbyPrefs } from './writeLobbyPrefs.js';

function browserStorage(kind) {
	try {
		return window[kind] ?? null;
	} catch {
		return null;
	}
}

export function initLobby2({
	root,
	decks = getPlayerFacingDecks(),
	modes = getLobbyModes(),
	storage = browserStorage('localStorage'),
	session = browserStorage('sessionStorage'),
	navigate = url => window.location.assign(url),
} = {}) {
	if (!root) return;
	let state = readLobbyPrefs(storage, decks);

	const draw = () => renderLobby2(root, { state, decks, modes, onChange, onStart });

	function onChange(patch) {
		const modeChanged = patch.mode !== undefined && patch.mode !== state.mode;
		state = normalizeLobbyChoices({ ...state, ...patch }, decks, modes);
		writeLobbyPrefs(storage, state, decks);
		// Only a mode change rebuilds the screen; a deck pick or a typed letter keeps focus and the caret where they are.
		if (modeChanged) {
			draw();
			root.querySelector('[data-picker="mode"] [aria-checked="true"]')?.focus();
		}
	}

	function onStart() {
		writeLobbyPrefs(storage, state, decks);
		launchGame(state, { decks, session, navigate });
	}

	draw();
}
