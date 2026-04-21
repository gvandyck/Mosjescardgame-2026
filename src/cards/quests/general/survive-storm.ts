import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Resilient ★★ OR has less than 30 MP." OR condition simplified:
// autoSucceed if Resilient ★★. Low-MP path uses roll with generous thresholds
// to simulate that at low MP even ★ users can succeed. Flagged in phase6-questions.md.
export const SURVIVE_STORM: QuestDefinition = {
  id: "quest_survive_storm" as CardId,
  name: "Survive Storm",
  category: "quest",
  subcategory: "RESILIENT",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Resilient", minStars: 2 } },
  roll: {
    die: "d6",
    thresholds: { "1": 4, "2": 3, "3": 2 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 30 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 50, isCostPayment: false } }]
};

registerCard(SURVIVE_STORM);
