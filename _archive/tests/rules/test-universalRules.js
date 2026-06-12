import {
  test,
  assertEqual,
  assertTrue,
  assertFalse,
} from "../helpers/testHelpers.js";
import {
  U1_singleTargetAttackResolution,
  U2_anyDeckScopeCheck,
  U3_selectRandomHandIndex,
  U4_isFieldEffectActiveForMosje,
  U5_computeEffectExpiryTurn,
  U7_isCostPayment,
  U6_MP_MODIFIER_ORDER,
} from "../../src/rules/universal-rules.js";

export function runUniversalRulesTests() {
  console.log("[TEST] Running universal rules tests...");

  test("U1 resolves when target remains valid", () => {
    const result = U1_singleTargetAttackResolution({
      selectedTargetId: "inst_target",
      targetStillValid: true,
    });
    assertEqual(result.status, "resolve");
    assertEqual(result.targetId, "inst_target");
    assertFalse(result.redirectAllowed);
  });

  test("U1 fizzles when target becomes invalid", () => {
    const result = U1_singleTargetAttackResolution({
      selectedTargetId: "inst_target",
      targetStillValid: false,
    });
    assertEqual(result.status, "fizzled");
    assertFalse(result.redirectAllowed);
  });

  test("U2 allows own deck and opponent deck only", () => {
    const player = { playerId: "p1", opponentIds: ["p2"] };
    assertTrue(U2_anyDeckScopeCheck(player, { ownerId: "p1" }));
    assertTrue(U2_anyDeckScopeCheck(player, { ownerId: "p2" }));
    assertFalse(U2_anyDeckScopeCheck(player, { ownerId: "p3" }));
  });

  test("U3 random hand index uses uniform bounded output", () => {
    assertEqual(U3_selectRandomHandIndex(3, () => 0), 0);
    assertEqual(U3_selectRandomHandIndex(3, () => 0.5), 1);
    assertEqual(U3_selectRandomHandIndex(3, () => 0.99), 2);
    assertEqual(U3_selectRandomHandIndex(0, () => 0.5), -1);
  });

  test("U4 field effect active only when on field and not in welloe", () => {
    assertTrue(U4_isFieldEffectActiveForMosje({ onField: true, inWelloe: false }));
    assertFalse(U4_isFieldEffectActiveForMosje({ onField: false, inWelloe: false }));
    assertFalse(U4_isFieldEffectActiveForMosje({ onField: true, inWelloe: true }));
  });

  test("U5 computes expiry turn from owner turn counter", () => {
    assertEqual(U5_computeEffectExpiryTurn(7, 2), 9);
  });

  test("U6 modifier order has canonical seven steps", () => {
    assertEqual(U6_MP_MODIFIER_ORDER.length, 7);
    assertEqual(U6_MP_MODIFIER_ORDER[0], "card_printed_base_value");
    assertEqual(U6_MP_MODIFIER_ORDER[6], "snelle_adjustments");
  });

  test("U7 identifies MP cost payment sources", () => {
    assertTrue(U7_isCostPayment("COST_PAYMENT"));
    assertTrue(U7_isCostPayment("card_cost"));
    assertFalse(U7_isCostPayment("ATTACK_EFFECT"));
  });
}
