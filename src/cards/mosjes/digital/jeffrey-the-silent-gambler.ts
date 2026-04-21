import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const JEFFREY_THE_SILENT_GAMBLER: MosjeDefinition = {
  id: "jeffrey-the-silent-gambler" as CardId,
  name: "Jeffrey The Silent Gambler",
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
  traits: { Physical: 3, Mental: 2, Social: 0, Creative: 0, Technical: 2, Resilient: 0 },
  startMP: 0,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp_variable", minMp: 0, label: "X" },
    usageLimit: "once_per_turn",
    description: "High Stakes: wager X MP. Roll 1d6: 1-2=lose X, 3-4=keep, 5-6=gain X and draw 1. 5-6 bonus: next Quest +25 MP.",
    effects: [
      {
        primitive: "rollBranch",
        params: {
          branches: [
            {
              range: [1, 2],
              effects: [{ primitive: "loseMP", params: { target: "$self", amount: "$choice:wagerAmount" } }]
            },
            {
              range: [3, 4],
              effects: []
            },
            {
              range: [5, 6],
              effects: [
                { primitive: "gainMP", params: { target: "$self", amount: "$choice:wagerAmount" } },
                { primitive: "drawCards", params: { playerId: "$player", count: 1 } },
                {
                  primitive: "applyBuff",
                  params: {
                    target: "$self",
                    buffId: "next_quest_bonus_mp",
                    data: { amount: 25 },
                    expiryTurn: "$currentTurn"
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  }
};

registerCard(JEFFREY_THE_SILENT_GAMBLER);
