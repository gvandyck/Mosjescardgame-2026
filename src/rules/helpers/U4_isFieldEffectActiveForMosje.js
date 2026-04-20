export function U4_isFieldEffectActiveForMosje(mosjeState) {
  if (!mosjeState) return false;
  if (mosjeState.onField !== true) return false;
  if (mosjeState.inWelloe === true) return false;
  return true;
}
