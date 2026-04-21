import type { GameState } from "../../types/game-state.js";
import type { CardId } from "../../types/card-id.js";
import { appendEvent } from "../../engine/append-event.js";
import { createRng } from "../../utils/rng.js";
import { getCard } from "../registry/card-registry.js";
import { resolvePrimitive } from "../../effects/registry.js"; // still needed for cost payment
import { checkTrait } from "../../effects/conditions/check-trait.js";
import { checkLevel } from "../../effects/conditions/check-level.js";
import { checkMP } from "../../effects/conditions/check-mp.js";
import { checkCardTypeInPlay } from "../../effects/conditions/check-card-type-in-play.js";
import { checkPlaceActive } from "../../effects/conditions/check-place-active.js";
import { checkSynergy } from "../../effects/conditions/check-synergy.js";
import { checkTrait as checkTraitCondition } from "../../effects/conditions/check-trait.js";
import { discardCards } from "../../effects/cards/discard-cards.js";
import type { RequirementDefinition } from "../schema/requirement-definition.js";
import type { CardDefinition } from "../schema/card-definition.js";
import type { CostDefinition } from "../schema/cost-definition.js";
import { resolveTargetReference, UntargetableError } from "./resolve-target-reference.js";
import type { CardInvocation } from "./resolve-target-reference.js";
import type { EffectContext } from "../../effects/effect-context.js";
import { runCardEffects } from "./run-card-effects.js";
import { variableCostResolvers } from "../variable-cost-resolvers.js";

export type { CardInvocation };

export class MissingChoiceError extends Error {
  constructor(choiceKey: string) {
    super(`Missing required player choice: ${choiceKey}`);
    this.name = "MissingChoiceError";
  }
}

export class InvalidChoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidChoiceError";
  }
}

function findActingMosje(state: GameState, invocation: CardInvocation) {
  const player = state.players.find((candidate) => candidate.id === invocation.actingPlayerId);
  if (player === undefined) return undefined;
  return player.mosjes.find((candidate) => candidate.instanceId === invocation.actingMosjeRef.instanceId);
}

function effectContainsPrimitive(value: unknown, primitiveName: string): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => effectContainsPrimitive(entry, primitiveName));
  }
  if (value === null || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;
  if (obj["primitive"] === primitiveName) return true;
  return Object.values(obj).some((nested) => effectContainsPrimitive(nested, primitiveName));
}

function isRestoreLocked(state: GameState, invocation: CardInvocation, card: CardDefinition): boolean {
  const actingMosje = findActingMosje(state, invocation);
  if (actingMosje === undefined) return false;
  if (actingMosje.flags["buff:piecie_mp_restore_locked"] === undefined) return false;
  return effectContainsPrimitive(card.effects, "gainMP");
}

function getNextPiecieFreeBuff(state: GameState, invocation: CardInvocation) {
  const actingMosje = findActingMosje(state, invocation);
  return actingMosje?.flags["buff:next_piecie_free"] as
    | { readonly data?: { readonly usesRemaining?: number }; readonly expiryTurn?: number }
    | undefined;
}

function consumeNextPiecieFree(state: GameState, invocation: CardInvocation): GameState {
  const playerIndex = state.players.findIndex((candidate) => candidate.id === invocation.actingPlayerId);
  if (playerIndex < 0) return state;

  const mosjeIndex = state.players[playerIndex].mosjes.findIndex(
    (candidate) => candidate.instanceId === invocation.actingMosjeRef.instanceId
  );
  if (mosjeIndex < 0) return state;

  const mosje = state.players[playerIndex].mosjes[mosjeIndex];
  const buff = mosje.flags["buff:next_piecie_free"] as
    | { readonly data?: { readonly usesRemaining?: number }; readonly expiryTurn?: number }
    | undefined;
  if (buff === undefined) return state;

  const usesRemaining = Number(buff.data?.usesRemaining ?? 1) - 1;
  const nextFlags = { ...mosje.flags };
  if (usesRemaining <= 0) {
    delete nextFlags["buff:next_piecie_free"];
  } else {
    nextFlags["buff:next_piecie_free"] = {
      data: { ...((buff.data as Record<string, unknown>) ?? {}), usesRemaining },
      expiryTurn: buff.expiryTurn
    };
  }

  const updatedMosjes = state.players[playerIndex].mosjes.map((candidate, index) =>
    index === mosjeIndex ? { ...candidate, flags: nextFlags } : candidate
  );
  const updatedPlayers = state.players.map((player, index) =>
    index === playerIndex ? { ...player, mosjes: updatedMosjes } : player
  );

  return { ...state, players: updatedPlayers };
}

// ─── Requirement validation ─────────────────────────────────────────────────

function validateRequirement(
  state: GameState,
  req: RequirementDefinition,
  invocation: CardInvocation
): boolean {
  const requirementTarget =
    req.params["applyTo"] === "target" && invocation.targetRef !== undefined
      ? invocation.targetRef
      : invocation.actingMosjeRef;
  const self = invocation.actingMosjeRef;
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
      const traitOk = checkTraitCondition(state, {
        target: invocation.actingMosjeRef,
        trait: req.trait,
        minStars: req.minStars
      });
      if (!traitOk) return false;
    }
  }

  return true;
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
    { ...context, source: { kind: "cost", cardId, playerId: invocation.actingPlayerId } }
  );
}

function resolveEffectiveCost(
  state: GameState,
  card: CardDefinition,
  context: EffectContext
): CostDefinition {
  if (card.cost.type !== "variable") return card.cost;
  const resolver = variableCostResolvers[(card.cost as { resolver?: string }).resolver ?? ""];
  if (resolver === undefined) return { type: "free" };
  return resolver(state, context);
}

function payDiscardCost(
  state: GameState,
  invocation: CardInvocation,
  discardCount: number,
  context: EffectContext
): GameState {
  const chosen = invocation.playerChoices?.discardCardId;
  if (typeof chosen !== "string") {
    throw new MissingChoiceError("discardCardId");
  }

  const player = state.players.find((p) => p.id === invocation.actingPlayerId);
  if (player === undefined || !player.hand.includes(chosen as CardId)) {
    throw new InvalidChoiceError(`Chosen discard card is not in hand: ${String(chosen)}`);
  }

  return discardCards(
    state,
    {
      playerId: invocation.actingPlayerId,
      count: discardCount,
      mode: "choose",
      chosenCardIds: [chosen]
    },
    context
  );
}

// ─── Effect resolution ────────────────────────────────────────────────────────

// ─── Main entry point ─────────────────────────────────────────────────────────

export function executeCard(
  state: GameState,
  cardId: CardId,
  invocation: CardInvocation
): GameState {
  // Step 1: Lookup
  const card = getCard(cardId);

  const context: EffectContext = {
    source: { kind: "card", cardId, playerId: invocation.actingPlayerId },
    actingPlayerId: invocation.actingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };

  if (card.id === ("perfect-setup" as CardId)) {
    const chosen = invocation.playerChoices?.targetMP;
    const chosenNumber = Number(chosen);
    if (!Number.isInteger(chosenNumber) || chosenNumber < 60 || chosenNumber > 90) {
      return appendEvent(state, {
        type: "card_resolved",
        cardId,
        playerId: invocation.actingPlayerId,
        outcome: "rejected"
      });
    }
  }

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

  if (!meetsCostGates(state, invocation, card)) {
    return appendEvent(state, {
      type: "card_resolved",
      cardId,
      playerId: invocation.actingPlayerId,
      outcome: "rejected"
    });
  }

  if (isRestoreLocked(state, invocation, card)) {
    return appendEvent(state, {
      type: "card_resolved",
      cardId,
      playerId: invocation.actingPlayerId,
      outcome: "rejected"
    });
  }

  // Step 2b: Check targetability before paying cost (throws UntargetableError when blocked)
  try {
    resolveTargetReference(state, card.target, invocation);
  } catch (e) {
    if (e instanceof UntargetableError) {
      return appendEvent(state, {
        type: "card_resolved",
        cardId,
        playerId: invocation.actingPlayerId,
        outcome: "rejected"
      });
    }
    throw e;
  }

  // Step 3: Pay cost
  const effectiveCost = resolveEffectiveCost(state, card, context);
  let afterCost = state;
  if (effectiveCost.type === "mp" && effectiveCost.mp !== undefined && effectiveCost.mp > 0) {
    const freeBuff = getNextPiecieFreeBuff(state, invocation);
    const hasFreeActivation = Number(freeBuff?.data?.usesRemaining ?? 0) > 0;

    if (!hasFreeActivation && !canPayCost(state, invocation, effectiveCost.mp)) {
      return appendEvent(state, {
        type: "card_resolved",
        cardId,
        playerId: invocation.actingPlayerId,
        outcome: "rejected"
      });
    }

    afterCost = hasFreeActivation
      ? consumeNextPiecieFree(state, invocation)
      : payCost(state, invocation, cardId, effectiveCost.mp, context);
  }

  if (effectiveCost.type === "discard" && (effectiveCost.discardCount ?? 0) > 0) {
    try {
      afterCost = payDiscardCost(afterCost, invocation, effectiveCost.discardCount ?? 1, context);
    } catch (error) {
      if (error instanceof MissingChoiceError || error instanceof InvalidChoiceError) {
        return appendEvent(state, {
          type: "card_resolved",
          cardId,
          playerId: invocation.actingPlayerId,
          outcome: "rejected"
        });
      }
      throw error;
    }
  }

  // Step 4: Resolve effects
  const resolvedTarget = resolveTargetReference(state, card.target, invocation);
  const effectInvocation: CardInvocation = {
    ...invocation,
    targetRef: resolvedTarget ?? invocation.targetRef
  };
  const afterEffects = runCardEffects(afterCost, card.effects, effectInvocation, context);

  // Step 5: Apply synergies
  let afterSynergies = afterEffects;

  if (card.synergies !== undefined) {
    const actingPlayer = afterSynergies.players.find((p) => p.id === invocation.actingPlayerId);
    const actingMosje = actingPlayer?.mosjes.find(
      (m) => m.instanceId === invocation.actingMosjeRef.instanceId
    );
    const synergyChamberActive = afterSynergies.gameFlags?.["synergy_chamber_active"] === true;
    const forcedSynergyBuff = actingMosje?.flags["buff:synergy_active_forced"] as
      | { readonly expiryTurn?: number }
      | undefined;
    const forceSynergyActive =
      synergyChamberActive ||
      forcedSynergyBuff !== undefined &&
      (forcedSynergyBuff.expiryTurn === undefined || context.turnCount <= forcedSynergyBuff.expiryTurn);

    for (const synergy of card.synergies) {
      const hasPartner =
        forceSynergyActive ||
        checkSynergy(afterSynergies, {
          mosje: invocation.actingMosjeRef,
          partnerCardId: synergy.partnerCardId
        });
      if (hasPartner) {
        afterSynergies = runCardEffects(afterSynergies, synergy.bonusEffects, effectInvocation, context);
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
        afterSynergies = runCardEffects(afterSynergies, petSynergy.bonusEffects, effectInvocation, context);
      }
    }
  }

  // Step 6: Double-activation check
  let afterDouble = afterSynergies;
  const actingPlayerForDouble = afterDouble.players.find((p) => p.id === invocation.actingPlayerId);
  const actingMosjeForDouble = actingPlayerForDouble?.mosjes.find(
    (m) => m.instanceId === invocation.actingMosjeRef.instanceId
  );
  const doubleBuff = actingMosjeForDouble?.flags["buff:double_activate_this_turn"] as
    | { readonly data?: { readonly usesRemaining?: number }; readonly expiryTurn?: number }
    | undefined;

  if (doubleBuff !== undefined && Number(doubleBuff.data?.usesRemaining ?? 0) > 0) {
    // Decrement usesRemaining; clear buff if it reaches 0
    const newUsesRemaining = Number(doubleBuff.data?.usesRemaining ?? 1) - 1;
    const actingPlayerIdx = afterDouble.players.findIndex((p) => p.id === invocation.actingPlayerId);
    const actingMosjeIdx = afterDouble.players[actingPlayerIdx]?.mosjes.findIndex(
      (m) => m.instanceId === invocation.actingMosjeRef.instanceId
    ) ?? -1;

    if (actingPlayerIdx >= 0 && actingMosjeIdx >= 0) {
      const updatedMosjes = afterDouble.players[actingPlayerIdx].mosjes.map((mosje, index) => {
        if (index !== actingMosjeIdx) return mosje;
        const nextFlags = { ...mosje.flags };
        if (newUsesRemaining <= 0) {
          delete nextFlags["buff:double_activate_this_turn"];
        } else {
          nextFlags["buff:double_activate_this_turn"] = {
            data: { ...((doubleBuff.data as Record<string, unknown>) ?? {}), usesRemaining: newUsesRemaining },
            expiryTurn: doubleBuff.expiryTurn
          };
        }
        return { ...mosje, flags: nextFlags };
      });
      const updatedPlayers = afterDouble.players.map((player, index) => {
        if (index !== actingPlayerIdx) return player;
        return { ...player, mosjes: updatedMosjes };
      });
      afterDouble = { ...afterDouble, players: updatedPlayers };
    }

    // Emit double_activation_triggered event
    afterDouble = appendEvent(afterDouble, {
      type: "double_activation_triggered",
      cardId,
      source: context.source
    });

    // Re-run steps 4 and 5 with updated state
    const freshContext: EffectContext = {
      ...context,
      rng: createRng(afterDouble.rngSeed)
    };
    const resolvedTargetDouble = resolveTargetReference(afterDouble, card.target, invocation);
    const effectInvocationDouble: CardInvocation = {
      ...invocation,
      targetRef: resolvedTargetDouble ?? invocation.targetRef
    };
    afterDouble = runCardEffects(afterDouble, card.effects, effectInvocationDouble, freshContext);
    if (card.synergies !== undefined) {
      for (const synergy of card.synergies) {
        const hasPartner = checkSynergy(afterDouble, {
          mosje: invocation.actingMosjeRef,
          partnerCardId: synergy.partnerCardId
        });
        if (hasPartner) {
          afterDouble = runCardEffects(afterDouble, synergy.bonusEffects, effectInvocationDouble, freshContext);
        }
      }
    }
  }

  // Step 7: Emit card_resolved event
  return appendEvent(afterDouble, {
    type: "card_resolved",
    cardId,
    playerId: invocation.actingPlayerId,
    outcome: "success"
  });
}
