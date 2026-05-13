import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

// The Void — general hostile Place. Drains all Mosjes 15 MP each end phase.
// RESTORE/FOOD Piecie restriction enforced in UI via void_active flag.
export const THE_VOID: PlaceDefinition = {
  id: "place_the_void" as CardId,
  name: "The Void",
  category: "place",
  subcategory: "PLACE",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "shared_field",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  onEnterEffects: [{ primitive: "setGameFlag", params: { flag: "void_active", value: true } }],
  onExitEffects: [{ primitive: "setGameFlag", params: { flag: "void_active", value: false } }],
  triggers: [
    {
      on: "turn_end",
      forPlayer: "both",
      effects: [
        {
          primitive: "forEachTarget",
          params: {
            targetType: "all_mosjes",
            effect: {
              primitive: "loseMP",
              params: { target: "$target", amount: 15, isCostPayment: false }
            }
          }
        }
      ]
    }
  ]
};

registerCard(THE_VOID);
