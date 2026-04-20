import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const THOSE_EYELASHES_THO: CardDefinition = {
  id: "those-eyelashes-tho" as CardId,
  name: "Those Eyelashes Tho...",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15, levelRequirement: 1 },
  requirements: [],
  target: "all_opponents",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 20 } },
    {
      primitive: "forEachTarget",
      params: {
        targetType: "all_opponents",
        effect: {
          primitive: "applyBuff",
          params: {
            target: "$target",
            buffId: "ability_locked",
            data: { locked: true },
            expiryTurn: "$currentTurn + 1"
          }
        }
      }
    }
  ]
};

registerCard(THOSE_EYELASHES_THO);
