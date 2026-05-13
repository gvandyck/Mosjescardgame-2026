import { appendEvent } from "../../engine/append-event.js";
import { applyVictoryCheck } from "../../engine/apply-victory-check.js";
import { createRng } from "../../utils/rng.js";
import { getCard } from "../registry/card-registry.js";
import type { MosjeDefinition, MosjeAbility } from "../schema/mosje-definition.js";
import type { CardId } from "../../types/card-id.js";
import type { MosjeRef } from "../../types/events.js";
import type { GameState } from "../../types/game-state.js";
import type { EffectContext } from "../../effects/effect-context.js";
import type { CardInvocation } from "./resolve-target-reference.js";
import { runCardEffects } from "./run-card-effects.js";
import { checkSynergy } from "../../effects/conditions/check-synergy.js";

export interface AbilityInvocation {
  readonly actingPlayerId: string;
  readonly actingMosjeRef: MosjeRef;
  readonly targetRef?: MosjeRef;
  readonly playerChoices?: Readonly<Record<string, unknown>>;
  readonly levelOverride?: 1 | 2 | 3;
  readonly allowPassiveTrigger?: boolean;
}

export class NonMosjeCardError extends Error {
  constructor(cardId: CardId) {
    super(`Card is not a mosje: ${cardId}`);
    this.name = "NonMosjeCardError";
  }
}

function resolveMosje(state: GameState, ref: MosjeRef) {
  const playerIndex = state.players.findIndex((player) => player.id === ref.playerId);
  if (playerIndex < 0) return undefined;
  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((mosje) => mosje.instanceId === ref.instanceId);
  if (mosjeIndex < 0) return undefined;
  return { playerIndex, mosjeIndex, player, mosje: player.mosjes[mosjeIndex] };
}

function resolveAbility(
  definition: MosjeDefinition,
  level: 1 | 2 | 3
): { ability: MosjeAbility; abilityId: string } {
  if (level >= 3 && definition.levelAbilities?.[3] !== undefined) {
    return { ability: definition.levelAbilities[3], abilityId: `${definition.id}:level3` };
  }
  if (level >= 2 && definition.levelAbilities?.[2] !== undefined) {
    return { ability: definition.levelAbilities[2], abilityId: `${definition.id}:level2` };
  }
  return { ability: definition.baseAbility, abilityId: `${definition.id}:base` };
}

function withMosjeFlag(state: GameState, ref: MosjeRef, key: string, value: unknown): GameState {
  const resolved = resolveMosje(state, ref);
  if (resolved === undefined) return state;

  const updatedMosjes = resolved.player.mosjes.map((mosje, index) => {
    if (index !== resolved.mosjeIndex) return mosje;
    return {
      ...mosje,
      flags: {
        ...mosje.flags,
        [key]: value
      }
    };
  });

  const updatedPlayers = state.players.map((player, index) => {
    if (index !== resolved.playerIndex) return player;
    return { ...player, mosjes: updatedMosjes };
  });

  return { ...state, players: updatedPlayers };
}

function consumeDoubleActivationBuff(state: GameState, ref: MosjeRef): { state: GameState; consumed: boolean } {
  const resolved = resolveMosje(state, ref);
  if (resolved === undefined) return { state, consumed: false };

  const doubleBuff = resolved.mosje.flags["buff:double_activate_this_turn"] as
    | { readonly data?: { readonly usesRemaining?: number }; readonly expiryTurn?: number }
    | undefined;

  if (doubleBuff === undefined || Number(doubleBuff.data?.usesRemaining ?? 0) <= 0) {
    return { state, consumed: false };
  }

  const newUsesRemaining = Number(doubleBuff.data?.usesRemaining) - 1;
  const updatedMosjes = resolved.player.mosjes.map((mosje, index) => {
    if (index !== resolved.mosjeIndex) return mosje;

    const nextFlags = { ...mosje.flags };
    if (newUsesRemaining <= 0) {
      delete nextFlags["buff:double_activate_this_turn"];
    } else {
      nextFlags["buff:double_activate_this_turn"] = {
        data: { ...(doubleBuff.data as Record<string, unknown>), usesRemaining: newUsesRemaining },
        expiryTurn: doubleBuff.expiryTurn
      };
    }

    return { ...mosje, flags: nextFlags };
  });

  const updatedPlayers = state.players.map((player, index) => {
    if (index !== resolved.playerIndex) return player;
    return { ...player, mosjes: updatedMosjes };
  });

  return { state: { ...state, players: updatedPlayers }, consumed: true };
}

function runAbilityBonuses(
  state: GameState,
  definition: MosjeDefinition,
  abilityInvocation: AbilityInvocation,
  invocation: CardInvocation,
  context: EffectContext
): GameState {
  let next = state;
  const chamberActive = next.gameFlags?.["synergy_chamber_active"] === true;
  for (const synergy of definition.synergies ?? []) {
    const active =
      chamberActive ||
      checkSynergy(next, {
        mosje: abilityInvocation.actingMosjeRef,
        partnerCardId: synergy.partnerCardId
      });
    if (!active) continue;
    next = runCardEffects(next, synergy.bonusEffects, invocation, context);
  }

  const refreshedSelf = resolveMosje(next, abilityInvocation.actingMosjeRef);
  const selfFlags = refreshedSelf?.mosje.flags ?? {};
  for (const petSynergy of definition.petSynergies ?? []) {
    const isPetActive = selfFlags[`buff:pet_active:${petSynergy.petCardId}`] !== undefined;
    if (!isPetActive) continue;
    next = runCardEffects(next, petSynergy.bonusEffects, invocation, context);
  }

  return next;
}

function payAbilityCost(
  state: GameState,
  ability: MosjeAbility,
  invocation: AbilityInvocation,
  context: EffectContext
): GameState | undefined {
  if (ability.cost === undefined || ability.cost.type === "free") return state;

  if (ability.cost.type === "mp") {
    const resolved = resolveMosje(state, invocation.actingMosjeRef);
    if (resolved === undefined) return undefined;

    const chamberReduction = state.gameFlags?.["synergy_chamber_active"] === true ? 5 : 0;
    const rawCost = ability.cost.mp ?? 0;
    const mpCost = Math.max(0, rawCost - chamberReduction);

    if (resolved.mosje.mp < mpCost) return undefined;

    return runCardEffects(
      state,
      [{ primitive: "loseMP", params: { target: invocation.actingMosjeRef, amount: mpCost, isCostPayment: true } }],
      {
        actingPlayerId: invocation.actingPlayerId,
        actingMosjeRef: invocation.actingMosjeRef,
        targetRef: invocation.targetRef,
        playerChoices: invocation.playerChoices
      },
      { ...context, source: { kind: "cost", cardId: context.source.cardId, playerId: invocation.actingPlayerId } }
    );
  }

  if (ability.cost.type === "discard") {
    const discardCount = ability.cost.discardCount ?? 0;
    if (discardCount <= 0) return state;

    const chosen = invocation.playerChoices?.discardCardId;
    if (typeof chosen !== "string") return undefined;

    return runCardEffects(
      state,
      [
        {
          primitive: "discardCards",
          params: {
            playerId: invocation.actingPlayerId,
            count: discardCount,
            mode: "choose",
            chosenCardIds: [chosen]
          }
        }
      ],
      {
        actingPlayerId: invocation.actingPlayerId,
        actingMosjeRef: invocation.actingMosjeRef,
        targetRef: invocation.targetRef,
        playerChoices: invocation.playerChoices
      },
      context
    );
  }

  return state;
}

function executeMosjeAbilityInternal(
  state: GameState,
  mosjeCardId: CardId,
  abilityInvocation: AbilityInvocation,
  allowPassiveTrigger: boolean
): GameState {
  const card = getCard(mosjeCardId);
  if (card.category !== "mosje") throw new NonMosjeCardError(mosjeCardId);
  const definition = card as MosjeDefinition;

  const resolvedSelf = resolveMosje(state, abilityInvocation.actingMosjeRef);
  if (resolvedSelf === undefined) return state;

  const level = abilityInvocation.levelOverride ?? resolvedSelf.mosje.level;
  const { ability, abilityId } = resolveAbility(definition, level);

  if (ability.usageLimit === "passive" && !allowPassiveTrigger) {
    return appendEvent(state, {
      type: "warning",
      code: "mosje_ability_passive",
      message: `Passive mosje ability cannot be manually activated: ${mosjeCardId}`
    });
  }

  const usedThisTurn = resolvedSelf.mosje.flags["ability_used_this_turn"] === true;
  const usedThisGame = resolvedSelf.mosje.flags["ability_used_this_game"] === true;
  if (ability.usageLimit === "once_per_turn" && usedThisTurn) return state;
  if (ability.usageLimit === "once_per_game" && usedThisGame) return state;

  const context: EffectContext = {
    source: { kind: "ability", cardId: mosjeCardId, playerId: abilityInvocation.actingPlayerId },
    actingPlayerId: abilityInvocation.actingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };

  const invocation: CardInvocation = {
    actingPlayerId: abilityInvocation.actingPlayerId,
    actingMosjeRef: abilityInvocation.actingMosjeRef,
    targetRef: abilityInvocation.targetRef,
    playerChoices: abilityInvocation.playerChoices
  };

  const paid = payAbilityCost(state, ability, abilityInvocation, context);
  if (paid === undefined) return state;

  let next = runCardEffects(paid, ability.effects, invocation, context);

  next = runAbilityBonuses(next, definition, abilityInvocation, invocation, context);

  const doubleActivation = consumeDoubleActivationBuff(next, abilityInvocation.actingMosjeRef);
  if (doubleActivation.consumed) {
    next = appendEvent(doubleActivation.state, {
      type: "double_activation_triggered",
      cardId: mosjeCardId,
      source: context.source
    });
    next = runCardEffects(next, ability.effects, invocation, context);
    next = runAbilityBonuses(next, definition, abilityInvocation, invocation, context);
  }

  if (ability.usageLimit === "once_per_turn") {
    next = withMosjeFlag(next, abilityInvocation.actingMosjeRef, "ability_used_this_turn", true);
  }
  if (ability.usageLimit === "once_per_game") {
    next = withMosjeFlag(next, abilityInvocation.actingMosjeRef, "ability_used_this_game", true);
  }

  const withEvent = appendEvent(next, {
    type: "mosje_ability_used",
    mosjeRef: abilityInvocation.actingMosjeRef,
    abilityId
  });

  return applyVictoryCheck(withEvent);
}

export function executeMosjeAbility(
  state: GameState,
  mosjeCardId: CardId,
  abilityInvocation: AbilityInvocation
): GameState {
  return executeMosjeAbilityInternal(state, mosjeCardId, abilityInvocation, abilityInvocation.allowPassiveTrigger === true);
}

export function executeTriggeredMosjeAbility(
  state: GameState,
  mosjeCardId: CardId,
  abilityInvocation: AbilityInvocation
): GameState {
  return executeMosjeAbilityInternal(state, mosjeCardId, abilityInvocation, true);
}
