// storageKeys.js — every browser-storage key the 2.0 lobby touches (pure data).
// V4 and 2.0 share the eightytwenty.nl origin, so localStorage is shared and sessionStorage can be
// reused by a V4 session in the same tab. 2.0-only keys therefore carry the `obby2:` prefix.
export const STORAGE_KEYS = Object.freeze({
	lobbyPrefs: 'obby2:lobbyPrefs', // localStorage: last mode, decks, name
	replay: 'obby2:replay', // sessionStorage: the lobby choices, for Play again
	offlineSession: 'mosjes:offline', // sessionStorage: existing game-page contract (D-04)
	v4LobbySession: 'mosjes:lobby', // sessionStorage: V4 online session, cleared on every 2.0 start
});
