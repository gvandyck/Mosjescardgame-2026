// attackMosje — "taksen": the attacker's Power is an MP loss on the target (can getemt).
import { loseMP } from '../mpManager.js';
import { checkVictory } from '../victoryChecker.js';
import { getPower } from '../mp/getPower.js';
import { isFresh } from '../fresh/isFresh.js';
import { canMosjeTakeAction } from './canMosjeTakeAction.js';
import { isValidAttackTarget } from './isValidAttackTarget.js';
import { ATTACK_TRIGGERS } from '../attack/attackTriggers.js';

export function attackMosje(state, playerId, { attackerSlotIndex, targetPlayerId, targetSlotIndex }) {
  const fail = (error) => ({ state, ok: false, error });
  const gate = canMosjeTakeAction(state, playerId, attackerSlotIndex);
  if (!gate.ok) return fail(gate.error);
  if (isFresh(state.players[playerId].activeSlots[attackerSlotIndex])) return fail('A fresh Mosje cannot attack');
  if (!isValidAttackTarget(state, playerId, targetPlayerId, targetSlotIndex)) return fail('Invalid attack target');

  let s = JSON.parse(JSON.stringify(state));
  const attacker = s.players[playerId].activeSlots[attackerSlotIndex];
  attacker.actedThisTurn = true;
  attacker.attackedThisTurn = true;
  const power = getPower(attacker);
  let final = 0;
  if (power > 0) {
    const ctx = { state: s, attackerPlayerId: playerId, attackerSlotIndex, targetPlayerId, targetSlotIndex, amount: power };
    let amount = power;
    for (const step of ATTACK_TRIGGERS.modifyAmount) amount = step({ ...ctx, amount });
    const before = s.players[targetPlayerId].activeSlots[targetSlotIndex].mpLostThisTurn || 0;
    s = loseMP(s, targetPlayerId, targetSlotIndex, amount, 'ATTACK', false, playerId);
    final = (s.players[targetPlayerId].activeSlots[targetSlotIndex].mpLostThisTurn || 0) - before;
    for (const step of ATTACK_TRIGGERS.afterLoss) {
      s = step({ state: s, attackerPlayerId: playerId, attackerSlotIndex, targetPlayerId, targetSlotIndex, final });
    }
  }
  console.log(`[ATTACK] ${attacker.name} taksed ${s.players[targetPlayerId].activeSlots[targetSlotIndex]?.name} for ${final}`);
  s = checkVictory(s);
  return { state: s, ok: true, power, final };
}
