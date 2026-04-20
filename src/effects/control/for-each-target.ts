import { appendEvent } from "../../engine/append-event.js";
import type { EffectSource, MosjeRef } from "../../types/events.js";
import type { Primitive } from "../primitive.js";
import { resolvePrimitive } from "../registry.js";
import type { EffectExpr } from "./types.js";

export interface ForEachTargetParams {
  readonly targetType: "all_opponents" | "all_mosjes" | "all_opponent_mosjes";
  readonly effect: EffectExpr;
}

function isAlive(mp: number): boolean {
  return mp > 0;
}

function resolveTargets(
  state: Parameters<Primitive>[0],
  actingPlayerId: string,
  targetType: ForEachTargetParams["targetType"]
): ReadonlyArray<MosjeRef> {
  if (targetType === "all_opponents") {
    return state.players
      .filter((player) => player.id !== actingPlayerId)
      .map((player) => {
        const active = player.mosjes[player.activeMosjeIndex];
        if (active === undefined || !isAlive(active.mp)) return undefined;
        return { playerId: player.id, instanceId: active.instanceId };
      })
      .filter((ref): ref is MosjeRef => ref !== undefined);
  }

  if (targetType === "all_opponent_mosjes") {
    return state.players
      .filter((player) => player.id !== actingPlayerId)
      .flatMap((player) =>
        player.mosjes
          .filter((mosje) => isAlive(mosje.mp))
          .map((mosje) => ({ playerId: player.id, instanceId: mosje.instanceId }))
      );
  }

  return state.players.flatMap((player) =>
    player.mosjes
      .filter((mosje) => isAlive(mosje.mp))
      .map((mosje) => ({ playerId: player.id, instanceId: mosje.instanceId }))
  );
}

function substituteTargetPlaceholders(value: unknown, target: MosjeRef): unknown {
  if (typeof value === "string") {
    if (value === "$target") return target;
    if (value === "$targetPlayer") return target.playerId;
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => substituteTargetPlaceholders(entry, target));
  }
  if (value !== null && typeof value === "object") {
    const mapped: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      mapped[key] = substituteTargetPlaceholders(nested, target);
    }
    return mapped;
  }
  return value;
}

function buildEventSource(source: EffectSource): EffectSource {
  if (source.kind === "card") {
    return source.cardId === undefined ? { kind: "card" } : { kind: "card", cardId: source.cardId };
  }
  if (source.kind === "place") {
    return source.cardId === undefined ? { kind: "place" } : { kind: "place", cardId: source.cardId };
  }
  if (source.kind === "ability") {
    return source.cardId === undefined ? { kind: "ability" } : { kind: "ability", cardId: source.cardId };
  }
  if (source.kind === "quest") {
    return source.cardId === undefined ? { kind: "quest" } : { kind: "quest", cardId: source.cardId };
  }
  return source.cardId === undefined ? { kind: "cost" } : { kind: "cost", cardId: source.cardId };
}

export const forEachTarget: Primitive<ForEachTargetParams> = (state, params, context) => {
  const targets = resolveTargets(state, context.actingPlayerId, params.targetType);
  let next = state;

  for (const target of targets) {
    const primitive = resolvePrimitive(params.effect.primitive);
    const resolvedParams = substituteTargetPlaceholders(params.effect.params, target) as Record<string, unknown>;
    next = primitive(next, resolvedParams, context);
  }

  return appendEvent(next, {
    type: "for_each_completed",
    targetType: params.targetType,
    count: targets.length,
    source: buildEventSource(context.source)
  });
};