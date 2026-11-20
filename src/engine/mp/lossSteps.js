// LOSS_STEPS — the registry for one MP loss, in handoff §2g order.
// Later phases register by push(), never by editing loseMP.
//   beforeLoss: (ctx) => void   (hook, empty since 2.1)
//   base / reducers / caps: (ctx) => number
import { zoIsNatuurReducer } from './lossSteps/zoIsNatuurReducer.js';
import { halvedLossReducer } from './lossSteps/halvedLossReducer.js';
import { statusReductionReducer } from './lossSteps/statusReductionReducer.js';
import { staysBoundReducer } from './lossSteps/staysBoundReducer.js';
import { snelleReactionReducer } from './lossSteps/snelleReactionReducer.js';
import { momentumStabilizerCap } from './lossSteps/momentumStabilizerCap.js';
import { resilientDefence } from './lossSteps/resilientDefence.js';

export const LOSS_STEPS = {
  beforeLoss: [],
  base: [],
  reducers: [zoIsNatuurReducer, halvedLossReducer, statusReductionReducer, staysBoundReducer, snelleReactionReducer],
  caps: [momentumStabilizerCap],
  defence: [resilientDefence],
};
