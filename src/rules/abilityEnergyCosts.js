// abilityEnergyCosts.js — up-front Energy cost of each activated Mosje ability.
// Values come from the 2.0 Card List ability texts ("pay N Energy"). Data only.
// (src/data/mosjes.js is generator-owned, so the costs live here.)
export const ABILITY_ENERGY_COSTS = Object.freeze({
  ability_gandoe_destroyer_elimination_strike: 4,
  ability_ronald_chef_strategic_insight: 2,
  ability_coert_tech_extra_resources: 1,
  ability_hacker_system_hack: 1,
  ability_youri_speed_activate: 1,
  ability_tactician_mp_manipulation: 2,
  ability_fps_west_tactical_analysis: 1,
  ability_ronald_mastermind_master_plan: 2,
  ability_tuk_healer_healing_presence: 1,
  ability_binti_cutting_words: 1,
  ability_martin_driver_perfect_line: 1,
  ability_tuk_architect_perfect_placement: 1,
});

// Energy is optional ("You may pay 1 Energy") or a chosen stake (1-2): paid inside
// the ability's own resolution (Phase 58, EFX-01), so charged 0 up front.
export const ABILITY_IN_EFFECT_ENERGY = Object.freeze([
  'ability_ming_predictor_future_sight',
  'ability_jeffrey_gambler_high_stakes',
]);
