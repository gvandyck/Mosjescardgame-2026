// getFoodBonus - the MP a food Piecie's gain gets on top (Ronald, The Master Chef; Ronnie's Kitchen). 0 for non-food.
import { FOOD_BONUS_SOURCES } from './foodBonusSources.js';

export function getFoodBonus(ctx) {
	if (ctx?.cardDef?.tag !== 'food') return 0;
	return FOOD_BONUS_SOURCES.reduce((sum, source) => sum + (source(ctx) || 0), 0);
}
