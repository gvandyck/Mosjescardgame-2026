// describeTimedEffect.js - one stored timed effect -> its short tag text (72-06, D-07). '' for anything unknown (the tag is dropped).
// Reads kind, duration and amount only; no card ids, so later effects with the same kinds show up without a table.
const POWER_SUFFIX = {
	untilEndOfYourNextTurn: 'until end of next turn',
	thisTurn: 'this turn',
	duringOpponentsNextTurn: "during opponent's next turn",
	whileAttached: 'while attached',
	whilePlaceStays: 'while the Place stays',
};

export function describeTimedEffect(entry) {
	if (!entry || typeof entry !== 'object') return '';
	if (entry.kind === 'power') {
		const suffix = POWER_SUFFIX[entry.duration];
		const n = Number(entry.amount);
		if (!suffix || !Number.isFinite(n) || n === 0) return '';
		return `${n > 0 ? '+' : '\u2212'}${Math.abs(n)} Power ${suffix}`;
	}
	if (entry.kind === 'noLevelDrop' && entry.duration === 'untilEndOfYourNextTurn') return "Can't drop a level until end of next turn";
	return '';
}
