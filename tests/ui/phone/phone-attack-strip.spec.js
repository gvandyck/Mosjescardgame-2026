/**
 * phone-attack-strip.spec.js - Phase 72.1-07 (D-06, MOB-05, MOB-04): the attack breakdown on a phone, by real taps, at 395x731,
 * 390x844 and 360x740. In the preview state the status strip is a panel docked above the bottom bar: target text, the breakdown
 * lines as a two-column grid (the note is hidden), Confirm and Cancel side by side (>= 48 px, >= 40 % of the width each). Confirm
 * resolves the attack for the shown total; Cancel clears the preview and the strip returns to the top. The panel never covers the
 * chosen target. Other strip kinds stay one 44 px row at the top. A desktop guard (1920x1080) shows the strip unchanged.
 */
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, setHand, setQuestFaceUp } from '../helpers.js';
import { tapOwnCard, chooseTray, targetTile, statusStrip } from '../../helpers/boardTaps.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { readStripPanel } from '../../helpers/readStripPanel.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';
import { intersects } from '../../helpers/phoneGeometry.js';

const TOUCH = { touch: true };

// Own Bulldozer (Physical, Power 20) in slot 0; opponent slot 0 = `target`, slot 1 = Ming (Creative, Res 1).
async function boot(page, { target = 'mosje_coert_tech', fresh = false, boost = 0 } = {}) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1, powerBoost: boost });
	await setMosjeOnField(page, 'player_1', 1, null);
	await setMosjeOnField(page, 'player_2', 0, target, { mp: 60, level: 1, entryProtected: fresh });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_ming_natural', { mp: 60, level: 1 });
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out');
	await page.waitForTimeout(500);
}
const oppMp = async (page, i) => (await getGameState(page)).players.player_2.activeSlots[i].mp;

// A tap low on the left of the tile, clear of the state pills (a tap on the FRESH pill shows its reason instead of choosing).
async function tapTarget(page, target) {
	const tile = targetTile(page, target);
	const box = await tile.boundingBox();
	await tile.tap({ position: { x: Math.round(box.width * 0.2), y: Math.round(box.height * 0.25) } });
}

async function toTargetChoice(page, touch) {
	await tapOwnCard(page, 'mosje', 0, touch);
	await chooseTray(page, 'attack', touch);
	await statusStrip(page).locator('[data-cancel]').waitFor({ state: 'visible', timeout: 5000 });
}
async function toPreview(page, slot) {
	await toTargetChoice(page, TOUCH);
	await tapTarget(page, `player_2:${slot}`);
	await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'preview');
}

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone attack strip at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		let errors;
		test.beforeEach(() => { errors = []; });
		test.afterEach(() => { expect(errors, 'no page errors').toEqual([]); });

		test('(a) Physical on Digital: a docked panel, two grid rows of lines, full-width buttons, nothing cut, Confirm costs the shown total', async ({ page }) => {
			test.setTimeout(90000);
			page.on('pageerror', (e) => errors.push(e.message));
			await boot(page);
			const before = await oppMp(page, 0);
			await toPreview(page, 0);
			await page.waitForTimeout(250);
			const p = await readStripPanel(page, '[data-zone="mosje"][data-player-id="player_2"][data-slot-index="0"]');
			expect(p.lines.filter((l) => l.rect).map((l) => l.kind), 'power, triangle, resilient, total; the note is hidden').toEqual(['power', 'triangle', 'resilient', 'total']);
			expect(p.lines.find((l) => l.kind === 'note')?.rect ?? null, 'the muted note is not drawn on a phone').toBeNull();
			expect(p.textValue).toBe('Alyssa hits Coert: −25 MP (leaves 35)');

			expect(Math.abs(p.bar.y - p.strip.bottom), `the panel touches the bar top (strip bottom ${p.strip.bottom}, bar top ${p.bar.y})`).toBeLessThanOrEqual(8);
			expect(p.strip.bottom, 'the panel ends above the bar').toBeLessThanOrEqual(p.bar.y + 0.5);
			expect(Math.abs(p.strip.w - (vp.width - 16)), `the panel is the width less 16 px (${p.strip.w})`).toBeLessThanOrEqual(1);
			expect(p.barHit, 'the bar stays visible and tappable under a preview').toBe(true);

			// Two rows: the lines sit on at most two distinct tops, Power and Triangle first.
			const tops = [...new Set(p.lines.filter((l) => l.rect).map((l) => Math.round(l.rect.y)))];
			expect(tops.length, `the breakdown reads as two rows (tops ${tops})`).toBeLessThanOrEqual(2);
			expect(p.lines[0].rect.y, 'Power and Triangle share the first row').toBe(p.lines[1].rect.y);
			expect(p.lines[2].rect.y, 'Resilient and the total share the second row').toBe(p.lines[3].rect.y);
			for (const l of p.lines.filter((x) => x.rect)) {
				expect(l.scrollW, `${l.kind} line is not cut sideways (${l.scrollW} vs ${l.clientW})`).toBeLessThanOrEqual(l.clientW + 1);
				expect(l.scrollH, `${l.kind} line is not cut vertically (${l.scrollH} vs ${l.clientH})`).toBeLessThanOrEqual(l.clientH + 1);
				expect(l.rect.x, `${l.kind} inside the screen (left)`).toBeGreaterThanOrEqual(0);
				expect(l.rect.right, `${l.kind} inside the screen (right)`).toBeLessThanOrEqual(vp.width);
				expect(l.rect.right, `${l.kind} inside the panel`).toBeLessThanOrEqual(p.strip.right + 0.5);
			}

			for (const [name, b] of [['Confirm', p.confirm], ['Cancel', p.cancel]]) {
				expect(b.h, `${name} height >= 48`).toBeGreaterThanOrEqual(48);
				expect(b.w, `${name} is at least 40% of the width`).toBeGreaterThanOrEqual(vp.width * 0.4);
				expect(b.x).toBeGreaterThanOrEqual(0);
				expect(b.right).toBeLessThanOrEqual(vp.width);
				expect(b.y, `${name} inside the panel (top)`).toBeGreaterThanOrEqual(p.strip.y);
				expect(b.bottom, `${name} inside the panel (bottom)`).toBeLessThanOrEqual(p.strip.bottom + 0.5);
			}
			expect(intersects(p.confirm, p.cancel), 'Confirm and Cancel do not overlap').toBe(false);
			expect(p.cancel.x - p.confirm.right, 'at least 8 px between Confirm and Cancel').toBeGreaterThanOrEqual(8);
			expect(p.confirm.y, 'side by side').toBe(p.cancel.y);
			expect(p.target, 'the target tile is on screen').not.toBeNull();
			expect(intersects(p.strip, p.target), `the panel does not cover the chosen target ${JSON.stringify(p.target)}`).toBe(false);

			if (vp.name === PIXEL_VIEWPORT.name) await savePhoneShot(page, '72.1-07-attack-strip');

			await statusStrip(page).locator('[data-confirm]').tap();
			await expect.poll(async () => oppMp(page, 0), { message: 'MP lost = the shown total' }).toBe(before - 25);
		});

		test('(b) Cancel clears the preview and the strip goes back to its top row', async ({ page }) => {
			test.setTimeout(90000);
			page.on('pageerror', (e) => errors.push(e.message));
			await boot(page);
			const before = await oppMp(page, 0);
			await toTargetChoice(page, TOUCH);
			const choose = await readStripPanel(page);
			expect(choose.kind).toBe('choose-target');
			expect(choose.strip.y, 'choose-target stays at the top').toBeLessThan(vp.height / 3);
			expect(choose.strip.h, 'one 44 px row').toBeLessThanOrEqual(46);
			expect(choose.cancel.h).toBeGreaterThanOrEqual(44);
			await tapTarget(page, 'player_2:0');
			await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'preview');
			const docked = await readStripPanel(page);
			expect(docked.strip.y, 'docked low').toBeGreaterThan(vp.height / 2);
			await statusStrip(page).locator('[data-cancel]').tap();
			await expect(statusStrip(page)).not.toHaveAttribute('data-status-kind', 'preview');
			await page.waitForTimeout(250);
			const after = await readStripPanel(page);
			expect(after.strip.y, 'the strip is back at the top').toBeLessThan(vp.height / 3);
			expect(after.strip.h).toBeLessThanOrEqual(46);
			expect(await oppMp(page, 0), 'Cancel attacked nothing').toBe(before);
		});

		test('(c) Physical on Creative: no Triangle line, Power then Resilient and the total', async ({ page }) => {
			test.setTimeout(90000);
			page.on('pageerror', (e) => errors.push(e.message));
			await boot(page);
			const before = await oppMp(page, 1);
			await toPreview(page, 1);
			await page.waitForTimeout(250);
			const p = await readStripPanel(page);
			expect(p.lines.filter((l) => l.rect).map((l) => l.kind)).toEqual(['power', 'resilient', 'total']);
			for (const l of p.lines.filter((x) => x.rect)) expect(l.scrollW, `${l.kind} not cut`).toBeLessThanOrEqual(l.clientW + 1);
			expect(p.strip.bottom).toBeLessThanOrEqual(p.bar.y + 0.5);
			expect(p.confirm.h).toBeGreaterThanOrEqual(48);
			await statusStrip(page).locator('[data-confirm]').tap();
			await expect.poll(async () => oppMp(page, 1)).toBe(before - 15);
		});

		test('(d) Power 0: the exact sentence in a docked panel, no Confirm, a full-width Cancel', async ({ page }) => {
			test.setTimeout(90000);
			page.on('pageerror', (e) => errors.push(e.message));
			await boot(page, { boost: -20 });
			await toPreview(page, 1);
			await page.waitForTimeout(250);
			const p = await readStripPanel(page);
			expect(p.textValue).toBe("Can't attack (Power 0)");
			expect(p.confirm, 'no Confirm for a blocked attack').toBeNull();
			expect(p.cancel.h).toBeGreaterThanOrEqual(48);
			expect(p.cancel.w, 'Cancel is full width').toBeGreaterThanOrEqual(vp.width * 0.8);
			expect(p.strip.bottom).toBeLessThanOrEqual(p.bar.y + 0.5);
			expect(p.lines.filter((l) => l.rect)).toEqual([]);
		});

		test('(e) a fresh target: the exact sentence, the strip stays the choose-target row at the top', async ({ page }) => {
			test.setTimeout(90000);
			page.on('pageerror', (e) => errors.push(e.message));
			await boot(page, { fresh: true });
			await toTargetChoice(page, TOUCH);
			await tapTarget(page, 'player_2:0');
			await expect(page.locator('#board-toast')).toHaveText("Protected until its owner's next turn");
			const p = await readStripPanel(page);
			expect(p.kind).toBe('choose-target');
			expect(p.strip.y).toBeLessThan(vp.height / 3);
			expect(p.confirm).toBeNull();
		});
	});
}

test.describe('desktop guard: the strip is unchanged at 1920x1080', () => {
	test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
	test('the preview strip stays in the top row, lines in one row, buttons 44 px', async ({ page }) => {
		test.setTimeout(90000);
		await boot(page);
		await tapOwnCard(page, 'mosje', 0);
		await chooseTray(page, 'attack');
		await statusStrip(page).locator('[data-cancel]').waitFor({ state: 'visible', timeout: 5000 });
		await targetTile(page, 'player_2:0').click();
		await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'preview');
		const p = await readStripPanel(page);
		expect(p.strip.y, 'top of the page').toBeLessThan(200);
		expect(p.strip.h, 'one row').toBeLessThanOrEqual(46);
		const centres = [...new Set(p.lines.filter((l) => l.rect).map((l) => Math.round((l.rect.y + l.rect.h / 2) / 4)))];
		expect(centres.length, 'one row of lines').toBe(1);
		expect(p.lines.find((l) => l.kind === 'note')?.rect, 'the note shows on desktop').toBeTruthy();
		expect(p.confirm.h).toBeGreaterThanOrEqual(44);
	});
});
