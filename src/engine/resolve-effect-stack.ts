import { appendEvent } from "./append-event.js";
import { getCard } from "../cards/registry/card-registry.js";
import { resolvePrimitive } from "../effects/registry.js";
import { runCardEffects } from "../cards/executor/run-card-effects.js";
import { resolveTargetReference } from "../cards/executor/resolve-target-reference.js";
import { createRng } from "../utils/rng.js";
import type { GameState } from "../types/game-state.js";
import type { CardId } from "../types/card-id.js";
import type { PendingEffect, SnelleInvocationData } from "../types/pending-effect.js";
import type { EffectContext } from "../effects/effect-context.js";
import type { CardInvocation } from "../cards/executor/resolve-target-reference.js";

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

/** Execute a snelle card's effects (no cost payment, no requirements re-check). */
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
    source: { kind: "card", cardId },
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

    // Push to top of stack
    const topEffect = state.effectStack[state.effectStack.length - 1] as PendingEffect | undefined;
    const snelleInvocationData: SnelleInvocationData = {
      actingPlayerId: options.invocation.actingPlayerId,
      actingMosjeRef: options.invocation.actingMosjeRef,
      targetRef: options.invocation.targetRef,
      playerChoices: options.invocation.playerChoices
    };
    const pendingEffect: PendingEffect = {
      id: `snelle_${options.snelleCardId}_${state.turnCount}_${state.effectStack.length}`,
      source: { kind: "card", cardId: options.snelleCardId },
      primitive: "__snelle__",
      params: {},
      canBeCountered: true,
      snelleCardId: options.snelleCardId,
      snelleInvocation: snelleInvocationData,
      respondingToEffectId: topEffect?.id
    };
    return { ...state, effectStack: [...state.effectStack, pendingEffect] };
  }

  // ── Non-counter snelle: execute immediately as interrupt, then resolve stack ──
  const context: EffectContext = {
    source: { kind: "card", cardId: options.snelleCardId },
    actingPlayerId: options.respondingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount,
    respondingToEffectId: state.effectStack[state.effectStack.length - 1]?.id,
    respondingToPendingEffect: state.effectStack[state.effectStack.length - 1]
  };

  const resolvedTarget = resolveTargetReference(state, card.target, options.invocation);
  const effectInvocation: CardInvocation = {
    ...options.invocation,
    targetRef: resolvedTarget ?? options.invocation.targetRef
  };

  const afterSnelle = runCardEffects(state, card.effects, effectInvocation, context);
  return resolveAllPending(afterSnelle);
}

/** Push an arbitrary PendingEffect to the effectStack (for game system use). */
export function pushPendingEffect(state: GameState, effect: PendingEffect): GameState {
  return { ...state, effectStack: [...state.effectStack, effect] };
}
