// runKeywordHook - run the hook registered for (keyword, cardId), if any, on the cloned state the caller holds.
// The caller's state object is always the one returned and updated in place, so callers that mutate in place keep working.
// A hook that throws is logged and the state before the hook is kept.
import { KEYWORD_HOOKS } from './keywordHooks.js';

const replaceContents = (target, source) => {
	if (target === source) return;
	for (const k of Object.keys(target)) delete target[k];
	Object.assign(target, source);
};

export function runKeywordHook(state, keyword, cardId, ctx = {}) {
	const fn = KEYWORD_HOOKS[keyword]?.[cardId];
	if (typeof fn !== 'function' || !state) return state;
	const before = JSON.parse(JSON.stringify(state));
	try {
		const out = fn(state, ctx);
		if (out && typeof out === 'object') replaceContents(state, out);
	} catch (err) {
		console.error(`[ENGINE] ${keyword} hook for ${cardId} threw, state kept:`, err?.message || err);
		replaceContents(state, before);
	}
	return state;
}
