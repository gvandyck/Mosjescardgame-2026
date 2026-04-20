import type { GameState } from "../../types/game-state.js";
import type { CardId } from "../../types/card-id.js";
import { appendEvent } from "../../engine/append-event.js";
import { createRng } from "../../utils/rng.js";
import { getCard } from "../registry/card-registry.js";
import { resolvePrimitive } from "../../effects/registry.js";
import { checkTrait } from "../../effects/conditions/check-trait.js";
import { checkLevel } from "../../effects/conditions/check-level.js";
import { checkMP } from "../../effects/conditions/check-mp.js";
import { checkCardTypeInPlay } from "../../effects/conditions/check-card-type-in-play.js";
import { checkPlaceActive } from "../../effects/conditions/check-place-active.js";
import { checkSynergy } from "../../effects/conditions/check-synergy.js";
import type { RequirementDefinition } from "../schema/requirement-definition.js";
import type { EffectExpression } from "../schema/effect-expression.js";
import { resolveEffectExpression } from "./resolve-effect-expression.js";
import { resolveTargetReference } from "./resolve-target-reference.js";
import type { CardInvocation } from "./resolve-target-reference.js";
import type { EffectContext } from "../../effects/effect-context.js";

export type { CardInvocation };

// ─── Requirement validation ──────────────────────────────────────────────────

function validateRequirement(
  state: GameState,
  req: RequirementDefinition,
  invocation: CardInvocation
): boolean {
  const self = invocation.actingMosjeRef;
  switch (req.type) {
    case "trait":
      return checkTrait(state, {
        target: self,
        trait: req.params["trait"] as string,
        minStars: req.params["minStars"] as 1 | 2 | 3
      });
    case "level":
      return checkLevel(state, {
        target: self,
        minLevel: req.params["minLevel"] as 1 | 2 | 3
      });
    case "mp":
      return checkMP(state, {
        target: self,
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
      // Phase 4+ will inject a custom checker; for now treat as always met
      return true;
    default: {
      const _: never = req.type;
      return _;
    }
  }
}

// ─── Cost payment ─────────────────────────────────────────────────────────────

function canPayCost(
  state: GameState,
  invocation: CardInvocation,
  mpCost: number
): boolean {
  const player = state.players.find((p) => p.id === invocation.actingPlayerId);
  const mosje = player?.mosjes.find((m) => m.instanceId === invocation.actingMosjeRef.instanceId);
  if (mosje === undefined) return false;
  return mosje.mp >= mpCost;
}

function payCost(
  state: GameState,
  invocation: CardInvocation,
  cardId: CardId,
  mpCost: number,
  context: EffectContext
): GameState {
  // Pay MP cost marked as isCostPayment=true so Phase 2 skips reductions (U7)
  const loseMP = resolvePrimitive("loseMP");
  return loseMP(
    state,
    {
      target: invocation.actingMosjeRef,
      amount: mpCost,
      isCostPayment: true
    },
    { ...context, source: { kind: "cost", cardId } }
  );
}

// ─── Effect resolution ────────────────────────────────────────────────────────

function runEffects(
  state: GameState,
  effects: ReadonlyArray<EffectExpression>,
  invocation: CardInvocation,
  context: EffectContext
): GameState {
  let next = state;
  for (const expr of effects) {
    const resolved = resolveEffectExpression(expr, invocation);
    try {
      const primitive = resolvePrimitive(resolved.primitive);
      next = primitive(next, resolved.params, context);
    } catch (error) {
      next = appendEvent(next, {
        type: "warning",
        code: "effect_execution_failed",
        message: `Primitive ${resolved.primitive} threw: ${String(error)}`
      });
      // Stop this chain on error (matches chain semantics from Phase 2)
      break;
    }
  }
  return next;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function executeCard(
  state: GameState,
  cardId: CardId,
  invocation: CardInvocation
): GameState {
  // Step 1: Lookup
  const card = getCard(cardId);

  const context: EffectContext = {
    source: { kind: "card", cardId },
    actingPlayerId: invocation.actingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };

  // Step 2: Validate requirements
  const unmetRequirement = card.requirements.find(
    (req) => !validateRequirement(state, req, invocation)
  );
  if (unmetRequirement !== undefined) {
    return appendEvent(state, {
      type: "card_resolved",
      cardId,
      playerId: invocation.actingPlayerId,
      outcome: "rejected"
    });
  }

  // Step 3: Pay cost
  let afterCost = state;
  if (card.cost.type === "mp" && card.cost.mp !== undefined && card.cost.mp > 0) {
    if (!canPayCost(state, invocation, card.cost.mp)) {
      return appendEvent(state, {
        type: "card_resolved",
        cardId,
        playerId: invocation.actingPlayerId,
        outcome: "rejected"
      });
    }
    afterCost = payCost(state, invocation, cardId, card.cost.mp, context);
  }

  // Step 4: Resolve effects
  const resolvedTarget = resolveTargetReference(state, card.target, invocation);
  const effectInvocation: CardInvocation = {
    ...invocation,
    targetRef: resolvedTarget ?? invocation.targetRef
  };
  const afterEffects = runEffects(afterCost, card.effects, effectInvocation, context);

  // Step 5: Apply synergies
  let afterSynergies = afterEffects;

  if (card.synergies !== undefined) {
    for (const synergy of card.synergies) {
      const hasPartner = checkSynergy(afterSynergies, {
        mosje: invocation.actingMosjeRef,
        partnerCardId: synergy.partnerCardId
      });
      if (hasPartner) {
        afterSynergies = runEffects(afterSynergies, synergy.bonusEffects, effectInvocation, context);
      }
    }
  }

  if (card.petSynergies !== undefined) {
    for (const petSynergy of card.petSynergies) {
      const hasPet = state.players
        .find((p) => p.id === invocation.actingPlayerId)
        ?.piecieSlots.some(
          (slot) => slot.cardId === petSynergy.petCardId && slot.faceUp
        ) ?? false;
      if (hasPet) {
        afterSynergies = runEffects(afterSynergies, petSynergy.bonusEffects, effectInvocation, context);
      }
    }
  }

  // Step 6: Emit card_resolved event
  return appendEvent(afterSynergies, {
    type: "card_resolved",
    cardId,
    playerId: invocation.actingPlayerId,
    outcome: "success"
  });
}
