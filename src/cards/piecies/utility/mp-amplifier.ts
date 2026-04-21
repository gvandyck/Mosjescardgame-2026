import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MP_AMPLIFIER: CardDefinition = {
  id: "mp-amplifier" as CardId,
  name: "MP Amplifier",
  category: "piecie",
  subcategory: "UTILITY",
  flavorText: "Your next MP gain this turn is increased by 50%. Free to play.",
  isBoosterOnly: false,
  cost: { type: "free" },
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
