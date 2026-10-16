// counterStrikkaOptions - where Counter Strikka can send a held Piecie that already has its target chosen
// (state._pendingTargets from the Piecie target table): { key, options } with the other legal Mosjes, or null.
// Only a target on the responder's side can be moved; an auto-picked Piecie with one legal target has no other one.
import { piecieTargetOptions } from '../../engine/targets/piecieTargetOptions.js';
import { heldPiecieDef } from '../../rules/heldPiecieDef.js';

export function counterStrikkaOptions(state, responderId, actorId, action) {
	const def = heldPiecieDef(state, action);
	if (!def) return null;
	for (const spec of piecieTargetOptions(state, actorId, def.id)) {
		if (spec.who === 'own') continue;
		const cur = state._pendingTargets?.[spec.key];
		const same = (o) => (spec.key === 'any_target' ? o.playerId === cur?.playerId && o.slotIndex === cur?.slotIndex : o.slotIndex === (cur ?? spec.options[0]?.slotIndex) && o.playerId !== actorId);
		const current = spec.options.find(same);
		if (!current || current.playerId !== responderId) continue;
		const options = spec.options.filter(o => o !== current);
		if (options.length) return { key: spec.key, options };
	}
	return null;
}
