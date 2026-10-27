/**
 * game-collector.js — Captures per-game data from Playwright console logs.
 *
 * The game engine emits structured console lines like:
 *   [ENGINE] Piecie activated: Kannetje Melk (effect_kannetje_melk)
 *   [BOT] METRIC {"ev":"attack","deck":"EXAMPLE_TAKSEN",...}   (src/bot/strategy/emitBotMetric.js)
 *
 * attachCollector() attaches a console listener; summarizeBotMetrics() turns the parsed
 * bot metric objects of ONE game into per-deck 2.0 counters (64-06, D-27 report numbers).
 */

export function attachCollector(page) {
	const logs = [];
	const errors = [];

	page.on('console', msg => {
		const text = msg.text();
		// 64-04: a console error counts as a crash too (the 2.0 sim and U11 require zero).
		if (msg.type() === 'error') errors.push(`console: ${text}`);
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
		// The parsed '[BOT] METRIC {json}' objects (emitBotMetric), in order; a malformed line is skipped.
		getMetrics: () => {
			const metrics = [];
			for (const line of logs) {
				if (!line.startsWith('[BOT] METRIC ')) continue;
				try { metrics.push(JSON.parse(line.slice('[BOT] METRIC '.length))); } catch { /* skip */ }
			}
			return metrics;
		},
	};
}

/**
 * Count the 2.0 bot events of one game, grouped by deck id ('UNKNOWN' when the event carries no deck,
 * e.g. elimination-strike and the reaction engine-refused). Input = playBotGame's result.metrics.
 *   attack, quest-roll (success -> questWins), action-skip (+ reason), reaction-played,
 *   plays-second-mosje, elimination-strike, engine-refused.
 */
export function summarizeBotMetrics(metrics) {
	const byDeck = {};
	for (const m of metrics) {
		const d = (byDeck[m.deck || 'UNKNOWN'] ??= {
			attacks: 0, questRolls: 0, questWins: 0, actionSkips: 0, skipReasons: {},
			reactionsPlayed: 0, secondMosjePlays: 0, eliminationStrikes: 0, engineRefused: 0,
		});
		if (m.ev === 'attack') d.attacks++;
		else if (m.ev === 'quest-roll') { d.questRolls++; if (m.success) d.questWins++; }
		else if (m.ev === 'action-skip') {
			d.actionSkips++;
			const reason = m.reason || 'unknown';
			d.skipReasons[reason] = (d.skipReasons[reason] || 0) + 1;
		}
		else if (m.ev === 'reaction-played') d.reactionsPlayed++;
		else if (m.ev === 'plays-second-mosje') d.secondMosjePlays++;
		else if (m.ev === 'elimination-strike') d.eliminationStrikes++;
		else if (m.ev === 'engine-refused') d.engineRefused++;
	}
	return byDeck;
}
