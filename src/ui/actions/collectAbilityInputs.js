// collectAbilityInputs — asks the human for every input of an ability (MOSJE_ABILITY_RULES[..].inputs).
// Inputs already in `preset` (the test-hook _pendingTargets) are not asked again.
// Returns the collected { key: value } object, or null if the player cancelled.
import { buildAbilityInputOptions } from './buildAbilityInputOptions.js';
import { pickCardOrder } from './pickCardOrder.js';

export async function collectAbilityInputs({ state, playerId, modal, inputs, preset = {} }) {
	const collected = {};
	for (const input of inputs) {
		if (preset[input.key] !== undefined) { collected[input.key] = preset[input.key]; continue; }
		if (input.kind === 'orderTopN' || input.kind === 'pickFromTopN') {
			const owner = input.deckKey && input.deckKey !== 'own' ? collected[input.deckKey] : playerId;
			let deck = state.players[owner || playerId]?.deck || [];
			// afterPick (Tuk Architect): order only the cards left in the top N once the picked ones are taken out.
			if (input.afterPick && Array.isArray(collected[input.afterPick])) {
				const picked = collected[input.afterPick];
				const top = deck.slice(0, 5).filter((_, i) => !picked.includes(i));
				deck = [...top, ...deck.slice(5)];
			}
			const value = await pickCardOrder({
				modal, deck, n: Math.min(input.n, deck.length),
				mode: input.kind === 'pickFromTopN' ? 'pick' : 'order', count: input.count,
			});
			if (value == null) return null;
			collected[input.key] = value;
			continue;
		}
		const { title, options } = buildAbilityInputOptions(state, playerId, input, collected);
		if (options.length === 0) return null; // nothing legal to pick
		if (input.kind === 'handCard' && input.count > 1) {
			const picks = [];
			while (picks.length < input.count) {
				const left = options.filter(o => !picks.includes(o.value));
				const id = await modal.showOptionSelect({ title: `${title} (${picks.length + 1}/${input.count})`, options: left, allowCancel: true });
				if (id == null) return null;
				picks.push(options.find(o => o.id === id).value);
			}
			collected[input.key] = picks;
			continue;
		}
		const id = await modal.showOptionSelect({ title, options, allowCancel: true, autoSelectSingle: input.kind === 'ownMosje' });
		if (id == null) return null;
		collected[input.key] = options.find(o => o.id === id).value;
	}
	return collected;
}
