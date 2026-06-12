import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const MARTIN_THE_HISTORIAN: MosjeDefinition = {
  id: "martin-the-historian" as CardId,
  name: "Martin The Historian",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 1, Mental: 3, Social: 2, Creative: 2, Technical: 2, Resilient: 1 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    usageLimit: "once_per_turn",
    description: "Time Control: gain 15 MP, draw 2, look at top 2 of any deck.",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 15 } },
      { primitive: "drawCards", params: { playerId: "$player", count: 2 } },
      {
        primitive: "lookAtTop",
        params: { playerId: "$player", targetDeckOwner: "$choice:deckOwnerId", count: 2 }
      }
    ]
  }
};

registerCard(MARTIN_THE_HISTORIAN);
