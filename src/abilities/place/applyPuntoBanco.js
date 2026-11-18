// Punto Banco (D-32) - once per turn per player, before a Quest roll: pay 1 Energy, call 'punto' or 'banco', one die each.
// The called side higher: +2 dice on that Quest. Tie: the Energy comes back. Loss: it stays spent.
// Works on the copy it is given; anything but a legal call, the right Place, a fresh turn and 1 Energy changes nothing.
import { payEnergy } from '../../engine/energy/payEnergy.js';
import { gainEnergy } from '../../engine/energy/gainEnergy.js';
import { rollQuestDice } from '../../engine/quests/rollQuestDice.js';

export function applyPuntoBanco(state, playerId, call, rng) {
	if (state.activePlace !== 'place_punto_banco') return { extraDice: 0 };
	if (call !== 'punto' && call !== 'banco') return { extraDice: 0 };
	const player = state.players[playerId];
	if (!player || player.puntoBancoTurn === state.turnNumber) return { extraDice: 0 };
	if (!payEnergy(state, playerId, 1).success) return { extraDice: 0 };
	player.puntoBancoTurn = state.turnNumber;
	const [punto, banco] = rollQuestDice(2, rng);
	const mine = call === 'punto' ? punto : banco;
	const theirs = call === 'punto' ? banco : punto;
	const result = mine > theirs ? 'won' : mine === theirs ? 'tie' : 'lost';
	if (result === 'tie') gainEnergy(state, playerId, 1);
	return { extraDice: result === 'won' ? 2 : 0, result: { call, punto, banco, result } };
}
