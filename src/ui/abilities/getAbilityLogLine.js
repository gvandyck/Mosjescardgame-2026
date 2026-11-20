// getAbilityLogLine.js — the battle-log line for an ability use (72-10, D-11).
// "<Mosje> uses <abilityName>" or "<Mosje> uses its ability".
export function getAbilityLogLine(def) {
	const who = String(def?.name || 'Mosje');
	const named = String(def?.abilityName || '').trim();
	return named ? `${who} uses ${named}` : `${who} uses its ability`;
}
