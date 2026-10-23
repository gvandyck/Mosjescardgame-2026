// Every card hover popup is docked in the same spot as the action spotlight (right side of the screen),
// whichever card is hovered (own or opponent's Mosje, face-up Piecie) and wherever the cursor is.
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField } from './helpers.js';

async function box(locator) {
	const b = await locator.boundingBox();
	return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
}

test('hover popups for any card sit in the spotlight dock (right side, vertically centred)', async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 30, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_michelle', { mp: 20, level: 1 });
	await page.evaluate(() => {
		window.__testHooks.clearEntryProtection();
		window.__testHooks.setPiecieOnField('player_1', 1, 'piecie_broodje_doner', { faceDown: false });
	});
	await page.mouse.move(5, 5);
	await page.waitForTimeout(800);

	const targets = [
		page.locator('.board-zone--player .card--mosje').first(),
		page.locator('.board-zone--opponent .card--mosje').first(),
		page.locator('.board-zone--player .board-zone__piecies .card[data-card-id="piecie_broodje_doner"]').first(),
	];
	const boxes = [];
	for (const target of targets) {
		await target.hover();
		await page.waitForTimeout(400);
		const pop = page.locator('.hover-zoom');
		await expect(pop).toHaveCount(1);
		boxes.push(await box(pop));
		// moving the cursor inside the card must not drag the popup along
		const t = await target.boundingBox();
		await page.mouse.move(t.x + 12, t.y + 12);
		await page.waitForTimeout(150);
		expect(await box(pop)).toEqual(boxes[boxes.length - 1]);
		await page.mouse.move(5, 5);
		await expect(pop).toHaveCount(0);
	}
	// identical box for every hovered card, docked right and vertically centred
	expect(boxes[1]).toEqual(boxes[0]);
	expect(boxes[2]).toEqual(boxes[0]);
	const [b] = boxes;
	expect(Math.abs((b.x + b.w) - (1920 - 0.05 * 1920))).toBeLessThanOrEqual(2);
	expect(Math.abs((b.y + b.h / 2) - 540)).toBeLessThanOrEqual(2);

	// same dock as the action spotlight
	await page.evaluate(async () => {
		const m = await import('/src/ui/actionAnimations.js');
		m.animateFieldActivation({ zone: 'mosje', playerId: 'player_1', slotIndex: 0, cardId: 'mosje_michelle' });
	});
	await page.waitForTimeout(700);
	const spot = await box(page.locator('.card-spotlight'));
	expect(Math.abs(spot.x - b.x)).toBeLessThanOrEqual(2);
	expect(Math.abs(spot.y - b.y)).toBeLessThanOrEqual(2);
	expect(Math.abs(spot.w - b.w)).toBeLessThanOrEqual(2);
	expect(Math.abs(spot.h - b.h)).toBeLessThanOrEqual(2);
});

test('hovering a hand card previews it in the same dock at the same size, with all its text inside the box', async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await seedOfflineSession(page, 'EXAMPLE_TAKSEN', 'EXAMPLE_CREATIEVELINGEN');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.evaluate(() => window.__testHooks.setHand('player_1', ['piecie_kannetje_melk', 'piecie_bowie_stormey', 'piecie_tony']));
	await page.waitForTimeout(800);

	await page.locator('.hand-card-wrap[data-card-id="piecie_bowie_stormey"]').hover({ position: { x: 150, y: 60 } });
	await page.waitForTimeout(500);
	const pop = page.locator('.hover-zoom.hover-zoom--hand');
	await expect(pop).toHaveCount(1);
	const b = await box(pop);
	expect(Math.abs((b.x + b.w) - (1920 - 0.05 * 1920))).toBeLessThanOrEqual(2); // same right edge as the field preview and the spotlight
	expect(Math.abs((b.y + b.h / 2) - 540)).toBeLessThanOrEqual(2); // vertically centred
	expect(Math.abs(b.w - 356)).toBeLessThanOrEqual(2); // the spotlight / field preview size: clamp(240px, 33vh, 360px) at 1080px high
	expect(Math.abs(b.h - b.w * 1.5)).toBeLessThanOrEqual(2);

	// every paragraph of Bowie & Stormey's long text ends inside the text plate (auto-fit text size)
	const fit = await pop.evaluate((el) => {
		const plate = el.querySelector('.ct-plate');
		const desc = el.querySelector('.cv1-desc');
		return { over: desc.getBoundingClientRect().bottom - plate.getBoundingClientRect().bottom, paragraphs: desc.children.length };
	});
	expect(fit.paragraphs).toBeGreaterThanOrEqual(4);
	expect(fit.over).toBeLessThanOrEqual(1);
	await page.mouse.move(5, 5);
	await expect(pop).toHaveCount(0);
});
