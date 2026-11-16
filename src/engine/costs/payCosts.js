// payCosts - the ONE way to pay a list of costs (cards now; Personal Quest Pay lines later). Checks everything first
// (canPayCosts re-checks every choice against the state, T-70-07) and only then pays, in order, on the already cloned
// state in ctx. Returns { ok: true } or { ok: false, reason } with nothing changed.
import { COST_KINDS } from './costKinds.js';
import { canPayCosts } from './canPayCosts.js';

export function payCosts(ctx, costs, choice = {}) {
	const check = canPayCosts(ctx, costs, choice);
	if (!check.ok) return check;
	for (const cost of costs || []) COST_KINDS[cost.kind].pay(ctx, cost, choice || {});
	return { ok: true };
}
