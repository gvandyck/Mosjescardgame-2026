/**
 * attack-and-quest-2-0.spec.js - Obby 2.0 attack and Quest on the live board (handoff E12, E13, E16, E17).
 * PLAY-01..07 as seen by the player: 3 face-up Quests, attack = target loses attacker Power, one action per Mosje,
 * Quest win/fail MP + fail tokens (dice forced via the testMode hook setNextDice).
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setQuestFaceUp, setNextDice, setHand, attackViaUi, questViaUi,
} from './helpers.js';
import { tapOwnCard, chooseTray } from '../helpers/boardTaps.js';
import { previewAttack } from '../../src/engine/attack/previewAttack.js';

async function boot(page) {
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 40, level: 2 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	// Both hands empty: a random opening reaction Snelle (Sleutelpuntje in mine, Je Weet Niet in the bot's) would open a
	// reaction window or reroll the forced dice in the middle of the Quest taps. The hands have no bearing on these rules.
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
}
const mp = (gs, pid, i = 0) => gs.players[pid].activeSlots[i].mp;

test('E12/E13: 3 face-up Quests; attack drops the target by the previewed loss; that Mosje cannot then Quest', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await expect(page.locator('#quest-stacks')).toBeVisible();
	const gs0 = await getGameState(page);
	for (const s of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) expect(gs0.questStacks[s].faceUp, `${s} face-up`).toBeTruthy();
	// 70-02: the loss is Power + type triangle - Resilient (at least 5): the engine's own preview.
	const power = previewAttack(gs0, 'player_1', 0, 'player_2', 0).final;
	expect(power).toBeGreaterThan(0);
	const before = mp(gs0, 'player_2');
	await attackViaUi(page);
	const gs1 = await getGameState(page);
	expect(mp(gs1, 'player_2'), 'opponent MP dropped by Power').toBe(before - power);
	await expect(page.locator('.mosje-card--opponent').first()).toContainText(String(before - power));
	// One action per Mosje: the only Mosje already acted, so its Quest chip is dimmed and the tap says it already acted.
	await tapOwnCard(page, 'mosje', 0);
	await expect(page.locator('[data-action-tray] [data-action="quest"]')).toHaveAttribute('aria-disabled', 'true');
	await chooseTray(page, 'quest', { force: true });
	await expect(page.locator('#board-toast')).toContainText('already acted');
});

test('E16: Quest win with forced dice gives +25 and a new Quest face-up', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [6, 6, 6]);
	const before = mp(await getGameState(page), 'player_1');
	await questViaUi(page, { slot: 0, stackId: 'PHYSICAL' });
	const gs = await getGameState(page);
	expect(mp(gs, 'player_1')).toBe(before + 25);
	expect(gs.questStacks.PHYSICAL.faceUp, 'next Quest turned face-up').toBeTruthy(); // D-16: the attempted Quest is shuffled back first, so the same card can come up again
	expect(gs.questStacks.PHYSICAL.faceUp).toBeTruthy();
	await expect(page.locator('.mosje-card--owned').first()).toContainText(String(before + 25));
});

test('E17: Quest fail loses 15, the Quest goes back into its stack and a new one is turned up (no fail tokens)', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out');
	await setNextDice(page, [1, 1, 1, 1, 1, 1]);
	const before = mp(await getGameState(page), 'player_1');
	await questViaUi(page, { slot: 0, stackId: 'PHYSICAL' });
	const gs = await getGameState(page);
	expect(mp(gs, 'player_1')).toBe(before - 15);
	// 70-07 / D-16: win or fail, the attempted Quest is shuffled back into the stack and the next one is turned up.
	expect(gs.questStacks.PHYSICAL.faceUp, 'a new Quest is turned up').toBeTruthy(); // D-16: the attempted Quest is shuffled back first, so the same card can come up again
	expect([gs.questStacks.PHYSICAL.faceUp, ...gs.questStacks.PHYSICAL.deck], 'the attempted Quest is back in the stack').toContain('quest_tough_it_out');
	expect(gs.questStacks.PHYSICAL.tokens, 'no fail tokens any more').toBeUndefined();
});
