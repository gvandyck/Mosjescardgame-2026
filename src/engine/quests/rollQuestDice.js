// rollQuestDice — roll `count` d6 with an injectable rng.
export function rollQuestDice(count, rng = Math.random) {
	return Array.from({ length: count }, () => Math.floor(rng() * 6) + 1);
}
