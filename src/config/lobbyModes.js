// lobbyModes.js — the modes the 2.0 lobby can offer (pure data, D-15).
// An entry with `requires` only shows up when that FEATURES flag is on (see getLobbyModes).
// There is deliberately no disabled placeholder entry (D-05): a hidden mode is simply not in the list.
export const LOBBY_MODES = Object.freeze([
	Object.freeze({ id: 'vsBot', label: 'Play vs Bot', hint: 'You against the bot' }),
	Object.freeze({ id: 'watchBots', label: 'Watch Bots', hint: 'Bot against bot' }),
	Object.freeze({ id: 'online', label: 'Play a friend (online)', hint: 'Two people, two devices', requires: 'onlineRooms' }),
]);

// A bot deck choice that is rolled again at every start (D-08, D-20).
export const RANDOM_DECK_CHOICE = 'RANDOM';

export const DEFAULT_PLAYER_NAME = 'Player';
export const PLAYER_NAME_MAX = 18;
