/**
 * build-deck-matrix-markdown.js — renders the 2.0 deck-matrix sim report as the human-readable results file (64-06).
 * Input: the report object written by sim-deck-matrix.spec.js { generatedAt, caps, seedBase, gamesPerMatchup, expectedGames,
 * gate, deckOrder, deckNames, stats, sanity }. Only the gate (D-26) can fail a run; every other number is report only (D-27).
 */

const cell = v => String(v ?? '—').replace(/\|/g, '\\|').replace(/\s+/g, ' ');
const pc = v => (v === null || v === undefined ? '—' : `${v}%`);
const row = cols => `| ${cols.map(cell).join(' | ')} |`;
const reasons = o => Object.entries(o || {}).map(([r, c]) => `${r} x${c}`).join(', ') || '—';
const topSkip = o => { const t = Object.entries(o || {}).sort((a, z) => z[1] - a[1])[0]; return t ? `${t[0]} x${t[1]}` : '—'; };

function gateSection(report) {
	const { gate, caps } = report;
	const out = ['## Gate (D-26)', ''];
	out.push(`Verdict: **${gate.passed ? 'PASS' : 'FAIL'}** (only a crash, a lost game or a timeout rate of 25 % or more fails the run)`, '');
	out.push(`- Caps: a game that is not finished by round ${caps.roundCap} or by ${caps.wallClockMs / 1000} s is a timeout.`);
	out.push(`- Crashes: ${gate.crashes.length} (pageerror, console error, bot-driver throw, engine-refused, invalid win reason)`);
	out.push(`- Timeout rate: ${gate.timeoutRate}% (${gate.timeoutCount} of ${gate.recorded}; limit: under 25%)`);
	out.push(`- Games recorded: ${gate.recorded}/${gate.expected}`, '');
	if (gate.crashes.length) {
		out.push(row(['Matchup', 'Game', 'Seed', 'First error']), row(['---', '---', '---', '---']));
		for (const c of gate.crashes) out.push(row([c.matchup, c.gameIndex, c.seed, c.firstError]));
		out.push('');
	}
	return out;
}

function decksSection({ deckOrder, deckNames, stats }) {
	const out = ['## Decks (non-mirror games)', '', row(['Deck', 'Games', 'W-L', 'Win rate', 'As seat 1', 'As seat 2', 'Median rounds', 'Win reasons']), row(Array(8).fill('---'))];
	for (const key of deckOrder) {
		const d = stats.decks[key];
		if (!d) continue;
		out.push(row([deckNames[key] || key, d.games, `${d.wins}-${d.losses}`, pc(d.winRate), pc(d.seat1WinRate), pc(d.seat2WinRate), d.medianRounds, reasons(d.winReasons)]));
	}
	return [...out, ''];
}

function matchupsSection({ deckOrder, stats }) {
	const out = ['## Ordered matchups', '', 'Rows = seat 1 deck, columns = seat 2 deck, cell = seat-1 wins - seat-2 wins. The diagonal is the mirror matchup.', ''];
	out.push(row(['Seat 1 \\ Seat 2', ...deckOrder]), row(Array(deckOrder.length + 1).fill('---')));
	for (const r of deckOrder) {
		const cells = deckOrder.map(c => {
			const x = stats.matchups[`${r}-vs-${c}`];
			if (!x) return '?';
			const extra = [x.timeouts ? `${x.timeouts} timeout` : '', x.crashes ? `${x.crashes} crash` : ''].filter(Boolean).join(', ');
			return `${x.p1Wins} - ${x.p2Wins}${extra ? ` (${extra})` : ''}`;
		});
		out.push(row([`**${r}**`, ...cells]));
	}
	return [...out, ''];
}

function shapeSection({ stats }) {
	const o = stats.overall;
	return ['## Game shape', '', row(['Games', 'Finished', 'Median rounds', 'p90 rounds', 'Seat 1 win rate', 'Attack share', 'Win reasons']), row(Array(7).fill('---')),
		row([o.games, o.finished, o.medianRounds, o.p90Rounds, pc(o.seat1WinRate), pc(o.attackShare), reasons(o.winReasons)]), ''];
}

function botSection({ deckOrder, deckNames, stats }) {
	const out = ['## Bot quality (per deck, mirrors included)', '', row(['Deck', 'Attacks', 'Quest rolls', 'Quest win rate', 'Attack share', '2nd Mosje/game', 'Reactions', 'Elim. strikes', 'Action skips (top reason)', 'Engine refused']), row(Array(10).fill('---'))];
	for (const key of deckOrder) {
		const b = stats.decks[key]?.bot;
		if (!b) continue;
		out.push(row([deckNames[key] || key, b.attacks, b.questRolls, pc(b.questWinRate), pc(b.attackShare), b.secondMosjePerGame, b.reactionsPlayed, b.eliminationStrikes, `${b.actionSkips} (${topSkip(b.skipReasons)})`, b.engineRefused]));
	}
	return [...out, ''];
}

function sanitySection({ sanity }) {
	const out = ['## Sanity vs desk sim (report only)', '', 'Desk sim (handoff 6d): median about 15 rounds, about 74% attacks, seat 1 about 55%. A flag means "look at the rules", never a failed run (D-27, balancing parked).', ''];
	out.push(row(['Metric', 'This run', 'Desk sim', 'Band', 'Verdict']), row(Array(5).fill('---')));
	for (const s of sanity) out.push(row([s.metric, s.value, s.desk, `${s.low}-${s.high}`, s.flagged ? `FLAGGED: ${s.note}` : s.note]));
	return [...out, ''];
}

export function buildDeckMatrixMarkdown(report) {
	const { stats } = report;
	const head = [
		'# Deck Matrix Results — 2.0 bot-vs-bot (3 Example Decks)', '',
		`Generated: ${report.generatedAt}`,
		`Games: ${stats.overall.games}/${report.expectedGames} recorded | ${report.gamesPerMatchup} per ordered matchup | seed base ${report.seedBase ?? 'random'} (game seed = base + matchup x 100 + game) | headless`, '',
	];
	const guide = [
		'## Reading guide',
		`- ${report.gamesPerMatchup} games per ordered matchup is a small sample (about +/-15% noise): trust the per-deck rows over any single matchup cell.`,
		'- Only the gate (crashes, lost games, timeout rate) can fail the run. Win rates, rounds, attack share and the sanity rows are report only.',
		'- Stats measure decks as piloted by the bot; Taksen, Regelaars and Creatievelingen differ in how well the bot can use them.', '',
	];
	return [...head, ...gateSection(report), ...decksSection(report), ...matchupsSection(report), ...shapeSection(report), ...botSection(report), ...sanitySection(report), ...guide].join('\n');
}
