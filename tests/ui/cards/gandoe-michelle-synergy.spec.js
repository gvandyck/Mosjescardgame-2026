/**
 * gandoe-michelle-synergy.spec.js - Phase 39 (D-01..D-05) repro-first browser test.
 *
 * REPRO-FIRST per CLAUDE.md: this spec drives the REAL .js game via
 * window.__testHooks. It is written to FAIL before Phase 39-02 wires the
 * DUO_GANDOE_MICHELLE synergy in src/abilities/questLogic.js.
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	waitForBoard,
	setMosjeOnField,
	clearEntryProtection,
	getGameState,
	injectQuestToTopOfDeck,
	endTurnAndWait,
	mockDiceRoll,
	ss,
} from '../helpers.js';

const PHYSICAL_QUEST_ID = 'quest_shotje_obby'; // Physical, roll 4+, success +65 MP.

const PLAYER_DECK = {
	id: 'custom_gandoe_michelle_synergy_player',
	name: 'Gandoe/Michelle Synergy Test - Player',
	mosjes: ['mosje_gandoe_destroyer', 'mosje_michelle'],
	piecies: [],
	snellePiecies: [],
	places: [],
	quests: [],
};

const BOT_DECK_HARMLESS = {
	id: 'custom_gandoe_michelle_synergy_bot',
	name: 'Gandoe/Michelle Synergy Test - Harmless Bot',
	mosjes: ['mosje_jeffrey'], // self-only quest success passive; no opponent-targeting ability.
	piecies: [],
	snellePiecies: [],
	places: [],
	quests: [],
};

async function seedDuoScenario(page, playerDeck = PLAYER_DECK, botDeck = BOT_DECK_HARMLESS) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	await page.addInitScript((opts) => {
		sessionStorage.setItem('mosjes:offline', JSON.stringify({
			name: 'TestPlayer',
			deckId: opts.playerDeck.id,
			botDeckId: opts.botDeck.id,
		}));
		sessionStorage.setItem(`mosjes:customDeck:${opts.playerDeck.id}`, JSON.stringify(opts.playerDeck));
		sessionStorage.setItem(`mosjes:customDeck:${opts.botDeck.id}`, JSON.stringify(opts.botDeck));
	}, { playerDeck, botDeck });
}

async function startGeneralQuestAttempt(page) {
	await page.click('#btn-general-quest');
	const yesBtn = page.locator('#modal-yes');
	await yesBtn.waitFor({ state: 'visible', timeout: 5000 });
	await yesBtn.click();
	await page.waitForTimeout(400);
}

async function attemptPhysicalQuestWithSlot(page, slotIndex) {
	await injectQuestToTopOfDeck(page, PHYSICAL_QUEST_ID);
	await startGeneralQuestAttempt(page);
	await page.locator(`.modal-mosje-select-btn[data-id="${slotIndex}"]`).click();
	await page.waitForTimeout(400);

	const attemptBtn = page.locator('#modal-attempt');
	await attemptBtn.waitFor({ state: 'visible', timeout: 5000 });
	await attemptBtn.click();
	await page.waitForTimeout(300);

	const rollBtn = page.locator('#modal-roll');
	if (await rollBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
		await rollBtn.click();
		await page.waitForTimeout(1800);
	}

	const doneBtn = page.locator('#modal-done');
	if (await doneBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
		await doneBtn.click();
	}

	await page.waitForTimeout(400);
}

async function setupEstablishedTurn(page) {
	await seedDuoScenario(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await endTurnAndWait(page); // P1 first-turn General Quest lock.
	await clearEntryProtection(page);
}

test('Scenario A (D-01/D-02/D-04): Michelle roll 5 grants Gandoe the Destroyer +10 MP', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0.7); // d6 roll 5.
	await setupEstablishedTurn(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_destroyer', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 40, level: 1 });
	await clearEntryProtection(page);

	const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	await ss(page, 'gandoe-michelle-scenario-a-before');

	await attemptPhysicalQuestWithSlot(page, 1); // Michelle quests; Tough Gamble fires.

	const after = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	const delta = after - before;
	console.log(`Scenario A - Gandoe Destroyer MP delta after Michelle roll 5: ${delta} (expect 10)`);
	await ss(page, 'gandoe-michelle-scenario-a-after');

	expect(delta).toBe(10);
});

test('Scenario B (D-01): Michelle roll 4 does not grant the Gandoe kicker', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0.55); // d6 roll 4.
	await setupEstablishedTurn(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_destroyer', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 40, level: 1 });
	await clearEntryProtection(page);

	const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	await attemptPhysicalQuestWithSlot(page, 1);
	const after = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	const delta = after - before;
	console.log(`Scenario B - Gandoe Destroyer MP delta after Michelle roll 4: ${delta} (expect 0)`);

	expect(delta).toBe(0);
});

test('Scenario C (D-04): Michelle roll 5 never grants the bonus to Gandoe Wizard', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0.7); // d6 roll 5.
	await setupEstablishedTurn(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_wizard', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 40, level: 1 });
	await clearEntryProtection(page);

	const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	await attemptPhysicalQuestWithSlot(page, 1);
	const after = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	const delta = after - before;
	console.log(`Scenario C - Gandoe Wizard MP delta after Michelle roll 5: ${delta} (expect 0)`);

	expect(delta).toBe(0);
});

test('Scenario D (D-05): Gandoe Physical Quest gains +15 MP while Michelle is on field', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0.55); // d6 roll 4, enough for quest_shotje_obby.
	await setupEstablishedTurn(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_destroyer', { mp: 30, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_michelle', { mp: 30, level: 1 });
	await clearEntryProtection(page);

	await attemptPhysicalQuestWithSlot(page, 0); // Gandoe quests.

	const after = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	console.log(`Scenario D - Gandoe MP after Physical quest with Michelle present: ${after} (expect 90)`);
	await ss(page, 'gandoe-michelle-scenario-d-after');

	// 30 start - 20 quest cost + 65 quest reward + 15 partner synergy = 90.
	expect(after).toBe(90);
});
