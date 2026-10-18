// pickDjRerollDie — which `djReroll:<i>` entry the bot picks at an after-roll window (or null = pass).
// Own roll: reroll a failing roll's lowest die that could still turn it into a win. Opponent's roll: reroll a die
// the win depends on (the lowest such one). Only rerolls that can change the outcome are worth the use.
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { isBandWin } from '../../engine/quests/isBandWin.js';
import { asBotView } from './asBotView.js';

export function pickDjRerollDie(state, responderId, eligible, prefix = 'djReroll:') {
	state = asBotView(state, responderId); // BOT-04: from here on `state` is the table view
	const roll = state.pendingQuestRoll;
	const quest = roll && getQuestDef(roll.questId);
	if (!quest || quest.band === 'trained') return null;
	const own = roll.playerId === responderId;
	if (own === roll.win) return null; // own win / opponent's loss: leave it
	const swing = own ? 6 : 1;
	const order = roll.dice.map((d, i) => ({ d, i })).sort((a, b) => a.d - b.d);
	for (const { i } of order) {
		const id = `${prefix}${i}`;
		if (!eligible.includes(id)) continue;
		const test = roll.dice.map((d, j) => (j === i ? swing : d));
		if (isBandWin(quest.band, test) !== roll.win) return id;
	}
	return null;
}
