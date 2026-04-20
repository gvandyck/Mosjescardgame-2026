import type { MosjeRef } from "../../types/events.js";
import type { EffectExpression } from "../schema/effect-expression.js";
import type { CardInvocation, MissingTargetError } from "./resolve-target-reference.js";
import { UnknownPlaceholderError } from "./resolve-target-reference.js";

/**
 * Performs '$'-prefix placeholder substitution in effect params.
 *
 * Placeholders:
 *   '$self'   → invocation.actingMosjeRef
 *   '$target' → invocation.targetRef (throws MissingTargetError if absent)
 *   '$player' → invocation.actingPlayerId (string)
 *
 * Any string starting with '$' that is not one of the above throws
 * UnknownPlaceholderError. Non-string values pass through unchanged.
 * Substitution recurses into nested objects/arrays.
 */
function substituteValue(
  value: unknown,
  invocation: CardInvocation
): unknown {
  if (typeof value === "string" && value.startsWith("$")) {
    return resolvePlaceholder(value, invocation);
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) => substituteValue(item, invocation));
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = substituteValue(v, invocation);
    }
    return result;
  }
  return value;
}

function resolvePlaceholder(placeholder: string, invocation: CardInvocation): unknown {
  if (placeholder === "$self") return invocation.actingMosjeRef;
  if (placeholder === "$target") {
    if (invocation.targetRef === undefined) {
      // Throw as MissingTargetError-compatible message
      const err = new Error(`Card requires targetRef for placeholder '$target' but none was provided`);
      err.name = "MissingTargetError";
      throw err;
    }
    return invocation.targetRef;
  }
  if (placeholder === "$player") return invocation.actingPlayerId;
  throw new UnknownPlaceholderError(placeholder);
}

/**
 * Takes an EffectExpression and substitutes all '$'-prefixed placeholders in
 * params, returning a new EffectExpression with concrete values.
 */
export function resolveEffectExpression(
  expr: EffectExpression,
  invocation: CardInvocation
): EffectExpression {
  const resolvedParams = substituteValue(expr.params, invocation) as Record<string, unknown>;
  return { primitive: expr.primitive, params: resolvedParams };
}

export type { MosjeRef, MissingTargetError };
