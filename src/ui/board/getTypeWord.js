// getTypeWord — the word for a Mosje type on screen (D-10): Physical, Digital, Creative. Unknown input: first letter up; never throws.
const WORDS = { PHYSICAL: 'Physical', DIGITAL: 'Digital', CREATIVE: 'Creative' };

export function getTypeWord(subtype) {
	const raw = String(subtype ?? '');
	if (WORDS[raw]) return WORDS[raw];
	const lower = raw.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}
