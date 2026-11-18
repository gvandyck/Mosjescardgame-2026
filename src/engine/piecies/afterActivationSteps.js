// afterActivationSteps - registry of steps run after any Piecie activation, in order, by afterPiecieEffect.
// Push-only: each step is (state, ctx) => state, ctx = { playerId, cardDef, slotIndex, free }.
// The Kitchen draw reads the food counter, so it comes before countFoodActivation.
import { ronniesKitchenDraw } from '../../abilities/place/ronniesKitchenDraw.js';
import { countFoodActivation } from './countFoodActivation.js';

export const AFTER_ACTIVATION_STEPS = [ronniesKitchenDraw, countFoodActivation];
