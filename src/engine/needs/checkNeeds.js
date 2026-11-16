// checkNeeds - the one generic Needs checker (Personal Quests and cards): is every Need true? Stops at the first false
// one and says why. Returns { ok: true, picks } (picks merged from the kinds) or { ok: false, reason }. Never changes state.
import { NEED_KINDS } from './needKinds.js';

export function checkNeeds(ctx, needs = []) {
	const picks = {};
	for (const need of needs) {
		const kind = NEED_KINDS[need?.kind];
		if (!kind) return { ok: false, reason: `Unknown Need: ${need?.kind}` };
		const r = kind.check(ctx, need);
		if (!r.ok) return { ok: false, reason: r.reason };
		Object.assign(picks, r.picks || {});
	}
	return { ok: true, picks };
}
