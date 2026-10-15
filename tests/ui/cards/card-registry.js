/**
 * card-registry.js — Data-driven card test specs.
 *
 * Each entry describes one card's expected behavior. The runner (card-test-runner.js)
 * loops over these and drives each card through the live browser game.
 *
 * Adding a new card = adding one entry here. Cards needing complex UI flows that
 * the generic runner can't drive get `skipReason` and are tracked but not run.
 *
 * MP delta values are the ACTUAL engine values (not the card-text descriptions —
 * several diverge, e.g. Kannetje Melk text says +20 but the effect gives +25).
 */

// The V4 Piecie registry (and its piecie-effects runner) was retired in Phase 59-01: its numbers were V4 values.
// The 2.0 Piecie specs (Card List numbers) arrive with the Phase 59 card-test library (59-02 .. 59-11).

// ── Snelle Piecies (played directly from hand, no face-down) ─────────────────
export const SNELLE_REGISTRY = [
	{
		cardId: 'snelle_jensen', cardType: 'SNELLE_PIECIE',
		setup: { ownMP: 40 }, playThen: 'play-direct',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 20, mpDeltaMax: 20, // +20 own Mosje
		logMatch: /[Jj]ensen/,
	},
	{
		cardId: 'snelle_emergency_healings', cardType: 'SNELLE_PIECIE',
		setup: { ownMP: 40 }, playThen: 'play-direct',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 25, mpDeltaMax: 35, // unconditional heal 25 (35 if resilient≥2)
		logMatch: /[Ee]mergency|[Hh]eal/,
	},
	{
		cardId: 'snelle_ff_haaltje_nemen', cardType: 'SNELLE_PIECIE',
		setup: { ownMP: 40 }, playThen: 'play-direct',
		expectedEffect: 'DRAW', handDelta: 1, // draws card(s)
		logMatch: /[Hh]aaltje|[Ff]f /,
	},
	// Reactive snelles (COUNTER/DODGE/PROTECT) can only be played in response to an
	// opponent action — the generic proactive runner can't trigger them.
	{ cardId: 'snelle_counter_strikka',    cardType: 'SNELLE_PIECIE', expectedEffect: 'STATUS_EFFECT', skipReason: 'reactive COUNTER — needs opponent piecie to negate' },
	{ cardId: 'snelle_negate_elimination', cardType: 'SNELLE_PIECIE', expectedEffect: 'STATUS_EFFECT', skipReason: 'reactive PROTECT — covered by chain-3 (Not Today! interrupt)' },
	{ cardId: 'snelle_lucky_coin',         cardType: 'SNELLE_PIECIE', expectedEffect: 'GAMBLE',        skipReason: 'slot-guard + coin flip needs specific board state' },
];

// Mosje ability tests moved to mosje-registry-2-0.js (Phase 58-11); the other 14 Mosjes follow in 58-12.

export const SNELLE_SPECS = SNELLE_REGISTRY;
