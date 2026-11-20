/**
 * log-and-modals-words.spec.js - Phase 72-09 (D-10, NUI-04): the battle log, float texts and the dice and target
 * modals read in words. No emoji, pictograph or arrow; a log row is the plain message with its type class.
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, clearEntryProtection,
	setQuestFaceUp, setNextDice, setHand, attackViaUi, questViaUi, readLog,
} from './helpers.js';

const BANNED = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{27BF}\u{2B50}\u{2190}-\u{21FF}\u{FE0F}]/u;

async function boot(page) {
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 40, level: 2 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
}

test('log rows and float texts after an attack and a Quest carry no glyphs; rows grow per action', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page);
	await page.evaluate(() => {
		window.__seenTexts = new Set();
		const grab = () => {
			for (const el of document.querySelectorAll('[class*="spotlight"], [class*="float"], .cast-chip, .quest-badge')) {
				const t = el.textContent?.trim();
				if (t && t.length < 120) window.__seenTexts.add(t);
			}
		};
		new MutationObserver(grab).observe(document.body, { childList: true, subtree: true, characterData: true });
	});
	const rows0 = (await readLog(page)).length;
	await attackViaUi(page);
	const rows1 = await readLog(page);
	expect(rows1.length, 'the attack adds a log row').toBeGreaterThan(rows0);

	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out');
	await setNextDice(page, [6, 6, 6]);
	await clearEntryProtection(page);
	await setMosjeOnField(page, 'player_1', 1, 'mosje_binti', { mp: 40, level: 2 });
	await questViaUi(page, { slot: 1, stackId: 'PHYSICAL' });
	const rows2 = await readLog(page);
	expect(rows2.length, 'the Quest adds a log row').toBeGreaterThan(rows1.length);

	for (const row of rows2) expect(row, `log row "${row}"`).not.toMatch(BANNED);

	const info = await page.evaluate(() => ({
		rows: [...document.querySelectorAll('#log-root .log-row')].map(el => [el.className, el.getAttribute('data-log-type')]),
		seen: [...window.__seenTexts],
	}));
	expect(info.rows.length).toBe(rows2.length);
	for (const [cls, dataType] of info.rows) {
		expect(cls).toMatch(/^log-row \S+/);
		expect(dataType).toBeTruthy();
	}
	for (const t of info.seen) expect(t, `float text "${t}"`).not.toMatch(BANNED);
});

test('the dice modal and the target modal use words', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	const dice = await page.evaluate(async () => {
		const { initModalManager } = await import('/src/ui/modalManager.js');
		const mm = initModalManager(document.body);
		mm.showDiceRoll({ name: 'Test Quest', successMP: 25, failMP: -15, roll: { trait: 'strength' } }, 1, () => {}, { forceReroll: true });
		const before = document.querySelector('.dice-modal')?.textContent ?? '';
		const rollText = document.querySelector('#modal-roll')?.textContent ?? '';
		document.querySelector('#modal-roll')?.click();
		await new Promise(r => setTimeout(r, 3500));
		const after = document.querySelector('.dice-modal')?.textContent ?? '';
		return { before, rollText, after, reroll: document.querySelector('#modal-reroll')?.textContent ?? '', headline: document.querySelector('.dice-result-headline')?.textContent ?? '' };
	});
	expect(dice.rollText.trim()).toBe('Roll dice');
	expect(dice.before).not.toMatch(BANNED);
	expect(dice.headline.trim()).toBe('Success!');
	expect(dice.reroll.trim()).toBe('Je Weet Niet: reroll');
	expect(dice.after).not.toMatch(BANNED);

	const target = await page.evaluate(async () => {
		const { initModalManager } = await import('/src/ui/modalManager.js');
		const mm = initModalManager(document.body);
		mm.showTargetSelector([
			{ id: 'a', label: 'Alyssa', mpValue: 40, level: 1, protected: true },
			{ id: 'b', label: 'Binti', mpValue: 30, level: 2 },
		], 'Pick one');
		await new Promise(r => setTimeout(r, 100));
		return document.querySelector('.modal-card')?.textContent ?? '';
	});
	expect(target).not.toMatch(BANNED);
	expect(target).toContain('Select target');
	expect(target).toContain('Alyssa (protected)');
});
