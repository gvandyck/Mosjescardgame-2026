// phoneSheetCases.js - Phase 65-08: the data the phone sheets spec walks through. SHEET_CASES are the modalManager builders that must
// be bottom sheets on a phone (D-14); DETAIL_CASES are the card detail view (showCardPreview), which stays a centred card.
// A case: { name, builder, args } (args as openModalBuilder reads them) plus optional
//   draw: true       the Draw step: the board must stay visible above (sheet top in the lower half, the opponent row uncovered)
//   scrollIn: sel    the element that must scroll by itself ('card' = the sheet itself) because the content is long
//   targets: [sel]   extra tap targets besides the buttons (checkbox rows), each at least 44 px high
//   roll: n          tap the Roll button with the die forced to n and wait for the result stage
//   reach: [sel]     elements that must be fully on screen without scrolling (the Continue button of a roll result)
import { PIECIES } from '../../src/data/piecies.js';

const LONG = 'A long description of what this choice does to the board, the Energy and the cards in your hand, so the row wraps over two lines';
const FISSA_TRAITS = { physical: 2, social: 1 };
const PIECIE_IDS = PIECIES.slice(0, 12).map((p) => p.id);

export const SHEET_CASES = [
	{ name: 'Draw step (3 options, no cancel)', builder: 'showOptionSelect', draw: true, args: [{
		title: 'Draw step', prompt: 'Draw normally, or use a Mosje ability instead.',
		options: [{ id: 'draw', label: 'Draw normally' }, { id: 'mosje_a', label: 'Alyssa Fissa' }, { id: 'mosje_b', label: 'Alyssa Bulldozer' }] }] },
	{ name: 'long option list (8 rows + Cancel)', builder: 'showOptionSelect', scrollIn: 'card', args: [{
		title: 'Choose a card', prompt: 'Pick one.', allowCancel: true,
		options: Array.from({ length: 8 }, (_, i) => ({ id: `opt${i}`, label: `Option ${i + 1} with a long name`, metaLabel: LONG })) }] },
	{ name: 'End Turn confirm (reaction variant)', builder: 'showOptionSelect', args: [{
		title: 'End your turn?', prompt: 'A Mosje can still act.', variant: 'reaction',
		options: [{ id: 'end', label: 'End turn anyway' }, { id: 'keep', label: 'Keep playing' }] }] },
	{ name: 'showConfirm', builder: 'showConfirm', args: ['Are you sure?', 'This cannot be undone.'] },
	{ name: 'showInfo', builder: 'showInfo', args: ['Heads up', 'Something happened on the table.'] },
	{ name: 'showTextInput', builder: 'showTextInput', args: ['Name your Mosje', 'Type a name'] },
	{ name: 'showCardChoice (6 cards)', builder: 'showCardChoice', args: ['Pick a card',
		Array.from({ length: 6 }, (_, i) => ({ cardId: `c${i}`, name: `Card ${i + 1}`, description: 'Does something useful to you' }))] },
	{ name: 'showTargetSelector (one protected)', builder: 'showTargetSelector', args: [[
		{ id: 'player_2:0', label: 'Gandoe Wizard', mpValue: 50, level: 1 },
		{ id: 'player_2:1', label: 'Ming Natural', mpValue: 50, level: 1, protected: true }], 'Pick the Mosje to hit.'] },
	{ name: 'showDiceRoll (ready stage)', builder: 'showDiceRoll', args: [{
		name: 'Arm Wrestling', requirementDescription: 'Roll: Physical ★=5+, ★★=3+, ★★★=2+', roll: { trait: 'physical' }, successMP: 40, failMP: -30 },
		4, '$fn', { mosje: { name: 'Alyssa Fissa', level: 1, mp: 50, traits: FISSA_TRAITS } }] },
	{ name: 'showDiceRoll (result stage after a tapped roll)', builder: 'showDiceRoll', roll: 5, reach: ['#modal-done'], args: [{
		name: 'Arm Wrestling', requirementDescription: 'Roll: Physical ★=5+, ★★=3+, ★★★=2+', roll: { trait: 'physical' }, successMP: 40, failMP: -30 },
		4, '$fn', { mosje: { name: 'Alyssa Fissa', level: 1, mp: 50, traits: FISSA_TRAITS } }] },
	{ name: 'showGraveyardModal (12 cards)', builder: 'showGraveyardModal', scrollIn: '.modal-card-list',
		args: [{ name: 'Gandoe', graveyard: PIECIE_IDS }, true] },
	{ name: 'showHandViewerModal', builder: 'showHandViewerModal', args: [PIECIE_IDS.slice(0, 5), 'Opponent', {}, '$fn'] },
	{ name: 'showOpponentHandRevealModal', builder: 'showOpponentHandRevealModal', args: [['Alyssa Fissa', 'Broodje Doner', 'Kannetje Melk']] },
	{ name: 'showRevealedCard', builder: 'showRevealedCard', args: ['Revealed card', 'Alyssa Fissa', 'MOSJE'] },
	{ name: 'showQuestAttemptPreview', builder: 'showQuestAttemptPreview', args: [
		{ $card: 'mosje_alyssa_fissa', level: 1, mp: 50, traits: FISSA_TRAITS }, { $card: 'quest_arm_wrestling' }, 4, '$fn'] },
	{ name: 'showDiscardRecoveryModal', builder: 'showDiscardRecoveryModal', targets: ['.recovery-card-option'], args: [{
		playerName: 'Gandoe', discardCards: PIECIE_IDS.slice(0, 6), requiredCount: 2 }] },
];

export const DETAIL_CASES = [
	{ name: 'Mosje', card: { $card: 'mosje_alyssa_fissa', level: 1, mp: 50 } },
	{ name: 'Piecie', card: { $card: 'piecie_broodje_doner' } },
	{ name: 'Place', card: { $card: 'place_the_gym' } },
	{ name: 'Quest', card: { $card: 'quest_arm_wrestling' } },
];
