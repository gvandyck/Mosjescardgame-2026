/**
 * game-collector.js — Captures per-game data from Playwright console logs.
 *
 * The game engine emits structured console lines like:
 *   [ENGINE] Piecie activated: Kannetje Melk (effect_kannetje_melk)
 *   [ABILITY] Redbull: active Mosje ability triggers twice this turn
 *   [QUEST] TestPlayer is attempting General Quest: Arm Wrestling
 *   [ENGINE] Victory! Player player_1 wins by: LEVEL_3
 *
 * This module attaches a console listener and returns a structured GameRecord.
 */

export function attachCollector(page) {
	const logs = [];
	const errors = [];

	page.on('console', msg => {
		const text = msg.text();
		if (text.startsWith('[ENGINE]') || text.startsWith('[ABILITY]') ||
		    text.startsWith('[QUEST]') || text.startsWith('[PIECIE]') ||
		    text.startsWith('[PLACE]') || text.startsWith('[UI]') ||
		    text.startsWith('[BOT]')) {
			logs.push(text);
		}
	});
	page.on('pageerror', err => errors.push(err.message));

	return {
		getLogs: () => [...logs],
		getErrors: () => [...errors],
	};
}

/**
 * Parse '[BOT] METRIC {json}' lines (emitted by src/bot/strategy/emitBotMetric.js)
 * into a per-deck bot-quality summary: quest decisions/attempts/skips with
 * reasons, confidence (estimated p of success), MP at decision time, setup
 * activations before questing, and actual roll outcomes.
 */
export function summarizeBotMetrics(logs) {
	const byDeck = {};
	for (const line of logs) {
		if (!line.startsWith('[BOT] METRIC ')) continue;
		let m;
		try { m = JSON.parse(line.slice('[BOT] METRIC '.length)); } catch { continue; }
		const deck = m.deck || 'UNKNOWN';
		const d = (byDeck[deck] ??= {
			decisions: 0, attempts: 0, skips: 0, skipReasons: {},
			pSum: 0, pCount: 0, mpSum: 0, mpCount: 0, setupSum: 0,
			rolls: 0, rollSuccesses: 0, secondMosjePlays: 0,
		});
		if (m.ev === 'quest-decision') {
			d.decisions++;
			if (m.attempt) d.attempts++;
			else {
				d.skips++;
				d.skipReasons[m.reason || 'unknown'] = (d.skipReasons[m.reason || 'unknown'] || 0) + 1;
			}
			if (typeof m.p === 'number') { d.pSum += m.p; d.pCount++; }
			if (typeof m.mp === 'number') { d.mpSum += m.mp; d.mpCount++; }
			if (typeof m.setupActs === 'number') d.setupSum += m.setupActs;
		} else if (m.ev === 'quest-skip') {
			d.skips++;
			d.skipReasons[m.reason || 'unknown'] = (d.skipReasons[m.reason || 'unknown'] || 0) + 1;
		} else if (m.ev === 'quest-roll') {
			d.rolls++;
			if (m.success) d.rollSuccesses++;
		} else if (m.ev === 'plays-second-mosje') {
			d.secondMosjePlays++;
		}
	}
	return byDeck;
}

/**
 * Extract a structured GameRecord from captured logs + final game state.
 * Call after the reward overlay appears.
 */
export async function buildGameRecord(page, collector, meta) {
	const logs = collector.getLogs();
	const errors = collector.getErrors();

	// Read reward overlay
	const title = await page.locator('.reward-title').textContent().catch(() => '');
	const subtitle = await page.locator('.reward-subtitle').textContent().catch(() => '');

	// Win reason from the overlay's machine-readable data attribute (set by rewardOverlay.js),
	// with a prose fallback to the human-readable reason line for older snapshots.
	let winReason = await page.locator('#reward-overlay').getAttribute('data-win-reason').catch(() => null);
	if (!winReason) {
		const reasonText = await page.locator('.reward-reason').textContent().catch(() => '');
		const winReasonMatch = `${subtitle} ${reasonText}`.toUpperCase().match(/\b(LEVEL[_ ]3|KNOCKOUT|QUEST[_ ]MASTER|MOMENTUM[_ ]DOMINATION)\b/);
		winReason = winReasonMatch ? winReasonMatch[1].replace(/ /g, '_') : 'UNKNOWN';
	}
	const winner = title.trim() === 'Victory!' ? 'player_1' : 'player_2';

	// Count from logs
	const pieciesActivated = logs.filter(l => l.includes('Piecie activated:')).length;
	const questsAttempted = logs.filter(l => l.includes('is attempting') || l.includes('Arm Wrestling') || l.includes('General Quest:')).length;
	const questsSucceeded = logs.filter(l => l.includes('→ Success') || l.includes('success') && l.includes('MP')).length;
	const abilitiesUsed = logs.filter(l => l.startsWith('[ABILITY]') && !l.includes('passive')).length;
	const botActions = logs.filter(l => l.startsWith('[BOT]')).length;
	const crashes = errors.length;

	// Count specific card activations mentioned in logs
	const cardMentions = {};
	for (const line of logs) {
		const m = line.match(/Piecie activated:\s+([^(]+)/);
		if (m) {
			const name = m[1].trim();
			cardMentions[name] = (cardMentions[name] || 0) + 1;
		}
	}

	// Turn count: read the authoritative turnNumber from the final game state
	// (requires ?testMode=true). Falls back to log parsing if unavailable.
	let turnCount = -1;
	try {
		const state = await page.evaluate(() => window.__testHooks?.getGameState?.() ?? null);
		if (state && Number.isFinite(state.turnNumber)) turnCount = state.turnNumber;
	} catch { /* ignore */ }
	if (turnCount < 0) {
		// Fallback: count "Turn N started" / "Now active" transitions
		turnCount = logs.filter(l => /Turn \d+ started|Now active/.test(l)).length;
	}

	return {
		...meta,
		winner,
		winReason,
		outcome: winner === 'player_1' ? 'win' : 'loss',
		turnCount: Math.max(1, turnCount),
		pieciesActivated,
		questsAttempted,
		questsSucceeded,
		abilitiesUsed,
		crashes,
		cardMentions,
		botMetrics: summarizeBotMetrics(logs),
		rawLogCount: logs.length,
	};
}

/**
 * Aggregate an array of GameRecords into a summary object.
 */
export function aggregateRecords(records) {
	if (records.length === 0) return {};

	const wins = records.filter(r => r.outcome === 'win').length;
	const losses = records.filter(r => r.outcome === 'loss').length;

	const winReasonCounts = {};
	for (const r of records) {
		winReasonCounts[r.winReason] = (winReasonCounts[r.winReason] || 0) + 1;
	}

	const avgTurns = records.reduce((s, r) => s + r.turnCount, 0) / records.length;
	const totalCrashes = records.reduce((s, r) => s + r.crashes, 0);

	// Aggregate card mention counts
	const cardTotals = {};
	for (const r of records) {
		for (const [name, count] of Object.entries(r.cardMentions || {})) {
			cardTotals[name] = (cardTotals[name] || 0) + count;
		}
	}

	// Cards played in ALL games = 100% consistent
	const alwaysPlayed = Object.entries(cardTotals)
		.filter(([, count]) => count >= records.length)
		.map(([name]) => name);

	return {
		totalGames: records.length,
		wins,
		losses,
		winRate: `${Math.round((wins / records.length) * 100)}%`,
		winReasonCounts,
		avgTurns: +avgTurns.toFixed(1),
		totalCrashes,
		cardTotals,
		alwaysPlayed,
	};
}
