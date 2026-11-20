// starterHandlers.js - starter card id -> the src file that holds the card's handler (Phase 71-25, D-37).
// Only for cards without an effect export: the 15 Mosjes, the 9 Places and the 12 Personal Quests.
// Piecies and Snelle are checked by their effectId export instead. Where a card's text is spread over two files,
// the file of the first sentence is named. The guard checks the file exists and contains the card's id
// (a Mosje: its abilityId; a Place and a Personal Quest: the card id).

const M = 'src/abilities/mosjeAbilities.js';
const P = 'src/abilities/placeEffects.js';
const POWER = 'src/abilities/place/placePower.js';
const PQ = 'src/data/personalQuests.js';

export const STARTER_HANDLER_FILES = {
	mosje_chris_ddr: M,
	mosje_alyssa_bulldozer: M,
	mosje_jeffrey: M,
	mosje_michelle: 'src/engine/attack/ironTukReducer.js',
	mosje_ronald_chef: M,
	mosje_coert_tech: M,
	mosje_gandoe_wizard: M,
	mosje_youri: M,
	mosje_fps_coert: M,
	mosje_fps_west: 'src/abilities/mosje/fpsWestLookAndBottom.js',
	mosje_ming_natural: M,
	mosje_jeffrey_gambler: M,
	mosje_dj_8020: M,
	mosje_binti: M,
	mosje_ronald_mastermind: M,

	place_de_box: POWER,
	place_the_gym: POWER,
	place_ronnies_kitchen: P,
	place_coerts_caravan: P,
	place_woonkamer_discord: P,
	place_youris_woonkamer: P,
	place_skiffa: POWER,
	place_punto_banco: P,
	place_nieuwe_gimma: P,

	pq_charge: PQ,
	pq_sterke_jongen: PQ,
	pq_knocked_down_not_out: PQ,
	pq_michelinster: PQ,
	pq_aloha_tech_support: PQ,
	pq_vibe_coded: PQ,
	pq_world_record_run: PQ,
	pq_headshot: PQ,
	pq_beginners_luck: PQ,
	pq_high_roller: PQ,
	pq_lucky_crescendo: PQ,
	pq_binti_brandt: PQ,
};
