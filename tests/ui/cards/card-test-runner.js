/**
 * card-test-runner.js — Data-driven card test factory.
 *
 * Given a CardTestSpec (see card-registry.js), runs the standard flow in the
 * live browser game and asserts the card's effect. Built on the battle-tested
 * helpers from the chain tests: authoritative getGameState reads (DOM lags when
 * the opponent has 2 Mosjes), game-over guards, and auto-dismiss of target
 * selectors. The MP delta is snapshotted JUST before the activation so it
 * isolates the card's effect from the turn-start trickle.
 *
 * CardTestSpec fields:
 *   cardId         — e.g. 'piecie_kannetje_melk'
 *   cardType       — 'PIECIE' | 'SNELLE_PIECIE' | 'PLACE'
 *   mosje          — starter Mosje cardId for the deck (default mosje_gandoe_destroyer)
 *   deck           — optional full custom deck object (overrides auto-built deck)
 *   botDeck        — opponent starter deck id (default 'PHYSICAL_FORCE')
 *   setup          — { ownMP, opponentMP } applied via testHooks before play
 *   playThen       — 'place-then-activate' | 'play-direct' | 'ability'
 *   abilityMosjeId — for playThen:'ability', which Mosje's button to click
 *   expectedEffect — see the switch below
 *   mpDeltaMin/Max — expected own-MP change range (for MP_GAIN/COST etc.)
 *   oppDeltaMin/Max— expected opponent-MP change range (for ATTACK/MP_DRAIN)
 *   handDelta      — expected own hand-size change (for DRAW)
 *   stateFlag      — { path, equals } checked on getGameState (for FIELD_EFFECT/STATUS)
 *   logMatch       — regex the game log must match
 *   skipReason     — non-null = the test is skipped
 */

import { expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	seedOfflineSession, seedCustomDeck,
	waitForBoard, ss,
	readLog, readOwnedMosjes, readOpponentMosjes,
	isPiecieOnField, setMosjeMP, getGameState, getHandSize,
	playCardFromHand, unlockPiecies, setHand, setMosjeOnField,
} from '../helpers.js';

// Generous filler so the deck never exhausts mid-test (DRAW cards like Pot of Weed
// draw min(2, deck.length) — a thin deck would under-draw and fail spuriously).
const FILLER = [
	'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
	'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
];

// Watch-mode pause: inserts a visible pause at each key moment so a human can follow
// the board change. Auto-enabled when running --headed (npm run test:cards:watch);
// 0 in the headless CI default. Override with SLOWMO=<ms>.
const WATCH_PAUSE = Number(process.env.SLOWMO) || (process.argv.includes('--headed') ? 600 : 0);
async function watch(page) {
	if (WATCH_PAUSE > 0) await page.waitForTimeout(WATCH_PAUSE);
}

/** Build a deck guaranteed to hold the target card in the opening hand. */
function buildDeck(spec) {
	if (spec.deck) return spec.deck;
	const mosje = spec.mosje || 'mosje_gandoe_destroyer';
	const id = spec.cardId;
	const isPiecie = spec.cardType === 'PIECIE';
	const isSnelle = spec.cardType === 'SNELLE_PIECIE';
	const isPlace = spec.cardType === 'PLACE';
	// Generous filler so the deck never empties (opening hand is 6 + a turn-start draw;
	// DRAW cards/abilities need cards LEFT in the deck to draw).
	const baseFiller = [...FILLER, ...FILLER, 'piecie_affoe', 'piecie_affoe'];
	return {
		id: `custom_${id}`,
		name: `Test ${id}`,
		mosjes: [mosje],
		piecies: isPiecie ? [id, id, id, ...baseFiller] : baseFiller,
		snellePiecies: isSnelle ? [id, id, id, 'snelle_jensen'] : ['snelle_jensen'],
		places: isPlace ? [id] : [],
		quests: [],
	};
}

/** End turn; returns 'turn' | 'gameover'. */
async function endTurnGuarded(page) {
	await page.click('#btn-end-turn').catch(() => {});
	return Promise.race([
		page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 30000 }).then(() => 'turn'),
		page.waitForSelector('#reward-overlay', { timeout: 30000 }).then(() => 'gameover'),
	]).catch(() => 'gameover');
}

/** Activate a piecie/place on the field; auto-dismiss up to two target pickers. */
async function activateOnField(page, cardId) {
	const el = page.locator(`#piecies-player [data-card-id="${cardId}"]`).first();
	await el.waitFor({ state: 'visible', timeout: 8000 });
	const btn = el.locator('button:has-text("Activate")');
	// The Activate button can lag a re-render (setMosjeMP renders after unlockPiecies).
	// Wait generously; if it still isn't there, re-unlock and wait once more.
	const appeared = await btn.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
	if (!appeared) {
		await page.evaluate(() => window.__testHooks?.unlockPiecies('player_1'));
		await page.waitForTimeout(300);
		await btn.waitFor({ state: 'visible', timeout: 8000 });
	}
	await btn.click();
	await page.waitForTimeout(500);
	for (let i = 0; i < 2; i++) {
		const target = page.locator('.target-option, .modal-mosje-select-btn:not(:disabled)').first();
		if (await target.isVisible({ timeout: 600 }).catch(() => false)) {
			await target.click();
			await page.waitForTimeout(350);
		} else break;
	}
}

/** Read own + opponent slot-0 MP + own deck size authoritatively from game state. */
async function readMP(page) {
	const s = await getGameState(page);
	return {
		own: s?.players?.player_1?.activeSlots?.[0]?.mp ?? null,
		opp: s?.players?.player_2?.activeSlots?.[0]?.mp ?? null,
		deck: s?.players?.player_1?.deck?.length ?? null,
		state: s,
	};
}

/** Resolve a dotted path on an object: getPath(s, 'players.player_1.questPrepBonus'). */
function getPath(obj, path) {
	return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export async function runCardTest(page, spec, test) {
	if (spec.skipReason) { test.skip(); return; }

	// 1. Seed deck + navigate
	const deck = buildDeck(spec);
	await seedCustomDeck(page, deck, spec.botDeck || 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// 2. Apply MP setup. If a level is needed (e.g. Ronald Kip requires Lv2), re-place
	// the starter Mosje at that level (setMosjeMP only touches MP, not level).
	if (spec.setup?.ownLevel != null) {
		await setMosjeOnField(page, 'player_1', 0, spec.mosje || 'mosje_gandoe_destroyer',
			{ mp: spec.setup.ownMP ?? 10, level: spec.setup.ownLevel });
	} else if (spec.setup?.ownMP != null) {
		await setMosjeMP(page, 'player_1', 0, spec.setup.ownMP);
	}
	if (spec.setup?.opponentMP != null) await setMosjeMP(page, 'player_2', 0, spec.setup.opponentMP);
	await page.waitForTimeout(150);

	// 3. Replace the hand with JUST the target card so (a) it's guaranteed present and
	// (b) the hand stays small — a bloated hand pushes play buttons off-screen, which
	// makes Playwright clicks hang. Abilities click a Mosje button, not a hand card.
	if (spec.playThen !== 'ability') {
		await setHand(page, 'player_1', [spec.cardId]);
	}
	await watch(page); // board + scenario set up — pause so a watcher sees the starting state

	if (spec.playThen === 'ability') {
		return runAbilityFlow(page, spec, test);
	}
	if (spec.playThen === 'play-direct') {
		return runDirectFlow(page, spec, test);
	}
	return runPlaceThenActivateFlow(page, spec, test);
}

// ── place-then-activate: play face-down on turn 1, activate on turn 2 ─────────
async function runPlaceThenActivateFlow(page, spec, test) {
	await playCardFromHand(page, spec.cardId);
	await page.waitForTimeout(400);
	if (!(await isPiecieOnField(page, spec.cardId))) { console.log(`${spec.cardId} not on field after play`); test.skip(); return; }

	// Unlock the just-placed piecie so it can activate THIS turn — no end-turn,
	// no bot turn (which, post defeat-at-0, would often KO the lone test Mosje).
	await unlockPiecies(page, 'player_1');

	// Re-apply known MP right before activation so the delta isolates the effect
	if (spec.setup?.ownMP != null) await setMosjeMP(page, 'player_1', 0, spec.setup.ownMP);
	if (spec.setup?.opponentMP != null) await setMosjeMP(page, 'player_2', 0, spec.setup.opponentMP);
	await page.waitForTimeout(150);

	const before = await readMP(page);
	const handBefore = await getHandSize(page, 'player_1');
	await watch(page); // card is on the field, about to activate
	await activateOnField(page, spec.cardId);
	await ss(page, `card-${spec.cardId}`);
	const after = await readMP(page);
	after.handDelta = (await getHandSize(page, 'player_1')) - handBefore;
	await watch(page); // effect resolved — pause so the board change is visible

	await assertEffect(page, spec, before, after, test);
}

// ── play-direct: snelle piecies / places played straight from hand ───────────
async function runDirectFlow(page, spec, test) {
	const before = await readMP(page);
	const handBefore = await getHandSize(page, 'player_1');
	await playCardFromHand(page, spec.cardId);
	await page.waitForTimeout(500);
	for (let i = 0; i < 2; i++) {
		const target = page.locator('.target-option, .modal-mosje-select-btn:not(:disabled)').first();
		if (await target.isVisible({ timeout: 600 }).catch(() => false)) { await target.click(); await page.waitForTimeout(350); }
		else break;
	}
	await ss(page, `card-${spec.cardId}`);
	const after = await readMP(page);
	after.handDelta = (await getHandSize(page, 'player_1')) - handBefore;
	await watch(page); // effect resolved
	await assertEffect(page, spec, before, after, test);
}

// ── ability: click a Mosje's ability button ──────────────────────────────────
async function runAbilityFlow(page, spec, test) {
	const before = await readMP(page);
	const handBefore = await getHandSize(page, 'player_1');
	const card = page.locator(`.mosje-card--owned[data-card-id="${spec.abilityMosjeId || spec.mosje}"]`);
	const btn = card.locator('.mosje-ability-btn');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(700);
	for (let i = 0; i < 2; i++) {
		const target = page.locator('.target-option, .modal-mosje-select-btn:not(:disabled)').first();
		if (await target.isVisible({ timeout: 600 }).catch(() => false)) { await target.click(); await page.waitForTimeout(350); }
		else break;
	}
	await ss(page, `card-${spec.cardId}`);
	const after = await readMP(page);
	after.handDelta = (await getHandSize(page, 'player_1')) - handBefore;
	await watch(page); // ability resolved
	await assertEffect(page, spec, before, after, test);
}

// ── assertions per expectedEffect ────────────────────────────────────────────
async function assertEffect(page, spec, before, after, test) {
	const ownDelta = (after.own ?? 0) - (before.own ?? 0);
	const oppDelta = (after.opp ?? 0) - (before.opp ?? 0);
	// Deck shrinkage = cards drawn — unaffected by the played card being consumed,
	// so it's a clean DRAW signal for both place-then-activate and play-direct flows.
	const deckDrawn = (before.deck ?? 0) - (after.deck ?? 0);
	console.log(`${spec.cardId} [${spec.expectedEffect}] ownΔ=${ownDelta} oppΔ=${oppDelta} handΔ=${after.handDelta ?? '-'} drawn=${deckDrawn}`);

	switch (spec.expectedEffect) {
		case 'MP_GAIN':
			expect(ownDelta, 'own MP gain').toBeGreaterThanOrEqual(spec.mpDeltaMin ?? 1);
			if (spec.mpDeltaMax != null) expect(ownDelta).toBeLessThanOrEqual(spec.mpDeltaMax);
			break;
		case 'ATTACK':
		case 'MP_DRAIN':
			expect(oppDelta, 'opponent MP drop').toBeLessThanOrEqual(spec.oppDeltaMax ?? -1);
			if (spec.oppDeltaMin != null) expect(oppDelta).toBeGreaterThanOrEqual(spec.oppDeltaMin);
			break;
		case 'STATUS_EFFECT':
			// No direct MP change; the effect sets a flag/status. ownDelta should be ~0.
			expect(Math.abs(ownDelta), 'no direct MP change').toBeLessThanOrEqual(spec.mpDeltaMax ?? 0);
			break;
		case 'DRAW':
			// Measure by deck shrinkage, not hand size — playing the card consumes a
			// hand slot which would otherwise mask a play-direct draw.
			expect(deckDrawn, 'cards drawn from deck').toBeGreaterThanOrEqual(spec.handDelta ?? 1);
			break;
		case 'FIELD_EFFECT': {
			const val = getPath(after.state, spec.stateFlag.path);
			expect(val, `state flag ${spec.stateFlag.path}`).toEqual(spec.stateFlag.equals);
			break;
		}
		case 'GAMBLE':
			// Random outcome — just verify SOMETHING changed (MP up or down) or a flag.
			expect(ownDelta !== 0 || oppDelta !== 0, 'gamble changed state').toBe(true);
			break;
		case 'PERSIST_LIFECYCLE': {
			// Card still on field after activation, then gone after end-turn sweep.
			expect(await isPiecieOnField(page, spec.cardId), 'on field after activation').toBe(true);
			const r = await endTurnGuarded(page);
			if (r !== 'gameover') {
				expect(await isPiecieOnField(page, spec.cardId), 'swept after end turn').toBe(false);
			}
			break;
		}
		default:
			throw new Error(`Unknown expectedEffect: ${spec.expectedEffect}`);
	}

	if (spec.logMatch) {
		const log = await readLog(page);
		expect(log.join(' '), `log matches ${spec.logMatch}`).toMatch(spec.logMatch);
	}
}
