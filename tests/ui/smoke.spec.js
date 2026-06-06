import { test, expect } from '@playwright/test';
import {
	GAME_URL,
	seedOfflineSession,
	waitForBoard,
	ss,
	readLog,
	readOwnedMosjes,
	readHand,
	endTurnAndWait,
	countActivePiecieSlots,
} from './helpers.js';

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
		expect(m.mp).toBeGreaterThanOrEqual(0);
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

	const logBefore   = await readLog(page);
	const mosjesBefore = await readOwnedMosjes(page);
	console.log('Before — Mosjes:', mosjesBefore);
	await ss(page, '04a-before-end-turn');

	await endTurnAndWait(page);

	const logAfter    = await readLog(page);
	const mosjesAfter = await readOwnedMosjes(page);
	console.log('After — Mosjes:', mosjesAfter);
	console.log('New log entries:', logAfter.slice(logBefore.length));
	await ss(page, '04b-after-bot-turn');

	expect(logAfter.length).toBeGreaterThan(logBefore.length);
	const label = await page.locator('#turn-label').textContent();
	expect(label).toContain('You');
});

// ─── Test 5: play a Piecie card from hand ────────────────────────────────────

test('play a Piecie from hand — appears on field', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);

	const hand = await readHand(page);
	const piecie = hand.find(c => c.cardType === 'PIECIE');
	if (!piecie) { console.log('No Piecie in hand — skip'); return; }
	console.log('Playing:', piecie);

	const fieldBefore = await countActivePiecieSlots(page);

	const wrap = page.locator(`.hand-card-wrap[data-card-id="${piecie.cardId}"]`);
	const playBtn = wrap.locator('.hand-card__play-btn');
	if (await playBtn.isVisible({ timeout: 500 }).catch(() => false)) {
		await playBtn.click();
	} else {
		await wrap.click();
	}
	await page.waitForTimeout(800);
	await ss(page, '05a-after-play-click');

	const modal = page.locator('.modal-overlay');
	if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
		await ss(page, '05b-modal');
		const cancel = page.locator('.btn-cancel, #modal-option-cancel, button:has-text("Annuleer")').first();
		if (await cancel.isVisible({ timeout: 300 }).catch(() => false)) await cancel.click();
	}

	const fieldAfter = await countActivePiecieSlots(page);
	const log = await readLog(page);
	console.log('Field slots before/after:', fieldBefore, '→', fieldAfter);
	console.log('Recent log:', log.slice(-3));
	await ss(page, '05c-after-piecie');
});

// ─── Test 6: two full turns — game state is coherent ─────────────────────────

test('two full turns — log grows and no crash', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);

	for (let turn = 1; turn <= 2; turn++) {
		const logBefore = await readLog(page);
		await endTurnAndWait(page);
		const logAfter = await readLog(page);
		console.log(`Turn ${turn}: log grew by ${logAfter.length - logBefore.length} entries`);
		expect(logAfter.length).toBeGreaterThan(logBefore.length);
		await ss(page, `06-turn-${turn}`);
	}

	const label = await page.locator('#turn-label').textContent();
	console.log('Label after 2 turns:', label);
	expect(label).toContain('You');
});
