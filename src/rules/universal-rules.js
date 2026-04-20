import { U1_singleTargetAttackResolution } from "./helpers/U1_singleTargetAttackResolution.js";
import { U2_anyDeckScopeCheck } from "./helpers/U2_anyDeckScopeCheck.js";
import { U3_selectRandomHandIndex } from "./helpers/U3_selectRandomHandIndex.js";
import { U4_isFieldEffectActiveForMosje } from "./helpers/U4_isFieldEffectActiveForMosje.js";
import { U5_computeEffectExpiryTurn } from "./helpers/U5_computeEffectExpiryTurn.js";
import { U7_isCostPayment } from "./helpers/U7_isCostPayment.js";

export const U1_SINGLE_TARGET_ATTACK_RULE = Object.freeze({
  id: "U1",
  title: "Single-target selection on ATTACK Piecies",
  targetSelectionTiming: "on_activation",
  lockTargetAtActivation: true,
  redirectOnInvalidTarget: false,
  multiTurnTargetLock: true,
});

export const U2_ANY_DECK_SCOPE_RULE = Object.freeze({
  id: "U2",
  title: "Any deck scope and visibility",
  validDeckOwners: ["self", "single_opponent"],
  visibility: "activating_player_only",
});

export const U3_RANDOM_SELECTION_RULE = Object.freeze({
  id: "U3",
  title: "Random selection from hand",
  method: "uniform_rng",
  selectedByTargetPlayer: false,
  revealOnDiscard: true,
});

export const U4_FIELD_DURATION_RULE = Object.freeze({
  id: "U4",
  title: "While this Mosje is active",
  lastsWhileOnField: true,
  endsOnWelloeOrRemoval: true,
  dedupeByMosjeId: true,
});

export const U5_TURN_DURATION_RULE = Object.freeze({
  id: "U5",
  title: "X turn duration effects",
  countingBasis: "activating_player_turns",
  activationTurnIsZero: true,
  expiresAtEndOfTurnX: true,
});

export const U6_MP_MODIFIER_ORDER = Object.freeze([
  "card_printed_base_value",
  "card_conditional_synergy",
  "active_mosje_passives",
  "partner_synergy_buffs",
  "place_modifiers",
  "piecie_buffs",
  "snelle_adjustments",
]);

export const U7_COST_PAYMENT_RULE = Object.freeze({
  id: "U7",
  title: "Cost payment is not effect damage",
  costPaymentCountsAsEffectLoss: false,
});

export {
  U1_singleTargetAttackResolution,
  U2_anyDeckScopeCheck,
  U3_selectRandomHandIndex,
  U4_isFieldEffectActiveForMosje,
  U5_computeEffectExpiryTurn,
  U7_isCostPayment,
};
