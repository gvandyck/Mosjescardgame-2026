// QUEST_CONDITIONS — costId -> (ctx) => bool. ctx = { state, playerId, slot, quest }. Pure.

const own = ({ state, playerId }) => state.players[playerId];
const opp = ({ state, playerId }) => state.players[Object.keys(state.players).find(id => id !== playerId)];
const filled = (p) => (p?.piecieSlots || []).filter(Boolean);
const trait2 = (t) => ({ slot }) => (Number(slot?.traits?.[t]) || 0) >= 2;
const totalMp = (p) => (p?.activeSlots || []).reduce((n, s) => n + (s && !s.isDefeated ? Math.max(0, s.mp) : 0), 0);

const staysPiecie = (entry) => entry.stays === true;

export const QUEST_CONDITIONS = {
	physical_2: trait2('physical'),
	technical_2: trait2('technical'),
	social_2: trait2('social'),
	level_1_only: ({ slot }) => slot?.level === 1,
	place_in_play: ({ state }) => !!state.activePlace,
	used_ability_this_turn: ({ slot }) => !!slot?.abilityUsedThisTurn,
	mp_70_to_80: ({ slot }) => slot?.mp >= 70 && slot?.mp <= 80,
	mp_80_plus: ({ slot }) => slot?.mp >= 80,
	piecie_stays: (ctx) => filled(own(ctx)).some(staysPiecie),
	three_face_down: (ctx) => filled(own(ctx)).filter(e => e.faceDown).length >= 3,
	three_piecies_in_play: (ctx) => filled(own(ctx)).length >= 3,
	more_piecies_than_opponent: (ctx) => filled(own(ctx)).length > filled(opp(ctx)).length,
	lower_total_mp: (ctx) => totalMp(own(ctx)) < totalMp(opp(ctx)),
	activate_1_ready_piecie: (ctx) => (own(ctx).piecieActivationsThisTurn || 0) >= 1,
	activate_2_ready_piecies: (ctx) => (own(ctx).piecieActivationsThisTurn || 0) >= 2,
};
