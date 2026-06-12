import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const AFBLIJVEN: CardDefinition = {
  id: "afblijven" as CardId,
  name: "Afblijven!",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$target",
        buffId: "piecie_activation_locked",
        data: { locked: true },
        expiryTurn: "$currentTurn + 1"
      }
    }
  ]
};

registerCard(AFBLIJVEN);
