// Phase 64-01: the pure (or storage-injected) layer of the 2.0 lobby.
// Feature flags (D-12), the flag-gated mode list (D-15, D-05), the account-lobby gate (D-13),
// the player-name sanitizer (D-09). No DOM involved.
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../../src/config/features.js';
import { LOBBY_MODES } from '../../src/config/lobbyModes.js';
import { getLobbyModes } from '../../src/ui/lobby/getLobbyModes.js';
import { shouldShowAccountLobby } from '../../src/ui/lobby/shouldShowAccountLobby.js';
import { sanitizePlayerName } from '../../src/ui/lobby/sanitizePlayerName.js';

describe('FEATURES (D-12)', () => {
	it('lists the six hidden features, all false in slice A, and is frozen', () => {
		expect(Object.keys(FEATURES).sort()).toEqual(
			['accounts', 'deckBuilder', 'leaderboard', 'muntenRewards', 'onlineRooms', 'store'].sort(),
		);
		for (const value of Object.values(FEATURES)) expect(value).toBe(false);
		expect(Object.isFrozen(FEATURES)).toBe(true);
	});
});

describe('getLobbyModes (D-15, D-05, D-03)', () => {
	it('with the shipped flags is exactly Play vs Bot then Watch Bots', () => {
		expect(getLobbyModes().map((m) => m.id)).toEqual(['vsBot', 'watchBots']);
	});

	it('turning onlineRooms on adds the online mode without code changes', () => {
		const ids = getLobbyModes(LOBBY_MODES, { ...FEATURES, onlineRooms: true }).map((m) => m.id);
		expect(ids).toEqual(['vsBot', 'watchBots', 'online']);
		expect(getLobbyModes(LOBBY_MODES, { ...FEATURES, onlineRooms: true })[2].label).toBe('Play a friend (online)');
	});

	it('returns id, label and hint copies and never a disabled coming-soon entry', () => {
		const modes = getLobbyModes();
		for (const mode of modes) expect(Object.keys(mode).sort()).toEqual(['hint', 'id', 'label']);
		expect(JSON.stringify(modes).toLowerCase()).not.toContain('coming soon');
		expect(modes[0]).not.toBe(LOBBY_MODES[0]);
	});
});

describe('shouldShowAccountLobby (D-13)', () => {
	it('is true for each existing V4 test param set to 1', () => {
		expect(shouldShowAccountLobby(new URLSearchParams('testGuestDeck=1'))).toBe(true);
		expect(shouldShowAccountLobby(new URLSearchParams('testOnboarding=1'))).toBe(true);
		expect(shouldShowAccountLobby(new URLSearchParams('testActiveDeck=1'))).toBe(true);
	});

	it('is false for no params and for a param that is not 1', () => {
		expect(shouldShowAccountLobby(new URLSearchParams(''))).toBe(false);
		expect(shouldShowAccountLobby(new URLSearchParams('testGuestDeck=0'))).toBe(false);
	});

	it('is true when the accounts flag is on, with no params', () => {
		expect(shouldShowAccountLobby(new URLSearchParams(''), { ...FEATURES, accounts: true })).toBe(true);
	});
});

describe('sanitizePlayerName (D-09)', () => {
	it('falls back to Player for empty input', () => {
		expect(sanitizePlayerName('')).toBe('Player');
		expect(sanitizePlayerName('   ')).toBe('Player');
	});

	it('trims and keeps a normal name', () => {
		expect(sanitizePlayerName('  Gandoe  ')).toBe('Gandoe');
	});

	it('cuts a long name to 18 characters', () => {
		expect(sanitizePlayerName('x'.repeat(30))).toHaveLength(18);
	});

	it('removes control characters, turns newlines into spaces and collapses whitespace', () => {
		expect(sanitizePlayerName('a\u0000b\nc')).toBe('ab c');
		expect(sanitizePlayerName('a \t\r\n  b')).toBe('a b');
		expect(sanitizePlayerName('\u0007\u007f')).toBe('Player');
	});

	it('never throws on non-strings', () => {
		expect(sanitizePlayerName(null)).toBe('Player');
		expect(sanitizePlayerName(42)).toBe('Player');
		expect(sanitizePlayerName({})).toBe('Player');
		expect(sanitizePlayerName(undefined)).toBe('Player');
	});
});
