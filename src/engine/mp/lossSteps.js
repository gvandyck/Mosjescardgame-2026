// LOSS_STEPS — the registry for one MP loss, in handoff §2g order.
// Later phases register by push(), never by editing loseMP.
//   beforeLoss: (ctx) => void   (Emergency Healings hook)
//   base / reducers / caps: (ctx) => number
import { drainZoneBonus } from './lossSteps/drainZoneBonus.js';
import { zoIsNatuurReducer } from './lossSteps/zoIsNatuurReducer.js';
import { coertsCaravanShield } from './lossSteps/coertsCaravanShield.js';
import { halvedLossReducer } from './lossSteps/halvedLossReducer.js';
import { statusReductionReducer } from './lossSteps/statusReductionReducer.js';
import { staysBoundReducer } from './lossSteps/staysBoundReducer.js';
import { snelleReactionReducer } from './lossSteps/snelleReactionReducer.js';
import { emergencyHealingsStep } from './lossSteps/emergencyHealingsStep.js';
import { momentumStabilizerCap } from './lossSteps/momentumStabilizerCap.js';

export const LOSS_STEPS = {
  beforeLoss: [emergencyHealingsStep],
  base: [drainZoneBonus],
  reducers: [zoIsNatuurReducer, coertsCaravanShield, halvedLossReducer, statusReductionReducer, staysBoundReducer, snelleReactionReducer],
  caps: [momentumStabilizerCap],
};
