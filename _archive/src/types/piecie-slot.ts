import type { CardId } from "./card-id.js";

export interface PiecieSlot {
  readonly slotIndex: 0 | 1 | 2 | 3 | 4;
  readonly cardId: CardId | null;
  readonly faceUp: boolean;
  readonly turnsSincePlaced: number;
}
