// testDiceQueue — scripted die results for headless tests. Empty in real play:
// only a testMode hook (or a unit test) ever fills it, so rollDie stays Math.random.
const queue = [];

export function pushTestDice(values) {
	for (const v of values) queue.push(v);
}

export function shiftTestDie() {
	return queue.length ? queue.shift() : null;
}

export function clearTestDice() {
	queue.length = 0;
}
