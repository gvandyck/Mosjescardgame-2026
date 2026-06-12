import { appendEvent } from "../../engine/append-event.js";
import { resolvePrimitive } from "../../effects/registry.js";
import { resolveEffectExpression } from "./resolve-effect-expression.js";
import type { EffectContext } from "../../effects/effect-context.js";
import type { EffectExpression } from "../schema/effect-expression.js";
import type { CardInvocation } from "./resolve-target-reference.js";
import type { GameState } from "../../types/game-state.js";

/**
 * Executes a list of EffectExpressions sequentially.
 * Stops on the first error (logged as a warning event).
 * Exported so resolve-effect-stack.ts can run snelle effects without re-paying cost.
 */
export function runCardEffects(
  state: GameState,
  effects: ReadonlyArray<EffectExpression>,
  invocation: CardInvocation,
  context: EffectContext
): GameState {
  let next = state;
  const responseInfo =
    context.respondingToEffectId !== undefined ||
    context.respondingToCardId !== undefined ||
    context.respondingToPendingEffect !== undefined
      ? {
          effectId: context.respondingToEffectId,
          cardId: context.respondingToCardId,
          pendingEffect: context.respondingToPendingEffect
        }
      : undefined;

  for (const expr of effects) {
    const resolved = resolveEffectExpression(
      expr,
      invocation,
      context.turnCount,
      state.players.map((player) => player.id),
      responseInfo
    );
    try {
      const primitive = resolvePrimitive(resolved.primitive);
      next = primitive(next, resolved.params, context);
    } catch (error) {
      next = appendEvent(next, {
        type: "warning",
        code: "effect_execution_failed",
        message: `Primitive ${resolved.primitive} threw: ${String(error)}`
      });
      break;
    }
  }
  return next;
}
