import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const THE_HACKER: MosjeDefinition = {
  id: "the-hacker" as CardId,
  name: "The Hacker",
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
  traits: { Physical: 0, Mental: 3, Social: 0, Creative: 0, Technical: 2, Resilient: 0 },
  startMP: 15,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "free" },
    usageLimit: "cooldown_5_turns",
    description: "System Hack: look at top 3 of any deck, rearrange, gain 10 MP. Cooldown: 5 turns.",
    effects: [
      {
        primitive: "lookAtTop",
        params: { playerId: "$player", targetDeckOwner: "$choice:deckOwnerId", count: 3 }
      },
      { primitive: "gainMP", params: { target: "$self", amount: 10 } }
    ]
  }
};

registerCard(THE_HACKER);
