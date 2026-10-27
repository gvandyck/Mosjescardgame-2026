// simCaps.js - the harness caps for a bot-vs-bot game (64 D-26), shared by U11 and the 2.0 simulation.
// The engine has no turn cap, so "timeout" is a harness definition: the game is not finished by round roundCap or by wallClockMs.
// 80 rounds is well above the measured engine p95 of 48 (median 22, max 92 over 90 seeded games; the desk sim median is about 15).
// stuckWindowMs: a reaction window or pending choice that stays open longer than this means nobody answers it (the Watch Bots halt).
export const SIM_CAPS = Object.freeze({
	roundCap: 80,
	wallClockMs: 120000,
	pollMs: 500,
	stuckWindowMs: 5000,
});
