import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const TUK_THE_SIMS_ARCHITECT: MosjeDefinition = {
  id: "mosje_tuk_architect" as CardId,
  name: "Tuk The Sims Architect",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "instant",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 0, Mental: 2, Social: 0, Creative: 3, Technical: 3, Resilient: 0 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", amount: 15 },
    usageLimit: "once_per_turn",
    description: "Perfect Placement: look at top 5 of deck, choose 2 for hand. Conditional face-down placement deferred.",
    effects: [
      { primitive: "lookAtTop", params: { playerId: "$player", deckType: "own_deck", count: 5 } }
    ]
  },
  triggeredAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "House Design: may place 1 additional Piecie face-down per turn (max 2 total). (Extra Piecie slot enforcement deferred.)",
    effects: []
  },
  synergies: [
    {
      partnerCardId: "gandoe-the-destroyer" as CardId,
      description: "Requires piecie_bowie_stormey on field. Reduce all MP loss by 75% (instead of 50%). Both gain +15 MP per turn for 2 turns. (75% reduction and per-turn gain deferred.)",
      bonusEffects: []
    }
  ]
};

registerCard(TUK_THE_SIMS_ARCHITECT);
