import type { CardId } from "../types/card-id.js";
import type { GameEvent } from "../types/events.js";
import type { GameState } from "../types/game-state.js";

export interface CardPlaytestSpec {
  readonly cardId: CardId;
  readonly description: string;
  readonly deck: ReadonlyArray<CardId>;
  readonly mosje: { readonly cardId: CardId; readonly startMP: number };
  readonly opponentMosje: { readonly cardId: CardId; readonly startMP: number };
  readonly expectations: ReadonlyArray<Expectation>;
}

export type Expectation =
  | {
      readonly type: "event_emitted";
      readonly eventType: string;
      readonly check: (event: GameEvent, before: GameState) => boolean;
      readonly description: string;
    }
  | {
      readonly type: "state_change";
      readonly check: (before: GameState, after: GameState) => boolean;
      readonly description: string;
    }
  | {
      readonly type: "card_resolved";
      readonly outcome?: "success" | "rejected" | "partial";
      readonly description: string;
    };

export interface ExpectationResult {
  readonly passed: boolean;
  readonly description: string;
  readonly details?: string;
}

export interface PlaytestResult {
  readonly cardId: CardId;
  readonly cardName: string;
  readonly description: string;
  readonly played: boolean;
  readonly outcome: "success" | "rejected" | "partial" | "not_played";
  readonly expectations: ReadonlyArray<ExpectationResult>;
  readonly actualEvents: ReadonlyArray<GameEvent>;
  readonly diagnosis: string;
}

export interface PlaytestSummary {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly notPlayed: number;
  readonly results: ReadonlyArray<PlaytestResult>;
}
