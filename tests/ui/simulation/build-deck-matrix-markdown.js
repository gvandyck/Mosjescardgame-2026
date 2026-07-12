/**
 * build-deck-matrix-markdown.js — Renders the deck-matrix sim report as the
 * human-readable results file (leaderboard + head-to-head matrix).
 *
 * Input: the report object written by sim-deck-matrix.spec.js
 * (deckOrder, deckNames, stats.decks, stats.pairings, game counts).
 */

export function buildDeckMatrixMarkdown(report) {
	const { deckOrder, deckNames, stats } = report;
	const lines = [];

	lines.push('# Deck Matrix Results — bot-vs-bot round-robin');
	lines.push('');
	lines.push(`Generated: ${report.generatedAt}`);
	lines.push(`Games: ${report.completedGames}/${report.expectedGames} completed` +
		(report.failedGames ? ` (**${report.failedGames} failed/hung — see Playwright report**)` : '') +
		` | ${report.gamesPerPairing} per pairing, seat-mirrored`);
	lines.push('');

	// ── Leaderboard ──
	lines.push('## Leaderboard (by overall win rate)');
	lines.push('');
	lines.push('| # | Deck | W–L | Win rate | As 1st | As 2nd | Avg turns | Win reasons |');
	lines.push('|---|------|-----|----------|--------|--------|-----------|-------------|');
	const ranked = Object.entries(stats.decks).sort((a, b) => b[1].winRate - a[1].winRate);
	ranked.forEach(([key, d], i) => {
		const reasons = Object.entries(d.winReasons).map(([r, c]) => `${r}×${c}`).join(', ') || '—';
		const verdict = d.winRate >= 60 ? ' ⚠️ over' : d.winRate <= 40 ? ' ⚠️ under' : '';
		lines.push(`| ${i + 1} | ${deckNames[key] || key}${verdict} | ${d.wins}–${d.losses} | ` +
			`${d.winRate}% | ${d.firstSeatWinRate}% | ${d.secondSeatWinRate}% | ${d.avgTurns} | ${reasons} |`);
	});
	lines.push('');

	// ── Head-to-head matrix ──
	lines.push('## Head-to-head (row wins – column wins)');
	lines.push('');
	lines.push(`| | ${deckOrder.join(' | ')} |`);
	lines.push(`|---|${deckOrder.map(() => '---').join('|')}|`);
	for (const row of deckOrder) {
		const cells = deckOrder.map(col => {
			if (row === col) return '—';
			const pairing = stats.pairings[`${row}-vs-${col}`] || stats.pairings[`${col}-vs-${row}`];
			if (!pairing) return '?';
			const rowWins = pairing.winsByDeck[row] || 0;
			const colWins = pairing.winsByDeck[col] || 0;
			return `${rowWins}–${colWins}`;
		});
		lines.push(`| **${row}** | ${cells.join(' | ')} |`);
	}
	lines.push('');

	// ── Bot quality (only when the strategy layer emitted metrics) ──
	const hasBot = Object.values(stats.decks).some(d => d.bot);
	if (hasBot) {
		lines.push('## Bot quality (per deck, quest decisions)');
		lines.push('');
		lines.push('| Deck | Attempts | Skips | Attempt rate | Avg confidence | Avg MP at decision | Setup acts/decision | Roll success | 2nd Mosje/game | Top skip reason |');
		lines.push('|------|----------|-------|--------------|----------------|--------------------|---------------------|--------------|-----------------|-----------------|');
		for (const key of deckOrder) {
			const b = stats.decks[key]?.bot;
			if (!b) continue;
			const topSkip = Object.entries(b.skipReasons || {})
				.sort((a, z) => z[1] - a[1])[0];
			lines.push(`| ${deckNames[key] || key} | ${b.questAttempts} | ${b.questSkips} | ` +
				`${b.attemptRate ?? '—'}% | ${b.avgConfidence ?? '—'} | ${b.avgMpAtDecision ?? '—'} | ` +
				`${b.setupActsPerDecision ?? '—'} | ${b.rollSuccessRate ?? '—'}% | ${b.secondMosjePerGame ?? '—'} | ` +
				`${topSkip ? `${topSkip[0]}×${topSkip[1]}` : '—'} |`);
		}
		lines.push('');
		lines.push('- *Avg confidence* = mean estimated success chance at decision time; ' +
			'*roll success* = what the dice actually delivered. *2nd Mosje/game* = how often the bot ' +
			'plays its second Mosje onto the field per game (0 here would mean duo synergies structurally ' +
			'cannot trigger — see src/bot/botDriver.js Phase 0).');
		lines.push('');
	}

	lines.push('## Reading guide');
	lines.push('- 10 games per pairing is a small sample (±~15% noise); trust the ' +
		`${report.gamesPerPairing * (deckOrder.length - 1)}-game per-deck aggregate over any single pairing.`);
	lines.push('- ⚠️ over = aggregate win rate ≥ 60%, ⚠️ under = ≤ 40% — balance-review candidates.');
	lines.push('- Stats measure decks *as piloted by the smart bot*; synergies the bot ignores will underrate.');
	lines.push('');

	return lines.join('\n');
}
