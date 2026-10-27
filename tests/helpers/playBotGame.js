// playBotGame.js - play ONE bot-vs-bot game in the browser and return a result record (64 D-24 / D-26).
// Shared by U11 (tests/ui/full-game-2.0.spec.js) and the 2.0 simulation (64-06). Never throws for a timeout: the caller decides.
// Opens /game.html?botvsbot=true&fast=true&testMode=true (testMode forces player_1 to go first, so seat 1 = deck1) and polls
// window.__testHooks.getGameState() until #reward-overlay shows or a cap of SIM_CAPS (round cap, wall clock) is hit.
// A reaction window or pending choice that stays open is tracked as stuckMs / stuckWhat (the Watch Bots halt shows up there).
import { servePlaceholderFirebase } from './servePlaceholderFirebase.js';
import { seedMathRandom } from './seedMathRandom.js';
import { SIM_CAPS } from './simCaps.js';
import { attachCollector } from '../ui/simulation/game-collector.js';

// One read of the page: overlay (game over) plus the few live-state fields the harness needs.
function readSnapshot() {
	const overlay = document.getElementById('reward-overlay');
	const s = window.__testHooks?.getGameState?.() ?? null;
	return {
		over: !!overlay,
		winReason: overlay ? overlay.getAttribute('data-win-reason') : null,
		turnNumber: s?.turnNumber ?? 0,
		winnerId: s?.winnerId ?? null,
		responder: s?.pendingReaction?.responderId ?? null,
		hasChoice: !!s?.pendingChoice,
	};
}

export async function playBotGame(page, { deck1, deck2, seed = null, caps = SIM_CAPS }) {
	await servePlaceholderFirebase(page);
	if (typeof seed === 'number') await seedMathRandom(page, seed);
	const collector = attachCollector(page);
	const started = Date.now();
	await page.goto(`/game.html?botvsbot=true&fast=true&testMode=true&player=player_1&deck1=${deck1}&deck2=${deck2}`);
	await page.waitForSelector('.mosje-card--owned, .mosje-card--opponent', { timeout: 20000 });

	let snap = { over: false, winReason: null, turnNumber: 0, winnerId: null };
	let timeoutKind = null;
	let harnessError = null;
	let stuckMs = 0;
	let stuckWhat = null;
	let openKey = null; // the window or choice that is open right now
	let openSince = 0;
	for (;;) {
		try { snap = await page.evaluate(readSnapshot); } catch (err) { harnessError = `harness: ${err.message}`; break; }
		if (snap.over) break;
		const now = Date.now();
		const key = snap.responder ? `reaction:${snap.responder}` : (snap.hasChoice ? 'choice' : null);
		if (key !== openKey) { openKey = key; openSince = now; }
		if (key && now - openSince > stuckMs) { stuckMs = now - openSince; stuckWhat = key; }
		if (snap.turnNumber > caps.roundCap) { timeoutKind = 'rounds'; break; }
		if (now - started > caps.wallClockMs) { timeoutKind = 'wall-clock'; break; }
		await page.waitForTimeout(caps.pollMs);
	}

	const metrics = collector.getMetrics();
	const errors = collector.getErrors();
	if (harnessError) errors.push(harnessError);
	return {
		deck1, deck2, seed,
		finished: snap.over,
		timedOut: timeoutKind !== null,
		timeoutKind,
		rounds: snap.turnNumber,
		winReason: snap.winReason,
		winnerId: snap.winnerId,
		errors,
		metrics,
		engineRefused: metrics.filter(m => m.ev === 'engine-refused').length,
		stuckMs,
		stuckWhat,
		elapsedMs: Date.now() - started,
	};
}
