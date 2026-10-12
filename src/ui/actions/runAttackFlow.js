// runAttackFlow — human attack: pick acting Mosje, then an opponent Mosje (invalid targets disabled), then the engine resolves.
import { attackMosje } from '../../engine/actions/attackMosje.js';
import { isValidAttackTarget } from '../../engine/actions/isValidAttackTarget.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { pickActingMosje } from './pickActingMosje.js';
import { escapeMeta } from './escapeMeta.js';

export async function runAttackFlow({ state, playerId, modal, settle = async s => s }) {
	const none = { state, log: [] };
	const slotIndex = await pickActingMosje({ state, playerId, modal, purpose: 'attack' });
	if (slotIndex == null) return none;

	const options = [];
	for (const [pid, p] of Object.entries(state.players)) {
		if (pid === playerId) continue;
		p.activeSlots.forEach((t, i) => {
			if (!t || t.isDefeated) return;
			const ok = isValidAttackTarget(state, playerId, pid, i);
			const why = isFresh(t) ? 'Fresh - safe' : t.levelUpProtected ? 'Level-up protected' : '';
			options.push({ id: `${pid}:${i}`, label: t.name, metaLabel: escapeMeta(ok ? `${t.mp} MP` : why), disabled: !ok });
		});
	}
	if (!options.some(o => !o.disabled)) {
		await modal.showOptionSelect({ title: 'No valid target', prompt: 'Every opposing Mosje is fresh or protected.', options: [{ id: 'ok', label: 'OK' }] });
		return none;
	}
	const picked = await modal.showOptionSelect({ title: 'Attack which Mosje?', options, allowCancel: true });
	if (picked == null) return none;
	const [targetPlayerId, idx] = picked.split(':');
	const res = attackMosje(state, playerId, { attackerSlotIndex: slotIndex, targetPlayerId, targetSlotIndex: Number(idx) });
	if (!res.ok) {
		await modal.showOptionSelect({ title: 'Cannot attack', prompt: res.error, options: [{ id: 'ok', label: 'OK' }] });
		return none;
	}
	const attacker = state.players[playerId].activeSlots[slotIndex].name;
	const target = state.players[targetPlayerId].activeSlots[Number(idx)].name;
	if (res.reactionPending) {
		const settled = await settle(res.state);
		return { state: settled, log: [`${attacker} attacks ${target}`] };
	}
	return { state: res.state, log: [`${attacker} attacks ${target}: Power ${res.power}, -${res.final} MP`] };
}
