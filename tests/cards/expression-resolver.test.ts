import { describe, expect, it } from "vitest";
import { resolveEffectExpression } from "../../src/cards/executor/resolve-effect-expression.js";
import { UnknownPlaceholderError } from "../../src/cards/executor/resolve-target-reference.js";
import type { EffectExpression } from "../../src/cards/schema/effect-expression.js";
import type { CardInvocation } from "../../src/cards/executor/execute-card.js";
import type { CardId } from "../../src/types/card-id.js";

function cardId(s: string): CardId {
  return s as CardId;
}

const baseInvocation: CardInvocation = {
  actingPlayerId: "p1",
  actingMosjeRef: { playerId: "p1", instanceId: "m1" },
  targetRef: { playerId: "p2", instanceId: "m3" }
};

describe("expression resolver — '$'-prefix substitution (step 5)", () => {
  describe("$self resolution", () => {
    it("substitutes $self with actingMosjeRef", () => {
      const expr: EffectExpression = {
        primitive: "gainMP",
        params: { target: "$self", amount: 10 }
      };
      const resolved = resolveEffectExpression(expr, baseInvocation);
      expect(resolved.params["target"]).toEqual({ playerId: "p1", instanceId: "m1" });
    });

    it("substitutes $self when it appears as a nested object value", () => {
      const expr: EffectExpression = {
        primitive: "drainMP",
        params: { from: "$self", to: "$target", amount: 20 }
      };
      const resolved = resolveEffectExpression(expr, baseInvocation);
      expect(resolved.params["from"]).toEqual({ playerId: "p1", instanceId: "m1" });
      expect(resolved.params["to"]).toEqual({ playerId: "p2", instanceId: "m3" });
    });

    it("resolves $self correctly even without a targetRef in invocation", () => {
      const invocationWithoutTarget: CardInvocation = {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      };
      const expr: EffectExpression = {
        primitive: "gainMP",
        params: { target: "$self", amount: 5 }
      };
      const resolved = resolveEffectExpression(expr, invocationWithoutTarget);
      expect(resolved.params["target"]).toEqual({ playerId: "p1", instanceId: "m1" });
    });
  });

  describe("$target resolution", () => {
    it("substitutes $target with targetRef when provided", () => {
      const expr: EffectExpression = {
        primitive: "loseMP",
        params: { target: "$target", amount: 15 }
      };
      const resolved = resolveEffectExpression(expr, baseInvocation);
      expect(resolved.params["target"]).toEqual({ playerId: "p2", instanceId: "m3" });
    });

    it("throws MissingTargetError when $target required but targetRef absent", () => {
      const invocationNoTarget: CardInvocation = {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      };
      const expr: EffectExpression = {
        primitive: "loseMP",
        params: { target: "$target", amount: 10 }
      };
      expect(() => resolveEffectExpression(expr, invocationNoTarget)).toThrow();
      expect(() => resolveEffectExpression(expr, invocationNoTarget)).toThrow(/\$target/);
    });
  });

  describe("$player resolution", () => {
    it("substitutes $player with actingPlayerId string", () => {
      const expr: EffectExpression = {
        primitive: "drawCards",
        params: { playerId: "$player", count: 2 }
      };
      const resolved = resolveEffectExpression(expr, baseInvocation);
      expect(resolved.params["playerId"]).toBe("p1");
    });
  });

  describe("deeply nested expressions", () => {
    it("resolves placeholders inside ifThenElse condition params", () => {
      const expr: EffectExpression = {
        primitive: "ifThenElse",
        params: {
          condition: {
            condition: "checkTrait",
            params: { target: "$target", trait: "Social", minStars: 2 }
          },
          then: { primitive: "drainMP", params: { from: "$target", to: "$self", amount: 20 } },
          else: { primitive: "drainMP", params: { from: "$target", to: "$self", amount: 10 } }
        }
      };

      const resolved = resolveEffectExpression(expr, baseInvocation);

      const conditionParams = (resolved.params["condition"] as Record<string, unknown>)["params"] as Record<string, unknown>;
      expect(conditionParams["target"]).toEqual({ playerId: "p2", instanceId: "m3" });

      const thenParams = (resolved.params["then"] as Record<string, unknown>)["params"] as Record<string, unknown>;
      expect(thenParams["from"]).toEqual({ playerId: "p2", instanceId: "m3" });
      expect(thenParams["to"]).toEqual({ playerId: "p1", instanceId: "m1" });

      const elseParams = (resolved.params["else"] as Record<string, unknown>)["params"] as Record<string, unknown>;
      expect(elseParams["from"]).toEqual({ playerId: "p2", instanceId: "m3" });
    });

    it("resolves ifThenElse inside chain inside ifThenElse (triple nesting)", () => {
      const innerExpr: EffectExpression = {
        primitive: "ifThenElse",
        params: {
          condition: { condition: "checkLevel", params: { target: "$self", minLevel: 2 } },
          then: { primitive: "gainMP", params: { target: "$self", amount: 50 } },
          else: { primitive: "gainMP", params: { target: "$self", amount: 10 } }
        }
      };

      const chainExpr: EffectExpression = {
        primitive: "chain",
        params: {
          effects: [
            { primitive: "gainMP", params: { target: "$self", amount: 5 } },
            innerExpr
          ]
        }
      };

      const outerExpr: EffectExpression = {
        primitive: "ifThenElse",
        params: {
          condition: { condition: "checkTrait", params: { target: "$target", trait: "Social", minStars: 1 } },
          then: chainExpr,
          else: { primitive: "gainMP", params: { target: "$self", amount: 1 } }
        }
      };

      const resolved = resolveEffectExpression(outerExpr, baseInvocation);

      // Check outer condition uses $target
      const outerCond = (resolved.params["condition"] as Record<string, unknown>)["params"] as Record<string, unknown>;
      expect(outerCond["target"]).toEqual({ playerId: "p2", instanceId: "m3" });

      // Check inner chain's first effect target
      const chainEffects = ((resolved.params["then"] as Record<string, unknown>)["params"] as Record<string, unknown>)["effects"] as Record<string, unknown>[];
      const firstEffect = chainEffects[0] as Record<string, unknown>;
      expect((firstEffect["params"] as Record<string, unknown>)["target"]).toEqual({ playerId: "p1", instanceId: "m1" });

      // Check inner ifThenElse condition target
      const innerIfThenElse = chainEffects[1] as Record<string, unknown>;
      const innerCond = ((innerIfThenElse["params"] as Record<string, unknown>)["condition"] as Record<string, unknown>)["params"] as Record<string, unknown>;
      expect(innerCond["target"]).toEqual({ playerId: "p1", instanceId: "m1" });
    });

    it("resolves placeholders inside arrays", () => {
      const expr: EffectExpression = {
        primitive: "chain",
        params: {
          effects: [
            { primitive: "gainMP", params: { target: "$self", amount: 10 } },
            { primitive: "gainMP", params: { target: "$target", amount: 5 } }
          ]
        }
      };

      const resolved = resolveEffectExpression(expr, baseInvocation);
      const effects = resolved.params["effects"] as Record<string, unknown>[];
      expect((effects[0] as Record<string, unknown>).params).toMatchObject({
        target: { playerId: "p1", instanceId: "m1" }
      });
      expect((effects[1] as Record<string, unknown>).params).toMatchObject({
        target: { playerId: "p2", instanceId: "m3" }
      });
    });
  });

  describe("unknown placeholders", () => {
    it("throws UnknownPlaceholderError for unrecognized '$' placeholder", () => {
      const expr: EffectExpression = {
        primitive: "gainMP",
        params: { target: "$wrong", amount: 10 }
      };
      expect(() => resolveEffectExpression(expr, baseInvocation)).toThrow(UnknownPlaceholderError);
      expect(() => resolveEffectExpression(expr, baseInvocation)).toThrow("$wrong");
    });

    it("throws for deeply nested unknown placeholder", () => {
      const expr: EffectExpression = {
        primitive: "ifThenElse",
        params: {
          condition: { condition: "checkTrait", params: { target: "$unknown", trait: "x", minStars: 1 } },
          then: { primitive: "gainMP", params: { target: "$self", amount: 10 } }
        }
      };
      expect(() => resolveEffectExpression(expr, baseInvocation)).toThrow(UnknownPlaceholderError);
    });
  });

  describe("non-placeholder values pass through unchanged", () => {
    it("leaves non-'$' strings unchanged", () => {
      const expr: EffectExpression = {
        primitive: "gainMP",
        params: { note: "hello world", amount: 10, target: "$self" }
      };
      const resolved = resolveEffectExpression(expr, baseInvocation);
      expect(resolved.params["note"]).toBe("hello world");
    });

    it("leaves numbers, booleans, and null unchanged", () => {
      const expr: EffectExpression = {
        primitive: "fakePrimitive",
        params: { num: 42, flag: true, nothing: null, target: "$self" }
      };
      const resolved = resolveEffectExpression(expr, baseInvocation);
      expect(resolved.params["num"]).toBe(42);
      expect(resolved.params["flag"]).toBe(true);
      expect(resolved.params["nothing"]).toBeNull();
    });

    it("preserves primitive name unchanged", () => {
      const expr: EffectExpression = {
        primitive: "gainMP",
        params: { target: "$self", amount: 1 }
      };
      const resolved = resolveEffectExpression(expr, baseInvocation);
      expect(resolved.primitive).toBe("gainMP");
    });
  });

  describe("invocation shape variations", () => {
    it("works when actingMosjeRef has different playerId from actingPlayerId", () => {
      // Edge case: triggerOverride scenario where source/target mismatch
      const specialInvocation: CardInvocation = {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p2", instanceId: "m3" }, // acting on behalf of p2
        targetRef: { playerId: "p1", instanceId: "m1" }
      };
      const expr: EffectExpression = {
        primitive: "drainMP",
        params: { from: "$self", to: "$target", amount: 10 }
      };
      const resolved = resolveEffectExpression(expr, specialInvocation);
      expect(resolved.params["from"]).toEqual({ playerId: "p2", instanceId: "m3" });
      expect(resolved.params["to"]).toEqual({ playerId: "p1", instanceId: "m1" });
    });
  });
});
