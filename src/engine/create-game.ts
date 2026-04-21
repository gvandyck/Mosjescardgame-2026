import { createRng } from "../utils/rng.js";
import { makeInstanceId } from "../utils/id.js";
import type { CardId } from "../types/card-id.js";
import type { GameState } from "../types/game-state.js";
import type { MosjeInstance } from "../types/mosje-instance.js";
import type { PiecieSlot } from "../types/piecie-slot.js";
import type { PlayerState } from "../types/player-state.js";

export class InvalidGameConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidGameConfigError";
  }
}

export function createGame(config: {
  players: Array<{
    id: string;
    name: string;
    deck: ReadonlyArray<CardId>;
    mosjes: ReadonlyArray<{ cardId: CardId; startMP: number }>;
  }>;
  seed: number;
}): GameState {
  if (config.players.length < 2 || config.players.length > 5) {
    throw new InvalidGameConfigError("players must contain between 2 and 5 players");
  }

  const rng = createRng(config.seed);
  let globalCounter = 0;

  const players: ReadonlyArray<PlayerState> = config.players.map((player) => {
    if (player.mosjes.length !== 2) {
      throw new InvalidGameConfigError(`player ${player.id} must provide exactly 2 mosjes`);
    }

    const shuffleRng = createRng(rng.nextInt(0, 2_000_000_000));
    const shuffledDeck = [...player.deck];
    for (let i = shuffledDeck.length - 1; i > 0; i -= 1) {
      const swapIndex = shuffleRng.nextInt(0, i);
      const temp = shuffledDeck[i];
      shuffledDeck[i] = shuffledDeck[swapIndex];
      shuffledDeck[swapIndex] = temp;
    }

    const mosjes: ReadonlyArray<MosjeInstance> = player.mosjes.map((mosje) => {
      globalCounter += 1;
      return {
        instanceId: makeInstanceId("mosje", config.seed, globalCounter),
        cardId: mosje.cardId,
        level: 1,
        mp: mosje.startMP,
        flags: {}
      };
    });

    const piecieSlots: ReadonlyArray<PiecieSlot> = [0, 1, 2, 3, 4].map((slotIndex) => ({
      slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
      cardId: null,
      faceUp: false,
      turnsSincePlaced: 0
    }));

    return {
      id: player.id,
      name: player.name,
      mosjes,
      piecieSlots,
      hand: [],
      deck: shuffledDeck,
      discard: [],
      welloePile: [],
      activeMosjeIndex: 0,
      flags: {}
    };
  });

  return {
    turnCount: 1,
    currentPlayerId: config.players[0].id,
    currentPhase: "draw",
    players,
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: config.seed,
    lastRoll: null,
    currentTurnStartCount: 0
  };
}


