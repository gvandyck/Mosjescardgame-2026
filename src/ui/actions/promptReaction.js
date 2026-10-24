// promptReaction — ask the human which eligible Snelle to play at an open reaction window, or "No reaction". Reuses the generic
// option modal in its big-row 'reaction' variant (63-07, D-20): an attack window opens with "<A> attacks <T>: −n MP", each Snelle
// is "<Name> · N Energy" with its text underneath, the last row is "No reaction" (id '__pass__'). No hover, no cancel.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { getSnelleCost } from '../../engine/energy/getSnelleCost.js';
import { describeReactionContext } from '../board/describeReactionContext.js';
import { escapeMeta } from './escapeMeta.js';

const MOMENT_TEXT = {
	targeted: 'Your Mosje is targeted',
	wouldLoseMp: 'Your Mosje is about to lose MP',
	attacked: 'Your Mosje is attacked',
	toWelloe: 'Your Mosje is about to go to the Welloe',
	afterQuestRoll: 'Your opponent just rolled a Quest',
	afterPiecieActivation: 'Your opponent just activated a Piecie',
	jensenPlayed: 'A Jensen! was just played',
	beforeOwnQuestRoll: 'Before your Quest roll',
	afterOwnQuestRoll: 'After your Quest roll',
	afterOwnPiecieActivation: 'You just activated a Piecie',
};

export async function promptReaction(modal, state, responderId) {
	const p = state.pendingReaction;
	const dice = state.pendingQuestRoll?.dice || [];
	const options = p.eligible.map(id => {
		if (id.startsWith('djReroll:')) {
			const i = Number(id.slice(9));
			return { id, label: `Lucky Beats: reroll die ${i + 1}`, metaLabel: escapeMeta(`DJ 80/20 - the die shows ${dice[i]}; once per turn`) };
		}
		if (id.startsWith('piecieReroll:')) {
			const i = Number(id.slice(13));
			return { id, label: `Reroll die ${i + 1}`, metaLabel: escapeMeta(`A Piecie lets you reroll one die - the die shows ${dice[i]}`) };
		}
		const def = SNELLE_PIECIES.find(c => c.id === id);
		return { id, label: `${def?.name ?? id} · ${getSnelleCost(state, responderId, def)} Energy`, metaLabel: escapeMeta(def?.description ?? '') };
	});
	options.push({ id: '__pass__', label: 'No reaction' });
	const question = p.moments.map(m => MOMENT_TEXT[m] ?? m).join(' / ') + (dice.length && p.eligible.some(id => id.startsWith('djReroll:') || id.startsWith('piecieReroll:')) ? '. Play a Snelle or reroll a die?' : '. Play a Snelle?');
	const prompt = describeReactionContext(state) || question;
	const choice = await modal.showOptionSelect({ title: 'Reaction', prompt, options, allowCancel: false, variant: 'reaction' });
	return !choice || choice === '__pass__' ? null : choice;
}
