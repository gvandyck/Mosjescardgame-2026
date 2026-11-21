// computePhoneScales.js — the opponent-first scale solver of the phone table (Phase 65-05, D-05). Pure: numbers in, numbers out.
// available = the board height we may use; full / oppMin / bothMin = the table's content height at (opp 1, me 1), (opp minOpp,
// me 1) and (opp minOpp, me minMe). The opponent's side (and the Place) shrink first, down to minOpp; only when that is not
// enough does my side (and the Quests) shrink, down to minMe. When even that does not fit it returns both minimums and the
// board scrolls inside itself. Between two measured points the height is treated as linear in the scale. Results are rounded
// to 3 decimals and clamped to [min, 1]; bad input (NaN, missing, zero height) returns { opp: 1, me: 1 }.
const ONE = { opp: 1, me: 1 };

const round3 = (value) => Math.round(value * 1000) / 1000;
const clamp = (value, min) => Math.min(1, Math.max(min, round3(value)));
const ratio = (min, over, span) => 1 - (1 - min) * (over / span);

export function computePhoneScales({ available, full, oppMin, bothMin, minOpp = 0.7, minMe = 0.9 } = {}) {
	if (![available, full, oppMin, bothMin, minOpp, minMe].every(Number.isFinite) || available <= 0) return { ...ONE };
	const lowOpp = Math.min(1, Math.max(0, minOpp));
	const lowMe = Math.min(1, Math.max(0, minMe));

	if (full <= available) return { ...ONE };
	if (oppMin <= available) return { opp: clamp(ratio(lowOpp, full - available, full - oppMin), lowOpp), me: 1 };
	if (bothMin <= available) return { opp: lowOpp, me: clamp(ratio(lowMe, oppMin - available, oppMin - bothMin), lowMe) };
	return { opp: lowOpp, me: lowMe };
}
