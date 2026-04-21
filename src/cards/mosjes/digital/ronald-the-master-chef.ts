import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const RONALD_THE_MASTER_CHEF: MosjeDefinition = {
  id: "ronald-the-master-chef" as CardId,
  name: "Ronald The Master Chef",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 1, Mental: 3, Social: 2, Creative: 2, Technical: 2, Resilient: 1 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", mp: 20 },
    usageLimit: "once_per_turn",
    description: "Strategic Insight: look at opponent hand, lock one card until next turn.",
    effects: [
      {
        primitive: "revealTopDeck",
        params: { playerId: "$player", targetDeckOwner: "$opponent", count: 99, zone: "hand" }
      },
      {
        primitive: "applyBuff",
        params: {
          target: "$target",
          buffId: "card_locked_in_hand",
          data: { cardId: "$choice:lockedCardId" },
          expiryTurn: "$currentTurn + 1"
        }
      }
    ]
  }
};

registerCard(RONALD_THE_MASTER_CHEF);
