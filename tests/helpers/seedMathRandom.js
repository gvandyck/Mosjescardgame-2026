// seedMathRandom.js - replace Math.random in the page with a seeded mulberry32 generator (64 D-26: reproducible bot games).
// Best-effort reproducibility: the page's UI code (animations, ids) also draws numbers from Math.random, so the same seed
// gives the same engine and bot dice only as long as the draw order does not shift. Seeding lives ONLY here, never in src/.
// The generator is inlined from tests/helpers/runSeededBotGame.js because the browser cannot import it.
export async function seedMathRandom(page, seed) {
	await page.addInitScript((initial) => {
		let s = initial;
		Math.random = function () {
			s |= 0; s = (s + 0x6D2B79F5) | 0;
			let t = Math.imul(s ^ (s >>> 15), 1 | s);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}, seed);
}
