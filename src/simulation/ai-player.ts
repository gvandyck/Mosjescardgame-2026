/**
 * Phase 9 — AI Player (Simple Decision Engine)
 *
 * Deterministic AI that takes a complete game turn.
 * Not smart — just non-crashing and seeded.
 */
import { createRng } from "../utils/rng.js";
import { drawCard } from "../engine/reducers/player/draw-card.js";
import { switchActiveMosje } from "../engine/reducers/player/switch-active-mosje.js";
import { advancePhase } from "../engine/advance-phase.js";
import { startTurn } from "../engine/start-turn.js";
import { executeCard } from "../cards/executor/execute-card.js";
import { getAllCards, getCard, hasCard } from "../cards/registry/card-registry.js";
import { attemptQuest } from "../engine/quest-manager.js";
import { resolveActivePlaceTriggers } from "../engine/place-manager.js";
import type { GameState } from "../types/game-state.js";
import type { CardId } from "../types/card-id.js";
import type { MosjeRef } from "../types/events.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isGameOver(state: GameState): boolean {
  return state.eventLog.some((e) => e.type === "game_won");
}

function getPlayer(state: GameState, playerId: string) {
  return state.players.find((p) => p.id === playerId);
}

function getActiveMosjeRef(state: GameState, playerId: string): MosjeRef | undefined {
  const player = getPlayer(state, playerId);
  if (player === undefined) return undefined;
  const activeMosje = player.mosjes[player.activeMosjeIndex];
  if (activeMosje === undefined) return undefined;
  return { playerId, instanceId: activeMosje.instanceId };
}

function getOpponentActiveMosjeRef(state: GameState, playerId: string): MosjeRef | undefined {
  const opponent = state.players.find((p) => p.id !== playerId);
  if (opponent === undefined) return undefined;
  const activeMosje = opponent.mosjes[opponent.activeMosjeIndex];
  if (activeMosje === undefined) return undefined;
  return { playerId: opponent.id, instanceId: activeMosje.instanceId };
}

function getActiveMosjeMP(state: GameState, playerId: string): number {
  const player = getPlayer(state, playerId);
  if (player === undefined) return 0;
  const activeMosje = player.mosjes[player.activeMosjeIndex];
  return activeMosje?.mp ?? 0;
}

function hasBenchMosje(state: GameState, playerId: string): boolean {
  const player = getPlayer(state, playerId);
  if (player === undefined) return false;
  const benchIndex = player.activeMosjeIndex === 0 ? 1 : 0;
  const benchMosje = player.mosjes[benchIndex];
  return benchMosje !== undefined && benchMosje.flags["in_welloe"] !== true;
}

function pickRandom<T>(values: ReadonlyArray<T>, rng: ReturnType<typeof createRng>): T | undefined {
  if (values.length === 0) return undefined;
  const idx = rng.nextInt(0, values.length - 1);
  return values[idx];
}

function getRegisteredCardIds(): ReadonlyArray<CardId> {
  return getAllCards().map((card) => card.id);
}

function containsChoiceKey(value: unknown, key: string): boolean {
  if (typeof value === "string") return value === `$choice:${key}`;
  if (Array.isArray(value)) {
    return value.some((item) => containsChoiceKey(item, key));
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).some((item) => containsChoiceKey(item, key));
  }
  return false;
}

function resolveUnknownChoice(
  key: string,
  rng: ReturnType<typeof createRng>
): CardId {
  const registered = getRegisteredCardIds();
  const fallback = pickRandom(registered, rng) ?? ("kannetje-melk" as CardId);
  console.warn(`[AI] unresolved $choice:${key}; falling back to random registered card: ${fallback}`);
  return fallback;
}

/**
 * Build deterministic player choices for any card that might need them.
 * Returns a best-effort choices map.
 */
function buildPlayerChoices(
  state: GameState,
  playerId: string,
  rng: ReturnType<typeof createRng>
): Readonly<Record<string, unknown>> {
  const player = getPlayer(state, playerId);
  const opponent = state.players.find((p) => p.id !== playerId);
  const registeredCardIds = getRegisteredCardIds();

  const randomRegisteredCardId =
    pickRandom(registeredCardIds, rng) ?? ("kannetje-melk" as CardId);

  // discardCardId: random card from hand
  const sortedHand = [...(player?.hand ?? [])].sort();
  const discardCardId = pickRandom(sortedHand, rng) ?? randomRegisteredCardId;

  // cardId: random card from discard pile
  const discardPileCardId = player?.discard[0] ?? discardCardId ?? ("kannetje-melk" as CardId);
  const randomDiscardCardId = pickRandom(player?.discard ?? [], rng) ?? discardPileCardId;

  // mosjeId: first Mosje in welloe pile
  const mosjeId = player?.welloePile[0] ?? player?.mosjes[player.activeMosjeIndex]?.cardId ?? randomRegisteredCardId;

  // named/locked card guesses: random from opponent hand (fallback random registered card)
  const sortedOpponentHand = [...(opponent?.hand ?? [])].sort();
  const randomOpponentCardId = pickRandom(sortedOpponentHand, rng) ?? randomRegisteredCardId;
  const lockedCardId = randomOpponentCardId;
  const namedCardId = randomOpponentCardId;

  // namedTypes (West Perfect Read): random 3-category guess tuple
  const guessTypes: ReadonlyArray<"piecie" | "mosje" | "quest" | "place" | "snelle-piecie"> = [
    "piecie",
    "mosje",
    "quest",
    "place",
    "snelle-piecie"
  ];
  const namedTypes = [
    pickRandom(guessTypes, rng) ?? "piecie",
    pickRandom(guessTypes, rng) ?? "mosje",
    pickRandom(guessTypes, rng) ?? "quest"
  ];

  // targetMosjeCardId: random own Mosje card ID currently on field
  const ownFieldMosjeCardIds = (player?.mosjes ?? []).map((mosje) => mosje.cardId);
  const randomOwnFieldMosjeCardId =
    pickRandom(ownFieldMosjeCardIds, rng) ??
    player?.mosjes[player.activeMosjeIndex]?.cardId ??
    randomRegisteredCardId;

  // targetMosjeCardId fallback from own hand if present
  const targetMosjeCardId =
    sortedHand.find((cardId) => {
      if (!hasCard(cardId)) return false;
      try {
        return getCard(cardId).category === "mosje";
      } catch {
        return false;
      }
    }) ??
    randomOwnFieldMosjeCardId;

  // deckOwnerId: opponent
  const deckOwnerId = opponent?.id ?? playerId;

  const knownChoices: Record<string, unknown> = {
    targetMP: 75,
    discardCardId,
    baggaDiscard: discardCardId,
    cardId: randomDiscardCardId,
    mosjeId,
    namedCardId,
    namedTypes,
    targetMosjeCardId,
    lockedCardId,
    deckOwnerId
  };

  return new Proxy(knownChoices, {
    get(target, prop): unknown {
      if (typeof prop !== "string") return Reflect.get(target, prop);
      if (prop in target) return target[prop];
      return resolveUnknownChoice(prop, rng);
    }
  });
}

/**
 * Check if a piecie/snelle-piecie card seems playable (cost can be met).
 * This is a best-effort pre-filter; the actual executeCard will do full validation.
 */
function seemsPlayable(state: GameState, playerId: string, cardId: CardId): boolean {
  if (!hasCard(cardId)) return false;
  try {
    const card = getCard(cardId);
    if (
      card.category !== "piecie" &&
      card.category !== "snelle-piecie" &&
      card.category !== "place"
    ) {
      return false;
    }

    const player = getPlayer(state, playerId);
    if (player === undefined) return false;
    const activeMosje = player.mosjes[player.activeMosjeIndex];
    if (activeMosje === undefined) return false;

    // Cards requiring mosjeId choice are skipped when no Welloe target exists.
    if (containsChoiceKey(card, "mosjeId") && player.welloePile.length === 0) {
      return false;
    }

    const cost = card.cost;
    if (cost.type === "free") return true;
    if (cost.type === "mp") {
      return activeMosje.mp >= (cost.mp ?? 0);
    }
    if (cost.type === "discard") {
      return (player.hand.length - 1) >= (cost.discardCount ?? 1);
    }
    if (cost.type === "variable") return true; // will resolve at runtime
    if (cost.type === "combo") return false; // skip combo costs — too complex
    return true;
  } catch {
    return false;
  }
}

/**
 * Fire place triggers for any events newly appended since `prevLength`.
 */
function fireNewPlaceTriggers(stateBefore: GameState, stateAfter: GameState): GameState {
  if (stateAfter.activePlace === null) return stateAfter;
  const prevLength = stateBefore.eventLog.length;
  let current = stateAfter;
  for (let i = prevLength; i < current.eventLog.length; i++) {
    const event = current.eventLog[i];
    if (event !== undefined) {
      current = resolveActivePlaceTriggers(current, event);
    }
  }
  return current;
}

// ─── AI Turn ─────────────────────────────────────────────────────────────────

export function aiTakeTurn(
  state: GameState,
  playerId: string,
  rng: ReturnType<typeof createRng>
): GameState {
  // Don't take turn if game is already over or it's not our turn
  if (isGameOver(state)) return state;
  if (state.currentPlayerId !== playerId) return state;

  const actingMosjeRef = getActiveMosjeRef(state, playerId);
  if (actingMosjeRef === undefined) return state;

  // ── Start turn ──────────────────────────────────────────────────────────────
  let current = startTurn(state);
  current = fireNewPlaceTriggers(state, current);
  if (isGameOver(current)) return current;

  // ── Draw phase ──────────────────────────────────────────────────────────────
  // Draw 1 card
  const afterDraw = drawCard(current, { playerId });
  current = fireNewPlaceTriggers(current, afterDraw);
  if (isGameOver(current)) return current;

  // Advance: draw → main
  const beforeMain = current;
  current = advancePhase(current);
  current = fireNewPlaceTriggers(beforeMain, current);
  if (isGameOver(current)) return current;

  // ── Main phase — play up to 2 cards (max 1 place) ──────────────────────────
  let pieciesPlayedThisTurn = 0;
  let placePlayedThisTurn = false;

  while (pieciesPlayedThisTurn < 2 && !isGameOver(current)) {
    const player = getPlayer(current, playerId);
    if (player === undefined) break;

    // Find playable cards, sorted alphabetically.
    // Places are limited to one play per turn to avoid wasting replacement plays.
    const playablePiecies = [...player.hand]
      .filter((cardId) => seemsPlayable(current, playerId, cardId))
      .filter((cardId) => {
        if (!hasCard(cardId)) return false;
        const category = getCard(cardId).category;
        if (category === "place" && placePlayedThisTurn) return false;
        return category === "piecie" || category === "snelle-piecie" || category === "place";
      })
      .sort();

    if (playablePiecies.length === 0) break;

    const cardId = playablePiecies[0];
    if (cardId === undefined) break;

    // Refresh actingMosjeRef in case it changed
    const freshMosjeRef = getActiveMosjeRef(current, playerId);
    if (freshMosjeRef === undefined) break;

    const opponentRef = getOpponentActiveMosjeRef(current, playerId);
    const choices = buildPlayerChoices(current, playerId, rng);

    const beforePlay = current;
    try {
      const isPlacePlay = hasCard(cardId) && getCard(cardId).category === "place";
      current = executeCard(current, cardId, {
        actingPlayerId: playerId,
        actingMosjeRef: freshMosjeRef,
        targetRef: opponentRef,
        playerChoices: choices
      });
      current = fireNewPlaceTriggers(beforePlay, current);
      if (isPlacePlay) {
        placePlayedThisTurn = true;
      }
    } catch (err) {
      // Log error but continue — skip this card
      console.error(`[AI] executeCard error on ${cardId}:`, err instanceof Error ? err.message : String(err));
      break;
    }

    pieciesPlayedThisTurn++;
    rng.next(); // consume RNG to stay deterministic
  }

  if (isGameOver(current)) return current;

  // Advance: main → quest
  const beforeQuest = current;
  current = advancePhase(current);
  current = fireNewPlaceTriggers(beforeQuest, current);
  if (isGameOver(current)) return current;

  // ── Quest phase ─────────────────────────────────────────────────────────────
  const playerForQuest = getPlayer(current, playerId);
  if (playerForQuest !== undefined && !isGameOver(current)) {
    const questCards = [...playerForQuest.hand]
      .filter((cardId) => {
        if (!hasCard(cardId)) return false;
        try {
          return getCard(cardId).category === "quest";
        } catch {
          return false;
        }
      })
      .sort();

    if (questCards.length > 0) {
      const questId = questCards[0];
      if (questId !== undefined) {
        const freshMosjeRef = getActiveMosjeRef(current, playerId);
        const opponentRef = getOpponentActiveMosjeRef(current, playerId);
        const choices = buildPlayerChoices(current, playerId, rng);

        if (freshMosjeRef !== undefined) {
          const beforeQuest2 = current;
          try {
            current = attemptQuest(current, questId, {
              actingPlayerId: playerId,
              actingMosjeRef: freshMosjeRef,
              targetRef: opponentRef,
              playerChoices: choices
            });
            current = fireNewPlaceTriggers(beforeQuest2, current);
          } catch (err) {
            console.error(`[AI] attemptQuest error on ${questId}:`, err instanceof Error ? err.message : String(err));
          }
        }
      }
    }
  }

  if (isGameOver(current)) return current;

  // Advance: quest → end
  const beforeEnd = current;
  current = advancePhase(current);
  current = fireNewPlaceTriggers(beforeEnd, current);
  if (isGameOver(current)) return current;

  // ── End phase — Mosje switch logic ──────────────────────────────────────────
  const activeMP = getActiveMosjeMP(current, playerId);
  const hasBench = hasBenchMosje(current, playerId);

  if (hasBench) {
    if (activeMP < 20) {
      // Switch: low MP
      current = switchActiveMosje(current, { playerId });
    }
    // If active MP >= 80: preserve high-MP Mosje (do NOT switch)
    // Otherwise: do not switch
  }

  // Advance: end → draw (calls endTurn internally)
  const beforeTurnEnd = current;
  current = advancePhase(current);
  current = fireNewPlaceTriggers(beforeTurnEnd, current);

  return current;
}
