import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const PERFECT_SETUP: CardDefinition = {
  id: "perfect-setup" as CardId,
  name: "Perfect Setup",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "setMP", params: { target: "$self", value: "$choice:targetMP", isQuestOverride: true } }
  ]
};

registerCard(PERFECT_SETUP);
