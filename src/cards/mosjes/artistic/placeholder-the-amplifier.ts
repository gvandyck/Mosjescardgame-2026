import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const PLACEHOLDER_THE_AMPLIFIER: MosjeDefinition = {
  id: "mosje_amplifier" as CardId,
  name: "Placeholder 3 — The Amplifier",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "instant",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 0, Mental: 2, Social: 1, Creative: 3, Technical: 0, Resilient: 0 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", amount: 30 },
    usageLimit: "limit_2_per_game",
    description: "Power Boost: all your Mosje abilities trigger twice this turn (double-trigger deferred). Applies buff to self.",
    effects: [
      {
        primitive: "applyBuff",
        params: {
          target: "$self",
          buffId: "double_trigger_this_turn",
          duration: "end_of_turn",
          expiryTurn: "$currentTurn"
        }
      }
    ]
  },
  synergies: []
};

registerCard(PLACEHOLDER_THE_AMPLIFIER);
