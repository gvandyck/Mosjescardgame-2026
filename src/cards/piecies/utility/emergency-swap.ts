import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const EMERGENCY_SWAP: CardDefinition = {
  id: "emergency-swap" as CardId,
  name: "Emergency Swap",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 30, levelRequirement: 1 },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "switchActiveMosje", params: { playerId: "$player" } },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "copy_ability_once",
        data: { sourceCardId: "$choice:targetMosjeCardId" },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(EMERGENCY_SWAP);
