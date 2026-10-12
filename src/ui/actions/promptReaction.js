// promptReaction — ask the human which eligible Snelle to play at an open reaction window (or Pass). Reuses the generic option modal.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
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
	const options = p.eligible.map(id => {
		const def = SNELLE_PIECIES.find(c => c.id === id);
		return { id, label: def?.name ?? id, metaLabel: escapeMeta(`Cost: ${def?.cost ?? 0} Energy - ${def?.description ?? ''}`) };
	});
	options.push({ id: '__pass__', label: 'Pass' });
	const prompt = p.moments.map(m => MOMENT_TEXT[m] ?? m).join(' / ') + '. Play a Snelle?';
	const choice = await modal.showOptionSelect({ title: 'Reaction', prompt, options, allowCancel: false });
	return !choice || choice === '__pass__' ? null : choice;
}
