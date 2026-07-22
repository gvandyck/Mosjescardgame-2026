/**
 * alyssa-jisca-synergy.spec.js — Phase 38 (D-01..D-05) repro-first browser test.
 *
 * REPRO-FIRST per CLAUDE.md: this spec drives the REAL .js game via
 * window.__testHooks. It was written to FAIL on the Plan 38-01 code (synergyEffect
 * null on all 3 duo cards, no engine hook) and now PASSES on Plan 38-02's engine
 * wiring (src/engine/turnManager.js) — it is the permanent regression guard for
 * both halves of the DUO_JISCA_ALYSSA headline synergy.
 *
 * Scenario A (D-02, Alyssa side): while Jisca is also on the field, Alyssa
 * gains +10 MP at the start of each of her owner's turns (on top of the
 * fixed +10 turn trickle every active Mosje already gets — src/engine/
 * turnManager.js). Total expected delta across one turn boundary: 20 MP
 * (10 trickle + 10 synergy).
 *
 * Scenario B (D-03, Jisca side): while an Alyssa is also on the field, the
 * FIRST Piecie the owner plays each turn gives +10 MP (once-per-turn cap —
 * a second Piecie played the same turn grants no additional bonus). Uses
 * piecie_katjegang (STATUS_EFFECT, zero own MP effect) so the only possible
 * MP delta observed is the synergy bonus itself, not the Piecie's own effect.
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	waitForBoard,
	setMosjeOnField,
	setHand,
	clearEntryProtection,
	playCardFromHand,
	getGameState,
	endTurnAndWait,
	mockDiceRoll,
	ss,
} from '../helpers.js';

// A duo deck for player_1 carrying both cards this phase cares about, plus a
// harmless custom bot deck for player_2 with ZERO Piecies/Snelle Piecies/
// Places — the bot literally has nothing to play against Alyssa, so the only
// remaining opponent-touching surface is a General Quest reward, which
// mockDiceRoll below neutralizes (forced-fail dice = no quest reward fires).
const PLAYER_DECK = {
	id: 'custom_alyssa_jisca_synergy_player',
	name: 'Alyssa/Jisca Synergy Test — Player',
	mosjes: ['mosje_alyssa_bulldozer', 'mosje_jisca'],
	piecies: ['piecie_katjegang', 'piecie_katjegang'],
	snellePiecies: [],
	places: [],
	quests: [],
};

const BOT_DECK_HARMLESS = {
	id: 'custom_alyssa_jisca_synergy_bot',
	name: 'Alyssa/Jisca Synergy Test — Harmless Bot',
	mosjes: ['mosje_michelle'], // self-only ability (Tough Gamble) — no opponent-targeting card
	piecies: [],
	snellePiecies: [],
	places: [],
	quests: [],
};

/**
 * Seed TWO custom decks (player + bot) in one session, since seedCustomDeck
 * (tests/ui/helpers.js) only injects a single custom deck. Mirrors its own
 * addInitScript pattern — resolveCustomDeckDef (src/main.js) reads
 * `mosjes:customDeck:<id>` from sessionStorage regardless of which player
 * the deckId belongs to, so writing both entries works for both sides.
 */
async function seedDuoScenario(page, playerDeck, botDeck) {
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

test('Scenario A (D-02): Alyssa gains +10 MP at start of turn while Jisca is on field', async ({ page }) => {
	test.setTimeout(60000);
	// Force all dice rolls to fail (roll 1) so the harmless bot's General Quest
	// attempts (if any) never succeed a reward — Alyssa's MP stays isolated to
	// the trickle + synergy under test.
	await mockDiceRoll(page, 0);
	await seedDuoScenario(page, PLAYER_DECK, BOT_DECK_HARMLESS);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 20, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_jisca', { mp: 20, level: 1 });
	// U8 — model an established board, not a fresh-entry-protection scenario.
	await clearEntryProtection(page);

	const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	await ss(page, 'alyssa-jisca-scenario-a-before');

	// Advance through the bot's turn back to the owner's next turn — this is
	// where the turn-start trickle (+10, always) and the Alyssa synergy bonus
	// (+10, once wired) both fire (src/engine/turnManager.js startTurn).
	await endTurnAndWait(page);

	const after = (await getGameState(page)).players.player_1.activeSlots[0].mp;
	const delta = after - before;
	console.log(`Scenario A — Alyssa MP delta across turn boundary: ${delta} (expect 20 = 10 trickle + 10 synergy)`);
	await ss(page, 'alyssa-jisca-scenario-a-after');

	// GREEN on Plan 38-02 wiring: the fixed +10 turn trickle plus the +10
	// Alyssa<->Jisca synergy bonus (turnManager.startTurn) sum to 20.
	expect(delta).toBe(20);
});

test('Scenario B (D-03): first Piecie played each turn gives Jisca +10 MP while an Alyssa is on field; second Piecie grants no extra', async ({ page }) => {
	test.setTimeout(60000);
	await mockDiceRoll(page, 0);
	await seedDuoScenario(page, PLAYER_DECK, BOT_DECK_HARMLESS);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 20, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_jisca', { mp: 20, level: 1 });
	await clearEntryProtection(page);
	await setHand(page, 'player_1', ['piecie_katjegang', 'piecie_katjegang']);

	const beforeFirst = (await getGameState(page)).players.player_1.activeSlots[1].mp; // Jisca, slot 1
	await playCardFromHand(page, 'piecie_katjegang'); // 1st Piecie this turn
	await page.waitForTimeout(400);
	const afterFirst = (await getGameState(page)).players.player_1.activeSlots[1].mp;
	const deltaFirst = afterFirst - beforeFirst;
	console.log(`Scenario B — Jisca MP delta after FIRST Piecie played: ${deltaFirst} (expect 10)`);
	await ss(page, 'alyssa-jisca-scenario-b-first-piecie');

	await playCardFromHand(page, 'piecie_katjegang'); // 2nd Piecie this turn — once-per-turn cap
	await page.waitForTimeout(400);
	const afterSecond = (await getGameState(page)).players.player_1.activeSlots[1].mp;
	const deltaSecond = afterSecond - afterFirst;
	console.log(`Scenario B — Jisca MP delta after SECOND Piecie played: ${deltaSecond} (expect 0, once-per-turn cap)`);
	await ss(page, 'alyssa-jisca-scenario-b-second-piecie');

	// GREEN on Plan 38-02 wiring: piecie_katjegang has zero own MP effect
	// (src/abilities/piecieEffects.js effect_katjegang), so the +10 delta on the
	// first play is purely the Jisca synergy bonus (applyAlyssaJiscaPiecieBonus).
	expect(deltaFirst).toBe(10);
	// Once-per-turn cap: the second Piecie played the same turn grants no extra
	// (alyssaJiscaPiecieBonusUsedThisTurn already set) → delta 0.
	expect(deltaSecond).toBe(0);
});
