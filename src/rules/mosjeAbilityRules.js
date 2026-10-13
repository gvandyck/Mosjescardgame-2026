// mosjeAbilityRules — per-ability rules for the 32 Obby 2.0 Mosjes (data only).
// reactive: true = an activated ability used inside a reaction window (no Activate button; DJ 80/20).
// kind: 'activated' (button, Energy) | 'trigger' (fires by itself) | 'passive' (always on).
// per: 'turn' | 'game'; maxPerTurn defaults to 1; ownTurnOnly defaults to true.
// inputs: what the player (or bot) must supply -> state.players[pid]._pendingTargets[key].
// Energy costs live in abilityEnergyCosts.js. Text: docs/obby-2.0 Card List.
const TYPES = ['MOSJE', 'PIECIE', 'SNELLE', 'PLACE'];
const act = (inputs = [], extra = {}) => ({ kind: 'activated', per: 'turn', maxPerTurn: 1, ownTurnOnly: true, inputs, ...extra });
const trig = () => ({ kind: 'trigger', per: null, inputs: [] });
const pass = () => ({ kind: 'passive', per: null, inputs: [] });
const deckPick = (n) => [
	{ key: 'deck_owner', kind: 'deckOwner' },
	{ key: 'order', kind: 'orderTopN', n, deckKey: 'deck_owner' },
];

export const MOSJE_ABILITY_RULES = Object.freeze({
	// Fighting
	ability_gandoe_wizard_chaos_roll: trig(),
	ability_jeffrey_brute_force: pass(),
	ability_alyssa_bulldozer_unstoppable: pass(),
	ability_alyssa_fissa_party_power: trig(),
	ability_azn_cless_risk_reward: trig(),
	ability_michelle_tough_gamble: trig(),
	ability_parkour_west_adaptive_combat: pass(),
	ability_gandoe_destroyer_elimination_strike: act([], { per: 'game' }),
	// Digital
	ability_ronald_chef_strategic_insight: act([{ key: 'locked_card', kind: 'oppHandCard' }]),
	ability_ming_natural_lucky_draw: act([{ key: 'choice', kind: 'choice', options: ['activate', 'hand'] }]),
	ability_ming_predictor_future_sight: act([{ key: 'stack_id', kind: 'questStack' }, { key: 'bottom', kind: 'confirm', peekStack: 'stack_id' }]),
	ability_martin_historian_time_control: act(deckPick(5), { drawStep: true }),
	ability_martin_senor_west_calculated_guess: act([{ key: 'card_type', kind: 'choice', options: TYPES }, { key: 'deck_owner', kind: 'deckOwner' }]),
	ability_coert_tech_extra_resources: act([{ key: 'extra', kind: 'number', min: 1, max: 2, step: 1 }], { maxPerTurn: 2, drawStep: true }),
	ability_hacker_system_hack: act(deckPick(3)),
	ability_jeffrey_gambler_high_stakes: act([{ key: 'stake', kind: 'number', min: 1, max: 2, step: 1 }]),
	ability_chris_perfect_setup: act([{ key: 'piecie_slot', kind: 'ownPiecieSlot', filter: 'faceDown' }]),
	ability_youri_speed_activate: act([{ key: 'piecie_slot', kind: 'ownPiecieSlot', filter: 'placedThisTurn' }]),
	ability_tactician_mp_manipulation: act([{ key: 'target', kind: 'anyMosje' }, { key: 'mp', kind: 'number', min: 10, max: 75, step: 5 }]),
	ability_drainer_continuous_drain: trig(),
	ability_fps_coert_headshot_precision: trig(),
	ability_fps_west_tactical_analysis: act([{ key: 'card_type', kind: 'choice', options: TYPES }]),
	// Artistic
	ability_ronald_mastermind_master_plan: act([{ key: 'discard_card', kind: 'discardCard', filter: 'PIECIE' }]),
	ability_jisca_perfect_combo: trig(),
	ability_tuk_healer_healing_presence: act([{ key: 'own_slot_index', kind: 'ownMosje' }]),
	ability_dj_8020_lucky_beats: act([], { ownTurnOnly: false, reactive: true }),
	ability_coert_kasteluck_morning_luck: trig(),
	ability_binti_cutting_words: act([{ key: 'hand_card', kind: 'handCard', filter: 'PIECIE' }, { key: 'opp_slot_index', kind: 'oppMosje' }]),
	ability_cless_teacher_teaching_moment: trig(),
	// Martin Driver: Perfect Line (quest gain) is handled as a quest hook; the activated part is Pit Stop.
	ability_martin_driver_perfect_line: act([{ key: 'discard_cards', kind: 'handCard', count: 2 }]),
	ability_tuk_architect_perfect_placement: act([{ key: 'pick', kind: 'pickFromTopN', n: 5, count: 2 }, { key: 'order', kind: 'orderTopN', n: 3, deckKey: 'own', afterPick: 'pick' }]),
	ability_chris_ddr_perfect_combo_chain: trig(),
});
