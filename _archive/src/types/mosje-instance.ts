import type { CardId } from "./card-id.js";

export interface MosjeInstance {
  readonly instanceId: string;
  readonly cardId: CardId;
  readonly level: 1 | 2 | 3;
  readonly mp: number;
  readonly flags: Readonly<Record<string, unknown>>;
}
