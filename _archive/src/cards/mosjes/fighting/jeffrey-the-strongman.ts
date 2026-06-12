import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const JEFFREY_THE_STRONGMAN: MosjeDefinition = {
  id: "jeffrey-the-strongman" as CardId,
  name: "Jeffrey The Strongman",
  category: "mosje",
  subcategory: "FIGHTING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "FIGHTING",
  traits: { Physical: 3, Mental: 1, Social: 1, Creative: 1, Technical: 1, Resilient: 3 },
  startMP: 15,
  baseAbility: {
    trigger: "on_activate",
    usageLimit: "once_per_turn",
    description: "Brute Force: gain 20 MP. Opponent cannot use MP-restoring Piecies next turn.",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 20 } },
      {
        primitive: "applyBuff",
        params: {
          target: "$target",
          buffId: "piecie_mp_restore_locked",
          data: { locked: true },
          expiryTurn: "$currentTurn + 1"
        }
      }
    ]
  }
};

registerCard(JEFFREY_THE_STRONGMAN);
