import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const BINTI_THE_CREATOR: MosjeDefinition = {
  id: "binti-the-creator" as CardId,
  name: "Binti The Creator",
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
  traits: { Physical: 0, Mental: 0, Social: 2, Creative: 3, Technical: 0, Resilient: 0 },
  startMP: 60,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "discard_food", discardCount: 2 },
    usageLimit: "once_per_turn",
    description: "Quick Sketch: discard 2 FOOD-tagged Piecies. Search deck for any 1 card, place it on field (active). (Search-to-field deferred — see phase8-questions.md)",
    effects: [
      {
        primitive: "searchDeck",
        params: { playerId: "$player", filter: "any", count: 1, destination: "field_active" }
      }
    ]
  }
};

registerCard(BINTI_THE_CREATOR);
