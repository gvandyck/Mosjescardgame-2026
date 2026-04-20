import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";

// Mimics pet synergies: applies a damage reduction buff, with extra effect
// if a specific partner card is on field.
export const PROOF_SYNERGY_BUFF: CardDefinition = {
  id: "proof-synergy-buff" as CardId,
  name: "Proof: Synergy Buff",
  category: "piecie",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: { turns: 2 },
  effects: [
    { primitive: "reduceMPLossBy", params: { target: "$self", amount: 20, duration: 2 } }
  ],
  synergies: [
    {
      // proof-simple-gain acts as the "partner" card for testing
      partnerCardId: "proof-simple-gain" as CardId,
      bonusEffects: [
        { primitive: "gainMP", params: { target: "$self", amount: 15 } }
      ]
    }
  ]
};
