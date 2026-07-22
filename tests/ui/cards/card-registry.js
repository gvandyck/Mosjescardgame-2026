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

export const CARD_REGISTRY = [
	// ── MP-GAIN piecies ──────────────────────────────────────────────────────
	{
		cardId: 'piecie_kannetje_melk', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 25, mpDeltaMax: 50, // 25 base, 50 with FOOD double synergy
		logMatch: /[Kk]annetje|[Mm]elk/,
	},
	{
		cardId: 'piecie_protein_shake', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 25, mpDeltaMax: 35, // 25, or 35 on Boxing Ring
		logMatch: /[Pp]rotein|[Ss]hake/,
	},
	{
		cardId: 'piecie_grammetje_pieter', cardType: 'PIECIE',
		setup: { ownMP: 50 }, playThen: 'place-then-activate',
		expectedEffect: 'GAMBLE', // die roll: 4+ → +30 MP, else → -15 MP
		logMatch: /[Gg]rammetje|[Pp]ieter/,
	},
	{
		cardId: 'piecie_dikke_jonko', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 25, mpDeltaMax: 25, // +25 self (also gives opp +10 + draws)
		logMatch: /[Dd]ikke|[Jj]onko/,
	},

	// ── ATTACK / drain piecies ───────────────────────────────────────────────
	{
		cardId: 'piecie_affoe', cardType: 'PIECIE',
		setup: { ownMP: 50, opponentMP: 80 }, playThen: 'place-then-activate',
		expectedEffect: 'ATTACK', oppDeltaMin: -15, oppDeltaMax: -15, // opp -15 (self +10)
		logMatch: /[Aa]ffoe/,
	},

	// ── DRAW piecies ─────────────────────────────────────────────────────────
	{
		cardId: 'piecie_pot_of_weed', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'DRAW', handDelta: 2, // draws 2 cards
		logMatch: /[Pp]ot of [Ww]eed|drew/,
	},
	{
		cardId: 'piecie_boosterpackkie', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'DRAW', handDelta: 1,
		logMatch: /[Bb]oosterpackkie/,
	},

	// ── STATUS / FIELD-effect piecies (no direct MP change) ──────────────────
	{
		cardId: 'piecie_quest_prep', cardType: 'PIECIE', // "Dubbele Dosis"
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'players.player_1.questPrepBonus', equals: 2 },
		logMatch: /[Dd]ubbele|quest.prep/i,
	},
	{
		cardId: 'piecie_loaded_dice', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'players.player_1.questPrepBonus', equals: 1 },
		logMatch: /[Ll]oaded [Dd]ice/,
	},
	{
		cardId: 'piecie_dikke_plaat', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'players.player_1.questPrepBonus', equals: 1 },
		logMatch: /[Dd]ikke [Pp]laat/,
	},
	{
		cardId: 'piecie_perfect_rhythm', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'players.player_1.perfectRhythmDrawNextPiecie', equals: true },
		logMatch: /[Pp]erfect [Rr]hythm/,
	},
	{
		cardId: 'piecie_laat_me_chillen', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0, // pushes MP_LOSS_REDUCTION status, no MP change
		logMatch: /[Cc]hillen|laat/i,
	},
	{
		cardId: 'piecie_redbull', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'players.player_1.abilityDoubleTrigger', equals: true },
		logMatch: /[Rr]edbull/,
	},
	{
		cardId: 'piecie_synergy_field', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'synergyFieldOwner', equals: 'player_1' },
		logMatch: /[Ss]ynergy/,
	},

	// ── DIGITAL-EQUIPMENT (needs a DIGITAL Mosje for the full value) ──────────
	{
		cardId: 'piecie_controller', cardType: 'PIECIE', mosje: 'mosje_coert_tech', // DIGITAL → +15
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 15, mpDeltaMax: 15,
		logMatch: /[Cc]ontroller/,
	},
	{
		cardId: 'piecie_keyboard', cardType: 'PIECIE', mosje: 'mosje_coert_tech', // DIGITAL → +15 + draw
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 15, mpDeltaMax: 15,
		logMatch: /[Kk]eyboard/,
	},

	// ── Batch 2: more MP-gain / status / draw piecies ───────────────────────
	{
		cardId: 'piecie_boxing_gloves', cardType: 'PIECIE', mosje: 'mosje_gandoe_destroyer', // Gandoe → +40
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 40, mpDeltaMax: 40,
		logMatch: /[Bb]oxing|[Gg]loves/,
	},
	{
		cardId: 'piecie_tikker', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 40, mpDeltaMax: 40, // +40 self (also QUEST_BLOCKED status)
		logMatch: /[Tt]ikker/,
	},
	{
		cardId: 'piecie_broodje_doner', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 35, mpDeltaMax: 70, // 35 base, 70 with FOOD double synergy
		logMatch: /[Bb]roodje|[Dd]oner/,
	},
	{
		cardId: 'piecie_bowie_stormey', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0, // MP_LOSS_HALVED status, no MP change
		logMatch: /[Bb]owie|[Ss]tormey/,
	},
	{
		cardId: 'piecie_mp_amplifier', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'players.player_1.mpAmplifierActive', equals: true },
		logMatch: /[Aa]mplifier/,
	},
	{
		cardId: 'piecie_bong_hit_demolition', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'DRAW', handDelta: 2, // draws min(2, deck)
		logMatch: /[Bb]ong|[Dd]emolition/,
	},
	{
		cardId: 'piecie_skipping_rope', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'DRAW', handDelta: 1, // questPrepBonus +1 and draws 1
		logMatch: /[Ss]kipping|[Rr]ope/,
	},

	// ── Batch 3: more MP-gain / attack / status / draw / gamble piecies ──────
	{
		cardId: 'piecie_energy_surge', cardType: 'PIECIE',
		setup: { ownMP: 10 }, playThen: 'place-then-activate', // only gains when MP < 30
		expectedEffect: 'MP_GAIN', mpDeltaMin: 20, mpDeltaMax: 20,
		logMatch: /[Ee]nergy|[Ss]urge|[Ss]hoettoe/,
	},
	{
		cardId: 'piecie_momentum_boost', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 15, mpDeltaMax: 15,
		logMatch: /[Mm]omentum/,
	},
	{
		cardId: 'piecie_dumbbells', cardType: 'PIECIE', mosje: 'mosje_gandoe_destroyer', // FIGHTING → +20
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 20, mpDeltaMax: 20,
		logMatch: /[Dd]umbbell/,
	},
	{
		cardId: 'piecie_ronald_kip', cardType: 'PIECIE',
		setup: { ownMP: 40, ownLevel: 2 }, playThen: 'place-then-activate', // requires Level 2
		expectedEffect: 'MP_GAIN', mpDeltaMin: 50, mpDeltaMax: 100, // 50 base / 60 Ronald / 100 FOOD-double
		logMatch: /[Rr]onald|[Kk]ip/,
	},
	{
		cardId: 'piecie_mouse', cardType: 'PIECIE', mosje: 'mosje_coert_tech', // DIGITAL → +15
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 15, mpDeltaMax: 15,
		logMatch: /[Mm]ouse/,
	},
	{
		cardId: 'piecie_chefs_special', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'MP_GAIN', mpDeltaMin: 15, mpDeltaMax: 300, // 15 base, +30 per opponent piecie in hand
		logMatch: /[Cc]hef/,
	},
	{
		cardId: 'piecie_harde_didde', cardType: 'PIECIE',
		setup: { ownMP: 50, opponentMP: 90 }, playThen: 'place-then-activate',
		expectedEffect: 'ATTACK', oppDeltaMin: -50, oppDeltaMax: -50,
		logMatch: /[Hh]arde|[Dd]idde/,
	},
	{
		cardId: 'piecie_te_hard_gaan', cardType: 'PIECIE',
		setup: { ownMP: 50, opponentMP: 90 }, playThen: 'place-then-activate',
		expectedEffect: 'ATTACK', oppDeltaMin: -25, oppDeltaMax: -25,
		logMatch: /[Tt]e [Hh]ard|hard gaan/i,
	},
	{
		cardId: 'piecie_kan_het', cardType: 'PIECIE',
		setup: { ownMP: 50 }, playThen: 'place-then-activate',
		expectedEffect: 'GAMBLE', // die roll: big gain or small self-loss
		logMatch: /[Kk]an het|kanhet/i,
	},
	{
		cardId: 'piecie_tony', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0, // MP_LOSS_HALVED status
		logMatch: /[Tt]ony/,
	},
	{
		cardId: 'piecie_gekke_vogels', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0,
		logMatch: /[Gg]ekke|[Vv]ogel/,
	},
	{
		cardId: 'piecie_katjegang', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0,
		logMatch: /[Kk]atje/,
	},
	{
		cardId: 'piecie_vianna_poes', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'STATUS_EFFECT', mpDeltaMax: 0,
		logMatch: /[Vv]ianna|[Pp]oes/,
	},
	{
		cardId: 'piecie_tempiecie', cardType: 'PIECIE',
		expectedEffect: 'DRAW', skipReason: 'graveyard-retrieve (not a deck draw) — needs seeded graveyard',
	},
	{
		cardId: 'piecie_stripje_bennies', cardType: 'PIECIE',
		setup: { ownMP: 40 }, playThen: 'place-then-activate',
		expectedEffect: 'DRAW', handDelta: 1, // draws (also self-damages 20 — DRAW measured by deck)
		logMatch: /[Ss]tripje|[Bb]ennie/,
	},

	// ── Complex / target-modal piecies — tracked but not auto-run ────────────
	{
		cardId: 'piecie_varkenspootjes', cardType: 'PIECIE',
		expectedEffect: 'MP_GAIN', skipReason: 'requires-mosje-target-pick (Binti +60 / other -30)',
	},
	{
		cardId: 'piecie_leipe_swap', cardType: 'PIECIE',
		expectedEffect: 'STATUS_EFFECT', skipReason: 'two-step target modal — covered by chain-tests',
	},
];

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

// ── Mosje abilities (clicked via the Mosje's ability button) ─────────────────
// Each runs a single-Mosje deck so the named Mosje is the starter; the runner's
// 'ability' flow clicks its .mosje-ability-btn and asserts the outcome.
export const ABILITY_REGISTRY = [
	{
		mosje: 'mosje_amplifier', abilityMosjeId: 'mosje_amplifier', playThen: 'ability',
		setup: { ownMP: 50 }, expectedEffect: 'MP_GAIN', mpDeltaMin: 10, mpDeltaMax: 10, // all own Mosjes +10
		cardId: 'ability_amplifier_power_boost', logMatch: /[Aa]mplifier/,
	},
	{
		mosje: 'mosje_martin_driver', abilityMosjeId: 'mosje_martin_driver', playThen: 'ability',
		setup: { ownMP: 40 }, expectedEffect: 'MP_GAIN', mpDeltaMin: 15, mpDeltaMax: 15, // Lv0 → +15
		cardId: 'ability_martin_driver_perfect_line', logMatch: /[Dd]river|[Pp]erfect [Ll]ine/,
	},
	{
		// 2026-07-13 reconciliation: Lucky Draw now shows a reveal modal (#modal-continue)
		// before optionally offering a free-activate/keep choice — the generic runner's
		// dismiss loop doesn't know to click #modal-continue, so it hangs there. Covered
		// instead by a dedicated test in card-chains.spec.js ("chain: Ming Natural Lucky Draw").
		mosje: 'mosje_ming_natural', abilityMosjeId: 'mosje_ming_natural', playThen: 'ability',
		setup: { ownMP: 40 }, expectedEffect: 'DRAW', handDelta: 1,
		cardId: 'ability_ming_natural_lucky_draw', logMatch: /[Mm]ing|[Ll]ucky [Dd]raw/,
		skipReason: 'Reveal modal (#modal-continue) blocks the generic ability runner — see card-chains.spec.js',
	},
	{
		mosje: 'mosje_binti_creator', abilityMosjeId: 'mosje_binti_creator', playThen: 'ability',
		setup: { ownMP: 40 }, expectedEffect: 'DRAW', handDelta: 1,
		cardId: 'ability_binti_creator_quick_sketch', logMatch: /[Bb]inti|[Ss]ketch/,
	},
	{
		mosje: 'mosje_cless_teacher', abilityMosjeId: 'mosje_cless_teacher', playThen: 'ability',
		setup: { ownMP: 40 }, expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'players.player_1.questPrepBonus', equals: 3 },
		cardId: 'ability_cless_teacher_teaching_moment', logMatch: /[Cc]less|[Tt]eaching/,
	},
	{
		mosje: 'mosje_coert_kastelein', abilityMosjeId: 'mosje_coert_kastelein', playThen: 'ability',
		setup: { ownMP: 40 }, expectedEffect: 'FIELD_EFFECT',
		stateFlag: { path: 'players.player_1.activeSlots.0.immuneThisTurn', equals: true },
		cardId: 'ability_coert_kastelein_immovable_object', logMatch: /[Kk]astelein|[Ii]mmovable/,
	},
	{
		// 2026-07-13 reconciliation: Perfect Setup now requires 3+ face-down Piecies on
		// the field (the generic runner's single-card setup can't drive that) and picks
		// one via a target-selector modal — covered instead by a dedicated test in
		// card-chains.spec.js ("chain: Chris All-Rounder Perfect Setup").
		mosje: 'mosje_chris', abilityMosjeId: 'mosje_chris', playThen: 'ability',
		setup: { ownMP: 40 }, expectedEffect: 'FIELD_EFFECT',
		cardId: 'ability_chris_perfect_setup', logMatch: /[Cc]hris|[Ss]etup/,
		skipReason: 'Requires 3+ face-down Piecies pre-placed + a target-selector pick — see card-chains.spec.js',
	},
	{
		// 2026-07-13 reconciliation: Headshot Precision is now a passive auto-trigger
		// after a Physical/Technical Quest success (rolled inside resolveQuest via
		// applyMosjeFieldEffectsOnQuest) — there's no manual button to click anymore
		// (autoAbility:true), so the generic 'ability' runner can't drive it. Same
		// pattern as Michelle/Jeffrey (also passive quest-hooks, never had a registry
		// entry). Covered by the resolveQuest unit tests in
		// ability-text-reconciliation.test.ts instead.
		mosje: 'mosje_fps_coert', abilityMosjeId: 'mosje_fps_coert', playThen: 'ability',
		setup: { ownMP: 40, opponentMP: 90 }, expectedEffect: 'ATTACK', oppDeltaMin: -25, oppDeltaMax: -25,
		cardId: 'ability_fps_coert_headshot_precision', logMatch: /[Cc]oert|[Hh]eadshot/,
		skipReason: 'Now a passive auto-trigger on Quest success, not a manual button — see ability-text-reconciliation.test.ts',
	},
];

export const PIECIE_SPECS = CARD_REGISTRY.filter(c => c.cardType === 'PIECIE');
export const SNELLE_SPECS = SNELLE_REGISTRY;
export const ABILITY_SPECS = ABILITY_REGISTRY;
