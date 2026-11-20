// getPersonalQuestPlayState - can this Personal Quest in hand be played now, and if not, why? (72-04, D-03, CC-4)
// Pure. Reads getPersonalQuestOptions / the engine's own sentences; nothing is re-implemented.
// Returns { ok, reason, mosjes: [{ slotIndex, ok, error? }] }; reason is '' when ok. One reason, the first that fails:
// not your turn, no Level 3 Mosje, then the engine's error for the Mosje that got furthest.
import { getPersonalQuestOptions } from '../../engine/personalQuests/getPersonalQuestOptions.js';
import { getPersonalQuestDef } from '../../engine/personalQuests/getPersonalQuestDef.js';

export function getPersonalQuestPlayState(state, playerId, cardId, { isLocalTurn = true } = {}) {
	const slots = state?.players?.[playerId]?.activeSlots || [];
	const mosjes = getPersonalQuestOptions(state, playerId)
		.filter(o => o.cardId === cardId)
		.map(({ slotIndex, ok, error }) => (ok ? { slotIndex, ok } : { slotIndex, ok, error }));
	const ok = mosjes.some(m => m.ok);
	if (!isLocalTurn) return { ok: false, reason: 'It is not your turn', mosjes };
	if (ok) return { ok: true, reason: '', mosjes };
	const level3 = mosjes.filter(m => slots[m.slotIndex]?.level === 3);
	if (!level3.length) return { ok: false, reason: 'You have no Level 3 Mosje', mosjes };
	const type = getPersonalQuestDef(cardId)?.mosjeType;
	const best = level3.find(m => slots[m.slotIndex]?.subtype === type) || level3[0];
	return { ok: false, reason: best.error || 'This Personal Quest cannot be played now', mosjes };
}
