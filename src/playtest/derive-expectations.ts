import type { CardDefinition } from "../cards/schema/card-definition.js";
import type { Expectation } from "./types.js";
import type { GameEvent } from "../types/events.js";

export function deriveExpectations(
  card: CardDefinition
): ReadonlyArray<Expectation> {
  const expectations: Expectation[] = [];

  expectations.push({
    type: "card_resolved",
    outcome: "success",
    description: `Card resolves successfully`,
  });

  const primitives = extractPrimitives(card.effects);

  for (const primitive of primitives) {
    switch (primitive.name) {
      case "gainMP":
        expectations.push({
          type: "event_emitted",
          eventType: "mp_gained",
          check: (e: GameEvent) => {
            if (e.type !== "mp_gained") return false;
            const amount = (primitive.params as Record<string, unknown>)
              .amount as number | undefined;
            return amount ? (e as any).amount === amount : true;
          },
          description: `Emits mp_gained event`,
        });
        break;

      case "drawCards":
        const drawCount = (primitive.params as Record<string, unknown>)
          .count as number | undefined;
        expectations.push({
          type: "event_emitted",
          eventType: "card_drawn",
          check: (e: GameEvent) => {
            if (e.type !== "card_drawn") return false;
            return drawCount
              ? countEventType("card_drawn") >= drawCount
              : true;
          },
          description: `Emits card_drawn events for draw`,
        });
        break;

      case "loseMP":
        expectations.push({
          type: "event_emitted",
          eventType: "mp_lost",
          check: (e: GameEvent) => e.type === "mp_lost",
          description: `Emits mp_lost event`,
        });
        break;

      case "drainMP":
        expectations.push({
          type: "event_emitted",
          eventType: "mp_drained",
          check: (e: GameEvent) => e.type === "mp_drained",
          description: `Emits mp_drained event`,
        });
        break;

      case "applyBuff":
        expectations.push({
          type: "event_emitted",
          eventType: "buff_applied",
          check: (e: GameEvent) => e.type === "buff_applied",
          description: `Applies a buff`,
        });
        break;

      case "destroyPlace":
        expectations.push({
          type: "event_emitted",
          eventType: "place_destroyed",
          check: (e: GameEvent) => e.type === "place_destroyed",
          description: `Destroys the active place`,
        });
        break;
    }
  }

  return expectations;
}

interface ExtractedPrimitive {
  name: string;
  params: Record<string, unknown>;
}

function extractPrimitives(
  effects: ReadonlyArray<{ primitive: string; params: Record<string, unknown> }>
): ExtractedPrimitive[] {
  const result: ExtractedPrimitive[] = [];

  function walk(
    effects: ReadonlyArray<{ primitive: string; params: Record<string, unknown> }>
  ) {
    for (const effect of effects) {
      result.push({ name: effect.primitive, params: effect.params });

      if (effect.primitive === "ifThenElse") {
        const thenEffects = (
          effect.params.thenEffects as ReadonlyArray<{
            primitive: string;
            params: Record<string, unknown>;
          }>
        ) ?? [];
        const elseEffects = (
          effect.params.elseEffects as ReadonlyArray<{
            primitive: string;
            params: Record<string, unknown>;
          }>
        ) ?? [];
        walk(thenEffects);
        walk(elseEffects);
      } else if (effect.primitive === "chain") {
        const chainEffects = (
          effect.params.effects as ReadonlyArray<{
            primitive: string;
            params: Record<string, unknown>;
          }>
        ) ?? [];
        walk(chainEffects);
      } else if (effect.primitive === "forEachTarget") {
        const targetEffects = (
          effect.params.effects as ReadonlyArray<{
            primitive: string;
            params: Record<string, unknown>;
          }>
        ) ?? [];
        walk(targetEffects);
      }
    }
  }

  walk(effects);
  return result;
}

function countEventType(type: string): number {
  return 0;
}
