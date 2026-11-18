// foodBonusSources - registry of rules that add MP to a food Piecie's gain. Push-only: each source is
// (ctx) => number, ctx = { state, playerId, cardDef, targetPlayerId, slotIndex }. getFoodBonus sums them.
import { ronaldChefFirstFood } from '../../abilities/mosje/ronaldChefFirstFood.js';
import { ronniesKitchenFood } from '../../abilities/place/ronniesKitchenFood.js';

export const FOOD_BONUS_SOURCES = [ronaldChefFirstFood, ronniesKitchenFood];
