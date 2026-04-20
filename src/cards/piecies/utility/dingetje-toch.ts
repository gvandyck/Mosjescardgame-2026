import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const DINGETJE_TOCH: CardDefinition = {
  id: "dingetje-toch" as CardId,
  name: "Dingetje Toch",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  // checkRevealedCardType is pending, so this step uses the approved MP-threshold fallback.
  effects: [
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkMP",
          params: {
            target: "$self",
            operator: ">=",
            value: 120
          }
        },
        then: {
          primitive: "gainMP",
          params: {
            target: "$self",
            amount: 30
          }
        },
        else: {
          primitive: "drawCards",
          params: {
            playerId: "$player",
            count: 1
          }
        }
      }
    }
  ]
};

registerCard(DINGETJE_TOCH);
