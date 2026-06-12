import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const DJ_8020: MosjeDefinition = {
  id: "dj-8020" as CardId,
  name: "DJ 80/20",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 0, Mental: 0, Social: 0, Creative: 3, Technical: 0, Resilient: 2 },
  startMP: 20,
  baseAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Lucky Beats: gain 10 MP at turn start (passive). Once per turn: reroll any 1 die result this turn.",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 10 } }
    ]
  }
};

registerCard(DJ_8020);
