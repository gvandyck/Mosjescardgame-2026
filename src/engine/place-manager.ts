import { getCard } from "../cards/registry/card-registry.js";
import { runCardEffects } from "../cards/executor/run-card-effects.js";
import { resolveEffectExpression } from "../cards/executor/resolve-effect-expression.js";
import type { CardInvocation } from "../cards/executor/resolve-target-reference.js";
import type { PlaceDefinition } from "../cards/schema/place-definition.js";
import type { PlaceTrigger } from "../cards/schema/place-trigger.js";
import { runConditionExpr } from "../effects/control/run-condition-expr.js";
import type { EffectContext } from "../effects/effect-context.js";
import { createRng } from "../utils/rng.js";
import type { CardId } from "../types/card-id.js";
import type { GameEvent, MosjeRef } from "../types/events.js";
import type { GameState } from "../types/game-state.js";
import { appendEvent } from "./append-event.js";

function resolvePlace(cardId: CardId): PlaceDefinition | undefined {
  try {
    const card = getCard(cardId);
    if (card.category !== "place") return undefined;
    return card as PlaceDefinition;
  } catch {
    return undefined;
  }
}

function findActiveMosjeRef(state: GameState, playerId: string): MosjeRef | undefined {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) return undefined;
  const active = player.mosjes[player.activeMosjeIndex];
  if (active === undefined) return undefined;
  return { playerId: player.id, instanceId: active.instanceId };
}

function playerIdFromEvent(event: GameEvent): string | undefined {
  if ("playerId" in event && typeof event.playerId === "string") return event.playerId;
  if ("target" in event && event.target !== undefined) {
    const target = event.target as { readonly playerId?: string };
    if (typeof target.playerId === "string") return target.playerId;
  }
  if ("rollerId" in event && typeof event.rollerId === "string") return event.rollerId;
  return undefined;
}

function eventMatches(trigger: PlaceTrigger, event: GameEvent): boolean {
  if (trigger.on === "turn_end") return event.type === "turn_ended";
  if (trigger.on === "turn_start") return event.type === "turn_started";
  if (trigger.on === "quest_attempt") return event.type === "quest_attempted";
  if (trigger.on === "quest_completed") return event.type === "quest_completed";
  if (trigger.on === "piecie_activated") return event.type === "piecie_activated";
  if (trigger.on === "mp_gained") return event.type === "mp_gained";
  if (trigger.on === "mosje_leveled_up") return event.type === "mosje_leveled_up";
  if (trigger.on === "mosje_defeated") return event.type === "mosje_defeated";
  return false;
}

function playerFilterPasses(state: GameState, event: GameEvent, trigger: PlaceTrigger): boolean {
  if (trigger.forPlayer === "both" || trigger.forPlayer === "all") return true;

  const eventPlayerId = playerIdFromEvent(event);
  if (eventPlayerId === undefined) return false;
  return eventPlayerId === state.currentPlayerId;
}

function runEffectsForPlayer(
  state: GameState,
  placeCardId: CardId,
  effects: ReadonlyArray<{ readonly primitive: string; readonly params: Readonly<Record<string, unknown>> }>,
  actingPlayerId: string
): GameState {
  const actingMosjeRef = findActiveMosjeRef(state, actingPlayerId);
  if (actingMosjeRef === undefined) return state;

  const context: EffectContext = {
    source: { kind: "place", cardId: placeCardId, playerId: actingPlayerId },
    actingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };

  const invocation: CardInvocation = {
    actingPlayerId,
    actingMosjeRef
  };

  return runCardEffects(state, effects, invocation, context);
}

export function enterPlace(state: GameState, cardId: CardId): GameState {
  let next = state;
  if (next.activePlace !== null) {
    next = exitPlace(next);
  }

  const place = resolvePlace(cardId);
  if (place?.onEnterEffects !== undefined && place.onEnterEffects.length > 0) {
    next = runEffectsForPlayer(next, cardId, place.onEnterEffects, next.currentPlayerId);
  }

  const withActivePlace: GameState = {
    ...next,
    activePlace: {
      cardId,
      flags: {},
      subscribedTriggers: place?.triggers ?? [],
      playerId: next.currentPlayerId
    }
  };

  return appendEvent(withActivePlace, { type: "place_entered", cardId });
}

export function exitPlace(state: GameState): GameState {
  if (state.activePlace === null) return state;

  const placeCardId = state.activePlace.cardId;
  const placePlayerId = state.activePlace.playerId;
  const place = resolvePlace(placeCardId);

  let next = state;
  if (place?.onExitEffects !== undefined && place.onExitEffects.length > 0) {
    next = runEffectsForPlayer(next, placeCardId, place.onExitEffects, next.currentPlayerId);
  }

  // Move Place card to the player's discard (U3: Replaced Place cards go to player's discard)
  const playerIndex = next.players.findIndex((p) => p.id === placePlayerId);
  let finalState = next;
  if (playerIndex >= 0) {
    const updatedPlayers = next.players.map((player, index) => {
      if (index !== playerIndex) return player;
      return { ...player, discard: [...player.discard, placeCardId] };
    });
    finalState = { ...next, players: updatedPlayers };
  }

  const withoutPlace: GameState = {
    ...finalState,
    activePlace: null
  };

  return appendEvent(withoutPlace, { type: "place_destroyed", cardId: placeCardId });
}

export function resolveActivePlaceTriggers(state: GameState, event: GameEvent): GameState {
  const activePlace = state.activePlace;
  if (activePlace === null) return state;

  const actingPlayerId = playerIdFromEvent(event) ?? state.currentPlayerId;
  const actingMosjeRef = findActiveMosjeRef(state, actingPlayerId);
  if (actingMosjeRef === undefined) return state;

  const playerIds = state.players.map((player) => player.id);
  const context: EffectContext = {
    source: { kind: "place", cardId: activePlace.cardId, playerId: actingPlayerId },
    actingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };
  const invocation: CardInvocation = {
    actingPlayerId,
    actingMosjeRef
  };

  let next = state;
  for (const trigger of activePlace.subscribedTriggers) {
    if (!eventMatches(trigger, event)) continue;
    if (!playerFilterPasses(next, event, trigger)) continue;

    if (trigger.condition !== undefined) {
      const resolvedCondition = resolveEffectExpression(
        trigger.condition,
        invocation,
        context.turnCount,
        playerIds
      );
      const conditionPasses = runConditionExpr(
        next,
        { primitive: resolvedCondition.primitive, params: resolvedCondition.params },
        context
      );
      if (!conditionPasses) continue;
    }

    next = runCardEffects(next, trigger.effects, invocation, context);
    next = appendEvent(next, {
      type: "place_trigger_fired",
      placeCardId: activePlace.cardId,
      triggerOn: trigger.on
    });
  }

  return next;
}
