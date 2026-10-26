// lobby-2-0.spec.js — Phase 64-03 (D-29): the 2.0 lobby, driven live in a real browser at 1920x1080.
// Two modes (Play vs Bot, Watch Bots), the 3 Example Deck tiles, no account / room / store UI, no Firebase redirect,
// Start reaching the board in both modes, remembered and safe prefs, and the hidden V4 lobby behind its test param.
// Firebase gets the same placeholder config the live site gets, so every test can demand zero console errors.
import { test, expect } from '@playwright/test';
import { servePlaceholderFirebase } from '../helpers/servePlaceholderFirebase.js';
import { EXAMPLE_DECKS } from '../../src/data/exampleDecks.js';
import { waitForBoard } from './helpers.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const DECK_IDS = ['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN'];
const RADIO = '[role="radio"]';
const pick = (picker, id) => `[data-picker="${picker}"] ${RADIO}[data-choice-id="${id}"]`;

function watchProblems(page) {
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	page.on('console', msg => { if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`); });
	return problems;
}

const visibleCount = (page, selector) => page.locator(selector).evaluateAll(
	elements => elements.filter(el => el.getClientRects().length > 0).length,
);

let problems;
test.beforeEach(async ({ page }) => {
	await servePlaceholderFirebase(page);
	problems = watchProblems(page);
});
test.afterEach(() => {
	expect(problems, 'no page error and no console error').toEqual([]);
});

async function openLobby(page) {
	await page.goto('/');
	await expect(page.locator('[data-picker="mode"]')).toBeVisible();
}

test('D-02 D-05 D-10 D-11: two modes, 3 deck tiles, no account / room / store UI, no account redirect', async ({ page }) => {
	const requests = [];
	page.on('request', request => requests.push(request.url()));
	await openLobby(page);

	const modes = page.locator(`[data-picker="mode"] ${RADIO}`);
	await expect(modes).toHaveCount(2);
	await expect(modes.locator('.segmented__label')).toHaveText(['Play vs Bot', 'Watch Bots']);
	await expect(modes.first()).toHaveAttribute('aria-checked', 'true');
	await expect(modes.nth(1)).toHaveAttribute('aria-checked', 'false');

	const tiles = page.locator('[data-picker="player-deck"] .deck-tile');
	await expect(tiles).toHaveCount(3);
	expect(await tiles.evaluateAll(els => els.map(el => el.dataset.deckId))).toEqual(DECK_IDS);
	for (const deck of EXAMPLE_DECKS.filter(entry => DECK_IDS.includes(entry.id))) {
		const tile = page.locator(`[data-picker="player-deck"] .deck-tile[data-deck-id="${deck.id}"]`);
		await expect(tile.locator('.deck-tile__desc')).toHaveText(deck.description);
		await expect(tile.locator('.deck-tile__mosje')).toContainText('Starts with');
	}

	await expect(page.locator(`[data-picker="bot-deck"] ${RADIO}`)).toHaveCount(4);
	await expect(page.locator(pick('bot-deck', 'RANDOM'))).toHaveAttribute('aria-checked', 'true');

	for (const hidden of ['#lobby-form', '#user-badge', '#room-code', '#play-offline', '#deck-select', '#btn-signout', '#btn-delete-account',
		'a[href*="store.html"]', 'a[href*="deck-builder.html"]', 'a[href*="leaderboard.html"]', 'a[href*="account.html"]']) {
		expect(await visibleCount(page, hidden), `${hidden} must not be visible`).toBe(0);
	}
	// The V4 lobby keeps its hidden markup (D-12), but the 2.0 lobby itself holds none of these links.
	const strayLinks = await page.locator('a[href*="store.html"], a[href*="deck-builder.html"], a[href*="leaderboard.html"], a[href*="account.html"]')
		.evaluateAll(els => els.filter(el => !el.closest('#account-lobby')).length);
	expect(strayLinks).toBe(0);
	await expect(page.getByText('Bot vs Bot (test)')).toBeHidden();
	await expect(page.locator('#lobby2').getByText(/coming soon|online/i)).toHaveCount(0);

	await expect(page.getByText('Build your squad. Pick your deck. Enter the arena.')).toBeVisible();
	await expect(page.locator('#app-version')).toHaveText(/^Version \S+/);

	await page.waitForTimeout(1500);
	expect(page.url()).not.toContain('account.html');
	expect(requests.filter(url => /identitytoolkit|firebasejs/.test(url))).toEqual([]);
});

test('D-06 D-40: one screen at 1920x1080, controls >= 44 px, keyboard', async ({ page }) => {
	await openLobby(page);
	for (const mode of ['vsBot', 'watchBots']) {
		await page.locator(pick('mode', mode)).click();
		await expect(page.locator(pick('mode', mode))).toHaveAttribute('aria-checked', 'true');
		const fit = await page.evaluate(() => ({
			scroll: document.documentElement.scrollHeight,
			inner: window.innerHeight,
			startBottom: document.getElementById('lobby2-start').getBoundingClientRect().bottom,
			mainBottom: document.querySelector('main').getBoundingClientRect().bottom,
		}));
		expect(fit.scroll, `${mode}: no page scroll`).toBeLessThanOrEqual(fit.inner);
		expect(fit.startBottom, `${mode}: Start is on screen`).toBeLessThanOrEqual(fit.inner);
		expect(fit.mainBottom, `${mode}: the lobby is on screen`).toBeLessThanOrEqual(fit.inner);

		const small = await page.locator('#lobby2').locator('button, input').evaluateAll(els => els
			.map(el => ({ id: el.id || el.dataset.choiceId || el.tagName, box: el.getBoundingClientRect() }))
			.filter(entry => entry.box.width < 44 || entry.box.height < 44)
			.map(entry => `${entry.id} ${Math.round(entry.box.width)}x${Math.round(entry.box.height)}`));
		expect(small, `${mode}: every control is at least 44x44`).toEqual([]);
	}

	await page.locator(pick('mode', 'vsBot')).click();
	await page.locator(pick('player-deck', 'EXAMPLE_TAKSEN')).focus();
	await page.keyboard.press('ArrowRight');
	await expect(page.locator(pick('player-deck', 'EXAMPLE_REGELAARS'))).toHaveAttribute('aria-checked', 'true');
	await expect(page.locator(pick('player-deck', 'EXAMPLE_TAKSEN'))).toHaveAttribute('aria-checked', 'false');
	await expect(page.locator(pick('player-deck', 'EXAMPLE_REGELAARS'))).toBeFocused();

	let reachedStart = false;
	for (let presses = 0; presses < 15 && !reachedStart; presses += 1) {
		await page.keyboard.press('Tab');
		reachedStart = await page.evaluate(() => document.activeElement?.id === 'lobby2-start');
	}
	expect(reachedStart, 'Tab reaches Start within 15 presses').toBe(true);
});

test('D-04: Start vs Bot reaches the board as player_1 and clears a stale V4 room', async ({ page }) => {
	await page.addInitScript(() => {
		if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
			sessionStorage.setItem('mosjes:lobby', JSON.stringify({ roomCode: '4827', playerId: 'player_2' }));
		}
	});
	await openLobby(page);
	await page.locator(pick('player-deck', 'EXAMPLE_REGELAARS')).click();
	await page.locator(pick('bot-deck', 'EXAMPLE_TAKSEN')).click();
	await page.locator('#lobby2-name').fill('Gandoe');
	await page.locator('#lobby2-start').click();

	await page.waitForURL('**/game.html?offline=true&player=player_1');
	await waitForBoard(page);
	const session = await page.evaluate(() => ({
		offline: JSON.parse(sessionStorage.getItem('mosjes:offline')),
		lobby: sessionStorage.getItem('mosjes:lobby'),
		replay: JSON.parse(sessionStorage.getItem('obby2:replay')),
	}));
	expect(session.offline).toEqual({ name: 'Gandoe', deckId: 'EXAMPLE_REGELAARS', botDeckId: 'EXAMPLE_TAKSEN', playerId: 'player_1' });
	expect(session.lobby).toBeNull();
	expect(session.replay.mode).toBe('vsBot');
	await expect(page.locator('#topbar-room-code')).toBeHidden();
});

test('D-08: Watch Bots has a row per bot and a speed switch, and starts a bot game', async ({ page }) => {
	await openLobby(page);
	await page.locator(pick('mode', 'watchBots')).click();
	await expect(page.locator('#lobby2-name')).toHaveCount(0);
	await expect(page.locator(`[data-picker="bot1-deck"] ${RADIO}`)).toHaveCount(4);
	await expect(page.locator(`[data-picker="bot2-deck"] ${RADIO}`)).toHaveCount(4);
	await expect(page.locator(pick('bot1-deck', 'RANDOM'))).toHaveAttribute('aria-checked', 'true');
	await expect(page.locator(pick('speed', 'normal'))).toHaveAttribute('aria-checked', 'true');

	await page.locator(pick('bot1-deck', 'EXAMPLE_CREATIEVELINGEN')).click();
	await page.locator(pick('speed', 'fast')).click();
	await page.locator('#lobby2-start').click();

	await page.waitForURL(/game\.html\?.*botvsbot=true/);
	const params = new URL(page.url()).searchParams;
	expect(params.get('botvsbot')).toBe('true');
	expect(params.get('player')).toBe('player_1');
	expect(params.get('deck1')).toBe('EXAMPLE_CREATIEVELINGEN');
	expect(DECK_IDS).toContain(params.get('deck2'));
	expect(params.get('fast')).toBe('true');
	await expect(page.locator('.mosje-card--owned, .mosje-card--opponent').first()).toBeVisible({ timeout: 20000 });
});

test('D-09: prefs remembered and safe (reload, broken storage, markup in a stored name)', async ({ page, browser }) => {
	// Remembered: last mode, bot deck and speed come back after a reload.
	await openLobby(page);
	await page.locator(pick('mode', 'watchBots')).click();
	await page.locator(pick('bot1-deck', 'EXAMPLE_REGELAARS')).click();
	await page.locator(pick('speed', 'fast')).click();
	await page.reload();
	await expect(page.locator(pick('mode', 'watchBots'))).toHaveAttribute('aria-checked', 'true');
	await expect(page.locator(pick('bot1-deck', 'EXAMPLE_REGELAARS'))).toHaveAttribute('aria-checked', 'true');
	await expect(page.locator(pick('bot2-deck', 'RANDOM'))).toHaveAttribute('aria-checked', 'true');
	await expect(page.locator(pick('speed', 'fast'))).toHaveAttribute('aria-checked', 'true');

	// Safe: a fresh browser context with broken stored prefs shows the defaults.
	const broken = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
	const brokenPage = await broken.newPage();
	await servePlaceholderFirebase(brokenPage);
	const brokenProblems = watchProblems(brokenPage);
	await brokenPage.addInitScript(() => localStorage.setItem('obby2:lobbyPrefs', '{bad'));
	await openLobby(brokenPage);
	await expect(brokenPage.locator(pick('mode', 'vsBot'))).toHaveAttribute('aria-checked', 'true');
	await expect(brokenPage.locator(pick('player-deck', 'EXAMPLE_TAKSEN'))).toHaveAttribute('aria-checked', 'true');
	await expect(brokenPage.locator(pick('bot-deck', 'RANDOM'))).toHaveAttribute('aria-checked', 'true');
	expect(brokenProblems).toEqual([]);
	await broken.close();

	// Safe: a stored name with markup is only ever an input value, never an element (T-64-12).
	const hostile = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
	const hostilePage = await hostile.newPage();
	await servePlaceholderFirebase(hostilePage);
	const hostileProblems = watchProblems(hostilePage);
	const evil = '<img src=x onerror="window.__xss=1">';
	await hostilePage.addInitScript(name => localStorage.setItem('obby2:lobbyPrefs', JSON.stringify({ mode: 'vsBot', name })), evil);
	await openLobby(hostilePage);
	expect((await hostilePage.locator('#lobby2-name').inputValue()).length).toBeLessThanOrEqual(18);
	await hostilePage.waitForTimeout(500);
	expect(await hostilePage.evaluate(() => window.__xss)).toBeUndefined();
	await expect(hostilePage.locator('#lobby2 img')).toHaveCount(0);
	expect(hostileProblems).toEqual([]);
	await hostile.close();
});

test('D-13: a V4 test param shows the hidden account lobby instead', async ({ page }) => {
	await page.goto('/?testGuestDeck=1');
	await expect(page.locator('#account-lobby')).toBeVisible();
	await expect(page.locator('#lobby2')).toBeHidden();
	await expect(page.locator('#deck-select option')).toHaveCount(3);
});
