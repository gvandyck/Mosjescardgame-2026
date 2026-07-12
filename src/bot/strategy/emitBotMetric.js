// emitBotMetric.js — Structured bot-decision telemetry for the simulations.
// Emits '[BOT] METRIC {json}' console lines; game-collector.js already keeps
// every '[BOT]'-prefixed line, so sim reports can score bot quality (quests
// attempted vs skipped, confidence, setup counts) without new plumbing.

export function emitBotMetric(event, fields = {}) {
	try {
		console.log('[BOT] METRIC ' + JSON.stringify({ ev: event, ...fields }));
	} catch {
		// Telemetry must never break a bot turn.
	}
}
