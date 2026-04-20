import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";

// Mimics Kannetje Melk: gain 25 MP, no cost, no requirements.
export const PROOF_SIMPLE_GAIN: CardDefinition = {
  id: "proof-simple-gain" as CardId,
  name: "Proof: Simple Gain",
  category: "piecie",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "gainMP", params: { target: "$self", amount: 25 } }]
};
