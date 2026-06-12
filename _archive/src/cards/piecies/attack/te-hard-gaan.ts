import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const TE_HARD_GAAN: CardDefinition = {
  id: "te-hard-gaan" as CardId,
  name: "Te Hard Gaan",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "loseMP", params: { target: "$target", amount: 25 } }]
};

registerCard(TE_HARD_GAAN);
