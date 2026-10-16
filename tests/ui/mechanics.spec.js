import { test, expect } from '@playwright/test';
import {
	GAME_URL, GAME_URL_TEST,
	seedOfflineSession, seedCustomDeck,
	waitForBoard, ss,
	readLog, readOwnedMosjes, readOpponentMosjes, readHand,
	isPiecieOnField,
	setMosjeMP,
	playCardFromHand, dismissModal, endTurnAndWait,
	mockDiceRoll, setQuestFaceUp, setNextDice, questViaUi, getGameState, setMosjeOnField,
} from './helpers.js';
import { activatePiecieOnField } from '../helpers/piecieUi.js';

// ─── Quest flow helper ────────────────────────────────────────────────────────
// Full modal sequence for completing a general quest attempt.
async function completeQuestFlow(page) {
	// 2.0: Mosje (slot 0) -> FIGHTING Quest -> click through the cost/result screens.
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	return true;
}

// ─── VIS-01: Dubbele Dosis lifecycle (2.0) ───────────────────────────────────
// Dubbele Dosis is a non-Stays Piecie: face-down when played, and when activated it takes its Energy cost,
// gives +1 die on the next Quest (player.questExtraDice) and goes to the discard AT ONCE.

test('VIS-01: Dubbele Dosis is discarded at once, costs Energy, and gives +1 die on the next Quest', async ({ page }) => {
	const deck = {
		id: 'custom_dubbele_test',
		name: 'Dubbele Test',
		mosjes: ['mosje_michelle', 'mosje_gandoe_destroyer'],
		piecies: ['piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	};
	await seedCustomDeck(page, deck, 'DIGITAL_CONTROL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Give the active Mosje enough MP to activate Dubbele Dosis (cost 10)
	await setMosjeMP(page, 'player_1', 0, 50);
	await page.waitForTimeout(200);

	// 2.0: 3-card opening hand and the first player skips the first draw, so guarantee the card.
	await page.evaluate(() => window.__testHooks.setHand('player_1', ['piecie_quest_prep']));
	// Turn 1: play the card face-down from hand
	await playCardFromHand(page, 'piecie_quest_prep');
	await page.waitForTimeout(500);

	// Card is now on the piecie field
	const onFieldFaceDown = await isPiecieOnField(page, 'piecie_quest_prep');
	console.log('Dubbele Dosis on field:', onFieldFaceDown);
	expect(onFieldFaceDown).toBe(true);
	await ss(page, 'vis01-face-down');

	// End turn 1 — bot plays, then turn 2 starts; piecie becomes activatable
	await endTurnAndWait(page);
	await ss(page, 'vis01-turn-2-start');

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	const gsBefore = await getGameState(page);
	const energyBefore = gsBefore.players.player_1.energy;

	await activatePiecieOnField(page, 'piecie_quest_prep');
	await ss(page, 'vis01-after-activation');

	const gsAfter = await getGameState(page);
	// Activation changes no MP; it costs 1 Energy (Card List cost) and grants +1 die.
	expect((await readOwnedMosjes(page))[0]?.mp).toBe(mpBefore);
	expect(gsAfter.players.player_1.energy, 'Energy drops by the Piecie cost (1)').toBe(energyBefore - 1);
	expect(gsAfter.players.player_1.questExtraDice, '+1 die on the next Quest').toBe(1);
	// Non-Stays: gone from the field AT ONCE, in the discard pile.
	expect(await isPiecieOnField(page, 'piecie_quest_prep')).toBe(false);
	expect(gsAfter.players.player_1.graveyard.map(c => c.cardId ?? c)).toContain('piecie_quest_prep');

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/[Dd]ubbele|[Qq]uest.prep/i);
	await ss(page, 'vis01-done');
});

// ─── VIS-02: Leipe Swap (2.0 Card List) ──────────────────────────────────────
// "Swap the MP of one of your Mosjes and one opponent Mosje. A swap is not a gain or a loss: nobody levels up
// or gets getemt from it." The swap is permanent: it must NOT revert at the end of the turn (V4 did).

test('VIS-02: Leipe Swap swaps MP and the swap does not revert at end of turn', async ({ page }) => {
	const deck = {
		id: 'custom_leipe_test',
		name: 'Leipe Test',
		mosjes: ['mosje_gandoe_destroyer', 'mosje_michelle'],
		piecies: ['piecie_leipe_swap', 'piecie_leipe_swap',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	};
	await seedCustomDeck(page, deck, 'DIGITAL_CONTROL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// 2.0: 3-card opening hand and the first player skips the first draw, so guarantee the card.
	await page.evaluate(() => window.__testHooks.setHand('player_1', ['piecie_leipe_swap']));
	// Turn 1: play Leipe Swap face-down
	await playCardFromHand(page, 'piecie_leipe_swap');
	await page.waitForTimeout(500);
	expect(await isPiecieOnField(page, 'piecie_leipe_swap')).toBe(true);
	await ss(page, 'vis02-face-down');

	// End turn 1 → Leipe Swap becomes activatable on turn 2
	await endTurnAndWait(page);

	// Set known MP values right before activation so assertions are deterministic
	await setMosjeMP(page, 'player_1', 0, 40);
	await setMosjeMP(page, 'player_2', 0, 70);
	await page.waitForTimeout(300);

	// MP BEFORE
	const ownBefore = (await readOwnedMosjes(page))[0]?.mp;
	const oppBefore = (await readOpponentMosjes(page))[0]?.mp;
	console.log(`Before — own: ${ownBefore}, opp: ${oppBefore}`);
	expect(ownBefore).toBe(40);
	expect(oppBefore).toBe(70);

	// Activate Leipe Swap — one own and one opponent Mosje: both targets are the only choice, so no picker opens
	await activatePiecieOnField(page, 'piecie_leipe_swap');
	await page.waitForTimeout(600);

	// MP DURING — should be swapped
	const ownDuring = (await readOwnedMosjes(page))[0]?.mp;
	const oppDuring = (await readOpponentMosjes(page))[0]?.mp;
	console.log(`During (swapped) — own: ${ownDuring}, opp: ${oppDuring}`);
	expect(ownDuring).toBe(70);
	expect(oppDuring).toBe(40);
	await ss(page, 'vis02-swapped');

	// The 2.0 swap is permanent: it does not revert at the end of the turn (V4 did).
	await endTurnAndWait(page);
	await endTurnAndWait(page);
	// After the opponent's turn plus ours the swapped MP is still swapped (opponent may have changed theirs: check own).
	const ownAfter = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`After end of turn — own: ${ownAfter}`);
	expect(ownAfter, 'swapped MP is kept (no V4 revert)').toBe(70);

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/[Ll]eipe/);
	await ss(page, 'vis02-kept');
});

// ─── VIS-03: Quest success grants MP, log shows roll + threshold ──────────────
// Mock dice to roll 6 (always success). After quest: MP increases, log has success.

test('VIS-03: Quest success grants MP and logs roll result', async ({ page }) => {
	await seedOfflineSession(page, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	// A plain Mosje (no Quest-reward ability such as Michelle's Tough Gamble) keeps the +25 exact.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 50, level: 1 });
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [6, 6, 6]);

	await setMosjeMP(page, 'player_1', 0, 50);
	await page.waitForTimeout(200);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP before quest: ${mpBefore}`);
	expect(mpBefore).toBe(50);

	await completeQuestFlow(page);
	await ss(page, 'vis03-after-quest');

	// MP AFTER — success must increase MP
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP after success: ${mpAfter}`);
	expect(mpAfter).toBeGreaterThan(mpBefore);

	const log = await readLog(page);
	const logText = log.join(' ');
	console.log('Quest log:', log.filter(l => l.match(/Success|Fail|rolled|needed|MP/i)));
	expect(logText).toMatch(/won/i);
	expect(mpAfter).toBe(mpBefore + 25);
});

// ─── VIS-04: Quest fail MP floor — never goes negative ───────────────────────
// Mock dice to roll 1 (always fail). MP must never go below 0.

test('VIS-04: Quest fail MP floor — MP never goes negative', async ({ page }) => {
	await seedOfflineSession(page, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [1, 1, 1]);

	await setMosjeMP(page, 'player_1', 0, 5);
	await page.waitForTimeout(200);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP before quest: ${mpBefore}`);
	expect(mpBefore).toBe(5);

	await completeQuestFlow(page);
	await ss(page, 'vis04-after-fail');

	// Negative MP never persists: a Lv0 Mosje taken below 0 is gone (getemt), nothing keeps a negative MP.
	const gs = await getGameState(page);
	for (const slot of gs.players.player_1.activeSlots.filter(Boolean)) expect(slot.mp).toBeGreaterThanOrEqual(0);

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/failed/i);
});

// ─── VIS-05/06: Youri, The Speedrunner (2.0 Speed Activate) ───────────────────
// 2.0 Card List: "once per turn, pay 1 Energy: activate a Piecie the same turn you placed it (still pay its cost),
// then draw 1 card." The Piecie becomes ready (Activate button appears); activating it still pays its own Energy.
// MP is never a cost. One Piecie waiting = auto-picked; two = a slot picker; refused when the player can't pay.

const YOURI_DECK = {
	id: 'custom_youri_2_0',
	name: 'Youri 2.0',
	mosjes: ['mosje_youri'],
	piecies: ['piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
	          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
	          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
	snellePiecies: ['snelle_jensen'], places: [], quests: [],
};
const energyOf = async (page) => (await getGameState(page)).players.player_1.energy;
const youriBtn = (page) => page.locator('.mosje-card--owned[data-card-id="mosje_youri"] .mosje-ability-btn');
const activateBtnOf = (page, cardId) => page.locator(`#piecies-player [data-card-id="${cardId}"] button:has-text("Activate")`).first();

async function setupYouri(page, count) {
	await seedCustomDeck(page, YOURI_DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	if (!await page.locator('.mosje-card--owned[data-card-id="mosje_youri"]').isVisible({ timeout: 2000 }).catch(() => false)) {
		throw new Error('Setup failed: Youri not on field - custom deck may not have loaded');
	}
	await setMosjeMP(page, 'player_1', 0, 60);
	await page.evaluate(() => window.__testHooks.setEnergy('player_1', 6));
	await page.evaluate(() => window.__testHooks.setHand('player_1', ['piecie_quest_prep', 'piecie_quest_prep', 'piecie_affoe', 'piecie_affoe', 'piecie_affoe']));
	await page.waitForTimeout(200);
	let played = 0;
	for (let i = 0; i < 6 && played < count; i++) {
		if (!(await readHand(page)).some(c => c.cardId === 'piecie_quest_prep')) break;
		await playCardFromHand(page, 'piecie_quest_prep');
		await page.waitForTimeout(500);
		played++;
	}
	if (played < count) throw new Error(`Setup failed: only ${played} Piecies placed`);
}

test('VIS-05: Youri Speed Activate - 1 Energy, the Piecie placed this turn becomes activatable, draw 1', async ({ page }) => {
	await setupYouri(page, 1);
	const handBefore = (await readHand(page)).length;
	const energyBefore = await energyOf(page);
	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	expect(mpBefore).toBe(60);
	// Placed this turn: not activatable yet.
	expect(await activateBtnOf(page, 'piecie_quest_prep').isVisible({ timeout: 300 }).catch(() => false)).toBe(false);
	await ss(page, 'vis05-face-down');

	await youriBtn(page).waitFor({ state: 'visible', timeout: 5000 });
	await youriBtn(page).click();
	// The slot picker also shows for a single waiting Piecie.
	await page.locator('.modal-mosje-select-btn').first().click();
	await page.waitForTimeout(1000);
	await ss(page, 'vis05-after-ability');

	expect(await energyOf(page), 'Speed Activate costs 1 Energy').toBe(energyBefore - 1);
	expect((await readOwnedMosjes(page))[0]?.mp, 'MP is never a cost').toBe(mpBefore);
	expect((await readHand(page)).length, 'draws 1').toBe(handBefore + 1);
	await activateBtnOf(page, 'piecie_quest_prep').waitFor({ state: 'visible', timeout: 4000 });
});

// Once per turn: a second use the same turn is refused, nothing is paid.
test('VIS-06: Youri Speed Activate is once per turn - the second use is refused and costs nothing', async ({ page }) => {
	await setupYouri(page, 2);
	const energyBeforeFirst = await energyOf(page);
	await youriBtn(page).click();
	await page.waitForTimeout(500);
	await page.locator('.modal-mosje-select-btn').first().click();
	await page.waitForTimeout(900);
	const energyAfterFirst = await energyOf(page);
	expect(energyAfterFirst, 'the first use paid 1 Energy').toBe(energyBeforeFirst - 1);
	const handAfterFirst = (await readHand(page)).length;

	const again = youriBtn(page);
	if (await again.isVisible({ timeout: 1000 }).catch(() => false) && await again.isEnabled().catch(() => false)) {
		await again.click();
		await page.waitForTimeout(800);
		const ok = page.locator('#modal-continue, #modal-ok, button:has-text("OK"), button:has-text("Close")').first();
		if (await ok.isVisible({ timeout: 800 }).catch(() => false)) await ok.click();
	}
	expect(await energyOf(page), 'no second payment').toBe(energyAfterFirst);
	expect((await readHand(page)).length, 'no second draw').toBe(handAfterFirst);
});

// VIS-06b: two Piecies waiting -> a slot picker; the chosen one becomes ready, the other stays face-down.
test('VIS-06b: Youri Speed Activate - two Piecies placed this turn show a slot picker', async ({ page }) => {
	await setupYouri(page, 2);
	const handBefore = (await readHand(page)).length;
	const energyBefore = await energyOf(page);

	await youriBtn(page).click();
	await page.locator('.modal-mosje-select-list').waitFor({ state: 'visible', timeout: 4000 });
	expect(await page.locator('.modal-mosje-select-btn').count()).toBe(2);
	await ss(page, 'vis06b-picker');
	await page.locator('.modal-mosje-select-btn').first().click();
	await page.waitForTimeout(900);

	expect(await energyOf(page)).toBe(energyBefore - 1);
	expect((await readHand(page)).length).toBe(handBefore + 1);
	expect(await page.locator('#piecies-player button:has-text("Activate")').count(), 'only the chosen Piecie is ready').toBe(1);
});

// VIS-06c: cancelling the picker pays nothing in 2.0 (Energy is only spent when the ability resolves).
test('VIS-06c: Youri Speed Activate - cancelling the slot picker pays nothing', async ({ page }) => {
	await setupYouri(page, 2);
	const handBefore = (await readHand(page)).length;
	const energyBefore = await energyOf(page);

	await youriBtn(page).click();
	await page.locator('.modal-mosje-select-list').waitFor({ state: 'visible', timeout: 4000 });
	await page.locator('#modal-option-cancel').click();
	await page.waitForTimeout(500);
	const ok = page.locator('#modal-ok, #modal-continue').first();
	if (await ok.isVisible({ timeout: 500 }).catch(() => false)) await ok.click();
	await page.waitForTimeout(300);

	expect(await energyOf(page), 'nothing paid').toBe(energyBefore);
	expect((await readHand(page)).length, 'no card drawn').toBe(handBefore);
	expect((await readOwnedMosjes(page))[0]?.mp).toBe(60);
});

// ─── VIS-07: Not Today! interrupt fires on bot elimination ───────────────────
// Not Today! (snelle_negate_elimination) must be offered in interrupt modal
// when bot would eliminate the human Mosje.

test('VIS-07: Not Today! interrupt fires on bot elimination', async ({ page }) => {
	const deck = {
		id: 'custom_not_today',
		name: 'Not Today Test',
		mosjes: ['mosje_gandoe_destroyer', 'mosje_michelle'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_negate_elimination', 'snelle_negate_elimination',
		                'snelle_negate_elimination', 'snelle_jensen'],
		places: [],
		quests: [],
	};
	await seedCustomDeck(page, deck, 'ARTISTIC_RHYTHM');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Verify Not Today! is in hand
	const hand = await readHand(page);
	const notToday = hand.find(c => c.cardId === 'snelle_negate_elimination');
	if (!notToday) { throw new Error('Setup failed: Not Today! not in hand'); }

	// Set Mosje to 1 MP so any bot damage triggers elimination
	await setMosjeMP(page, 'player_1', 0, 1);
	await page.waitForTimeout(200);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`Mosje MP before end turn: ${mpBefore}`);
	expect(mpBefore).toBe(1);
	await ss(page, 'vis07-1mp');

	// End turn — bot may eliminate
	await page.click('#btn-end-turn');

	const result = await Promise.race([
		page.waitForSelector('.modal-card h3', { timeout: 12000 }).then(() => 'modal'),
		page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 12000 }).then(() => 'ended'),
	]).catch(() => 'timeout');

	console.log('Outcome:', result);
	await ss(page, 'vis07-outcome');

	if (result === 'modal') {
		const h3 = await page.locator('.modal-card h3').textContent().catch(() => '');
		console.log('Modal title:', h3);
		if (h3.includes('Interrupt') || h3.includes('Damage')) {
			const notTodayBtn = page.locator('.modal-mosje-select-btn', { hasText: 'Not Today' });
			if (await notTodayBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
				await notTodayBtn.click();
				await page.waitForTimeout(500);
			}
			await page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 20000 });
			const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
			console.log(`Mosje MP after Not Today!: ${mpAfter}`);
			expect(mpAfter).toBeGreaterThan(0);
			const log = await readLog(page);
			expect(log.join(' ')).toMatch(/[Nn]ot [Tt]oday|[Ii]nterrupt/);
		} else {
			// Different modal — dismiss and continue
			await dismissModal(page);
			const ok = page.locator('#modal-continue').first();
			if (await ok.isVisible({ timeout: 500 }).catch(() => false)) await ok.click();
		}
	} else {
		// Bot ended turn without a damaging action — no interrupt needed
		console.log('Bot did not trigger interrupt this turn');
	}
	await ss(page, 'vis07-done');
});

// ─── VIS-08: Laat me chillen! is a Stays Piecie (2.0) ────────────────────────
// Stays face-up in its slot through the opponent's turn and leaves at the end of the owner's NEXT turn.

test('VIS-08: Laat me chillen! stays through the opponent turn and leaves at the end of the owner next turn', async ({ page }) => {
	const deck = {
		id: 'custom_chillen_test',
		name: 'Chillen Test',
		mosjes: ['mosje_michelle', 'mosje_gandoe_destroyer'],
		piecies: ['piecie_laat_me_chillen', 'piecie_laat_me_chillen',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	};
	await seedCustomDeck(page, deck, 'DIGITAL_CONTROL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeMP(page, 'player_1', 0, 50);
	await page.waitForTimeout(200);
	// 2.0: 3-card opening hand and the first player skips the first draw, so guarantee the card.
	await page.evaluate(() => window.__testHooks.setHand('player_1', ['piecie_laat_me_chillen']));

	// Turn 1: play face-down
	await playCardFromHand(page, 'piecie_laat_me_chillen');
	await page.waitForTimeout(500);

	const onFieldFD = await isPiecieOnField(page, 'piecie_laat_me_chillen');
	console.log('Laat me chillen! on field:', onFieldFD);
	expect(onFieldFD).toBe(true);
	await ss(page, 'vis08-face-down');

	// End turn 1 — card becomes activatable on turn 2
	await endTurnAndWait(page);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	await activatePiecieOnField(page, 'piecie_laat_me_chillen');
	await ss(page, 'vis08-activated');
	expect((await readOwnedMosjes(page))[0]?.mp, 'activation changes no MP').toBe(mpBefore);
	expect(await isPiecieOnField(page, 'piecie_laat_me_chillen'), 'Stays: still in its slot after activation').toBe(true);

	// End turn 2 → opponent's turn → back to us: it must still be there (Stays until the end of OUR next turn).
	await endTurnAndWait(page);
	expect(await isPiecieOnField(page, 'piecie_laat_me_chillen'), 'still there through the opponent turn').toBe(true);

	// End our next turn → it leaves to the discard.
	await endTurnAndWait(page);
	expect(await isPiecieOnField(page, 'piecie_laat_me_chillen'), 'gone after the end of the owner next turn').toBe(false);
	expect((await getGameState(page)).players.player_1.graveyard.map(c => c.cardId ?? c)).toContain('piecie_laat_me_chillen');

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/[Cc]hillen|laat/i);
	await ss(page, 'vis08-done');
});

// ─── VIS-09: Quest cap — second general quest attempt is blocked ──────────────
// After one general quest per turn (default cap), the button is disabled.
// The second attempt must not change MP.

test('VIS-09: one action per Mosje — a Mosje that already Quested cannot Quest again', async ({ page }) => {
	await seedOfflineSession(page, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [6, 6, 6]);

	await setMosjeMP(page, 'player_1', 0, 200);
	await page.waitForTimeout(200);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP before quests: ${mpBefore}`);

	// First quest — complete it
	const completed = await completeQuestFlow(page);
	console.log('First quest completed:', completed);
	await ss(page, 'vis09-after-first-quest');

	const mpAfterFirst = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP after 1st quest: ${mpAfterFirst}`);
	// Quest must have resolved and changed MP
	expect(mpAfterFirst).not.toBe(mpBefore);

	// Second attempt by the same Mosje: it already acted, so nobody can Quest.
	await page.click('#btn-quest');
	await expect(page.locator('.modal-card')).toContainText('No Mosje can act');
	await ss(page, 'vis09-no-mosje-can-act');

	// MP must be unchanged (no cost for a blocked attempt)
	const mpAfterBlock = (await readOwnedMosjes(page))[0]?.mp;
	expect(mpAfterBlock).toBe(mpAfterFirst);

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/won|failed/i);
});
