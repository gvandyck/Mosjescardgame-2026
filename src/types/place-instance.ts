import type { CardId } from "./card-id.js";

export interface PlaceInstance {
  readonly cardId: CardId;
  readonly flags: Readonly<Record<string, unknown>>;
}
