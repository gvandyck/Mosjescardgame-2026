// rollOpeningDice — 1 d6 each, highest goes first, ties reroll (only the tied players).
import { rollDie } from '../deckEngine.js';

export function rollOpeningDice(playerIds, roll = () => rollDie(6)) {
  const rolls = [];
  let contenders = [...playerIds];
  for (let guard = 0; guard < 100; guard++) {
    const round = contenders.map(playerId => ({ playerId, value: roll(playerId) }));
    rolls.push(...round);
    const top = Math.max(...round.map(r => r.value));
    const winners = round.filter(r => r.value === top);
    if (winners.length === 1) return { firstPlayerId: winners[0].playerId, rolls };
    contenders = winners.map(w => w.playerId);
  }
  return { firstPlayerId: playerIds[0], rolls };
}
