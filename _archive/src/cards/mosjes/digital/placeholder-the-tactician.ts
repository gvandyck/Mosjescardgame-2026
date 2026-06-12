import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const PLACEHOLDER_THE_TACTICIAN: MosjeDefinition = {
  id: "mosje_tactician" as CardId,
  name: "Placeholder 1 — The Tactician",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "any_active_mosje",
  trigger: "on_activate",
  duration: "instant",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 0, Mental: 3, Social: 2, Creative: 0, Technical: 1, Resilient: 0 },
  startMP: 15,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", amount: 15 },
    usageLimit: "once_per_turn",
    description: "MP Manipulation: set any Mosje's MP to exactly 60, bypassing protection.",
    effects: [
      { primitive: "setMP", params: { target: "$target", value: 60 } }
    ]
  },
  synergies: []
};

registerCard(PLACEHOLDER_THE_TACTICIAN);
