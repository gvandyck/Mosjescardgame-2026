/**
 * chain-specs.js — Definitions for card chain tests.
 *
 * Each ChainSpec defines:
 *   - name: display name
 *   - deck: deckId or custom deck object to use
 *   - setup: testHook overrides to apply after board loads
 *   - steps: sequence of actions to execute
 *   - assertions: what to check after each step
 *   - knownBug: if set, the test is expected to FAIL and this string documents why
 */

// ─── Chain 1: Quest Prep Stack ────────────────────────────────────────────────
// Dubbele Dosis (piecie_quest_prep, effect: +2 questPrepBonus) activated.
// Then attempt quest with mocked dice = 2 (roll 2, threshold ~3 → would fail without bonus).
// With +2 bonus: effective roll = 4 → succeeds.
export const CHAIN_QUEST_PREP_STACK = {
	name: 'Quest Prep Stack: Dubbele Dosis +2 converts near-miss to success',
	deckId: 'PHYSICAL_FORCE',
	mockDice: 0.1666,  // Math.floor(0.1666 * 6) + 1 = 2 (raw roll = 2, needs 3+ for Parkour)
	setup: { ownMPSlot0: 60 },
	steps: [
		{ action: 'play-face-down', cardId: 'piecie_quest_prep' },
		{ action: 'end-turn' },
		{ action: 'activate', cardId: 'piecie_quest_prep' },
		{ action: 'check-questPrepBonus', expected: 2 },  // bonus is now set
		{ action: 'general-quest' },  // with dice=2+bonus=4: success for Parkour Challenge (needs 3+)
	],
	assertions: [
		{ after: 'activate', questPrepBonus: 2 },
		{ after: 'quest', mpIncreased: true, logMatch: /Success|✅/ },
	],
};

// ─── Chain 2: Affoe Drain + Kannetje Melk Gain ────────────────────────────────
// Affoe drains -15 from opponent, +10 to own Mosje.
// Then Kannetje Melk gives own Mosje +20 MP.
// Net own gain: +30 MP. Net opponent loss: -15 MP.
export const CHAIN_AFFOE_KANNETJE = {
	name: 'Affoe drain (-15 opp, +10 own) + Kannetje Melk (+20 own) = net +30 own',
	deckId: {
		id: 'custom_affoe_chain',
		name: 'Affoe Chain Test',
		mosjes: ['mosje_gandoe_destroyer', 'mosje_michelle'],
		piecies: ['piecie_affoe', 'piecie_kannetje_melk', 'piecie_affoe',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	},
	setup: { ownMPSlot0: 50, opponentMPSlot0: 80 },
	steps: [
		{ action: 'play-face-down', cardId: 'piecie_affoe' },
		{ action: 'end-turn' },
		{ action: 'activate', cardId: 'piecie_affoe' },  // auto-target: own +10, opp -15
		{ action: 'snapshot', label: 'after-affoe' },
		{ action: 'play-face-down', cardId: 'piecie_kannetje_melk' },
		{ action: 'end-turn' },
		{ action: 'activate', cardId: 'piecie_kannetje_melk' },  // +20 to own
	],
	assertions: [
		{
			after: 'after-affoe',
			ownMPDelta: 10,      // +10 from Affoe drain
			opponentMPDelta: -15, // -15 from Affoe drain
		},
		{
			after: 'kannetje-melk',
			ownMPDeltaFromSnapshot: 20,  // +20 from Kannetje Melk
		},
	],
};

// ─── Chain 3: Attack + Not Today! Cancel ─────────────────────────────────────
// Set own Mosje to 1 MP. Bot attacks → elimination imminent.
// Not Today! (snelle_negate_elimination) fires from hand via interrupt modal.
// Result: Mosje survives at 5 MP.
export const CHAIN_ATTACK_NOT_TODAY = {
	name: 'Attack + Not Today!: bot eliminates, human negates, Mosje survives at 5 MP',
	deckId: {
		id: 'custom_not_today_chain',
		name: 'Not Today! Chain',
		mosjes: ['mosje_gandoe_destroyer', 'mosje_michelle'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_negate_elimination', 'snelle_negate_elimination',
		                'snelle_negate_elimination', 'snelle_jensen'],
		places: [],
		quests: [],
	},
	setup: { ownMPSlot0: 1 },  // set to 1 MP so any bot damage = elimination
	steps: [
		{ action: 'verify-hand-has', cardId: 'snelle_negate_elimination' },
		{ action: 'end-turn' },   // bot acts; interrupt should fire
		{ action: 'wait-for-interrupt-or-pass' },  // clicks Not Today! if modal appears
	],
	assertions: [
		{ after: 'end-turn', mosjeAlive: true, logMatch: /[Nn]ot [Tt]oday|[Ii]nterrupt/ },
	],
};

// ─── Chain 4: Youri Speed Activate ────────────────────────────────────────────
// Youri (-20 MP) activates face-down piecie → draws 1 card.
// Already tested in VIS-05 but here we verify it with exact state assertions.
export const CHAIN_YOURI_ABILITY = {
	name: 'Youri Speed Activate: -20 MP, face-down piecie activates, hand +1',
	deckId: {
		id: 'custom_youri_chain',
		name: 'Youri Chain',
		mosjes: ['mosje_youri'],
		piecies: ['piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
		          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	},
	setup: { ownMPSlot0: 60 },
	steps: [
		{ action: 'play-face-down', cardId: 'piecie_quest_prep' },
		{ action: 'snapshot', label: 'before-ability' },
		{ action: 'use-ability', mosjeId: 'mosje_youri' },
	],
	assertions: [
		{
			after: 'after-ability',
			ownMPDeltaFromSnapshot: -20,  // Youri paid 20 MP
			handDelta: 1,                  // drew 1 card
			logMatch: /[Yy]ouri|[Ss]peed|20 MP/,
		},
	],
};

// ─── Chain 5: Redbull + Mosje Ability (EXPECTED TO FAIL — known bug) ──────────
// Redbull sets abilityDoubleTrigger=true but main.js NEVER reads this flag.
// The ability should fire twice; it actually fires once.
// BUG: abilityDoubleTrigger flag set in effect_redbull() but never consumed
// in handleUseAbility() — the double-trigger never happens.
export const CHAIN_REDBULL_ABILITY = {
	name: 'Redbull + Ability: ability should trigger TWICE — BUG: triggers once',
	knownBug: 'abilityDoubleTrigger flag set in effect_redbull/piecieEffects.js:404 but never read in main.js handleUseAbility — double-trigger silently does nothing',
	deckId: {
		id: 'custom_redbull_chain',
		name: 'Redbull Chain',
		mosjes: ['mosje_alyssa_fissa'],  // ability: +5 per card in hand (predictable result)
		piecies: ['piecie_redbull', 'piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	},
	setup: { ownMPSlot0: 30 },
	steps: [
		{ action: 'play-face-down', cardId: 'piecie_redbull' },
		{ action: 'end-turn' },
		{ action: 'activate', cardId: 'piecie_redbull' },  // sets abilityDoubleTrigger=true
		{ action: 'snapshot', label: 'before-ability' },
		{ action: 'use-ability', mosjeId: 'mosje_alyssa_fissa' },
		// Alyssa Fissa: +5 per card in hand. With double trigger: should give +5×hand twice.
		// Without fix: gives +5×hand once.
	],
	assertions: [
		{
			after: 'after-ability',
			// If bug is FIXED: ownMPDeltaFromSnapshot = (handSize * 5) * 2
			// If bug is PRESENT: ownMPDeltaFromSnapshot = handSize * 5 (only once)
			// The test RECORDS the actual delta and flags if it's half of expected.
			checkDoubleTrigger: true,  // custom assertion: verify delta = 2 × single-trigger
		},
	],
};

// ─── Chain 6: Controller + Quest (+10 MP and +1 dice) ─────────────────────────
// Controller gives the ACTIVE Mosje +10 MP (or +15/25/40 if DIGITAL) and sets
// questPrepBonus +1. Then attempt quest — the +1 dice bonus should apply.
// Requires a DIGITAL Mosje on field to see the +15 MP (not just +5 base).
export const CHAIN_CONTROLLER_QUEST = {
	name: 'Controller: DIGITAL Mosje gets +15 MP + questPrepBonus +1, then quest uses the bonus',
	mockDice: 0.3333,  // die = 3 (Math.floor(0.3333*6)+1 = 3). With +1 bonus = 4 → success if threshold ≤4
	deckId: {
		id: 'custom_controller_chain',
		name: 'Controller Chain',
		mosjes: ['mosje_coert_tech'],  // DIGITAL subtype → Controller gives +15 MP
		piecies: ['piecie_controller', 'piecie_controller', 'piecie_controller',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	},
	setup: { ownMPSlot0: 40 },
	steps: [
		{ action: 'play-face-down', cardId: 'piecie_controller' },
		{ action: 'end-turn' },
		{ action: 'activate', cardId: 'piecie_controller' },  // should give +15 MP + questPrepBonus +1
		{ action: 'snapshot', label: 'after-controller' },
		{ action: 'general-quest' },  // dice=3, +1 bonus = 4 → success for quests with threshold ≤4
	],
	assertions: [
		{
			after: 'after-controller',
			ownMPDeltaFromSetup: 15,  // DIGITAL L1 = +15 MP from Controller
			questPrepBonus: 1,         // bonus flag set
		},
		{
			after: 'quest',
			mpIncreased: true,   // quest succeeded (roll 3 + bonus 1 = 4)
			logMatch: /[Cc]ontroller|DIGITAL|\+15|Quest.*Success|Success/,
		},
	],
};

// ─── Chain 7: Eendjes Voeren + Michelle END_PHASE +10 MP ─────────────────────
// The place fires END_PHASE +10 to every Michelle Mosje on the field.
// BUG report: doesn't seem to give +10 MP.
// Root causes to verify:
//   1. Michelle must be played from hand first (only 1 Mosje starts on field)
//   2. Eendjes Voeren must be ACTIVATED (not just placed)
//   3. END_PHASE fires at endTurn — verify the +10 shows up
export const CHAIN_EENDJES_VOEREN_MICHELLE = {
	name: 'Eendjes Voeren END_PHASE: Michelle +10 MP per turn while Place is active',
	deckId: {
		id: 'custom_eendjes_chain',
		name: 'Eendjes Chain',
		// Force Michelle as the starter by making her the only Mosje
		mosjes: ['mosje_michelle'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: ['place_eendjes_voeren'],
		quests: [],
	},
	setup: { ownMPSlot0: 30 },
	steps: [
		// Play Eendjes Voeren from hand (it's a Place, goes to piecie zone face-down)
		{ action: 'play-face-down', cardId: 'place_eendjes_voeren' },
		{ action: 'end-turn' },
		// Activate the Place on turn 2
		{ action: 'activate', cardId: 'place_eendjes_voeren' },
		{ action: 'snapshot', label: 'place-activated' },
		// End turn — END_PHASE should fire, giving Michelle +10 MP
		{ action: 'end-turn' },
		{ action: 'snapshot', label: 'after-end-phase' },
	],
	assertions: [
		{
			// After the END_PHASE turn, Michelle's MP should be higher than before end-turn
			// by at least +10 (the place bonus). May be higher due to trickle too.
			after: 'after-end-phase',
			michelleGainedAtLeast: 10,  // place bonus fires
			logMatch: /Eendjes|MICHELLE|\+10/i,
		},
	],
};

export const ALL_CHAINS = [
	CHAIN_QUEST_PREP_STACK,
	CHAIN_AFFOE_KANNETJE,
	CHAIN_ATTACK_NOT_TODAY,
	CHAIN_YOURI_ABILITY,
	CHAIN_REDBULL_ABILITY,
	CHAIN_CONTROLLER_QUEST,
	CHAIN_EENDJES_VOEREN_MICHELLE,
];
