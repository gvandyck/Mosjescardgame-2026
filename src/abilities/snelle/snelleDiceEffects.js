// snelleDiceEffects - Card List 2.0 Quest-dice Snelle (Phase 60): Lucky Coin, Sleutelpuntje, Je Weet Niet. Effects: (state, playerId, ctx).
// The roll under reaction is state.pendingQuestRoll; changing a die re-checks the band the way useRerollGrant does.
import { rollDie } from '../../engine/deckEngine.js';
import { isPendingRollWin } from '../../engine/quests/isPendingRollWin.js';

const clone = (s) => JSON.parse(JSON.stringify(s));

function recheck(pending) {
	pending.win = isPendingRollWin(pending, pending.dice);
}

// Sleutelpuntje: +1 die on the owner's next Quest roll (getQuestDiceCount keeps the 6-dice cap).
export function effect_snelle_sleutelpuntje(gameState, pid) {
	const state = clone(gameState);
	state.players[pid].questExtraDice = (state.players[pid].questExtraDice || 0) + 1;
	return state;
}

// Je Weet Niet: the opponent rerolls all the dice of the held roll and keeps the new roll.
export function effect_snelle_jeweetniet(gameState) {
	const state = clone(gameState);
	const pending = state.pendingQuestRoll;
	if (!pending) return state;
	pending.dice = pending.dice.map(() => rollDie(6));
	recheck(pending);
	return state;
}

const dieOption = (dice, i) => ({ label: `Die ${i + 1} (${dice[i]})`, die: i });

// Lucky Coin: pick dice one by one ('coin_n'; 'Done' stops), then reroll each picked die once. The results are always rolled.
export function effect_snelle_lucky_coin(gameState, pid) {
	const state = clone(gameState);
	const pending = state.pendingQuestRoll;
	if (!pending) return state;
	const picks = state.players[pid]._pendingTargets || {};
	const own = pending.playerId === pid;
	const chosen = [];
	for (let n = 0; n < pending.dice.length; n++) {
		const left = pending.dice.map((_, i) => i).filter(i => !chosen.some(c => c.die === i));
		if (!left.length) break;
		const given = picks['coin_' + n];
		if (!given) {
			const dice = left.map(i => dieOption(pending.dice, i));
			const done = { label: 'Done', done: true };
			const options = (own ? pending.win : !pending.win) ? [done, ...dice] : [...dice, done]; // bot takes the first option
			return { state, needChoice: { playerId: pid, key: 'coin_' + n, choiceKind: 'die', prompt: 'Lucky Coin: which die do you reroll?', options } };
		}
		if (given.done) break;
		chosen.push({ die: given.die });
	}
	for (const { die } of chosen) {
		if (!Number.isInteger(die) || die < 0 || die >= pending.dice.length) continue;
		pending.dice[die] = rollDie(6); // T-60-04
	}
	if (chosen.length) recheck(pending);
	for (const k of Object.keys(picks)) if (k.startsWith('coin_')) delete picks[k];
	return state;
}
