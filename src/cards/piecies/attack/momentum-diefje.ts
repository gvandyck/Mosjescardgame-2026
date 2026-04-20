import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MOMENTUM_DIEFJE: CardDefinition = {
  id: "momentum-diefje" as CardId,
  name: "Momentum Diefje",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20, levelRequirement: 2 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "drainMP", params: { from: "$target", to: "$self", amount: 20 } }]
};

registerCard(MOMENTUM_DIEFJE);
