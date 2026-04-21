import type { CardId } from "./card-id.js";
import type { PlaceTrigger } from "../cards/schema/place-trigger.js";

export interface PlaceInstance {
  readonly cardId: CardId;
  readonly flags: Readonly<Record<string, unknown>>;
  readonly subscribedTriggers: ReadonlyArray<PlaceTrigger>;
}
