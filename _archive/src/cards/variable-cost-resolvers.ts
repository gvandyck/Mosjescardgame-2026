import { checkEventLogThisTurn } from "../effects/conditions/check-event-log-this-turn.js";
import { createRng } from "../utils/rng.js";
import type { GameState } from "../types/game-state.js";
import type { EffectContext } from "../effects/effect-context.js";
import type { CostDefinition } from "./schema/cost-definition.js";

export type VariableCostResolver = (state: GameState, context: EffectContext) => CostDefinition;

const blensenCost: VariableCostResolver = (state, context) => {
  const jensenOrFrenssenPlayed = checkEventLogThisTurn(
    state,
    {
      eventType: "card_resolved",
      cardIdFilter: ["snelle_jensen", "snelle_frenssen"]
    },
    {
      ...context,
      rng: createRng(state.rngSeed)
    }
  );

  return jensenOrFrenssenPlayed ? { type: "free" } : { type: "mp", mp: 50 };
};

export const variableCostResolvers: Readonly<Record<string, VariableCostResolver>> = Object.freeze({
  blensen_cost: blensenCost
});
