import { resolveQuery, resolvePrimitive } from "../registry.js";
import type { Primitive } from "../primitive.js";
import type { CountParams } from "../query/count-cards-in-zone.js";
import type { EffectExpr } from "./types.js";

export interface MultiplyByCountParams {
  readonly countParams: CountParams;
  readonly perUnitEffect: EffectExpr;
  readonly target: "$self" | "$target";
  readonly cap?: number;
}

function computeIterationCount(count: number, params: MultiplyByCountParams): number {
  if (params.cap === undefined || params.cap <= 0) return count;

  const amount = Number(params.perUnitEffect.params["amount"] ?? 0);
  const primitive = params.perUnitEffect.primitive;
  const canCap = (primitive === "gainMP" || primitive === "loseMP") && amount > 0;
  if (!canCap) return count;

  const maxByCap = Math.floor(params.cap / amount);
  return Math.max(0, Math.min(count, maxByCap));
}

export const multiplyByCount: Primitive<MultiplyByCountParams> = (state, params, context) => {
  const query = resolveQuery("countCardsInZone");
  const rawCount = Number(query(state, params.countParams, context));
  const count = Number.isFinite(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0;
  if (count <= 0) return state;

  const iterations = computeIterationCount(count, params);
  let next = state;

  for (let i = 0; i < iterations; i += 1) {
    const primitive = resolvePrimitive(params.perUnitEffect.primitive);
    next = primitive(next, params.perUnitEffect.params, context);
  }

  return next;
};
