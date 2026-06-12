import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const GANDOE_THE_DESTROYER: MosjeDefinition = {
  id: "gandoe-the-destroyer" as CardId,
  name: "Gandoe The Destroyer",
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
  traits: { Physical: 3, Mental: 1, Social: 1, Creative: 1, Technical: 1, Resilient: 2 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", mp: 80 },
    usageLimit: "once_per_game",
    description: "Elimination Strike: send target opponent Mosje to Welloe if their MP <= 60.",
    effects: [
      {
        primitive: "ifThenElse",
        params: {
          condition: {
            primitive: "checkMP",
            params: { target: "$target", operator: "<=", value: 60 }
          },
          then: { primitive: "sendToWelloe", params: { target: "$target" } },
          else: { primitive: "gainMP", params: { target: "$self", amount: 0 } }
        }
      }
    ]
  }
};

registerCard(GANDOE_THE_DESTROYER);
