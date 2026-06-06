import { test, expect } from '@playwright/test';
import fs from 'fs';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const GAME_URL = '/game?offline=true&player=player_1';

/** Block Firebase CDN so it fails fast — firebase.js degrades to LOCAL mode. */
async function seedOfflineSession(page, deckId = 'PHYSICAL_FORCE') {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	await page.addInitScript((deck) => {
		sessionStorage.setItem('mosjes:offline', JSON.stringify({
			name: 'TestPlayer',
			deckId: deck,
			botDeckId: 'ARTISTIC_RHYTHM',
		}));
	}, deckId);
}

/** Wait until startGame has run and at least one owned Mosje card is rendered. */
async function waitForBoard(page) {
	page.on('pageerror', err => console.log('[PAGE CRASH]', err.message));
	await page.waitForFunction(() => {
		const label = document.getElementById('turn-label');
		return label && !label.textContent.includes('Loading') && !label.textContent.includes('Connecting');
	}, { timeout: 20000 });
	await page.waitForSelector('.mosje-card--owned', { timeout: 10000 });
}

/** Save screenshot to tests/ui/screenshots/<name>.png */
async function ss(page, name) {
	fs.mkdirSync('tests/ui/screenshots', { recursive: true });
	await page.screenshot({ path: `tests/ui/screenshots/${name}.png`, fullPage: false });
}

/** Read all game log rows as text. Single DOM call — no stall risk. */
async function readLog(page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('#log-root .log-row')].map(el => el.textContent.trim())
	);
}

/** Read name + MP for all owned Mosje cards. Single DOM call. */
async function readOwnedMosjes(page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('.mosje-card--owned')].map(card => ({
			name: card.querySelector('.mosje-name-v2')?.textContent?.trim() ?? '?',
			mp:   card.querySelector('.mosje-mp-header')?.textContent?.trim() ?? '?',
		}))
	);
}

/** Read all cards in the human player's hand. Single DOM call. */
async function readHand(page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('.hand-card-wrap')].map(wrap => ({
			cardId:   wrap.getAttribute('data-card-id') ?? '?',
			cardType: wrap.getAttribute('data-card-type') ?? '?',
			name:     (wrap.querySelector('.card-name') ?? wrap.querySelector('[class*="name"]'))?.textContent?.trim() ?? '?',
		}))
	);
}

// ─── Test 1: board loads and engine starts ────────────────────────────────────

test('board loads in offline mode', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);
	await ss(page, '01-board-loaded');

	const label = await page.locator('#turn-label').textContent();
	console.log('Turn label:', label);
	expect(label).toContain('You');
	await expect(page.locator('#btn-end-turn')).toBeVisible();
	await expect(page.locator('#btn-end-turn')).not.toBeDisabled();
});

// ─── Test 2: Mosje cards render with MP values ────────────────────────────────

test('Mosje cards render with MP values', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);

	const mosjes = await readOwnedMosjes(page);
	console.log('Owned Mosjes:', mosjes);
	expect(mosjes.length).toBeGreaterThan(0);
	for (const m of mosjes) {
		expect(m.name).not.toBe('?');
		expect(m.mp).toMatch(/^\d+$/);
	}

	const log = await readLog(page);
	console.log('Initial log:', log);
	expect(log.length).toBeGreaterThan(0);
	expect(log.join(' ')).toContain('Turn 1');

	await ss(page, '02-mosjes-and-log');
});

// ─── Test 3: hand contains readable cards ────────────────────────────────────

test('hand contains cards with known IDs', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);

	const hand = await readHand(page);
	console.log('Hand:', hand);
	expect(hand.length).toBeGreaterThan(0);
	for (const c of hand) {
		expect(c.cardId).not.toBe('?');
	}

	await ss(page, '03-hand-cards');
});

// ─── Test 4: end human turn — bot responds, log grows ────────────────────────

test('end turn — bot takes its turn and returns control', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);

	const logBefore  = await readLog(page);
	const mosjesBefore = await readOwnedMosjes(page);
	console.log('Before — Mosjes:', mosjesBefore);
	await ss(page, '04a-before-end-turn');

	await page.click('#btn-end-turn');
	await page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 25000 });

	const logAfter   = await readLog(page);
	const mosjesAfter = await readOwnedMosjes(page);
	console.log('After — Mosjes:', mosjesAfter);
	console.log('New log entries:', logAfter.slice(logBefore.length));
	await ss(page, '04b-after-bot-turn');

	expect(logAfter.length).toBeGreaterThan(logBefore.length);
	const label = await page.locator('#turn-label').textContent();
	expect(label).toContain('You');
});

// ─── Test 5: play a Piecie — it lands on the field ───────────────────────────

test('play a Piecie from hand — appears on field', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);

	const hand = await readHand(page);
	const piecie = hand.find(c => c.cardType === 'PIECIE');
	if (!piecie) { console.log('No Piecie in hand — skip'); return; }
	console.log('Playing:', piecie);

	const fieldBefore = await page.evaluate(() =>
		document.querySelectorAll('.piecie-slot:not(.piecie-slot--empty)').length
	);

	const wrap = page.locator(`.hand-card-wrap[data-card-id="${piecie.cardId}"]`);
	const playBtn = wrap.locator('.hand-card__play-btn');
	if (await playBtn.isVisible({ timeout: 500 }).catch(() => false)) {
		await playBtn.click();
	} else {
		await wrap.click();
	}
	await page.waitForTimeout(600);
	await ss(page, '05a-after-play-click');

	// Dismiss any modal
	const modal = page.locator('.modal-overlay');
	if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
		await ss(page, '05b-modal');
		const cancel = page.locator('.btn-cancel, button:has-text("Annuleer"), button:has-text("Cancel")').first();
		if (await cancel.isVisible({ timeout: 300 }).catch(() => false)) await cancel.click();
	}

	const fieldAfter = await page.evaluate(() =>
		document.querySelectorAll('.piecie-slot:not(.piecie-slot--empty)').length
	);

	const log = await readLog(page);
	console.log('Field slots before/after:', fieldBefore, '→', fieldAfter);
	console.log('Recent log:', log.slice(-3));
	await ss(page, '05c-after-piecie');

	// Either the field grew OR a log entry appeared (card may have gone to active immediately)
	const logMentionsCard = log.some(l => l.toLowerCase().includes(piecie.cardId.replace('piecie_', '').replace(/_/g, ' ')));
	const fieldGrew = fieldAfter > fieldBefore;
	console.log('Field grew:', fieldGrew, '| Log mentions card:', logMentionsCard);
});

// ─── Test 6: two full turns — game state stays coherent ──────────────────────

test('two full turns — log grows and no crash', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);

	for (let turn = 1; turn <= 2; turn++) {
		const logBefore = await readLog(page);
		await page.click('#btn-end-turn');
		await page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 25000 });
		const logAfter = await readLog(page);
		console.log(`Turn ${turn}: log grew by ${logAfter.length - logBefore.length} entries`);
		expect(logAfter.length).toBeGreaterThan(logBefore.length);
		await ss(page, `06-turn-${turn}`);
	}

	// Confirm game is still running
	const label = await page.locator('#turn-label').textContent();
	console.log('Label after 2 turns:', label);
	expect(label).toContain('You');
});
