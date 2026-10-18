// cardAmounts - the numbers on Piecie texts the bot needs to judge an activation (data only, from the 2.0 Card List).
// SELF_LOSS_MP: the MP one of our own Mosjes loses. ELIMINATION_MP_MAX: "send one opponent Mosje with N MP or less to
// the Welloe pile". They describe the cards for the bot's choices; they never change what a card does.
export const SELF_LOSS_MP = {
	piecie_warm_kannetje_melk: 10,
	piecie_stripje_bennies: 20,
	piecie_straffoe: 5,
};

export const ELIMINATION_MP_MAX = {
	piecie_harde_didde: 40,
	piecie_klaar_met_jou: 30,
};
