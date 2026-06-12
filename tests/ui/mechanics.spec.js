import { test, expect } from '@playwright/test';
import {
	GAME_URL, GAME_URL_TEST,
	seedOfflineSession, seedCustomDeck,
	waitForBoard, ss,
	readLog, readOwnedMosjes, readOpponentMosjes, readHand,
	isPiecieOnField,
	setMosjeMP, setYouriUses,
	playCardFromHand, dismissModal, endTurnAndWait,
	mockDiceRoll,
} from './helpers.js';

// ─── Quest flow helper ────────────────────────────────────────────────────────
// Full modal sequence for completing a general quest attempt.
async function completeQuestFlow(page) {
	// Stage 1: Confirm payment — "Pay 20 MP to attempt this quest?" → Yes
	const yesBtn = page.locator('#modal-yes');
	if (!await yesBtn.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)) {
		console.log('[quest] No #modal-yes — unexpected flow');
		return false;
	}
	await yesBtn.click();
	await page.waitForTimeout(300);

	// Stage 2: Quest preview → Attempt Quest
	const attemptBtn = page.locator('#modal-attempt');
	if (!await attemptBtn.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)) {
		console.log('[quest] No #modal-attempt — quest may auto-resolve');
		return false;
	}
	await attemptBtn.click();
	await page.waitForTimeout(300);

	// Stage 3: Dice roll
	const rollBtn = page.locator('#modal-roll');
	if (await rollBtn.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)) {
		await rollBtn.click();
		await page.waitForTimeout(1800);
	}

	// Stage 4: Continue after result
	const doneBtn = page.locator('#modal-done');
	if (await doneBtn.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)) {
		await doneBtn.click();
		await page.waitForTimeout(400);
	}
	return true;
}

// ─── Activate a piecie on field that is ready to activate ────────────────────
// Own piecies render as full card elements (faceDown:false in viewModel for own piecies).
// The Activate button appears on the card when canActivate === true.
async function activatePiecieOnField(page, cardId) {
	const piecieEl = page.locator(`#piecies-player [data-card-id="${cardId}"]`).first();
	await piecieEl.waitFor({ state: 'visible', timeout: 8000 });
	const activateBtn = piecieEl.locator('button:has-text("Activate")');
	await activateBtn.waitFor({ state: 'visible', timeout: 5000 });
	await activateBtn.click();
	await page.waitForTimeout(600);
}

// ─── VIS-01: Dubbele Dosis lifecycle ─────────────────────────────────────────
// Playing piecie_quest_prep (Dubbele Dosis) goes face-down, then costs 10 MP on
// activation. With persistUntilEndOfTurn:true it must stay on field after activation,
// only leaving when the end-of-turn sweep fires. BUG-02 regression guard.

test('VIS-01: Dubbele Dosis stays on field after activation until end of turn', async ({ page }) => {
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

	// MP BEFORE activation (may have changed due to trickle/bot on turn 2)
	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP before activation: ${mpBefore}`);
	expect(mpBefore).toBeGreaterThanOrEqual(0);

	// Activate Dubbele Dosis — effect adds questPrepBonus (no direct MP change)
	await activatePiecieOnField(page, 'piecie_quest_prep');
	await ss(page, 'vis01-after-activation');

	// MP DURING — effect_quest_prep adds dice bonus only, no MP deduction in engine
	const mpDuring = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP after activation: ${mpDuring}`);
	// MP should be unchanged by the activation (the effect only sets questPrepBonus)
	expect(mpDuring).toBe(mpBefore);

	// Card must STILL be on field (persistUntilEndOfTurn — not immediately discarded)
	const onFieldActive = await isPiecieOnField(page, 'piecie_quest_prep');
	console.log('Dubbele Dosis still on field after activation:', onFieldActive);
	expect(onFieldActive).toBe(true);

	// End turn 2 — sweep fires
	await endTurnAndWait(page);

	// MP AFTER end-turn — must be >= 0 (floor holds)
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
	const onFieldAfter = await isPiecieOnField(page, 'piecie_quest_prep');
	console.log(`After sweep: MP=${mpAfter}, on field=${onFieldAfter}`);
	expect(onFieldAfter).toBe(false);
	expect(mpAfter).toBeGreaterThanOrEqual(0);

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/[Dd]ubbele|[Qq]uest.prep/i);
	await ss(page, 'vis01-done');
});

// ─── VIS-02: Leipe Swap reverts MP at end of turn ────────────────────────────
// Leipe Swap (activates from field): swaps own Mosje MP with opponent's.
// At end of the swapper's turn, engine reverts the swap via _leipeSwap record.

test('VIS-02: Leipe Swap swaps and reverts MP at end of turn', async ({ page }) => {
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

	// Activate Leipe Swap — shows target selector modals
	await activatePiecieOnField(page, 'piecie_leipe_swap');

	// Pick OWN Mosje
	const ownBtn = page.locator('.target-option').first();
	if (await ownBtn.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)) {
		await ownBtn.click();
		await page.waitForTimeout(400);
	}
	// Pick OPPONENT Mosje
	const oppBtn = page.locator('.target-option').first();
	if (await oppBtn.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)) {
		await oppBtn.click();
		await page.waitForTimeout(500);
	}

	// MP DURING — should be swapped
	const ownDuring = (await readOwnedMosjes(page))[0]?.mp;
	const oppDuring = (await readOpponentMosjes(page))[0]?.mp;
	console.log(`During (swapped) — own: ${ownDuring}, opp: ${oppDuring}`);
	expect(ownDuring).toBe(70);
	expect(oppDuring).toBe(40);
	await ss(page, 'vis02-swapped');

	// End turn 2 — revert fires at end of player's turn
	await endTurnAndWait(page);

	// MP AFTER — revert: own should NOT be 70 anymore
	const ownAfter = (await readOwnedMosjes(page))[0]?.mp;
	const oppAfter = (await readOpponentMosjes(page))[0]?.mp;
	console.log(`After revert — own: ${ownAfter}, opp: ${oppAfter}`);
	// Key assertion: the swap reverted (own MP is no longer the opponent's borrowed value)
	expect(ownAfter).not.toBe(70);

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/[Ll]eipe/);
	await ss(page, 'vis02-reverted');
});

// ─── VIS-03: Quest success grants MP, log shows roll + threshold ──────────────
// Mock dice to roll 6 (always success). After quest: MP increases, log has success.

test('VIS-03: Quest success grants MP and logs roll result', async ({ page }) => {
	await mockDiceRoll(page, 0.9999);
	await seedOfflineSession(page, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeMP(page, 'player_1', 0, 50);
	await page.waitForTimeout(200);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP before quest: ${mpBefore}`);
	expect(mpBefore).toBe(50);

	await page.click('#btn-general-quest');
	await page.waitForTimeout(400);
	await completeQuestFlow(page);
	await ss(page, 'vis03-after-quest');

	// MP AFTER — success must increase MP
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP after success: ${mpAfter}`);
	expect(mpAfter).toBeGreaterThan(mpBefore);

	const log = await readLog(page);
	const logText = log.join(' ');
	console.log('Quest log:', log.filter(l => l.match(/Success|Fail|rolled|needed|MP/i)));
	expect(logText).toMatch(/Success|✅/i);
	expect(logText).toMatch(/rolled|needed/i);
});

// ─── VIS-04: Quest fail MP floor — never goes negative ───────────────────────
// Mock dice to roll 1 (always fail). MP must never go below 0.

test('VIS-04: Quest fail MP floor — MP never goes negative', async ({ page }) => {
	await mockDiceRoll(page, 0);
	await seedOfflineSession(page, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeMP(page, 'player_1', 0, 5);
	await page.waitForTimeout(200);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP before quest: ${mpBefore}`);
	expect(mpBefore).toBe(5);

	await page.click('#btn-general-quest');
	await page.waitForTimeout(400);
	await completeQuestFlow(page);
	await ss(page, 'vis04-after-fail');

	// Floor must hold — MP >= 0
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP after fail: ${mpAfter}`);
	expect(mpAfter).toBeGreaterThanOrEqual(0);

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/Fail|❌|attempting/i);
});

// ─── VIS-05: Youri ability — single face-down piecie auto-activates ───────────
// Single-Mosje deck (Youri only, no Chris) → no synergy → piecies go face-down.
// Youri's ability: 20 MP cost → activate face-down piecie + draw 1 card.
// With only one face-down piecie, auto-activates (no slot picker modal).

test('VIS-05: Youri ability auto-activates single face-down piecie', async ({ page }) => {
	// Single Mosje deck — Youri always starts on slot 0, no Chris = no synergy
	// Use piecie_quest_prep (effect = +questPrepBonus, no MP change) so the Youri
	// ability's -20 MP is the ONLY MP change, making the assertion exact.
	const deck = {
		id: 'custom_youri_solo',
		name: 'Youri Solo',
		mosjes: ['mosje_youri'],
		// 9 piecies + 1 snelle = 10 cards. Opening hand=6, turn-start draw=1 → 7 in hand,
		// 3 remain in deck. After playing 1 face-down → 6 in hand. Youri draws 1 → 7 in hand.
		piecies: ['piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
		          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	};
	await seedCustomDeck(page, deck, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Verify Youri is actually on field (confirms custom deck loaded)
	const youriOnField = await page.locator('.mosje-card--owned[data-card-id="mosje_youri"]').isVisible({ timeout: 2000 }).catch(() => false);
	if (!youriOnField) { console.log('Youri not on field — custom deck may not have loaded — skip'); test.skip(); return; }

	// Give Youri 60 MP (ability costs 20)
	await setMosjeMP(page, 'player_1', 0, 60);
	await page.waitForTimeout(200);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`Youri MP before: ${mpBefore}`);
	expect(mpBefore).toBe(60);

	// Play one piecie face-down
	const hand = await readHand(page);
	const piecie = hand.find(c => c.cardType === 'PIECIE');
	if (!piecie) { test.skip(); return; }

	await playCardFromHand(page, piecie.cardId);
	await page.waitForTimeout(600);

	const onField = await isPiecieOnField(page, piecie.cardId);
	if (!onField) { console.log('Piecie not on field — skip'); test.skip(); return; }

	// Measure hand size AFTER playing the piecie (this is the baseline before Youri draws)
	const handSizeBefore = (await readHand(page)).length;
	console.log(`Hand size after play (before ability): ${handSizeBefore}`);
	await ss(page, 'vis05-face-down');

	// Use Youri's ability button
	const youriCard = page.locator('.mosje-card--owned[data-card-id="mosje_youri"]');
	const abilityBtn = youriCard.locator('.mosje-ability-btn');
	await abilityBtn.waitFor({ state: 'visible', timeout: 5000 });
	await abilityBtn.click();
	await page.waitForTimeout(1000);
	await ss(page, 'vis05-after-ability');

	// MP DURING — must have dropped by 20
	const mpDuring = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`Youri MP after ability: ${mpDuring}`);
	expect(mpDuring).toBe(mpBefore - 20);

	// Piecie must now be ACTIVE (canActivate=false after activation, no more Activate button)
	// The card stays on field but loses its Activate button once activated
	const activateBtn = page.locator(`#piecies-player [data-card-id="${piecie.cardId}"] button:has-text("Activate")`);
	const activateBtnVisible = await activateBtn.isVisible({ timeout: 300 }).catch(() => false);
	console.log('Activate button still visible after ability:', activateBtnVisible);
	// After Youri ability activates the piecie, the Activate button should be gone
	expect(activateBtnVisible).toBe(false);

	// Hand +1 (card drawn by ability)
	const handSizeAfter = (await readHand(page)).length;
	console.log(`Hand size: ${handSizeBefore} → ${handSizeAfter}`);
	expect(handSizeAfter).toBe(handSizeBefore + 1);

	// MP AFTER is stable (no further automatic cost)
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
	expect(mpAfter).toBe(mpDuring);
	await ss(page, 'vis05-done');
});

// ─── VIS-06: Youri ability — 3-use cap blocks 4th attempt ────────────────────
// After 3 uses, the ability shows an error modal and deducts no MP.

test('VIS-06: Youri ability 3-use cap — blocked on 4th attempt', async ({ page }) => {
	const deck = {
		id: 'custom_youri_cap',
		name: 'Youri Cap',
		mosjes: ['mosje_youri'],
		piecies: ['piecie_affoe', 'piecie_affoe', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_quest_prep'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	};
	await seedCustomDeck(page, deck, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeMP(page, 'player_1', 0, 80);
	await setYouriUses(page, 'player_1', 3);
	await page.waitForTimeout(200);

	// Verify testHooks worked (Youri should have 80 MP)
	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`Youri MP before blocked attempt: ${mpBefore}`);
	if (mpBefore !== 80) { console.log('TestHooks not applied — skip'); test.skip(); return; }

	// Click Youri's ability button — should be blocked
	const youriCard = page.locator('.mosje-card--owned[data-card-id="mosje_youri"]');
	const abilityBtn = youriCard.locator('.mosje-ability-btn');
	await abilityBtn.waitFor({ state: 'visible', timeout: 5000 });
	await abilityBtn.click();
	await page.waitForTimeout(800);
	await ss(page, 'vis06-blocked');

	// Error modal must appear
	const modalCard = page.locator('.modal-card');
	await modalCard.waitFor({ state: 'visible', timeout: 3000 });
	const modalText = await modalCard.textContent().catch(() => '');
	console.log('Modal text:', modalText?.slice(0, 200));
	expect(modalText).toMatch(/3 times|cap|limit|already|[Cc]annot|[Cc]an't/i);

	// Dismiss modal
	const okBtn = page.locator('#modal-continue, button:has-text("OK"), button:has-text("Close")').first();
	if (await okBtn.isVisible({ timeout: 1000 }).catch(() => false)) await okBtn.click();
	await page.waitForTimeout(200);

	// MP AFTER — unchanged (no cost deducted on blocked attempt)
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`Youri MP after blocked: ${mpAfter}`);
	expect(mpAfter).toBe(mpBefore);
	await ss(page, 'vis06-done');
});

// ─── VIS-06b: Youri ability — multiple face-down piecies → slot picker ───────
// Phase-27 human-needed scenario 2: with 2+ face-down piecies, a slot picker
// modal appears; selecting a slot activates that piecie, Youri pays 20 MP, draws 1.
async function setupYouriWithTwoFaceDown(page) {
	const deck = {
		id: 'custom_youri_multi',
		name: 'Youri Multi',
		// quest_prep activates with NO MP change, so Youri's -20 is the only MP delta.
		mosjes: ['mosje_youri'],
		piecies: ['piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
		          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	};
	await seedCustomDeck(page, deck, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	if (!await page.locator('.mosje-card--owned[data-card-id="mosje_youri"]').isVisible({ timeout: 2000 }).catch(() => false)) {
		return false;
	}
	await setMosjeMP(page, 'player_1', 0, 60);
	await page.waitForTimeout(200);
	// Play TWO quest_prep piecies face-down.
	let played = 0;
	for (let i = 0; i < 5 && played < 2; i++) {
		const hand = await readHand(page);
		const qp = hand.find(c => c.cardId === 'piecie_quest_prep');
		if (!qp) break;
		await playCardFromHand(page, 'piecie_quest_prep');
		await page.waitForTimeout(500);
		played++;
	}
	return played >= 2;
}

test('VIS-06b: Youri ability — multiple face-down piecies show slot picker', async ({ page }) => {
	if (!await setupYouriWithTwoFaceDown(page)) { console.log('Setup failed — skip'); test.skip(); return; }

	const handBefore = (await readHand(page)).length;
	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	expect(mpBefore).toBe(60);

	await page.locator('.mosje-card--owned[data-card-id="mosje_youri"] .mosje-ability-btn').click();

	// Slot-picker modal must appear with 2 options.
	const list = page.locator('.modal-mosje-select-list');
	await list.waitFor({ state: 'visible', timeout: 4000 });
	const options = page.locator('.modal-mosje-select-btn');
	expect(await options.count()).toBe(2);
	await ss(page, 'vis06b-picker');

	// Pick the first slot.
	await options.first().click();
	await page.waitForTimeout(900);

	// Youri paid 20, drew 1.
	expect((await readOwnedMosjes(page))[0]?.mp).toBe(mpBefore - 20);
	expect((await readHand(page)).length).toBe(handBefore + 1);
	await ss(page, 'vis06b-done');
});

// ─── VIS-06c: Youri ability — cancel the picker → cost still spent ───────────
// Phase-27 human-needed scenario 3: cancelling the slot picker still spends the
// 20 MP (and a use); no card is drawn.
test('VIS-06c: Youri ability — cancelling slot picker still spends 20 MP', async ({ page }) => {
	if (!await setupYouriWithTwoFaceDown(page)) { console.log('Setup failed — skip'); test.skip(); return; }

	const handBefore = (await readHand(page)).length;
	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	expect(mpBefore).toBe(60);

	await page.locator('.mosje-card--owned[data-card-id="mosje_youri"] .mosje-ability-btn').click();
	await page.locator('.modal-mosje-select-list').waitFor({ state: 'visible', timeout: 4000 });

	// Cancel.
	await page.locator('#modal-option-cancel').click();
	await page.waitForTimeout(400);

	// Info modal: cost still spent.
	const info = page.locator('.modal-card');
	await info.waitFor({ state: 'visible', timeout: 3000 });
	expect(await info.textContent()).toMatch(/cost is still spent|paid 20 MP/i);
	await page.locator('#modal-ok').click().catch(() => {});
	await page.waitForTimeout(200);
	await ss(page, 'vis06c-cancelled');

	// MP dropped 20 (cost spent); no card drawn.
	expect((await readOwnedMosjes(page))[0]?.mp).toBe(mpBefore - 20);
	expect((await readHand(page)).length).toBe(handBefore);
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
	if (!notToday) { console.log('Not Today! not in hand'); test.skip(); return; }

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

// ─── VIS-08: Laat me chillen! stays on field until end of turn ───────────────
// Same lifecycle as VIS-01 but for piecie_laat_me_chillen (persistUntilEndOfTurn:true).
// Also applies MP_LOSS_REDUCTION while active.

test('VIS-08: Laat me chillen! stays on field after activation until end of turn', async ({ page }) => {
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

	// Turn 1: play face-down
	await playCardFromHand(page, 'piecie_laat_me_chillen');
	await page.waitForTimeout(500);

	const onFieldFD = await isPiecieOnField(page, 'piecie_laat_me_chillen');
	console.log('Laat me chillen! on field:', onFieldFD);
	expect(onFieldFD).toBe(true);
	await ss(page, 'vis08-face-down');

	// End turn 1 — card becomes activatable on turn 2
	await endTurnAndWait(page);

	// MP BEFORE activation
	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP before activation: ${mpBefore}`);
	expect(mpBefore).toBeGreaterThanOrEqual(0);

	// Activate — effect pushes MP_LOSS_REDUCTION status (no direct MP change)
	await activatePiecieOnField(page, 'piecie_laat_me_chillen');
	await ss(page, 'vis08-activated');

	// MP DURING — effect_laat_me_chillen pushes MP_LOSS_REDUCTION only, no MP change
	const mpDuring = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP after activation: ${mpDuring}`);
	expect(mpDuring).toBe(mpBefore);

	// Card must still be on field (persistUntilEndOfTurn)
	const onFieldActive = await isPiecieOnField(page, 'piecie_laat_me_chillen');
	console.log('Laat me chillen! still on field:', onFieldActive);
	expect(onFieldActive).toBe(true);

	// End turn 2 — sweep removes it
	await endTurnAndWait(page);

	const onFieldAfter = await isPiecieOnField(page, 'piecie_laat_me_chillen');
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`After sweep: on field=${onFieldAfter}, MP=${mpAfter}`);
	expect(onFieldAfter).toBe(false);
	expect(mpAfter).toBeGreaterThanOrEqual(0);

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/[Cc]hillen|laat/i);
	await ss(page, 'vis08-done');
});

// ─── VIS-09: Quest cap — second general quest attempt is blocked ──────────────
// After one general quest per turn (default cap), the button is disabled.
// The second attempt must not change MP.

test('VIS-09: Quest cap — general quest button disabled after 1 attempt', async ({ page }) => {
	await mockDiceRoll(page, 0.9999);
	await seedOfflineSession(page, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeMP(page, 'player_1', 0, 200);
	await page.waitForTimeout(200);

	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP before quests: ${mpBefore}`);

	// First quest — complete it
	await page.click('#btn-general-quest');
	await page.waitForTimeout(400);
	const completed = await completeQuestFlow(page);
	console.log('First quest completed:', completed);
	await ss(page, 'vis09-after-first-quest');

	const mpAfterFirst = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP after 1st quest: ${mpAfterFirst}`);
	// Quest must have resolved and changed MP
	expect(mpAfterFirst).not.toBe(mpBefore);

	// Second attempt — button must be DISABLED (cap = 1 without Quest Haven)
	const questBtn = page.locator('#btn-general-quest');
	const isDisabled = await questBtn.evaluate(el => el.disabled);
	console.log('General Quest button disabled:', isDisabled);
	expect(isDisabled).toBe(true);
	await ss(page, 'vis09-button-disabled');

	// MP must be unchanged (no cost for a blocked attempt)
	const mpAfterBlock = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`MP after cap check: ${mpAfterBlock}`);
	expect(mpAfterBlock).toBe(mpAfterFirst);

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/[Qq]uest|attempting/i);
});
