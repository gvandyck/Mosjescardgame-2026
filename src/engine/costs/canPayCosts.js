// canPayCosts - can every cost in the list be paid right now? Pure. Returns { ok } or { ok: false, reason }.
// An unknown kind is refused, never ignored.
import { COST_KINDS } from './costKinds.js';

export function canPayCosts(ctx, costs, choice = {}) {
	for (const cost of costs || []) {
		const kind = Object.prototype.hasOwnProperty.call(COST_KINDS, cost?.kind) ? COST_KINDS[cost.kind] : null;
		if (!kind) return { ok: false, reason: `Unknown cost kind: ${cost?.kind}` };
		const r = kind.canPay(ctx, cost, choice || {});
		if (r !== true) return { ok: false, reason: r };
	}
	return { ok: true };
}
