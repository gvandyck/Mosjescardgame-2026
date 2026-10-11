// Coert's Caravan: a Coert Mosje shrugs off up to 40 Quest damage per turn.
function isCoertMosje(mosje) {
  return String(mosje?.cardId || mosje?.mosjeId || '').toLowerCase().includes('coert');
}

function isQuestDamageSource(source) {
  const label = String(source || '');
  return label.startsWith('QUEST') && !label.includes('COST');
}

export function coertsCaravanShield(ctx) {
  const { state, slot, placeId, source, amount } = ctx;
  if (placeId !== 'place_coerts_caravan' || !isCoertMosje(slot) || !isQuestDamageSource(source)) {
    return amount;
  }
  const currentTurn = state.turnNumber ?? 0;
  const shield = slot._coertsCaravanQuestShield || { turnNumber: currentTurn, used: 0 };
  const usedThisTurn = shield.turnNumber === currentTurn ? shield.used || 0 : 0;
  const remainingShield = Math.max(0, 40 - usedThisTurn);
  const prevented = Math.min(amount, remainingShield);
  if (prevented <= 0) return amount;
  slot._coertsCaravanQuestShield = { turnNumber: currentTurn, used: usedThisTurn + prevented };
  console.log(`[MP] Coert's Caravan: prevented ${prevented} Quest damage for ${slot.name} (${40 - (usedThisTurn + prevented)} shield left this turn)`);
  return Math.max(0, amount - prevented);
}
