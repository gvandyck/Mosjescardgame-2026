/**
 * quest-stacks.spec.js - U5: the 3 Quests as 2.0 tiles on visible stacks in the middle strip (UI-01, Phase 63-03, D-09).
 * Each stack shows the Quest tile (with its dice need) on two card edges and "<n> left"; the 2 fail pips fill from
 * state.questStacks[stack].tokens; after a win or a 2nd fail the next Quest takes the stack.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setQuestFaceUp, setNextDice, questViaUi, setHand,
} from './helpers.js';

const STACKS = ['FIGHTING', 'DIGITAL', 'ARTISTIC'];
const SHOT_DIR = 'tests/ui/screenshots/board-2-0';

async function boot(page) {
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 40, level: 2 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await clearEntryProtection(page);
}
// The Quest-flow tests start with both hands empty: a random opening reaction Snelle (Sleutelpuntje in mine, Je Weet Niet in
// the bot's) would open a reaction window or reroll the forced dice in the middle of questViaUi. The hands have no bearing on the stacks.
async function bootWithoutHand(page) {
	await boot(page);
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
}
const stackOf = (page, id) => page.locator(`[data-zone="middle"] [data-quest-stack="${id}"]`);
const filledPips = (page, id) => stackOf(page, id).locator('[data-cv1-pip="filled"]');

test('U5: 3 Quest tiles on visible stacks, each with its dice need, 2 edges and a "<n> left" count', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await page.mouse.move(2, 2);
	await expect(page.locator('[data-zone="middle"] [data-quest-stack]')).toHaveCount(3);
	const gs = await getGameState(page);
	const boxes = [];
	for (const id of STACKS) {
		const stack = stackOf(page, id);
		const left = gs.questStacks[id].deck.length;
		await expect(stack, `${id} Quest face-up`).toHaveAttribute('data-quest', gs.questStacks[id].faceUp);
		await expect(stack.locator('.cv2-tile'), `${id} shows the 2.0 Quest tile`).toBeVisible();
		await expect(stack.locator('[data-cv1-need]'), `${id} shows the dice need`).toBeVisible();
		await expect(stack.locator('.quest-stack__edge'), `${id} stack edges`).toHaveCount(2);
		await expect(stack, `${id} count hook`).toHaveAttribute('data-stack-count', String(left));
		await expect(stack.locator('.quest-stack__count'), `${id} strip text`).toHaveText(`${left} left`);
		await expect(filledPips(page, id), `${id} starts without fail pips`).toHaveCount(0);
		await expect(stack.locator('[data-cv1-pip]'), `${id} has 2 pips`).toHaveCount(2);
		boxes.push(await stack.locator('.card').boundingBox());
	}
	// Geometry: tiles are full size, side by side without overlap, inside the middle strip.
	const middle = await page.locator('[data-zone="middle"]').boundingBox();
	for (const [i, b] of boxes.entries()) {
		expect(b.height, `Quest tile ${i} height`).toBeGreaterThanOrEqual(150);
		expect(b.y).toBeGreaterThanOrEqual(middle.y - 1);
		expect(b.y + b.height).toBeLessThanOrEqual(middle.y + middle.height + 1);
		if (i > 0) expect(b.x, `Quest tile ${i} clear of the previous`).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].width);
	}
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/u5-quests.png` });
});

test('U5: a failed Quest fills a fail pip; the 2nd fail replaces the Quest with a fresh one (0 pips)', async ({ page }) => {
	test.setTimeout(60000);
	await bootWithoutHand(page);
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await expect(stackOf(page, 'FIGHTING')).toHaveAttribute('data-quest', 'quest_tough_it_out');
	await setNextDice(page, [1, 1, 1, 1, 1, 1]);
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	let gs = await getGameState(page);
	expect(gs.questStacks.FIGHTING.tokens, 'engine fail token').toBe(1);
	await expect(stackOf(page, 'FIGHTING')).toHaveAttribute('data-quest', 'quest_tough_it_out');
	await expect(filledPips(page, 'FIGHTING'), 'one filled pip after the first fail').toHaveCount(1);
	await expect(filledPips(page, 'DIGITAL'), 'other stacks untouched').toHaveCount(0);

	// Second failed attempt (second Mosje, same turn): the Quest leaves, the next one comes in with empty pips.
	await questViaUi(page, { slot: 1, stackId: 'FIGHTING' });
	gs = await getGameState(page);
	expect(gs.questStacks.FIGHTING.faceUp).not.toBe('quest_tough_it_out');
	await expect(stackOf(page, 'FIGHTING')).toHaveAttribute('data-quest', gs.questStacks.FIGHTING.faceUp);
	await expect(filledPips(page, 'FIGHTING'), 'fresh Quest has no fail pips').toHaveCount(0);
	await expect(stackOf(page, 'FIGHTING').locator('.quest-stack__count')).toHaveText(`${gs.questStacks.FIGHTING.deck.length} left`);
});

test('U5: a won Quest is replaced by the next one in its stack', async ({ page }) => {
	test.setTimeout(60000);
	await bootWithoutHand(page);
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out');
	await expect(stackOf(page, 'FIGHTING')).toHaveAttribute('data-quest', 'quest_tough_it_out');
	const before = (await getGameState(page)).questStacks.FIGHTING.deck.length;
	await setNextDice(page, [6, 6, 6]);
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	const gs = await getGameState(page);
	expect(gs.questStacks.FIGHTING.faceUp, 'next Quest turned face-up').not.toBe('quest_tough_it_out');
	await expect(stackOf(page, 'FIGHTING')).toHaveAttribute('data-quest', gs.questStacks.FIGHTING.faceUp);
	await expect(filledPips(page, 'FIGHTING')).toHaveCount(0);
	await expect(stackOf(page, 'FIGHTING')).toHaveAttribute('data-stack-count', String(gs.questStacks.FIGHTING.deck.length));
	expect(gs.questStacks.FIGHTING.deck.length, 'one card left the deck').toBe(before - 1);
});
