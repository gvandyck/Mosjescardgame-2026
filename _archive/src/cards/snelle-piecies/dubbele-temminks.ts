import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Dubbele Temminks — Ability Amplifier
// Play when a Mosje uses their unique ability. That ability triggers TWICE this turn.
// Implemented by applying buff:double_activate_this_turn (same as double-trigger piecie).
// The executor will detect this buff after effects and re-run steps 4+5 once.
export const DUBBELE_TEMMINKS: CardDefinition = {
  id: "snelle_dubbele_temminks" as CardId,
  name: "Dubbele Temminks",
  category: "snelle-piecie",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20 },
  requirements: [{ type: "level", params: { minLevel: 1 } }],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "double_activate_this_turn",
        data: { usesRemaining: 1 },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(DUBBELE_TEMMINKS);
