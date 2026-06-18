// Game rule: MP always lands on a multiple of 5. Whenever an effect halves or
// scales MP (loss-halving, %-reduction, 1.5× amplifier, half-reward), round the
// result to the NEAREST 5 — up or down depending on the value.
export function roundToFive(n) {
	return Math.round(n / 5) * 5;
}
