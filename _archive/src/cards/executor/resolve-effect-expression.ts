import type { MosjeRef } from "../../types/events.js";
import type { EffectExpression } from "../schema/effect-expression.js";
import type { CardInvocation, MissingTargetError } from "./resolve-target-reference.js";
import { UnknownPlaceholderError } from "./resolve-target-reference.js";
import type { PendingEffect } from "../../types/pending-effect.js";

export interface EffectResponseInfo {
  readonly effectId?: string;
  readonly cardId?: string;
  readonly pendingEffect?: PendingEffect;
}

interface ResolveOptions {
  readonly allowDeferredTargetPlaceholders?: boolean;
  readonly responseInfo?: EffectResponseInfo;
}

export class AmbiguousTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmbiguousTargetError";
  }
}

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
  invocation: CardInvocation,
  turnCount: number,
  options: ResolveOptions,
  playerIds: ReadonlyArray<string>,
  enclosingPrimitive?: string
): unknown {
  if (typeof value === "string" && value.startsWith("$")) {
    return resolvePlaceholder(value, invocation, turnCount, options, playerIds, options.responseInfo);
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) =>
      substituteValue(item, invocation, turnCount, options, playerIds, enclosingPrimitive) // responseInfo is in options
    );
  }
  if (value !== null && typeof value === "object") {
    const asRecord = value as Record<string, unknown>;
    const objectPrimitive =
      typeof asRecord["primitive"] === "string" ? (asRecord["primitive"] as string) : enclosingPrimitive;
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(asRecord)) {
      const nestedOptions: ResolveOptions =
        enclosingPrimitive === "forEachTarget" && k === "effect"
          ? { ...options, allowDeferredTargetPlaceholders: true, responseInfo: options.responseInfo }
          : options;
      result[k] = substituteValue(v, invocation, turnCount, nestedOptions, playerIds, objectPrimitive);
    }
    return result;
  }
  return value;
}

function resolveCurrentTurnExpression(raw: string, turnCount: number): number | undefined {
  const match = raw.match(/^\$currentTurn(?:\s*([+-])\s*(\d+))?$/);
  if (match === null) return undefined;
  const sign = match[1];
  const amount = match[2] === undefined ? 0 : Number(match[2]);
  if (sign === "-") return turnCount - amount;
  return turnCount + amount;
}

function resolvePlaceholder(
  placeholder: string,
  invocation: CardInvocation,
  turnCount: number,
  options: ResolveOptions,
  playerIds: ReadonlyArray<string>,
  responseInfo?: EffectResponseInfo
): unknown {
  const turnExpr = resolveCurrentTurnExpression(placeholder, turnCount);
  if (turnExpr !== undefined) return turnExpr;

  if (placeholder === "$self") return invocation.actingMosjeRef;
  if (placeholder === "$target") {
    if (options.allowDeferredTargetPlaceholders === true) return "$target";
    if (invocation.targetRef === undefined) {
      // Throw as MissingTargetError-compatible message
      const err = new Error(`Card requires targetRef for placeholder '$target' but none was provided`);
      err.name = "MissingTargetError";
      throw err;
    }
    return invocation.targetRef;
  }
  if (placeholder === "$player") return invocation.actingPlayerId;
  if (placeholder === "$opponent") {
    const opponents = playerIds.filter((id) => id !== invocation.actingPlayerId);
    if (opponents.length === 1) return opponents[0];
    throw new AmbiguousTargetError(
      "Use forEachTarget for multiplayer opponent targeting, not $opponent."
    );
  }
  if (placeholder.startsWith("$choice:")) {
    const key = placeholder.slice("$choice:".length);
    const value = invocation.playerChoices?.[key];
    if (value === undefined) {
      throw new UnknownPlaceholderError(placeholder);
    }
    return value;
  }
  if (placeholder === "$targetPlayer" && options.allowDeferredTargetPlaceholders === true) {
    return "$targetPlayer";
  }
  if (placeholder === "$pendingEffectId") return responseInfo?.effectId ?? "";
  if (placeholder === "$pendingEffectCardId") return responseInfo?.cardId ?? "";
  if (placeholder === "$pendingEffectDrainAmount") {
    return Number(responseInfo?.pendingEffect?.params?.["amount"] ?? 0);
  }
  if (placeholder === "$pendingEffectGainAmount") {
    return Number(responseInfo?.pendingEffect?.params?.["amount"] ?? 0);
  }
  throw new UnknownPlaceholderError(placeholder);
}

/**
 * Takes an EffectExpression and substitutes all '$'-prefixed placeholders in
 * params, returning a new EffectExpression with concrete values.
 */
export function resolveEffectExpression(
  expr: EffectExpression,
  invocation: CardInvocation,
  turnCount: number,
  playerIds: ReadonlyArray<string>,
  responseInfo?: EffectResponseInfo
): EffectExpression {
  const resolvedParams = substituteValue(expr.params, invocation, turnCount, {
    allowDeferredTargetPlaceholders: false,
    responseInfo
  }, playerIds, expr.primitive) as Record<string, unknown>;
  return { primitive: expr.primitive, params: resolvedParams };
}

export type { MosjeRef, MissingTargetError };
