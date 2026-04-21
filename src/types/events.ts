import type { CardId } from "./card-id.js";
import type { Phase } from "./phase.js";

export interface MosjeRef {
  readonly playerId: string;
  readonly instanceId: string;
}

export interface EffectSource {
  readonly kind: "card" | "place" | "ability" | "quest" | "cost";
  readonly cardId?: CardId;
  readonly playerId?: string;
}

export interface PlayerRef {
  readonly playerId: string;
}

export type GameEvent =
  | { type: "turn_started"; turn: number; playerId: string }
  | { type: "turn_ended"; turn: number; playerId: string }
  | { type: "phase_changed"; from: Phase; to: Phase }
  | { type: "mp_gained"; target: MosjeRef; amount: number; source: EffectSource }
  | { type: "mp_lost"; target: MosjeRef; amount: number; source: EffectSource }
  | { type: "mp_loss_blocked"; target: MosjeRef; source: EffectSource }
  | { type: "mp_drained"; from: MosjeRef; to: MosjeRef; amount: number }
  | {
      type: "mp_set";
      target: MosjeRef;
      oldValue: number;
      newValue: number;
      source: EffectSource;
    }
  | { type: "card_drawn"; playerId: string; cardId: CardId }
  | { type: "card_discarded"; playerId: string; cardId: CardId }
  | { type: "card_sent_to_deck_bottom"; playerId: string; cardId: CardId; source: string }
  | { type: "cards_revealed_private"; viewerId: string; ownerId: string; cards: ReadonlyArray<CardId> }
  | { type: "piecie_placed"; playerId: string; slotIndex: number; cardId: CardId }
  | { type: "piecie_activated"; playerId: string; slotIndex: number; cardId: CardId }
  | { type: "piecie_destroyed"; target: { playerId: string; slotIndex: number }; cardId: CardId }
  | { type: "quest_attempted"; playerId: string; questId: CardId }
  | { type: "quest_completed"; playerId: string; questId: CardId; reward: number; rollResult: number }
  | { type: "quest_failed"; playerId: string; questId: CardId; penalty: number; rollResult: number }
  | { type: "quest_skipped"; playerId: string; questId: CardId }
  | { type: "quest_rejected"; playerId: string; questId: CardId }
  | { type: "place_entered"; cardId: CardId }
  | { type: "place_destroyed"; cardId: CardId }
  | { type: "place_trigger_fired"; placeCardId: CardId; triggerOn: string }
  | { type: "mosje_ability_used"; mosjeRef: MosjeRef; abilityId: string }
  | { type: "mosje_leveled_up"; target: MosjeRef; newLevel: 2 | 3 }
  | { type: "mosje_defeated"; target: MosjeRef }
  | { type: "die_rolled"; raw: 1 | 2 | 3 | 4 | 5 | 6; modifier: number; final: number; rollerId: string }
  | {
      type: "die_rerolled";
      previous: { raw: 1 | 2 | 3 | 4 | 5 | 6; modifier: number; final: number; rollerId: string };
      next: { raw: 1 | 2 | 3 | 4 | 5 | 6; modifier: number; final: number; rollerId: string };
    }
  | { type: "buff_applied"; target: MosjeRef | PlayerRef; buffId: string; expiryTurn: number }
  | { type: "buff_expired"; target: MosjeRef | PlayerRef; buffId: string }
  | { type: "effect_negated"; pendingEffectId: string }
  | { type: "warning"; code: string; message: string }
    | { type: "double_activation_triggered"; cardId: CardId; source: EffectSource }
    | {
      type: "card_resolved";
      cardId: CardId;
      playerId: string;
      outcome: "success" | "rejected" | "partial";
    }
  | {
      type: "for_each_completed";
      targetType: string;
      count: number;
      source: EffectSource;
    }
  | {
      type: "game_won";
      playerId: string;
      reason: "level_3" | "knockout" | "quest_master" | "momentum_domination";
    };
