/**
 * phone-option-modal.spec.js - Phase 72.1-07 (D-06, D-07, MOB-05, MOB-04): every card-option pause (Wizard top 3, Ming with a prompt
 * card, a forced discard, Wizard with Cancel only, attach replace) on a phone: the faces are a horizontal snap row, the leave and
 * Cancel buttons are pinned at the bottom of the sheet (44 px, full width, always on screen), a prompt card is a thumbnail of at most
 * 96 px beside the prompt text, the sheet is at most 78 dvh, nothing is clipped but the intended peek, a tap on a face resolves it,
 * a swipe resolves nothing. Real touch at 395x731, 390x844, 360x740. Cases: tests/helpers/phoneOptionCases.js (openOptionSelect).
 */
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { seedPhoneBoard } from '../../helpers/phoneBoard.js';
import { OPTION_CASES } from '../../helpers/phoneOptionCases.js';
import { readSheet } from '../../helpers/readSheet.js';
import { readSnapRow } from '../../helpers/readSnapRow.js';
import { rectOf, pageOverflow } from '../../helpers/phoneGeometry.js';
import { swipe } from '../../helpers/phoneSwipe.js';

const ROW = '.modal-card--cards .modal-mosje-select-list';
const open = (page, config) => page.evaluate((c) => { window.__testHooks.openOptionSelect(c); }, config).then(() => page.waitForSelector(`${ROW} .modal-option--card`));
const last = (page) => page.evaluate(() => window.__lastOptionSelect);
async function settle(page) {
	let still = 0;
	let prev = -1;
	await expect.poll(async () => {
		const n = (await readSnapRow(page, ROW)).scrollLeft;
		still = n === prev ? still + 1 : 0;
		prev = n;
		return still >= 3;
	}, { intervals: [150], timeout: 10000 }).toBe(true);
}
// Headless Chromium sometimes drops the click of a first synthetic tap; tap up to three times until the pause has resolved.
async function tapUntilResolved(page, locator) {
	for (let i = 0; i < 3 && (await last(page)) === 'pending'; i++) {
		await locator.tap({ timeout: 4000 }).catch(() => {});
		await page.waitForTimeout(250);
	}
}

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone option modal at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		for (const c of OPTION_CASES) {
			test(`${c.name}`, async ({ page }) => {
				test.setTimeout(120000);
				const errors = [];
				page.on('pageerror', (e) => errors.push(e.message));
				await seedPhoneBoard(page, { hand: [], energy: 6 });
				await open(page, c.config);
				await page.waitForTimeout(400); // the slide-up ends
				const modal = page.locator('.modal-card--cards');
				const sheet = await readSheet(page);
				const n = c.config.options.length;

				// The sheet: bottom edge, at most 78 dvh, no sideways page scroll.
				expect(Math.abs(sheet.bottom - sheet.innerHeight), 'a bottom sheet').toBeLessThanOrEqual(1);
				expect(sheet.height, `sheet ${sheet.height} <= 78 dvh`).toBeLessThanOrEqual(sheet.innerHeight * 0.78 + 1);
				expect((await pageOverflow(page)).x, 'no sideways page scroll').toBeLessThanOrEqual(0);

				// The faces: a snap row, the first face whole, the next peeking, vertically unclipped.
				const row = await readSnapRow(page, ROW);
				expect(row.itemLefts.length).toBe(n);
				expect(row.scrollWidth, `row scrolls (${row.scrollWidth} vs ${row.clientWidth})`).toBeGreaterThan(row.clientWidth);
				expect(row.snapType).toMatch(/^x mandatory/);
				expect(row.flexWrap).toBe('nowrap');
				const list = await rectOf(page, ROW);
				const faces = await page.locator(`${ROW} .modal-option--card`).evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { y: r.top, bottom: r.bottom }; }));
				for (const f of faces) {
					expect(f.y, 'face top not clipped').toBeGreaterThanOrEqual(list.y - 1);
					expect(f.bottom, 'face bottom not clipped').toBeLessThanOrEqual(list.bottom + 1);
				}
				expect(row.itemLefts[0], 'first face starts inside the sheet').toBeGreaterThanOrEqual(sheet.left);
				expect(row.itemLefts[0] + row.itemWidths[0], 'first face ends inside the row').toBeLessThanOrEqual(row.rowRight);
				if (c.config.promptCard) {
					for (const w of row.itemWidths) expect(w, 'faces are min(56vw, 200px) beside a prompt card').toBeLessThanOrEqual(Math.min(0.56 * vp.width, 200) + 1);
				}

				// Face text stays inside its box at the rendered width.
				const bad = await modal.evaluate((m) => [...m.querySelectorAll('.card-v1')].flatMap((card, i) => {
					const t = card.querySelector('.cv2-text');
					const b = card.querySelector('.cv2-textbox');
					if (!t || !b) return [];
					const out = t.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom;
					return out > 1 ? [`face ${i} text leaves its box by ${Math.round(out)}px`] : [];
				}));
				expect(bad).toEqual([]);

				// The prompt card is a thumbnail of at most 96 px beside the prompt text.
				if (c.config.promptCard) {
					const pc = await rectOf(page, '.option-prompt-card .card');
					expect(pc.w, `prompt card ${pc.w} <= 96`).toBeLessThanOrEqual(96);
				}

				// The footer: leave and Cancel on screen, inside the sheet, 44 px, full width, at the bottom.
				const foot = [];
				if (c.leaveId) foot.push('.modal-option-leave');
				if (c.cancel) foot.push('#modal-option-cancel');
				for (const sel of foot) {
					const b = await rectOf(page, `.modal-card--cards ${sel}`);
					expect(b.h, `${sel} >= 44`).toBeGreaterThanOrEqual(44);
					expect(b.w, `${sel} full width`).toBeGreaterThanOrEqual(vp.width - 40);
					expect(b.y, `${sel} on screen`).toBeGreaterThanOrEqual(sheet.top);
					expect(b.bottom, `${sel} inside the sheet and the screen`).toBeLessThanOrEqual(Math.min(sheet.bottom, vp.height) + 0.5);
				}
				if (foot.length) {
					const lastBtn = await rectOf(page, `.modal-card--cards ${foot[foot.length - 1]}`);
					expect(sheet.bottom - lastBtn.bottom, 'the last button sits at the bottom of the sheet').toBeLessThanOrEqual(40);
					if (foot.length > 1) {
						const a = await rectOf(page, `.modal-card--cards ${foot[0]}`);
						const b = await rectOf(page, `.modal-card--cards ${foot[1]}`);
						expect(a.bottom, 'leave and Cancel do not overlap').toBeLessThanOrEqual(b.y + 0.5);
					}
				} else {
					await expect(modal.locator('.modal-option-leave, #modal-option-cancel')).toHaveCount(0);
				}

				// Hover must not lift a face on touch.
				await modal.locator('.modal-option--card').first().hover();
				expect(await modal.locator('.modal-option--card').first().evaluate((el) => getComputedStyle(el).transform)).toBe('none');

				// A swipe on the row resolves nothing and moves the row.
				const y = list.y + list.h / 2;
				await swipe(page, { from: { x: vp.width - 40, y }, to: { x: vp.width - 190, y } });
				await page.waitForTimeout(500);
				expect((await readSnapRow(page, ROW)).scrollLeft, 'the swipe moved the row').toBeGreaterThan(0);
				expect(await last(page), 'a swipe resolves nothing').toBe('pending');
				await expect(modal).toBeVisible();

				// A tap on the last face resolves it.
				const lastFace = modal.locator('.modal-option--card').nth(n - 1);
				await lastFace.evaluate((el) => el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' }));
				await settle(page);
				await tapUntilResolved(page, lastFace);
				expect(await last(page), 'the tapped face resolves').toBe(c.config.options[n - 1].id);

				// Leave, then Cancel, resolve their ids.
				if (c.leaveId) {
					await open(page, c.config);
					await page.waitForTimeout(400);
					await tapUntilResolved(page, modal.locator('.modal-option-leave'));
					expect(await last(page), 'leave resolves its id').toBe(c.leaveId);
				}
				if (c.cancel) {
					await open(page, c.config);
					await page.waitForTimeout(400);
					await tapUntilResolved(page, modal.locator('#modal-option-cancel'));
					expect(await last(page), 'Cancel resolves null').toBeNull();
				}
				expect(errors).toEqual([]);
			});
		}
	});
}
