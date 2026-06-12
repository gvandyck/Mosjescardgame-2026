import type { CardId } from "../../types/card-id.js";

export type { CardId };

export type CardCategory = "mosje" | "piecie" | "snelle-piecie" | "place" | "quest";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type TriggerType =
  | "on_play"
  | "on_activate"
  | "passive"
  | "instant"
  | "quest_attempt"
  | "turn_start"
  | "turn_end"
  | "conditional";

export type DurationType =
  | "instant"
  | "this_turn"
  | "next_turn"
  | "while_active"
  | "once_per_game"
  | { readonly turns: number };
