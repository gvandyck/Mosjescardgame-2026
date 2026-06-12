import type { CardId } from "./card-id.js";
import type { MosjeInstance } from "./mosje-instance.js";
import type { PiecieSlot } from "./piecie-slot.js";

export interface PlayerState {
  readonly id: string;
  readonly name: string;
  readonly mosjes: ReadonlyArray<MosjeInstance>;
  readonly piecieSlots: ReadonlyArray<PiecieSlot>;
  readonly hand: ReadonlyArray<CardId>;
  readonly deck: ReadonlyArray<CardId>;
  readonly discard: ReadonlyArray<CardId>;
  readonly welloePile: ReadonlyArray<CardId>;
  readonly activeMosjeIndex: 0 | 1;
  readonly totalDamageTaken: number;
  readonly flags: Readonly<Record<string, unknown>>;
}
