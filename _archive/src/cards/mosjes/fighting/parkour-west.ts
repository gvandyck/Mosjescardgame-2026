import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const PARKOUR_WEST: MosjeDefinition = {
  id: "parkour-west" as CardId,
  name: "Parkour West",
  category: "mosje",
  subcategory: "FIGHTING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  mosjeType: "FIGHTING",
  traits: { Physical: 3, Mental: 2, Social: 1, Creative: 2, Technical: 1, Resilient: 1 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    usageLimit: "passive",
    description: "Adaptive Combat: first Piecie activated this turn costs 0 MP.",
    effects: [
      {
        primitive: "applyBuff",
        params: {
          target: "$self",
          buffId: "next_piecie_free",
          data: { usesRemaining: 1 },
          expiryTurn: "$currentTurn"
        }
      }
    ]
  },
  synergies: [],
  petSynergies: []
};

registerCard(PARKOUR_WEST);
