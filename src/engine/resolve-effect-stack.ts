import { appendEvent } from "./append-event.js";
import { getCard } from "../cards/registry/card-registry.js";
import { resolvePrimitive } from "../effects/registry.js";
import { runCardEffects } from "../cards/executor/run-card-effects.js";
import { resolveTargetReference } from "../cards/executor/resolve-target-reference.js";
import { createRng } from "../utils/rng.js";
import { checkTrait } from "../effects/conditions/check-trait.js";
import { checkLevel } from "../effects/conditions/check-level.js";
import { checkMP } from "../effects/conditions/check-mp.js";
import { checkCardTypeInPlay } from "../effects/conditions/check-card-type-in-play.js";
import { checkPlaceActive } from "../effects/conditions/check-place-active.js";
import type { GameState } from "../types/game-state.js";
import type { CardId } from "../types/card-id.js";
import type { PendingEffect, SnelleInvocationData } from "../types/pending-effect.js";
import type { EffectContext } from "../effects/effect-context.js";
import type { RequirementDefinition } from "../cards/schema/requirement-definition.js";
import type { CardDefinition } from "../cards/schema/card-definition.js";
import type { CostDefinition } from "../cards/schema/cost-definition.js";
import type { CardInvocation } from "../cards/executor/resolve-target-reference.js";
import { variableCostResolvers } from "../cards/variable-cost-resolvers.js";

// ─── Error classes ────────────────────────────────────────────────────────────

export class SnelleOnlyError extends Error {
  constructor(cardId: string) {
    super(`Only Snelle Piecies can be played as responses. Got: '${cardId}'`);
    this.name = "SnelleOnlyError";
  }
}

export class ChainDepthExceededError extends Error {
  constructor() {
    super("Chain depth exceeded: max 3 counter-cards on the stack at once");
    this.name = "ChainDepthExceededError";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SnelleResponseOptions {
  readonly respondingPlayerId: string;
  readonly snelleCardId: CardId;
  readonly invocation: CardInvocation;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function validateRequirement(
  state: GameState,
  req: RequirementDefinition,
  invocation: CardInvocation
): boolean {
  const requirementTarget =
    req.params["applyTo"] === "target" && invocation.targetRef !== undefined
      ? invocation.targetRef
      : invocation.actingMosjeRef;

  switch (req.type) {
    case "trait":
      return checkTrait(state, {
        target: requirementTarget,
        trait: req.params["trait"] as string,
        minStars: req.params["minStars"] as 1 | 2 | 3
      });
    case "level":
      return checkLevel(state, {
        target: requirementTarget,
        minLevel: req.params["minLevel"] as 1 | 2 | 3
      });
    case "mp":
      return checkMP(state, {
        target: requirementTarget,
        operator: req.params["operator"] as ">=" | "<=" | "==" | "between",
        value: req.params["value"] as number,
        rangeEnd: req.params["rangeEnd"] as number | undefined
      });
    case "card_in_play":
      return checkCardTypeInPlay(state, {
        playerId: invocation.actingPlayerId,
        cardType: req.params["cardType"] as string
      });
    case "place_active":
      return checkPlaceActive(state, {
        placeCardId: req.params["placeCardId"] as string
      });
    case "custom":
      return true;
    default: {
      const _: never = req.type;
      return _;
    }
  }
}

function meetsCostGates(state: GameState, invocation: CardInvocation, card: CardDefinition): boolean {
  if (card.cost.levelRequirement !== undefined) {
    const levelOk = checkLevel(state, {
      target: invocation.actingMosjeRef,
      minLevel: card.cost.levelRequirement
    });
    if (!levelOk) return false;
  }

  const traitReqs = card.cost.traitRequirements;
  if (traitReqs !== undefined) {
    for (const req of traitReqs) {
      const traitOk = checkTrait(state, {
        target: invocation.actingMosjeRef,
        trait: req.trait,
        minStars: req.minStars
      });
      if (!traitOk) return false;
    }
  }

  return true;
}

function canPayCost(state: GameState, invocation: CardInvocation, mpCost: number): boolean {
  const player = state.players.find((p) => p.id === invocation.actingPlayerId);
  const mosje = player?.mosjes.find((m) => m.instanceId === invocation.actingMosjeRef.instanceId);
  if (mosje === undefined) return false;
  return mosje.mp >= mpCost;
}

function resolveEffectiveCost(state: GameState, card: CardDefinition, context: EffectContext): CostDefinition {
  if (card.cost.type !== "variable") return card.cost;
  const resolver = variableCostResolvers[(card.cost as { resolver?: string }).resolver ?? ""];
  if (resolver === undefined) return { type: "free" };
  return resolver(state, context);
}

function resolveAutoTargetRefFromPending(
  state: GameState,
  card: CardDefinition,
  invocation: CardInvocation,
  pending?: PendingEffect
): CardInvocation {
  if (invocation.targetRef !== undefined) return invocation;
  if (card.target !== "opponent_active_mosje") return invocation;
  const sourcePlayerId = pending?.source.playerId;
  if (sourcePlayerId === undefined) return invocation;
  const sourcePlayer = state.players.find((player) => player.id === sourcePlayerId);
  if (sourcePlayer === undefined) return invocation;
  const activeMosje = sourcePlayer.mosjes[sourcePlayer.activeMosjeIndex];
  if (activeMosje === undefined) return invocation;

  return {
    ...invocation,
    targetRef: { playerId: sourcePlayerId, instanceId: activeMosje.instanceId }
  };
}

function payCost(
  state: GameState,
  invocation: CardInvocation,
  cardId: CardId,
  mpCost: number,
  context: EffectContext
): GameState {
  const loseMP = resolvePrimitive("loseMP");
  return loseMP(
    state,
    {
      target: invocation.actingMosjeRef,
      amount: mpCost,
      isCostPayment: true
    },
    { ...context, source: { kind: "cost", cardId, playerId: invocation.actingPlayerId } }
  );
}

function validateAndPayResponseCard(
  state: GameState,
  card: CardDefinition,
  invocation: CardInvocation,
  context: EffectContext
): { ok: true; state: GameState } | { ok: false; state: GameState } {
  const effectiveCost = resolveEffectiveCost(state, card, context);

  const unmetRequirement = card.requirements.find((req) => !validateRequirement(state, req, invocation));
  if (unmetRequirement !== undefined) {
    return {
      ok: false,
      state: appendEvent(state, {
        type: "card_resolved",
        cardId: card.id,
        playerId: invocation.actingPlayerId,
        outcome: "rejected"
      })
    };
  }

  if (!meetsCostGates(state, invocation, card)) {
    return {
      ok: false,
      state: appendEvent(state, {
        type: "card_resolved",
        cardId: card.id,
        playerId: invocation.actingPlayerId,
        outcome: "rejected"
      })
    };
  }

  if (effectiveCost.type === "mp" && effectiveCost.mp !== undefined && effectiveCost.mp > 0) {
    if (!canPayCost(state, invocation, effectiveCost.mp)) {
      return {
        ok: false,
        state: appendEvent(state, {
          type: "card_resolved",
          cardId: card.id,
          playerId: invocation.actingPlayerId,
          outcome: "rejected"
        })
      };
    }

    return {
      ok: true,
      state: payCost(state, invocation, card.id, effectiveCost.mp, context)
    };
  }

  return { ok: true, state };
}

/** Execute a snelle card's effects (cost already paid on response push). */
function executeSnellePendingEffect(state: GameState, pendingEffect: PendingEffect): GameState {
  const cardId = pendingEffect.snelleCardId!;
  const rawInvocation = pendingEffect.snelleInvocation!;
  const card = getCard(cardId);

  // Reconstruct CardInvocation-compatible object
  const invocation: CardInvocation = {
    actingPlayerId: rawInvocation.actingPlayerId,
    actingMosjeRef: rawInvocation.actingMosjeRef,
    targetRef: rawInvocation.targetRef,
    playerChoices: rawInvocation.playerChoices
  };

  const context: EffectContext = {
    source: { kind: "card", cardId, playerId: rawInvocation.actingPlayerId },
    actingPlayerId: rawInvocation.actingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount,
    respondingToEffectId: pendingEffect.respondingToEffectId,
    respondingToCardId:
      pendingEffect.respondingToEffectId !== undefined
        ? (state.effectStack.find((e) => e.id === pendingEffect.respondingToEffectId)?.source.cardId as
            | string
            | undefined)
        : undefined,
    respondingToPendingEffect: state.effectStack.find(
      (e) => e.id === pendingEffect.respondingToEffectId
    )
  };

  const resolvedTarget = resolveTargetReference(state, card.target, invocation);
  const effectInvocation: CardInvocation = {
    ...invocation,
    targetRef: resolvedTarget ?? invocation.targetRef
  };

  return runCardEffects(state, card.effects, effectInvocation, context);
}

/** Execute a regular (non-snelle) PendingEffect via the primitive registry. */
function executeRegularPendingEffect(state: GameState, pendingEffect: PendingEffect): GameState {
  const context: EffectContext = {
    source: pendingEffect.source,
    actingPlayerId: state.currentPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };
  const primitive = resolvePrimitive(pendingEffect.primitive);
  return primitive(state, pendingEffect.params, context);
}

/** Resolve all items on the effectStack from top (LIFO). */
function resolveAllPending(state: GameState): GameState {
  let current = state;
  while (current.effectStack.length > 0) {
    const topIndex = current.effectStack.length - 1;
    const topEffect = current.effectStack[topIndex];
    // Remove from stack first
    current = { ...current, effectStack: current.effectStack.slice(0, topIndex) };

    if (topEffect.snelleCardId !== undefined && topEffect.snelleInvocation !== undefined) {
      current = executeSnellePendingEffect(current, topEffect);
    } else {
      current = executeRegularPendingEffect(current, topEffect);
    }
  }
  return current;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Push a Snelle Piecie onto the effectStack as a response (canCounter=true),
 * OR execute it immediately as an interrupt (canCounter=false).
 *
 * With options = null: resolve the entire remaining effectStack top-down.
 */
export function resolveEffectStack(
  state: GameState,
  options: SnelleResponseOptions | null
): GameState {
  // ── Resolve entire stack ────────────────────────────────────────────────
  if (options === null) {
    return resolveAllPending(state);
  }

  // ── Snelle response ─────────────────────────────────────────────────────
  const card = getCard(options.snelleCardId);
  if (card.category !== "snelle-piecie") {
    throw new SnelleOnlyError(options.snelleCardId as string);
  }

  if (card.canCounter === true) {
    // Frenssen-style: must have something on stack to be useful; fizzles when empty
    if (card.requiresStackTarget === true && state.effectStack.length === 0) {
      return appendEvent(state, {
        type: "warning",
        code: "snelle_fizzle",
        message: `${options.snelleCardId} requires a stack target but effectStack is empty — fizzles`
      });
    }

    // Chain depth: count canCounter items already on stack
    const counterDepth = state.effectStack.filter((e) => e.canBeCountered).length;
    if (counterDepth >= 3) {
      throw new ChainDepthExceededError();
    }

    const responseContext: EffectContext = {
      source: { kind: "card", cardId: options.snelleCardId, playerId: options.respondingPlayerId },
      actingPlayerId: options.respondingPlayerId,
      rng: createRng(state.rngSeed),
      turnCount: state.turnCount,
      respondingToEffectId: state.effectStack[state.effectStack.length - 1]?.id,
      respondingToPendingEffect: state.effectStack[state.effectStack.length - 1]
    };

    const invocationWithAutoTarget = resolveAutoTargetRefFromPending(
      state,
      card,
      options.invocation,
      state.effectStack[state.effectStack.length - 1]
    );

    const validated = validateAndPayResponseCard(state, card, invocationWithAutoTarget, responseContext);
    if (!validated.ok) {
      return validated.state;
    }

    // Push to top of stack after successful validation/cost payment
    const topEffect = validated.state.effectStack[validated.state.effectStack.length - 1] as
      | PendingEffect
      | undefined;
    const snelleInvocationData: SnelleInvocationData = {
      actingPlayerId: invocationWithAutoTarget.actingPlayerId,
      actingMosjeRef: invocationWithAutoTarget.actingMosjeRef,
      targetRef: invocationWithAutoTarget.targetRef,
      playerChoices: invocationWithAutoTarget.playerChoices
    };
    const pendingEffect: PendingEffect = {
      id: `snelle_${options.snelleCardId}_${validated.state.turnCount}_${validated.state.effectStack.length}`,
      source: { kind: "card", cardId: options.snelleCardId, playerId: options.respondingPlayerId },
      primitive: "__snelle__",
      params: {},
      canBeCountered: true,
      snelleCardId: options.snelleCardId,
      snelleInvocation: snelleInvocationData,
      respondingToEffectId: topEffect?.id
    };
    return appendEvent(
      { ...validated.state, effectStack: [...validated.state.effectStack, pendingEffect] },
      {
        type: "card_resolved",
        cardId: options.snelleCardId,
        playerId: options.respondingPlayerId,
        outcome: "success"
      }
    );
  }

  // ── Non-counter snelle: validate/pay, then execute as interrupt, then resolve stack ──
  const context: EffectContext = {
    source: { kind: "card", cardId: options.snelleCardId, playerId: options.respondingPlayerId },
    actingPlayerId: options.respondingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount,
    respondingToEffectId: state.effectStack[state.effectStack.length - 1]?.id,
    respondingToPendingEffect: state.effectStack[state.effectStack.length - 1]
  };

  if (card.requiresStackTarget === true && state.effectStack.length === 0) {
    return appendEvent(state, {
      type: "warning",
      code: "snelle_fizzle",
      message: `${options.snelleCardId} requires a stack target but effectStack is empty — fizzles`
    });
  }

  const validated = validateAndPayResponseCard(state, card, options.invocation, context);
  if (!validated.ok) {
    return validated.state;
  }

  const resolvedTarget = resolveTargetReference(validated.state, card.target, options.invocation);
  const effectInvocation: CardInvocation = {
    ...options.invocation,
    targetRef: resolvedTarget ?? options.invocation.targetRef
  };

  const afterSnelle = runCardEffects(validated.state, card.effects, effectInvocation, context);
  const withResolved = appendEvent(afterSnelle, {
    type: "card_resolved",
    cardId: options.snelleCardId,
    playerId: options.respondingPlayerId,
    outcome: "success"
  });
  return resolveAllPending(withResolved);
}

/** Push an arbitrary PendingEffect to the effectStack (for game system use). */
export function pushPendingEffect(state: GameState, effect: PendingEffect): GameState {
  return { ...state, effectStack: [...state.effectStack, effect] };
}
