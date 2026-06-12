import type { EffectExpression } from "./effect-expression.js";

export type PlaceTriggerEventType =
  | "turn_end"
  | "turn_start"
  | "quest_attempt"
  | "quest_completed"
  | "quest_failed"
  | "piecie_activated"
  | "mp_gained"
  | "mosje_leveled_up"
  | "mosje_defeated";

export interface PlaceTrigger {
  readonly on: PlaceTriggerEventType;
  readonly forPlayer: "active" | "both" | "all";
  readonly condition?: EffectExpression;
  readonly effects: ReadonlyArray<EffectExpression>;
}
