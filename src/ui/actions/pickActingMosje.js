// pickActingMosje — choose which of your Mosjes acts (attack or Quest). Mosjes that can't act are disabled with the reason.
// Returns the slot index, or null when cancelled / nobody can act.
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { escapeMeta } from './escapeMeta.js';

export async function pickActingMosje({ state, playerId, modal, purpose = 'quest' }) {
	const options = [];
	state.players[playerId].activeSlots.forEach((slot, i) => {
		if (!slot || slot.isDefeated) return;
		const gate = canMosjeTakeAction(state, playerId, i);
		const freshBlock = purpose === 'attack' && isFresh(slot);
		const reason = !gate.ok ? gate.error : freshBlock ? 'Fresh Mosje cannot attack' : '';
		options.push({ id: String(i), label: slot.name, metaLabel: escapeMeta(reason || `${slot.mp} MP`), disabled: !!reason });
	});
	if (!options.some(o => !o.disabled)) {
		await modal.showOptionSelect({ title: 'No Mosje can act', prompt: options.map(o => o.label).join(', ') || 'No Mosjes on your field.', options: [{ id: 'ok', label: 'OK' }] });
		return null;
	}
	const picked = await modal.showOptionSelect({
		title: purpose === 'attack' ? 'Attack with which Mosje?' : 'Quest with which Mosje?',
		options, allowCancel: true,
	});
	return picked == null ? null : Number(picked);
}
