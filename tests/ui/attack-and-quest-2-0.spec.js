/**
 * attack-and-quest-2-0.spec.js - Obby 2.0 attack and Quest on the live board (handoff E12, E13, E16, E17).
 * PLAY-01..07 as seen by the player: 3 face-up Quests, attack = target loses attacker Power, one action per Mosje,
 * Quest win/fail MP + fail tokens (dice forced via the testMode hook setNextDice).
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setQuestFaceUp, setNextDice, attackViaUi, questViaUi,
} from './helpers.js';
import { getPower } from '../../src/engine/mp/getPower.js';

async function boot(page) {
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 40, level: 2 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await clearEntryProtection(page);
}
const mp = (gs, pid, i = 0) => gs.players[pid].activeSlots[i].mp;

test('E12/E13: 3 face-up Quests; attack drops the target by the attacker Power; that Mosje cannot then Quest', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await expect(page.locator('#quest-stacks')).toBeVisible();
	const gs0 = await getGameState(page);
	for (const s of ['FIGHTING', 'DIGITAL', 'ARTISTIC']) expect(gs0.questStacks[s].faceUp, `${s} face-up`).toBeTruthy();
	const power = getPower(gs0.players.player_1.activeSlots[0]);
	expect(power).toBeGreaterThan(0);
	const before = mp(gs0, 'player_2');
	await attackViaUi(page);
	const gs1 = await getGameState(page);
	expect(mp(gs1, 'player_2'), 'opponent MP dropped by Power').toBe(before - power);
	await expect(page.locator('.mosje-card--opponent').first()).toContainText(String(before - power));
	// One action per Mosje: the only Mosje already acted, so the Quest picker offers nobody.
	await page.click('#btn-quest');
	await expect(page.locator('.modal-card')).toContainText('No Mosje can act');
});

test('E16: Quest win with forced dice gives +25 and a new Quest face-up', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [6, 6, 6]);
	const before = mp(await getGameState(page), 'player_1');
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	const gs = await getGameState(page);
	expect(mp(gs, 'player_1')).toBe(before + 25);
	expect(gs.questStacks.FIGHTING.faceUp, 'next Quest turned face-up').not.toBe('quest_tough_it_out');
	expect(gs.questStacks.FIGHTING.faceUp).toBeTruthy();
	await expect(page.locator('.mosje-card--owned').first()).toContainText(String(before + 25));
});

test('E17: Quest fail loses 15 and adds a token; a 2nd fail discards the Quest', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 40, level: 1 });
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out');
	await setNextDice(page, [1, 1, 1, 1, 1, 1]);
	const before = mp(await getGameState(page), 'player_1');
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	let gs = await getGameState(page);
	expect(mp(gs, 'player_1')).toBe(before - 15);
	expect(gs.questStacks.FIGHTING.faceUp).toBe('quest_tough_it_out');
	expect(gs.questStacks.FIGHTING.tokens, 'fail token').toBe(1);
	// Second failed attempt (second Mosje, same turn) -> 2nd token -> Quest leaves the stack.
	await questViaUi(page, { slot: 1, stackId: 'FIGHTING' });
	gs = await getGameState(page);
	expect(gs.questStacks.FIGHTING.faceUp).not.toBe('quest_tough_it_out');
	expect(gs.questStacks.FIGHTING.discard).toContain('quest_tough_it_out');
});
