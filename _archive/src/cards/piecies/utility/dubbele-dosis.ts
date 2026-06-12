import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const QUEST_PREP: CardDefinition = {
  id: "dubbele-dosis" as CardId,
  name: "Dubbele Dosis",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "quest_auto_complete_once",
        data: { consumesOnQuest: true },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(QUEST_PREP);
