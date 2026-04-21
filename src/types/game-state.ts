import type { CardId } from "./card-id.js";
import type { GameEvent } from "./events.js";
import type { PendingEffect } from "./pending-effect.js";
import type { Phase } from "./phase.js";
import type { PlaceInstance } from "./place-instance.js";
import type { PlayerState } from "./player-state.js";

export interface LastRoll {
  readonly raw: 1 | 2 | 3 | 4 | 5 | 6;
  readonly modifier: number;
  readonly final: number;
  readonly rollerId: string;
}

export interface GameState {
  readonly turnCount: number;
  readonly currentPlayerId: string;
  readonly currentPhase: Phase;
  readonly players: ReadonlyArray<PlayerState>;
  readonly activePlace: PlaceInstance | null;
  readonly questDeck: ReadonlyArray<CardId>;
  readonly effectStack: ReadonlyArray<PendingEffect>;
  readonly eventLog: ReadonlyArray<GameEvent>;
  readonly rngSeed: number;
  readonly lastRoll: LastRoll | null;
  readonly currentTurnStartCount?: number;
}


