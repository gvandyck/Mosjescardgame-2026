/**
 * build-sim-record.js — turn ONE playBotGame result into the record the 2.0 sim aggregates (64-06, D-26).
 * A game is a CRASH when: it has a page or console error, an engine-refused bot metric, a finished win reason other than
 * LEVEL_3 / KNOCKOUT, a thrown harness error, or it neither finished nor hit a cap. A cap hit alone is a TIMEOUT, not a crash.
 * meta: { matchup, p1: { key }, p2: { key }, gameIndex, seed }. result: playBotGame's return (null when it threw `thrown`).
 */
import { summarizeBotMetrics } from './game-collector.js';

const VALID_WIN_REASONS = ['LEVEL_3', 'KNOCKOUT'];

export function buildSimRecord(meta, result, thrown = null) {
	const r = result || { finished: false, timedOut: false, timeoutKind: null, rounds: 0, winReason: null, winnerId: null, errors: [], metrics: [], engineRefused: 0, stuckMs: 0, elapsedMs: 0 };
	const errors = [...r.errors];
	if (thrown) errors.push(`harness: ${thrown.message || thrown}`);
	else if (!r.finished && !r.timedOut) errors.push('game neither finished nor hit a cap');
	const badWinReason = r.finished && !VALID_WIN_REASONS.includes(r.winReason);
	const winnerDeck = r.winnerId === 'player_1' ? meta.p1.key : r.winnerId === 'player_2' ? meta.p2.key : null;
	return {
		matchup: meta.matchup, p1Deck: meta.p1.key, p2Deck: meta.p2.key, gameIndex: meta.gameIndex, seed: meta.seed,
		finished: r.finished, timedOut: r.timedOut, timeoutKind: r.timeoutKind,
		crashed: errors.length > 0 || r.engineRefused > 0 || badWinReason,
		errors, engineRefused: r.engineRefused, rounds: r.rounds, winReason: r.winReason, winnerId: r.winnerId, winnerDeck,
		botMetrics: summarizeBotMetrics(r.metrics), elapsedMs: r.elapsedMs, stuckMs: r.stuckMs,
	};
}
