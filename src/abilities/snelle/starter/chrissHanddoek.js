// Chris's Handdoek (snelle_chriss_handdoek): "When one of your Mosjes rolls for a Quest: reroll 1 die. A Chris also gains 10 MP."
// Played after the owner's own roll: the player picks one die of the held roll (one die: no question), it is rerolled and the
// win re-checked; then a Chris on the field gains 10 MP (two Chrises: the player picks). The effect re-runs after each pause,
// so the reroll is marked on the held roll (handdoekRerolled) and the mark goes when the card is done.
import { rollDie } from '../../../engine/deckEngine.js';
import { gainMP } from '../../../engine/mpManager.js';
import { isPendingRollWin } from '../../../engine/quests/isPendingRollWin.js';
import { pickFriendOnField } from '../../../engine/friends/pickFriendOnField.js';

const GAIN = 10;

function dieOptions(dice) {
	return dice.map((value, die) => ({ label: `Die ${die + 1} (${value})`, die })).sort((a, b) => dice[a.die] - dice[b.die]); // the bot takes the first: the lowest die
}

export function effect_chriss_handdoek(gameState, pid) {
	const state = JSON.parse(JSON.stringify(gameState));
	const pending = state.pendingQuestRoll;
	if (!pending || pending.playerId !== pid || !pending.dice?.length) return state;
	if (!pending.handdoekRerolled) {
		const options = dieOptions(pending.dice);
		const given = state.players[pid]._pendingTargets?.handdoek_die;
		if (options.length > 1 && !given) {
			return { state, needChoice: { playerId: pid, key: 'handdoek_die', choiceKind: 'die', prompt: "Chris's Handdoek: which die do you reroll?", options } };
		}
		const die = options.length === 1 ? options[0].die : given?.die;
		if (state.players[pid]._pendingTargets) delete state.players[pid]._pendingTargets.handdoek_die;
		if (!Number.isInteger(die) || !options.some(o => o.die === die)) return state; // T-71-24: only a die of the held roll
		pending.dice[die] = rollDie(6);
		pending.win = isPendingRollWin(pending, pending.dice);
		pending.handdoekRerolled = true;
	}
	const friend = pickFriendOnField(state, pid, ['Chris'], 'handdoek_chris', 'Which Chris gains 10 MP?');
	if (friend.needChoice) return { state, needChoice: friend.needChoice };
	delete pending.handdoekRerolled;
	return friend.none ? state : gainMP(state, pid, friend.slotIndex, GAIN, 'SNELLE');
}
