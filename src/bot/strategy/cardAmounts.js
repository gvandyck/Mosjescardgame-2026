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

// SNELLE_LOSS_CUT: how much less one defender Snelle lets a Mosje lose (Card List 2.0). `upgraded` applies when the
// threatened Mosje has `stars` of `trait`. Emergency Healings gains MP first (+25, Resilient 2+: +35), which for the
// bot counts the same as a cut. Jensen!, Counter Strikka and Blensen! cut nothing: they stop the card instead.
export const SNELLE_LOSS_CUT = {
	snelle_the_protector: { base: 30 },
	snelle_perfect_dodge: { base: 20, upgraded: 30, trait: 'physical', stars: 3 },
	snelle_drain_reversal: { base: 20 },
	snelle_emergency_healings: { base: 25, upgraded: 35, trait: 'resilient', stars: 2 },
};

// Reaction Snelle numbers: Jammertje Gepakt! is worth its card against a Piecie that costs this much Energy or more.
export const JAMMERTJE_MIN_COST = 2;
export const FIVE_STARS = '★★★★★';
