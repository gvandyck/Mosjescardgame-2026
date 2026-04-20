import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MP_AMPLIFIER: CardDefinition = {
  id: "mp-amplifier" as CardId,
  name: "MP Amplifier",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10, levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "multiplyNextMPGain",
      params: {
        target: "$self",
        multiplier: 2,
        duration: "this_turn",
        expiresOnTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(MP_AMPLIFIER);
