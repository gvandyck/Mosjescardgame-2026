import type { CardId } from "./card-id.js";
import type { Phase } from "./phase.js";

export interface MosjeRef {
  readonly playerId: string;
  readonly instanceId: string;
}

export interface EffectSource {
  readonly kind: "card" | "place" | "ability" | "quest" | "cost";
  readonly cardId?: CardId;
}

export type GameEvent =
  | { type: "turn_started"; turn: number; playerId: string }
  | { type: "turn_ended"; turn: number; playerId: string }
  | { type: "phase_changed"; from: Phase; to: Phase }
  | { type: "mp_gained"; target: MosjeRef; amount: number; source: EffectSource }
  | { type: "mp_lost"; target: MosjeRef; amount: number; source: EffectSource }
  | { type: "mp_drained"; from: MosjeRef; to: MosjeRef; amount: number }
  | { type: "card_drawn"; playerId: string; cardId: CardId }
  | { type: "card_discarded"; playerId: string; cardId: CardId }
  | { type: "piecie_placed"; playerId: string; slotIndex: number; cardId: CardId }
  | { type: "piecie_activated"; playerId: string; slotIndex: number; cardId: CardId }
  | { type: "quest_attempted"; playerId: string; questId: CardId }
  | { type: "quest_completed"; playerId: string; questId: CardId; reward: number }
  | { type: "quest_failed"; playerId: string; questId: CardId; penalty: number }
  | { type: "place_entered"; cardId: CardId }
  | { type: "place_destroyed"; cardId: CardId }
  | { type: "mosje_leveled_up"; target: MosjeRef; newLevel: 2 | 3 }
  | { type: "mosje_defeated"; target: MosjeRef }
  | {
      type: "game_won";
      playerId: string;
      reason: "level_3" | "knockout" | "quest_master" | "momentum_domination";
    };
