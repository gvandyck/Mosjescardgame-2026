// queuedRng - the default rng of a Quest roll: a scripted die from the testMode queue when one is waiting, else Math.random.
// Real play never fills the queue, so this is Math.random there.
import { shiftTestDie } from './testDiceQueue.js';

export function queuedRng() {
	const v = shiftTestDie();
	return v != null ? (v - 0.5) / 6 : Math.random();
}
