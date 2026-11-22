// buildCountBadge.js - the one count badge a phone tile shows instead of the chip row and the tag lines (72.1-04, D-05, D-13).
// ({ attachments, effects }) -> { text: '2 gear, 1 effect', compact: '2+1', label: aria text } or null when nothing is attached.
// Counts and fixed words only (no card names), so nothing needs escaping and nothing hidden is read (T-72.1-07, T-72.1-08).
const count = (n) => { const v = Math.trunc(Number(n)); return Number.isFinite(v) && v > 0 ? v : 0; };

export function buildCountBadge({ attachments, effects } = {}) {
	const a = count(attachments);
	const e = count(effects);
	if (!a && !e) return null;
	const gear = `${a} gear`;
	const fx = `${e} ${e === 1 ? 'effect' : 'effects'}`;
	const att = `${a} ${a === 1 ? 'attachment' : 'attachments'}`;
	return {
		text: a && e ? `${gear}, ${fx}` : a ? gear : fx,
		compact: a && e ? `${a}+${e}` : String(a || e),
		label: a && e ? `${att}, ${fx}` : a ? att : fx,
	};
}
