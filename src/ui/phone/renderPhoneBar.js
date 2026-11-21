// renderPhoneBar.js — writes the two numbers of the phone bottom bar (Phase 65-03, D-08): the hand size next to "Hand" and the
// Energy as "N/M". Plain text only (textContent), never innerHTML: the numbers come from engine state (T-65-04). Null-safe: a
// missing bar, a missing field or a missing number writes nothing wrong (a missing number reads 0).
export function renderPhoneBar(bar, { handCount, energy, max } = {}) {
	if (!bar) return;
	const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
	const count = bar.querySelector('[data-phone-hand-count]');
	const energyEl = bar.querySelector('[data-phone-energy]');
	if (count) count.textContent = String(num(handCount));
	if (energyEl) energyEl.textContent = `${num(energy)}/${num(max)}`;
}
