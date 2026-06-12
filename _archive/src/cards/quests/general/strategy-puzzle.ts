import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Mental ★★ required. Discard 1 card as part of the outcome (cost in effects).
// Auto-succeeds when requirement is met; discard runs regardless of outcome direction.
export const STRATEGY_PUZZLE: QuestDefinition = {
  id: "quest_strategy_puzzle" as CardId,
  name: "Strategy Puzzle",
  category: "quest",
  subcategory: "MENTAL",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "trait", params: { trait: "Mental", minStars: 2 } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Mental", minStars: 2 } },
  onSuccess: [
    { primitive: "discardCards", params: { playerId: "$player", count: 1, mode: "random" } },
    { primitive: "gainMP", params: { target: "$self", amount: 25 } }
  ],
  onFailure: [
    { primitive: "discardCards", params: { playerId: "$player", count: 1, mode: "random" } },
    { primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } }
  ]
};

registerCard(STRATEGY_PUZZLE);
