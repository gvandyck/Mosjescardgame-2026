// mosjeCardSetup — boot the real game headless and lay out the board an entry describes (testMode hooks only).
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, clearEntryProtection,
	setMosjeOnField, setEnergy, setHand, setNextDice, setQuestFaceUp,
} from '../ui/helpers.js';

// Distinct Piecies so a deck order is observable; none of them is a Snelle (no reaction windows).
const DECK_PIECIES = [
	'piecie_kannetje_melk', 'piecie_broodje_doner', 'piecie_warm_kannetje_melk', 'piecie_affoe',
	'piecie_straffoe', 'piecie_slecht_gezet', 'piecie_bong_hit_demolition', 'piecie_larry_zegeltje', 'piecie_quest_prep',
];

export async function mosjeCardSetup(page, entry, c) {
	const s = c.setup || {};
	await seedCustomDeck(page, {
		id: `custom_mosje_${entry.mosje}`, name: `Mosje test ${entry.mosje}`,
		// Jeffrey (a harmless starter, no draw-step ability) is replaced by the entry's field below.
		mosjes: ['mosje_jeffrey'], piecies: [...DECK_PIECIES, ...DECK_PIECIES], snellePiecies: [], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	for (const pid of ['player_1', 'player_2']) for (let i = 0; i < 3; i++) await setMosjeOnField(page, pid, i, null);
	for (const f of s.field || []) await setMosjeOnField(page, 'player_1', f.slot ?? 0, f.id, { mp: f.mp, level: f.level ?? 1 });
	for (const f of s.oppField || []) await setMosjeOnField(page, 'player_2', f.slot ?? 0, f.id, { mp: f.mp, level: f.level ?? 1 });
	await clearEntryProtection(page);
	await setEnergy(page, 'player_1', s.energy ?? 3);
	await setEnergy(page, 'player_2', 6);
	await setHand(page, 'player_1', s.hand || []);
	await setHand(page, 'player_2', s.oppHand || []);

	await page.evaluate(({ piecies, place, turn }) => {
		const h = window.__testHooks;
		for (const p of piecies || []) h.setPiecieOnField('player_1', p.slot, p.id, { faceDown: p.faceDown !== false });
		if (place) h.setActivePlace(place.id, place.by || 'player_2');
		if (turn) h.setTurnNumber(turn);
		h.unlockPiecies('player_1');
	}, { piecies: s.piecies, place: s.place, turn: s.turn });

	if (s.quest) await setQuestFaceUp(page, s.quest.stack, s.quest.id);
	if (s.dice) await setNextDice(page, s.dice);
	if (s.abilityDice) await page.evaluate((v) => window.__testHooks.setNextAbilityDice(v), s.abilityDice);
	if (s.pendingTargets) await page.evaluate((t) => window.__testHooks.setPendingTargets(t), s.pendingTargets);
	await page.waitForTimeout(150);
}
