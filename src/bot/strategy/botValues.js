// BOT_VALUES - the bot's valuation numbers (data only). Bot valuation, never a rule: they change what the bot prefers,
// not what the game allows. LEVEL_BONUS is indexed by level - 1; L3_MP_CAP mirrors the Level 3 cap of applyGainToSlot.
export const BOT_VALUES = {
	LEVEL_BONUS: [0, 25, 200],
	SIDEWAYS_PENALTY: 25,
	WELLOE_WORTH: -145,
	L3_MP_CAP: 95,
};
