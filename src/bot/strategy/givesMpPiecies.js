// givesMpPiecies - the Piecies whose text makes a Mosje gain MP (data only). The bot uses it to skip a gain nobody can
// receive (isUsefulActivation). No game rule reads it any more: Jeffrey, The Strongman (2.1) is only "3 attachments".
// Kept in line with the 2.1 starter texts (Phase 71-07); non-starter ids are unchanged. Snelle Piecies are not in the list.
export const GIVES_MP_PIECIES = new Set([
	'piecie_kannetje_melk', 'piecie_ronald_kip', 'piecie_chefs_special',
	'piecie_varkenspootjes', 'piecie_protein_shake', 'piecie_momentum_boost',
	'piecie_energy_surge', 'piecie_momentum_diefje', 'piecie_perfect_rhythm',
	'piecie_kan_het', 'piecie_f1_telemetry',
	'piecie_keyboard', 'piecie_controller', 'piecie_bowie_stormey',
	'piecie_gekke_vogels', 'piecie_grammetje_pieter', 'piecie_dikke_jonko', 'piecie_affoe',
	'piecie_tikker', 'piecie_larry_zegeltje',
	'piecie_hawaii_pizza', 'piecie_dancepad', 'piecie_magicprompt',
]);
