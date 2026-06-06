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
 * Extract a structured GameRecord from captured logs + final game state.
 * Call after the reward overlay appears.
 */
export async function buildGameRecord(page, collector, meta) {
	const logs = collector.getLogs();
	const errors = collector.getErrors();

	// Read reward overlay
	const title = await page.locator('.reward-title').textContent().catch(() => '');
	const subtitle = await page.locator('.reward-subtitle').textContent().catch(() => '');

	// Parse win reason from subtitle ("Bot wins — LEVEL_3." or "TestPlayer wins — MOMENTUM_DOMINATION.")
	const winReasonMatch = subtitle.match(/\b(LEVEL_3|KNOCKOUT|QUEST_MASTER|MOMENTUM_DOMINATION)\b/);
	const winReason = winReasonMatch ? winReasonMatch[1] : 'UNKNOWN';
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

	// Turn count: each "Now active" line = one turn transition
	const turnCount = logs.filter(l => l.includes('Now active') || l.includes('activePlayerId')).length + 1;

	return {
		...meta,
		winner,
		winReason,
		outcome: winner === 'player_1' ? 'win' : 'loss',
		turnCount: Math.max(1, Math.floor(turnCount / 2)),  // approximate human turns
		pieciesActivated,
		questsAttempted,
		questsSucceeded,
		abilitiesUsed,
		crashes,
		cardMentions,
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
