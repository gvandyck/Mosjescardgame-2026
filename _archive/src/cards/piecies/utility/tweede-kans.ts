import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const TWEEDE_KANS: CardDefinition = {
  id: "tweede-kans" as CardId,
  name: "Tweede Kans",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 5 },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "rerollDie", params: {} }]
};

registerCard(TWEEDE_KANS);
