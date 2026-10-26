// Phase 64-01: the pure (or storage-injected) layer of the 2.0 lobby.
// Feature flags (D-12), the flag-gated mode list (D-15, D-05), the account-lobby gate (D-13),
// the player-name sanitizer (D-09). No DOM involved.
import { describe, it, expect, vi } from 'vitest';
import { FEATURES } from '../../src/config/features.js';
import { LOBBY_MODES } from '../../src/config/lobbyModes.js';
import { getLobbyModes } from '../../src/ui/lobby/getLobbyModes.js';
import { shouldShowAccountLobby } from '../../src/ui/lobby/shouldShowAccountLobby.js';
import { sanitizePlayerName } from '../../src/ui/lobby/sanitizePlayerName.js';
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';
import { STORAGE_KEYS } from '../../src/config/storageKeys.js';
import { resolveDeckChoice } from '../../src/ui/lobby/resolveDeckChoice.js';
import { normalizeLobbyChoices } from '../../src/ui/lobby/normalizeLobbyChoices.js';
import { buildStartTarget } from '../../src/ui/lobby/buildStartTarget.js';
import { launchGame } from '../../src/ui/lobby/launchGame.js';
import { readLobbyPrefs } from '../../src/ui/lobby/readLobbyPrefs.js';
import { writeLobbyPrefs } from '../../src/ui/lobby/writeLobbyPrefs.js';
import { toDeckTileSpecs } from '../../src/ui/lobby/toDeckTileSpecs.js';
import { buildDeckTilesHtml } from '../../src/ui/lobby/buildDeckTilesHtml.js';
import { EXAMPLE_DECKS } from '../../src/data/exampleDecks.js';

const decks: any[] = getPlayerFacingDecks();
const DEFAULT_CHOICES = {
	mode: 'vsBot',
	name: 'Player',
	deckChoice: 'EXAMPLE_TAKSEN',
	botChoice: 'RANDOM',
	bot1Choice: 'RANDOM',
	bot2Choice: 'RANDOM',
	fast: false,
};

// Small Map-backed Storage stand-in (getItem / setItem / removeItem), optionally throwing.
const fakeStorage = (seed: Record<string, string> = {}, throws = false) => {
	const map = new Map<string, string>(Object.entries(seed));
	return {
		map,
		getItem: (key: string) => {
			if (throws) throw new Error('blocked');
			return map.has(key) ? (map.get(key) as string) : null;
		},
		setItem: (key: string, value: string) => {
			if (throws) throw new Error('blocked');
			map.set(key, String(value));
		},
		removeItem: (key: string) => {
			if (throws) throw new Error('blocked');
			map.delete(key);
		},
	};
};

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

describe('resolveDeckChoice (D-08, D-20)', () => {
	it('rolls RANDOM through the injected picker', () => {
		expect(resolveDeckChoice('RANDOM', decks, () => decks[2])).toBe(decks[2].id);
	});

	it('keeps a player-facing deck id', () => {
		expect(resolveDeckChoice('EXAMPLE_REGELAARS', decks)).toBe('EXAMPLE_REGELAARS');
	});

	it('falls back to the first deck for a non player-facing or junk id', () => {
		expect(resolveDeckChoice('PHYSICAL_FORCE', decks)).toBe(decks[0].id);
		expect(resolveDeckChoice('<script>', decks)).toBe(decks[0].id);
		expect(resolveDeckChoice(undefined, decks)).toBe(decks[0].id);
	});
});

describe('normalizeLobbyChoices (D-04, D-08, D-09, T-64-01)', () => {
	it('gives the full default set for null and for non-objects', () => {
		expect(normalizeLobbyChoices(null, decks)).toEqual(DEFAULT_CHOICES);
		expect(normalizeLobbyChoices('junk', decks)).toEqual(DEFAULT_CHOICES);
	});

	it('whitelists mode, decks and fast, and cuts the name', () => {
		const choices = normalizeLobbyChoices(
			{ mode: 'online', deckChoice: 'RANDOM', botChoice: 'EXAMPLE_TAKSEN', fast: 'yes', name: 'x'.repeat(40) },
			decks,
		);
		expect(choices.mode).toBe('vsBot'); // online is not an enabled mode
		expect(choices.deckChoice).toBe('EXAMPLE_TAKSEN'); // own deck can never be RANDOM
		expect(choices.botChoice).toBe('EXAMPLE_TAKSEN');
		expect(choices.fast).toBe(false); // only true counts
		expect(choices.name).toHaveLength(18);
	});

	it('returns exactly the 7 contract keys and ignores extra ones', () => {
		const choices = normalizeLobbyChoices({ mode: 'watchBots', evil: '1', fast: true }, decks);
		expect(Object.keys(choices).sort()).toEqual(
			['bot1Choice', 'bot2Choice', 'botChoice', 'deckChoice', 'fast', 'mode', 'name'],
		);
		expect(choices.mode).toBe('watchBots');
		expect(choices.fast).toBe(true);
	});

	it('accepts the online mode once onlineRooms is on', () => {
		const modes = getLobbyModes(LOBBY_MODES, { ...FEATURES, onlineRooms: true });
		expect(normalizeLobbyChoices({ mode: 'online' }, decks, modes).mode).toBe('online');
	});

	it('replaces junk bot choices with RANDOM', () => {
		const choices = normalizeLobbyChoices({ bot1Choice: '<b>', bot2Choice: 7, botChoice: 'PHYSICAL_FORCE' }, decks);
		expect(choices.bot1Choice).toBe('RANDOM');
		expect(choices.bot2Choice).toBe('RANDOM');
		expect(choices.botChoice).toBe('RANDOM');
	});
});

describe('buildStartTarget (D-04, D-08, T-64-02)', () => {
	it('Play vs Bot keeps the offline url and the mosjes:offline payload, replay keeps the choice not the roll', () => {
		const target = buildStartTarget(
			{ mode: 'vsBot', name: 'Gandoe', deckChoice: 'EXAMPLE_REGELAARS', botChoice: 'RANDOM' },
			decks,
			() => decks[0],
		);
		expect(target.url).toBe('./game.html?offline=true&player=player_1');
		expect(target.offlineSession).toEqual({
			name: 'Gandoe',
			deckId: 'EXAMPLE_REGELAARS',
			botDeckId: 'EXAMPLE_TAKSEN',
			playerId: 'player_1',
		});
		expect(target.replay.botChoice).toBe('RANDOM');
		expect(target.replay.mode).toBe('vsBot');
	});

	it('Watch Bots builds the botvsbot url on the player_1 path, with fast only when asked', () => {
		const choices = { mode: 'watchBots', bot1Choice: 'EXAMPLE_CREATIEVELINGEN', bot2Choice: 'RANDOM', fast: true };
		const fast = buildStartTarget(choices, decks, () => decks[1]);
		expect(fast.url).toBe(
			'./game.html?botvsbot=true&player=player_1&deck1=EXAMPLE_CREATIEVELINGEN&deck2=EXAMPLE_REGELAARS&fast=true',
		);
		expect(fast.offlineSession).toBeNull();
		const normal = buildStartTarget({ ...choices, fast: false }, decks, () => decks[1]);
		expect(normal.url).not.toContain('fast');
		expect(normal.replay.bot2Choice).toBe('RANDOM');
	});

	it('only normalized ids reach the url (garbage never does)', () => {
		const target = buildStartTarget(
			{ mode: 'watchBots', bot1Choice: 'a&deck2=<x>', bot2Choice: '../../evil' },
			decks,
			() => decks[1],
		);
		expect(target.url.startsWith('./game.html?')).toBe(true);
		expect(target.url).not.toContain('evil');
		expect(target.url).not.toContain('<');
	});
});

describe('launchGame (D-04, D-20)', () => {
	const vsBot = { mode: 'vsBot', name: 'Gandoe', deckChoice: 'EXAMPLE_TAKSEN', botChoice: 'EXAMPLE_REGELAARS' };

	it('clears the V4 session, writes mosjes:offline and the replay, then navigates once', () => {
		const session = fakeStorage({ [STORAGE_KEYS.v4LobbySession]: '{"roomCode":"1234"}' });
		const urls: string[] = [];
		const target = launchGame(vsBot, { decks, session, navigate: (url: string) => urls.push(url) });
		expect(session.map.has(STORAGE_KEYS.v4LobbySession)).toBe(false);
		expect(JSON.parse(session.map.get(STORAGE_KEYS.offlineSession) as string)).toEqual(target.offlineSession);
		expect(JSON.parse(session.map.get(STORAGE_KEYS.replay) as string).botChoice).toBe('EXAMPLE_REGELAARS');
		expect(urls).toEqual([target.url]);
	});

	it('Watch Bots writes no offline session but still writes the replay', () => {
		const session = fakeStorage();
		const urls: string[] = [];
		launchGame({ mode: 'watchBots' }, { decks, session, navigate: (url: string) => urls.push(url) });
		expect(session.map.has(STORAGE_KEYS.offlineSession)).toBe(false);
		expect(JSON.parse(session.map.get(STORAGE_KEYS.replay) as string).mode).toBe('watchBots');
		expect(urls).toHaveLength(1);
	});

	it('still navigates when the session storage throws', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const urls: string[] = [];
		launchGame(vsBot, { decks, session: fakeStorage({}, true), navigate: (url: string) => urls.push(url) });
		expect(urls).toHaveLength(1);
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});
});

describe('readLobbyPrefs / writeLobbyPrefs (D-09, T-64-01)', () => {
	it('falls back to the defaults for no storage, bad JSON, and tampered values', () => {
		expect(readLobbyPrefs(null, decks)).toEqual(DEFAULT_CHOICES);
		const bad = fakeStorage({ [STORAGE_KEYS.lobbyPrefs]: '{bad json' });
		expect(readLobbyPrefs(bad, decks)).toEqual(DEFAULT_CHOICES);
		expect(readLobbyPrefs(fakeStorage({}, true), decks)).toEqual(DEFAULT_CHOICES);
		const tampered = fakeStorage({ [STORAGE_KEYS.lobbyPrefs]: JSON.stringify({ mode: 'hack', deckChoice: 'x', fast: 1 }) });
		expect(readLobbyPrefs(tampered, decks)).toEqual(DEFAULT_CHOICES);
	});

	it('write returns false without throwing when storage is missing or blocked', () => {
		expect(writeLobbyPrefs(null, DEFAULT_CHOICES, decks)).toBe(false);
		expect(writeLobbyPrefs(fakeStorage({}, true), DEFAULT_CHOICES, decks)).toBe(false);
	});

	it('round-trips the normalized choices', () => {
		const storage = fakeStorage();
		const choices = { mode: 'watchBots', name: 'Gandoe', deckChoice: 'EXAMPLE_REGELAARS', botChoice: 'EXAMPLE_TAKSEN', bot1Choice: 'EXAMPLE_TAKSEN', bot2Choice: 'RANDOM', fast: true };
		expect(writeLobbyPrefs(storage, choices, decks)).toBe(true);
		expect(readLobbyPrefs(storage, decks)).toEqual(choices);
	});
});

describe('toDeckTileSpecs (D-07)', () => {
	it('gives one spec per deck in deck order with the stack colour, description and starting Mosje', () => {
		const specs = toDeckTileSpecs(decks, { selectedId: 'EXAMPLE_REGELAARS' });
		expect(specs.map((s) => s.id)).toEqual(['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN']);
		expect(specs.map((s) => s.color)).toEqual(['#C2410C', '#0E7490', '#A21CAF']);
		expect(specs[0].startingMosjeName).toBe('Alyssa, Fissa Fissa!');
		expect(specs.map((s) => s.selected)).toEqual([false, true, false]);
		expect(specs.every((s) => s.isRandom === false)).toBe(true);
		for (const spec of specs) {
			const source = (EXAMPLE_DECKS as any[]).find((d) => d.id === spec.id);
			expect(spec.description).toBe(source.description);
			expect(spec.name).toBe(source.name);
			expect(spec.tint).toMatch(/^#[0-9A-F]{6}$/);
		}
	});

	it('prepends a neutral Random spec when includeRandom is on', () => {
		const specs = toDeckTileSpecs(decks, { selectedId: 'RANDOM', includeRandom: true });
		expect(specs).toHaveLength(4);
		expect(specs[0]).toMatchObject({ id: 'RANDOM', name: 'Random', isRandom: true, color: '#B45309', selected: true });
	});

	it('works without options and never selects anything', () => {
		const specs = toDeckTileSpecs(decks);
		expect(specs).toHaveLength(3);
		expect(specs.some((s) => s.selected)).toBe(false);
	});
});

describe('buildDeckTilesHtml (D-07, T-64-03)', () => {
	const count = (html: string, needle: string) => html.split(needle).length - 1;

	it('renders one accessible radiogroup with a radio button per tile', () => {
		const html = buildDeckTilesHtml(toDeckTileSpecs(decks, { selectedId: 'EXAMPLE_REGELAARS' }), { label: 'Your deck' });
		expect(html).toContain('role="radiogroup"');
		expect(html).toContain('aria-label="Your deck"');
		expect(count(html, 'role="radio"')).toBe(3);
		expect(count(html, 'data-deck-id="')).toBe(3);
		expect(count(html, 'data-choice-id="')).toBe(3);
		expect(count(html, 'aria-checked="true"')).toBe(1);
		expect(count(html, 'tabindex="0"')).toBe(1);
		expect(count(html, 'tabindex="-1"')).toBe(2);
		expect(count(html, 'deck-tile__desc')).toBe(3);
		expect(count(html, 'Starts with ')).toBe(3);
		expect(html).toContain('Starts with Alyssa, Fissa Fissa!');
	});

	it('puts tabindex 0 on the first tile when nothing is selected', () => {
		const html = buildDeckTilesHtml(toDeckTileSpecs(decks), { label: 'Pick' });
		expect(count(html, 'aria-checked="true"')).toBe(0);
		expect(count(html, 'tabindex="0"')).toBe(1);
		expect(html.indexOf('tabindex="0"')).toBeLessThan(html.indexOf('tabindex="-1"'));
	});

	it('compact drops the description and Starts-with lines', () => {
		const html = buildDeckTilesHtml(toDeckTileSpecs(decks, { includeRandom: true }), { label: 'Bot plays', compact: true });
		expect(html).toContain('deck-tiles--compact');
		expect(html).not.toContain('deck-tile__desc');
		expect(html).not.toContain('Starts with');
		expect(html).toContain('deck-tile--random');
		expect(count(html, 'role="radio"')).toBe(4);
	});

	it('escapes every value: markup in a name and CSS injection in a colour', () => {
		const evil = {
			id: 'x"><script>', name: '<img src=x onerror=alert(1)>', description: '<b>d</b>', startingMosjeName: '<i>m</i>',
			color: 'red;background:url(x)', tint: '"><svg>', isRandom: false, selected: true,
		};
		const html = buildDeckTilesHtml([evil], { label: '"><u>label' });
		expect(html).toContain('&lt;img');
		expect(html).not.toContain('<img');
		expect(html).not.toContain('<script');
		expect(html).not.toContain('<svg');
		expect(html).not.toContain('<b>');
		expect(html).not.toContain('<i>');
		expect(html).not.toContain('<u>');
		expect(html).not.toContain('background:url');
	});
});
