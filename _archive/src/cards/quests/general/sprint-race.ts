import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Physical ★★ or higher = auto-success. Without it, no roll defined → auto-fail.
export const SPRINT_RACE: QuestDefinition = {
  id: "quest_sprint_race" as CardId,
  name: "Sprint Race",
  category: "quest",
  subcategory: "PHYSICAL",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Physical", minStars: 2 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 70 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 80, isCostPayment: false } }]
};

registerCard(SPRINT_RACE);
