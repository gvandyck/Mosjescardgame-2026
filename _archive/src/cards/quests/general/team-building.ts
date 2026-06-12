import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Social ★★ or higher = auto-success. Without it, no roll → auto-fail.
export const TEAM_BUILDING: QuestDefinition = {
  id: "quest_team_building" as CardId,
  name: "Team Building",
  category: "quest",
  subcategory: "SOCIAL",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Social", minStars: 2 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 22 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 40, isCostPayment: false } }]
};

registerCard(TEAM_BUILDING);
