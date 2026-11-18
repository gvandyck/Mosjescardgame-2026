// ATTACK_TRIGGERS — registry for attack triggers (push-only; Phase 57 adds reaction windows).
//   modifyAmount: (ctx) => number   (before the loss; ctx.amount is the running amount)
//   afterLoss:    (ctx) => state    (ctx.final = MP actually lost)
//   afterAttack:  (ctx) => state    (once per attack, after all hits, also at Power 0; ctx = { state, attackerPlayerId, attackerSlotIndex })
import { flowTaksedReducer } from './flowTaksedReducer.js';
import { unstoppableTrigger } from './unstoppableTrigger.js';
import { welloeForceThorns } from './welloeForceThorns.js';
import { momentumDiefjeGain } from './momentumDiefjeGain.js';
import { mpHemorrhageMark } from './mpHemorrhageMark.js';
import { rugbybalAttackGain } from './rugbybalAttackGain.js';

export const ATTACK_TRIGGERS = {
  modifyAmount: [flowTaksedReducer],
  afterLoss: [unstoppableTrigger, welloeForceThorns, momentumDiefjeGain, mpHemorrhageMark],
  afterAttack: [rugbybalAttackGain],
};
