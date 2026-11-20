/**
 * personal-quest-registry-2-1.js - card-test-library rows for the 12 starter Personal Quests (Phase 71-22, D-35 b).
 * Each entry has a win (Needs met, Pay taken, dice queued to meet the Roll: the game-over overlay names the card and the Mosje)
 * and a refusal (one Need not met, or a Level / Pay gap: the card cannot be played, the game says why, nothing is paid).
 * Numbers come from the Personal Quest table in docs/obby-2.0/handover/card-list.md. The Mosje is Level 3 (3 stars of its
 * trait = 3 dice); the driver is tests/helpers/mosjeCardTest.js (trigger kind personalQuest, expectations in personalQuestExpect.js).
 */
const MILK = 'piecie_kannetje_melk'; // food
const RONALD_KIP = 'piecie_ronald_kip'; // food
const GEAR = 'piecie_headset'; // gear, one ready copy on the field
const OPP = [{ id: 'mosje_ming_predictor', mp: 40 }];
const field = (id, mp = 60, level = 3) => [{ id, mp, level }];
const on = (...ids) => ids.map((id, slot) => ({ slot, id }));
const MORE = ['piecie_affoe', 'piecie_straffoe', 'piecie_slecht_gezet', 'piecie_quest_prep', 'piecie_larry_zegeltje']; // 5 other cards
const play = (cardId, picks) => ({ kind: 'personalQuest', cardId, picks });
const win = (card, mosje) => ({ gameOver: { card, mosje } });

const base = (id, extra = {}) => ({ field: field(id), oppField: OPP, energy: 3, ...extra });

export const PERSONAL_QUEST_REGISTRY = [
	{ personalQuest: 'pq_charge', cases: [
		{ name: 'Charge!: 31+ MP, pays 30 MP, two 4+ on Str 3 dice: Alyssa wins',
			setup: base('mosje_alyssa_bulldozer', { hand: ['pq_charge'], dice: [6, 6, 1] }),
			trigger: play('pq_charge'), expect: win('Charge!', 'Alyssa') },
		{ name: 'Charge!: 30 MP is not enough (needs 31+): refused, no MP paid',
			setup: base('mosje_alyssa_bulldozer', { field: field('mosje_alyssa_bulldozer', 30), hand: ['pq_charge'] }),
			trigger: play('pq_charge'), expect: { refused: /31\+ MP/ } },
	] },
	{ personalQuest: 'pq_sterke_jongen', cases: [
		{ name: 'Sterke Jongen: Gym in play, discards 1 ready gear, two 4+ on Str 3 dice: Jeffrey wins',
			setup: base('mosje_jeffrey', { hand: ['pq_sterke_jongen'], piecies: on(GEAR), place: { id: 'place_the_gym', by: 'player_2' }, dice: [4, 1, 6] }),
			trigger: play('pq_sterke_jongen'),
			expect: { ...win('Sterke Jongen', 'Jeffrey'), check: (b, a) => {
				if (a.players.player_1.piecieSlots.some(s => s?.cardId === GEAR)) throw new Error('the gear was not discarded');
			} } },
		{ name: 'Sterke Jongen: no Gym in play: refused',
			setup: base('mosje_jeffrey', { hand: ['pq_sterke_jongen'], piecies: on(GEAR) }),
			trigger: play('pq_sterke_jongen'), expect: { refused: /Gym in play/ } },
	] },
	{ personalQuest: 'pq_knocked_down_not_out', cases: [
		{ name: 'Knocked Down, Not Out: lost MP in an attack and has 50+ MP, discards a ready food Piecie, one 5+: Michelle wins',
			setup: base('mosje_michelle', { field: field('mosje_michelle', 100), oppField: [{ id: 'mosje_jeffrey', mp: 50, level: 3 }], hand: ['pq_knocked_down_not_out'], piecies: on(MILK), dice: [5, 1, 1] }),
			trigger: { kind: 'attacked', then: { kind: 'ownTurn', then: play('pq_knocked_down_not_out') } }, expect: win('Knocked Down, Not Out', 'Michelle') },
		{ name: 'Knocked Down, Not Out: she lost no MP: refused',
			setup: base('mosje_michelle', { hand: ['pq_knocked_down_not_out'], piecies: on(MILK) }),
			trigger: play('pq_knocked_down_not_out'), expect: { refused: /lost MP since the start of your last turn/ } },
	] },
	{ personalQuest: 'pq_michelinster', cases: [
		{ name: 'Michelinster: Ronald Kip ready and 2 Mosjes, discards a food Piecie from the hand, two 4+: Ronald wins',
			setup: base('mosje_ronald_chef', { field: [{ id: 'mosje_ronald_chef', mp: 60, level: 3 }, { id: 'mosje_ming_natural', mp: 20, slot: 1 }], hand: ['pq_michelinster', MILK], piecies: on(RONALD_KIP), dice: [4, 4, 1] }),
			trigger: play('pq_michelinster'), expect: win('Michelinster', 'Ronald') },
		{ name: 'Michelinster: only 1 Mosje on the field: refused',
			setup: base('mosje_ronald_chef', { hand: ['pq_michelinster', MILK], piecies: on(RONALD_KIP) }),
			trigger: play('pq_michelinster'), expect: { refused: /2 Mosjes on your field/ } },
	] },
	{ personalQuest: 'pq_aloha_tech_support', cases: [
		{ name: 'Aloha Tech Support: 1 ready gear, 5 other cards in hand, pays 2 Energy, two 4+ on Tech 3 dice: Coert wins',
			setup: base('mosje_coert_tech', { hand: ['pq_aloha_tech_support', ...MORE], piecies: on(GEAR), dice: [5, 5, 1] }),
			trigger: play('pq_aloha_tech_support'), expect: { ...win('Aloha Tech Support', 'Coert'), energy: 1 } },
		{ name: 'Aloha Tech Support: only 4 other cards in hand: refused, no Energy paid',
			setup: base('mosje_coert_tech', { hand: ['pq_aloha_tech_support', ...MORE.slice(0, 4)], piecies: on(GEAR) }),
			trigger: play('pq_aloha_tech_support'), expect: { refused: /5\+ other cards in your hand/ } },
	] },
	{ personalQuest: 'pq_vibe_coded', cases: [
		{ name: 'Vibe Coded: 1 ready gear, any 2 dice the same (3, 3, 6): Gandoe wins',
			setup: base('mosje_gandoe_wizard', { hand: ['pq_vibe_coded'], piecies: on(GEAR), dice: [3, 6, 3] }),
			trigger: play('pq_vibe_coded'), expect: win('Vibe Coded', 'Gandoe') },
		{ name: 'Vibe Coded: no ready gear Piecie: refused',
			setup: base('mosje_gandoe_wizard', { hand: ['pq_vibe_coded'] }),
			trigger: play('pq_vibe_coded'), expect: { refused: /ready gear Piecie/ } },
	] },
	{ personalQuest: 'pq_world_record_run', cases: [
		{ name: 'World Record Run: discards 2 gear Piecies from the hand, two 4+: Youri wins',
			setup: base('mosje_youri', { hand: ['pq_world_record_run', 'piecie_controller', 'piecie_keyboard'], dice: [6, 4, 1] }),
			trigger: play('pq_world_record_run'),
			expect: { ...win('World Record Run', 'Youri'), check: (b, a) => {
				const gone = a.players.player_1.graveyard.filter(c => c.cardId === 'piecie_controller' || c.cardId === 'piecie_keyboard').length;
				if (gone !== 2) throw new Error(`${gone} gear Piecies in the pile, expected 2`);
			} } },
		{ name: 'World Record Run: only 1 gear Piecie in the hand: refused, nothing discarded',
			setup: base('mosje_youri', { hand: ['pq_world_record_run', 'piecie_controller', MILK] }),
			trigger: play('pq_world_record_run'), expect: { refused: /./ } },
	] },
	{ personalQuest: 'pq_headshot', cases: [
		{ name: 'Headshot: 1 ready gear, one 6 on Tech 3 dice: FPS Coert wins',
			setup: base('mosje_fps_coert', { hand: ['pq_headshot'], piecies: on(GEAR), dice: [2, 6, 1] }),
			trigger: play('pq_headshot'), expect: win('Headshot', 'FPS Coert') },
		{ name: 'Headshot: no ready gear Piecie: refused',
			setup: base('mosje_fps_coert', { hand: ['pq_headshot'] }),
			trigger: play('pq_headshot'), expect: { refused: /ready gear Piecie/ } },
	] },
	{ personalQuest: 'pq_beginners_luck', cases: [
		{ name: "Beginner's Luck: pays 1 Energy, one 6 on Art 3 dice: Ming wins",
			setup: base('mosje_ming_natural', { hand: ['pq_beginners_luck'], dice: [1, 6, 2] }),
			trigger: play('pq_beginners_luck'), expect: { ...win("Beginner's Luck", 'Ming'), energy: 2 } },
		{ name: "Beginner's Luck: no Energy to pay: refused",
			setup: base('mosje_ming_natural', { hand: ['pq_beginners_luck'], energy: 0 }),
			trigger: play('pq_beginners_luck'), expect: { refused: /./ } },
	] },
	{ personalQuest: 'pq_high_roller', cases: [
		{ name: 'High Roller: pays 2 Energy = 1 die more (4 dice: 1, 1, 5, 5 wins; the first 3 alone would not)',
			setup: base('mosje_jeffrey_gambler', { hand: ['pq_high_roller'], dice: [1, 1, 5, 5] }),
			trigger: play('pq_high_roller', [/^\s*2 Energy/]), expect: { ...win('High Roller', 'Jeffrey'), energy: 1 } },
		{ name: 'High Roller: pays 0 Energy = no extra die (3 dice: 1, 1, 5 misses, the game goes on)',
			setup: base('mosje_jeffrey_gambler', { hand: ['pq_high_roller'], dice: [1, 1, 5, 5] }),
			trigger: play('pq_high_roller', [/^0 Energy/]), expect: { failed: true, energy: 3 } },
		{ name: 'High Roller: a Level 2 Mosje cannot play it: refused',
			setup: base('mosje_jeffrey_gambler', { field: field('mosje_jeffrey_gambler', 60, 2), hand: ['pq_high_roller'] }),
			trigger: play('pq_high_roller'), expect: { refused: /Level 3/ } },
	] },
	{ personalQuest: 'pq_lucky_crescendo', cases: [
		{ name: 'Lucky Crescendo: Skiffa in play, two 5+ on Art 3 dice: DJ wins',
			setup: base('mosje_dj_8020', { hand: ['pq_lucky_crescendo'], place: { id: 'place_skiffa', by: 'player_2' }, dice: [5, 6, 1] }),
			trigger: play('pq_lucky_crescendo', [/No reaction/]), expect: win('Lucky Crescendo', 'DJ 80/20') },
		{ name: 'Lucky Crescendo: no Skiffa in play: refused',
			setup: base('mosje_dj_8020', { hand: ['pq_lucky_crescendo'] }),
			trigger: play('pq_lucky_crescendo'), expect: { refused: /Skiffa in play/ } },
	] },
	{ personalQuest: 'pq_binti_brandt', cases: [
		{ name: 'Binti Brandt: opponent has 2 or fewer cards, discards a Piecie, two 4+: Binti wins',
			setup: base('mosje_binti', { hand: ['pq_binti_brandt', MILK], oppHand: ['piecie_affoe'], dice: [4, 5, 1] }),
			trigger: play('pq_binti_brandt'), expect: win('Binti Brandt', 'Binti') },
		{ name: 'Binti Brandt: the opponent holds 3 cards: refused',
			setup: base('mosje_binti', { hand: ['pq_binti_brandt', MILK], oppHand: ['piecie_affoe', 'piecie_straffoe', MILK] }),
			trigger: play('pq_binti_brandt'), expect: { refused: /2 or fewer cards in hand/ } },
	] },
];
