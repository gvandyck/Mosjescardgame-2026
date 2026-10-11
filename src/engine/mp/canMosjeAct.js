// canMosjeAct — Obby 2.0 §2b/§2c: a sideways Mosje takes no action (ability, Quest).
// Phase 56 hand-off: the attack action and the "one action per Mosje" rule must call this.
export function canMosjeAct(slot) {
  return !!slot && !slot.isDefeated && slot.sideways !== true;
}
