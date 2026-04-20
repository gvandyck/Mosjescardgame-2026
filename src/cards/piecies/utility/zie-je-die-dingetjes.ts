import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const ZIE_JE_DIE_DINGETJES: CardDefinition = {
  id: "zie-je-die-dingetjes" as CardId,
  name: "Zie Je Die Dingetjes",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 1 },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "lookAtTop",
      params: { playerId: "$player", targetDeckOwner: "$player", count: 3 }
    },
    { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
  ]
};

registerCard(ZIE_JE_DIE_DINGETJES);
