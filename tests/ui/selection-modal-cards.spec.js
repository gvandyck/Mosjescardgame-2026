/**
 * selection-modal-cards.spec.js - Phase 72-01: the generic option modal shows cards as options, a prompt card and a leave option.
 * Headless 1920x1080 (run through a temp config; the "visual" project is headed).
 */
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard } from './helpers.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const MOSJES = ['mosje_chris_ddr', 'mosje_alyssa_bulldozer', 'mosje_jeffrey', 'mosje_michelle', 'mosje_ronald_chef'];

function config(extra = {}) {
	return {
		title: 'Choose your Mosje',
		prompt: 'Pick one.',
		options: MOSJES.map((cardId, i) => ({
			id: cardId, cardId, label: cardId.replace('mosje_', ''),
			...(i === 4 ? { disabled: true, metaLabel: 'Needs Level 3' } : {}),
		})),
		leave: { id: 'leave', label: 'Leave it' },
		allowCancel: true,
		...extra,
	};
}

async function open(page, cfg) {
	await page.evaluate(c => {
		window.__lastOptionSelect = 'pending';
		window.__testHooks.openOptionSelect(c).then(v => { window.__lastOptionSelect = v; });
	}, cfg);
	await page.waitForSelector('.modal-mosje-select-list');
}
const result = page => page.evaluate(() => window.__lastOptionSelect);

async function boot(page) {
	await seedOfflineSession(page, 'STARTER_PHYSICAL', 'STARTER_DIGITAL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
}

test('card options render as faces, fit the screen, and the disabled one cannot be clicked', async ({ page }) => {
	await boot(page);
	await open(page, config({ promptCard: 'mosje_gandoe_wizard' }));
	const cards = page.locator('.modal-option--card');
	await expect(cards).toHaveCount(5);
	for (let i = 0; i < 5; i++) await expect(cards.nth(i).locator('.card-v1')).toHaveCount(1);
	await expect(page.locator('.modal-card.modal-card--cards')).toHaveCount(1);
	await expect(page.locator('.option-prompt-card .card-v1')).toHaveCount(1);
	await expect(cards.nth(4)).toBeDisabled();
	await expect(page.locator('#modal-option-cancel')).toBeVisible();
	await expect(cards.nth(4)).toContainText('Needs Level 3');
	const box = await cards.nth(4).boundingBox();
	expect(box).not.toBeNull();
	// everything inside the viewport
	for (const loc of [...Array(5).keys()].map(i => cards.nth(i)).concat([page.locator('.modal-option-leave'), page.locator('#modal-option-cancel')])) {
		const b = await loc.boundingBox();
		expect(b.y).toBeGreaterThanOrEqual(0);
		expect(b.y + b.height).toBeLessThanOrEqual(1080);
		expect(b.x + b.width).toBeLessThanOrEqual(1920);
	}
	await page.screenshot({ path: '.planning/phases/72-screens-for-the-new-design/shots/72-01-card-options.png' });
	await cards.nth(4).click({ force: true, timeout: 1000 }).catch(() => {});
	expect(await result(page)).toBe('pending');
	await cards.nth(1).click();
	expect(await result(page)).toBe('mosje_alyssa_bulldozer');
});

test('leave resolves its own id and Cancel still resolves null', async ({ page }) => {
	await boot(page);
	await open(page, config());
	await page.locator('.modal-option-leave').click();
	expect(await result(page)).toBe('leave');
	await open(page, config());
	await page.locator('#modal-option-cancel').click();
	expect(await result(page)).toBeNull();
});

test('a modal without card options is unchanged', async ({ page }) => {
	await boot(page);
	await open(page, { title: 'Plain', options: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] });
	await expect(page.locator('.modal-option--card')).toHaveCount(0);
	await expect(page.locator('.modal-card--cards')).toHaveCount(0);
	await expect(page.locator('.modal-option-leave')).toHaveCount(0);
	await expect(page.locator('.option-prompt-card')).toHaveCount(0);
	await page.locator('.modal-mosje-select-btn[data-id="b"]').click();
	expect(await result(page)).toBe('b');
});
