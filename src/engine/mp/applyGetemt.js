// applyGetemt — Called when a real MP loss leaves a Mosje at 0 MP or less.
//   Level 2-3: drop one Level at 10 MP.   Level 1 upright: MP 0, sideways.
//   Level 1 already sideways: flag for the Welloe pile (swept by applyPendingDefeats).
import { refreshLevelTraits } from './refreshLevelTraits.js';
import { MP_AFTER_GETEMT } from './levelRules.js';

export function applyGetemt(slot) {
  if (slot.level >= 2) {
    slot.level -= 1;
    slot.mp = MP_AFTER_GETEMT;
    refreshLevelTraits(slot);
    return 'dropped';
  }
  slot.mp = 0;
  if (slot.sideways === true) {
    slot._pendingWelloe = true;
    return 'welloe';
  }
  slot.sideways = true;
  return 'sideways';
}
