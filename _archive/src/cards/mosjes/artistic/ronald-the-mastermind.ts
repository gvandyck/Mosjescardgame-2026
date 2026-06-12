import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const RONALD_THE_MASTERMIND: MosjeDefinition = {
  id: "ronald-the-mastermind" as CardId,
  name: "Ronald The Mastermind",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 0, Mental: 3, Social: 0, Creative: 3, Technical: 0, Resilient: 0 },
  startMP: 0,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "free" },
    usageLimit: "once_per_game",
    description: "Master Plan: activate any Piecie directly from your discard pile for free (effect resolves immediately).",
    effects: [
      {
        primitive: "activateFromDiscard",
        params: { playerId: "$player", cardId: "$choice:discardCardId", free: true }
      }
    ]
  }
};

registerCard(RONALD_THE_MASTERMIND);
