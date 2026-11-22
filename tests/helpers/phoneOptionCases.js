// phoneOptionCases.js - Phase 72.1-07: the card-option pauses the phone option-modal spec loops over. Each case is the config of
// window.__testHooks.openOptionSelect (the same config the real pauses pass to showOptionSelect): { name, config, leaveId, cancel }.
// leaveId: the id the leave button resolves; cancel: the sheet also has the Cancel button (resolves null).
const mosje = (id) => ({ id, label: id, cardId: id });
const MOSJES = ['mosje_alyssa_bulldozer', 'mosje_alyssa_fissa', 'mosje_gandoe_wizard', 'mosje_ming_natural', 'mosje_coert_tech'];
const PIECIES = ['piecie_broodje_doner', 'piecie_kannetje_melk', 'piecie_momentum_boost'];

export const OPTION_CASES = [
	{
		name: 'five card options with a leave',
		config: { title: 'Wizard: top of your deck', options: MOSJES.map(mosje), leave: { id: 'leave', label: 'Leave it' } },
		leaveId: 'leave', cancel: false,
	},
	{
		name: 'three options with a prompt card and a leave (Ming)',
		config: { title: 'Ming: pick a card', prompt: 'Pick one to put in your hand.', promptCard: 'mosje_ming_natural', options: MOSJES.slice(0, 3).map(mosje), leave: { id: 'leave', label: 'Leave it' } },
		leaveId: 'leave', cancel: false,
	},
	{
		name: 'two options, no leave, no cancel (a forced discard)',
		config: { title: 'Discard a card', options: PIECIES.slice(0, 2).map(mosje) },
		leaveId: null, cancel: false,
	},
	{
		name: 'Wizard with Cancel only',
		config: { title: 'Wizard: pick one', options: MOSJES.slice(0, 3).map(mosje), allowCancel: true },
		leaveId: null, cancel: true,
	},
	{
		name: 'attach replace: two Piecies, a leave and Cancel',
		config: { title: 'Replace an attachment', prompt: 'Pick the one to replace.', options: PIECIES.slice(0, 2).map(mosje), leave: { id: 'keep', label: 'Keep both' }, allowCancel: true },
		leaveId: 'keep', cancel: true,
	},
];
