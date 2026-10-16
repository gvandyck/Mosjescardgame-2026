// snelleDiceEffects - Card List 2.0 Quest-dice Snelle (Phase 60): Lucky Coin, Sleutelpuntje, Je Weet Niet. Effects: (state, playerId, ctx).
// The roll under reaction is state.pendingQuestRoll; changing a die re-checks the band the way useRerollGrant does.
import { rollDie } from '../../engine/deckEngine.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { isBandWin } from '../../engine/quests/isBandWin.js';

const clone = (s) => JSON.parse(JSON.stringify(s));
const bestStars = (state, pid, trait) =>
	Math.max(0, ...(state.players[pid].activeSlots || []).filter(s => s && !s.isDefeated).map(s => s.traits?.[trait] || 0));

function recheck(pending) {
	pending.win = isBandWin(getQuestDef(pending.questId).band, pending.dice);
}

// Sleutelpuntje: +1 die on the owner's next Quest roll (getQuestDiceCount keeps the 4-dice cap).
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

// Lucky Coin: pick dice one by one ('coin_n'), then reroll each once. Creative 3: also pick its result ('coin_v_n', 1-6).
export function effect_snelle_lucky_coin(gameState, pid) {
	const state = clone(gameState);
	const pending = state.pendingQuestRoll;
	if (!pending) return state;
	const creative3 = bestStars(state, pid, 'creative') >= 3;
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
		let value = null;
		if (creative3) {
			const v = picks['coin_v_' + n];
			if (!v) {
				const faces = [1, 2, 3, 4, 5, 6].map(value => ({ label: String(value), value }));
				return { state, needChoice: { playerId: pid, key: 'coin_v_' + n, choiceKind: 'dieValue', prompt: 'Lucky Coin: choose the result', options: own ? faces.reverse() : faces } };
			}
			value = v.value;
		}
		chosen.push({ die: given.die, value });
	}
	for (const { die, value } of chosen) {
		if (!Number.isInteger(die) || die < 0 || die >= pending.dice.length) continue;
		pending.dice[die] = creative3 && Number.isInteger(value) && value >= 1 && value <= 6 ? value : rollDie(6); // T-60-04
	}
	if (chosen.length) recheck(pending);
	for (const k of Object.keys(picks)) if (k.startsWith('coin_')) delete picks[k];
	return state;
}
