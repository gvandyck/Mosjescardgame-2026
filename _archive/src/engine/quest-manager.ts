import { appendEvent } from "./append-event.js";
import { applyVictoryCheck } from "./apply-victory-check.js";
import { eventsSince } from "./events-since.js";
import { getCard } from "../cards/registry/card-registry.js";
import { runCardEffects } from "../cards/executor/run-card-effects.js";
import { createRng } from "../utils/rng.js";
import { checkTrait } from "../effects/conditions/check-trait.js";
import { checkLevel } from "../effects/conditions/check-level.js";
import { checkMP } from "../effects/conditions/check-mp.js";
import { checkCardTypeInPlay } from "../effects/conditions/check-card-type-in-play.js";
import { checkPlaceActive } from "../effects/conditions/check-place-active.js";
import { resolvePrimitive } from "../effects/registry.js";
import { levelUpMosje } from "./reducers/player/level-up-mosje.js";
import { resolveQuestThreshold } from "./resolve-quest-threshold.js";
import type { CardId } from "../types/card-id.js";
import type { GameState } from "../types/game-state.js";
import type { MosjeRef } from "../types/events.js";
import type { RequirementDefinition } from "../cards/schema/requirement-definition.js";
import type { QuestDefinition } from "../cards/schema/quest-definition.js";
import type { EffectContext } from "../effects/effect-context.js";
import type { EffectExpression } from "../cards/schema/effect-expression.js";

export interface QuestInvocation {
  readonly actingPlayerId: string;
  readonly actingMosjeRef: MosjeRef;
  readonly playerChoices?: Readonly<Record<string, unknown>>;
  readonly diceRollOverride?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly targetRef?: MosjeRef;
}

export class NonQuestCardError extends Error {
  constructor(cardId: CardId) {
    super(`Card is not a quest: ${cardId}`);
    this.name = "NonQuestCardError";
  }
}

function findActingMosje(state: GameState, actingRef: MosjeRef) {
  const player = state.players.find((p) => p.id === actingRef.playerId);
  const mosje = player?.mosjes.find((m) => m.instanceId === actingRef.instanceId);
  return { player, mosje };
}

function evaluateRequirement(
  state: GameState,
  req: RequirementDefinition,
  selfRef: MosjeRef,
  playerId: string
): boolean {
  switch (req.type) {
    case "trait":
      return checkTrait(state, {
        target: selfRef,
        trait: req.params["trait"] as string,
        minStars: req.params["minStars"] as 1 | 2 | 3
      });
    case "level":
      return checkLevel(state, {
        target: selfRef,
        minLevel: req.params["minLevel"] as 1 | 2 | 3
      });
    case "mp":
      return checkMP(state, {
        target: selfRef,
        operator: req.params["operator"] as ">=" | "<=" | "==" | "between",
        value: req.params["value"] as number,
        rangeEnd: req.params["rangeEnd"] as number | undefined
      });
    case "card_in_play":
      return checkCardTypeInPlay(state, {
        playerId,
        cardType: req.params["cardType"] as string
      });
    case "place_active":
      return checkPlaceActive(state, { placeCardId: req.params["placeCardId"] as string });
    case "custom": {
      const description = String(req.params["description"] ?? "");
      const player = state.players.find((candidate) => candidate.id === playerId);
      const mosje = player?.mosjes[player.activeMosjeIndex];

      switch (description) {
        case "40_or_more_total_mp_damage_taken_this_game":
          return (player?.totalDamageTaken ?? 0) >= 40;

        case "Dealt 30+ MP damage this turn": {
          const recentEvents = eventsSince(state, state.currentTurnStartCount ?? 0);
          const damageDealt = recentEvents
            .filter(e => e.type === "mp_lost" && (e as any).target.playerId !== playerId)
            .reduce((sum, e) => sum + ((e as any).amount ?? 0), 0);
          return damageDealt >= 30;
        }

        case "Used Mosje ability AND completed 1 Quest this turn": {
          const recentEvents = eventsSince(state, state.currentTurnStartCount ?? 0);
          const usedAbility = recentEvents.some(e =>
            e.type === "mosje_ability_used" && (e as any).mosjeRef.playerId === playerId
          );
          const completedQuest = recentEvents.some(e =>
            e.type === "quest_completed" && (e as any).playerId === playerId
          );
          return usedAbility && completedQuest;
        }

        case "Mosje must be exactly Level 1":
          return mosje?.level === 1;

        case "Any trait at ★★★": {
          if (mosje === undefined) return false;
          const traits = (mosje.flags.traits as Readonly<Record<string, number>> | undefined) ?? {};
          return Object.values(traits).some(stars => stars >= 3);
        }

        case "Activated keyboard/mouse/controller this game": {
          const allEvents = state.eventLog;
          const targetCardIds = ["keyboard", "mouse", "controller"] as CardId[];
          return allEvents.some(e =>
            e.type === "card_resolved" && targetCardIds.includes((e as any).cardId)
          );
        }

        case "Activated 2+ Piecies this turn": {
          const recentEvents = eventsSince(state, state.currentTurnStartCount ?? 0);
          const piecieCount = recentEvents.filter(e => {
            if (e.type !== "card_resolved") return false;
            const cardId = (e as any).cardId as CardId;
            const card = getCard(cardId);
            return card.category === "piecie" || card.category === "snelle-piecie";
          }).length;
          return piecieCount >= 2;
        }

        case "Activated 3+ Piecies this turn": {
          const recentEvents = eventsSince(state, state.currentTurnStartCount ?? 0);
          const piecieCount = recentEvents.filter(e => {
            if (e.type !== "card_resolved") return false;
            const cardId = (e as any).cardId as CardId;
            const card = getCard(cardId);
            return card.category === "piecie" || card.category === "snelle-piecie";
          }).length;
          return piecieCount >= 3;
        }

        case "piecie_larry_zegeltje on field or in hand": {
          if (player === undefined) return false;
          const targetCardId = "larry-zegeltje" as CardId;

          // Check hand
          if (player.hand.includes(targetCardId)) return true;

          // Check piecie field
          return player.piecieSlots.some(slot => slot.cardId === targetCardId);
        }

        default:
          return false;
      }
    }
    default: {
      const _: never = req.type;
      return _;
    }
  }
}

function readQuestRollBonus(mosjeFlags: Readonly<Record<string, unknown>>): number {
  const raw = mosjeFlags["quest_roll_bonus"];
  if (typeof raw === "number") return raw;
  if (raw !== null && typeof raw === "object") {
    return Number((raw as Record<string, unknown>)["amount"] ?? 0);
  }
  return 0;
}

function withQuestMpOverride(state: GameState, actingRef: MosjeRef): GameState {
  const playerIndex = state.players.findIndex((p) => p.id === actingRef.playerId);
  if (playerIndex < 0) return state;
  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((m) => m.instanceId === actingRef.instanceId);
  if (mosjeIndex < 0) return state;
  const mosje = player.mosjes[mosjeIndex];
  const overrideFlag = mosje.flags["quest_mp_override"] as
    | { readonly data?: { readonly mp?: number } }
    | undefined;
  const overrideMp = overrideFlag?.data?.mp;
  if (typeof overrideMp !== "number") return state;

  const updatedMosjes = player.mosjes.map((m, index) =>
    index !== mosjeIndex ? m : { ...m, mp: overrideMp }
  );
  const updatedPlayers = state.players.map((p, index) =>
    index !== playerIndex ? p : { ...p, mosjes: updatedMosjes }
  );
  return { ...state, players: updatedPlayers };
}

function incrementQuestsCompleted(state: GameState, playerId: string): GameState {
  const updatedPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;
    const current = Number(player.flags.quests_completed_total ?? 0);
    return {
      ...player,
      flags: {
        ...player.flags,
        quests_completed_total: current + 1
      }
    };
  });
  return { ...state, players: updatedPlayers };
}

function applyPostQuestDrainIfPresent(state: GameState, actingRef: MosjeRef, context: EffectContext): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === actingRef.playerId);
  if (playerIndex < 0) return state;
  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((mosje) => mosje.instanceId === actingRef.instanceId);
  if (mosjeIndex < 0) return state;
  const mosje = player.mosjes[mosjeIndex];
  const buff = mosje.flags["next_quest_drain_target"] as
    | { readonly data?: { readonly targetRef?: MosjeRef; readonly drainAmount?: number } }
    | undefined;

  const targetRef = buff?.data?.targetRef;
  const drainAmount = Number(buff?.data?.drainAmount ?? 25);
  if (targetRef === undefined) return state;

  const drainMP = resolvePrimitive("drainMP");
  const drained = drainMP(
    state,
    {
      from: targetRef,
      to: actingRef,
      amount: drainAmount,
      isCostPayment: false
    },
    context
  );

  const refreshedPlayer = drained.players[playerIndex];
  const refreshedMosje = refreshedPlayer.mosjes[mosjeIndex];
  const nextFlags = { ...refreshedMosje.flags };
  delete nextFlags["next_quest_drain_target"];
  const updatedMosjes = refreshedPlayer.mosjes.map((m, index) =>
    index !== mosjeIndex ? m : { ...m, flags: nextFlags }
  );
  const updatedPlayers = drained.players.map((p, index) =>
    index !== playerIndex ? p : { ...p, mosjes: updatedMosjes }
  );

  return { ...drained, players: updatedPlayers };
}

function runQuestEffects(
  state: GameState,
  effects: ReadonlyArray<EffectExpression>,
  invocation: QuestInvocation,
  context: EffectContext
): GameState {
  return runCardEffects(
    state,
    effects,
    {
      actingPlayerId: invocation.actingPlayerId,
      actingMosjeRef: invocation.actingMosjeRef,
      playerChoices: invocation.playerChoices,
      targetRef: invocation.targetRef
    },
    context
  );
}

export function attemptQuest(
  state: GameState,
  questId: CardId,
  invocation: QuestInvocation
): GameState {
  const card = getCard(questId);
  if (card.category !== "quest") throw new NonQuestCardError(questId);
  const quest = card as QuestDefinition;

  const { mosje } = findActingMosje(state, invocation.actingMosjeRef);
  if (mosje === undefined) return state;

  if (quest.scope === "personal" && quest.requiredMosjeCardId !== undefined) {
    if (mosje.cardId !== quest.requiredMosjeCardId) {
      return appendEvent(state, {
        type: "quest_rejected",
        playerId: invocation.actingPlayerId,
        questId
      });
    }
  }

  const stateWithMpOverride = withQuestMpOverride(state, invocation.actingMosjeRef);

  const unmet = quest.requirements.find(
    (req) => !evaluateRequirement(stateWithMpOverride, req, invocation.actingMosjeRef, invocation.actingPlayerId)
  );
  if (unmet !== undefined) {
    return appendEvent(state, {
      type: "quest_rejected",
      playerId: invocation.actingPlayerId,
      questId
    });
  }

  const refreshed = findActingMosje(stateWithMpOverride, invocation.actingMosjeRef).mosje;
  const questLocked = refreshed?.flags["quest_locked"];
  if (questLocked !== undefined) {
    return appendEvent(stateWithMpOverride, {
      type: "quest_skipped",
      playerId: invocation.actingPlayerId,
      questId
    });
  }

  const rollBonus = readQuestRollBonus(refreshed?.flags ?? {});

  const context: EffectContext = {
    source: { kind: "quest", cardId: questId, playerId: invocation.actingPlayerId },
    actingPlayerId: invocation.actingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };

  const autoSucceed =
    quest.autoSucceedCondition !== undefined &&
    evaluateRequirement(
      stateWithMpOverride,
      quest.autoSucceedCondition,
      invocation.actingMosjeRef,
      invocation.actingPlayerId
    );

  let rollResult = 0;
  let working = appendEvent(stateWithMpOverride, {
    type: "quest_attempted",
    playerId: invocation.actingPlayerId,
    questId
  });

  if (!autoSucceed && quest.roll !== undefined) {
    const raw = invocation.diceRollOverride ?? context.rng.rollD6();
    rollResult = raw + rollBonus;
    working = {
      ...working,
      lastRoll: {
        raw,
        modifier: rollBonus,
        final: rollResult,
        rollerId: invocation.actingPlayerId
      }
    };
  }

  const outcome = autoSucceed
    ? "success"
    : resolveQuestThreshold(quest, refreshed ?? mosje, rollResult);

  if (outcome === "success") {
    working = runQuestEffects(working, quest.onSuccess, invocation, context);
    working = incrementQuestsCompleted(working, invocation.actingPlayerId);
    working = levelUpMosje(working, { target: invocation.actingMosjeRef });
    working = applyPostQuestDrainIfPresent(working, invocation.actingMosjeRef, context);
    working = appendEvent(working, {
      type: "quest_completed",
      playerId: invocation.actingPlayerId,
      questId,
      reward: 0,
      rollResult
    });
  } else {
    if (quest.onFailure !== undefined && quest.onFailure.length > 0) {
      working = runQuestEffects(working, quest.onFailure, invocation, context);
    }
    working = applyPostQuestDrainIfPresent(working, invocation.actingMosjeRef, context);
    working = appendEvent(working, {
      type: "quest_failed",
      playerId: invocation.actingPlayerId,
      questId,
      penalty: 0,
      rollResult
    });
  }

  return applyVictoryCheck(working);
}
