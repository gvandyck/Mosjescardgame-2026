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

const STACKS = ['PHYSICAL', 'DIGITAL', 'CREATIVE'];
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
const anyPips = (page, id) => stackOf(page, id).locator('.cv2-pip, [data-cv1-pip]');

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
		await expect(anyPips(page, id), `${id} shows no fail pips (72-15)`).toHaveCount(0);
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

test('U5: a failed Quest goes back into its stack and a fresh Quest is turned up', async ({ page }) => {
	test.setTimeout(60000);
	await bootWithoutHand(page);
	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await expect(stackOf(page, 'PHYSICAL')).toHaveAttribute('data-quest', 'quest_tough_it_out');
	const before = (await getGameState(page)).questStacks.PHYSICAL.deck.length;
	await setNextDice(page, [1, 1, 1, 1, 1, 1]);
	await questViaUi(page, { slot: 0, stackId: 'PHYSICAL' });
	const gs = await getGameState(page);
	// 70-07 / D-16: no fail tokens; after one attempt the Quest is shuffled back and the next one is turned up.
	expect(gs.questStacks.PHYSICAL.tokens, 'no engine fail token').toBeUndefined();
	expect(gs.questStacks.PHYSICAL.faceUp, 'a Quest is turned face-up').toBeTruthy(); // D-16: the attempted Quest is shuffled back first, so the same card can come up again
	expect([gs.questStacks.PHYSICAL.faceUp, ...gs.questStacks.PHYSICAL.deck], 'the failed Quest is back in the stack').toContain('quest_tough_it_out');
	expect(gs.questStacks.PHYSICAL.deck.length, 'the stack keeps its size').toBe(before);
	await expect(stackOf(page, 'PHYSICAL')).toHaveAttribute('data-quest', gs.questStacks.PHYSICAL.faceUp);
	await expect(anyPips(page, 'PHYSICAL'), 'fresh Quest has no fail pips').toHaveCount(0);
	await expect(stackOf(page, 'PHYSICAL').locator('.quest-stack__count')).toHaveText(`${gs.questStacks.PHYSICAL.deck.length} left`);
});

test('U5: a won Quest is replaced by the next one in its stack', async ({ page }) => {
	test.setTimeout(60000);
	await bootWithoutHand(page);
	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out');
	await expect(stackOf(page, 'PHYSICAL')).toHaveAttribute('data-quest', 'quest_tough_it_out');
	const before = (await getGameState(page)).questStacks.PHYSICAL.deck.length;
	await setNextDice(page, [6, 6, 6]);
	await questViaUi(page, { slot: 0, stackId: 'PHYSICAL' });
	const gs = await getGameState(page);
	expect(gs.questStacks.PHYSICAL.faceUp, 'next Quest turned face-up').toBeTruthy(); // D-16: the attempted Quest is shuffled back first, so the same card can come up again
	await expect(stackOf(page, 'PHYSICAL')).toHaveAttribute('data-quest', gs.questStacks.PHYSICAL.faceUp);
	await expect(anyPips(page, 'PHYSICAL')).toHaveCount(0);
	await expect(stackOf(page, 'PHYSICAL')).toHaveAttribute('data-stack-count', String(gs.questStacks.PHYSICAL.deck.length));
	expect(gs.questStacks.PHYSICAL.deck.length, 'the won Quest is shuffled back, the stack keeps its size').toBe(before);
});
