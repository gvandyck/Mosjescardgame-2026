// keywordHooks - registry of the card keyword hooks (rules §9, D-23). Each map is card id -> (state, ctx) => state.
// Push-only, like MOSJE_TRIGGERS and ATTACK_TRIGGERS; Phase 71 fills it. It ships empty.
//   entrance   ctx { playerId, slotIndex }                  a Mosje is summoned (from hand or pile)
//   discarded  ctx { playerId, ownerId, byPlayerId }        the card is discarded from its owner's hand
//   levelDown  ctx { playerId, slotIndex, level }           a Mosje drops a level through a loss
//   combo      ctx { playerId, slotIndex, free, combo }     a Piecie finished as the 2nd Piecie activated this turn
export const KEYWORD_HOOKS = {
	entrance: {},
	discarded: {},
	levelDown: {},
	combo: {},
};
