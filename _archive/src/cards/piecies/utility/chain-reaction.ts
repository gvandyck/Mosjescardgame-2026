import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const CHAIN_REACTION: CardDefinition = {
  id: "chain-reaction" as CardId,
  name: "Chain Reaction",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "multiplyByCount",
      params: {
        countParams: {
          playerId: "$player",
          zone: "discard",
          filter: { category: "piecie" }
        },
        perUnitEffect: {
          primitive: "gainMP",
          params: {
            target: "$self",
            amount: 10
          }
        },
        target: "$self",
        cap: 50
      }
    }
  ]
};

registerCard(CHAIN_REACTION);
