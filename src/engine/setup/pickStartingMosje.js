// pickStartingMosje — Example Decks name their startingMosje; V4 decks fall back to a random Mosje.
export function pickStartingMosje(deckDef) {
  if (deckDef?.startingMosje) return deckDef.startingMosje;
  const pool = Array.isArray(deckDef?.mosjes) ? deckDef.mosjes.filter(Boolean) : [];
  if (pool.length === 0) throw new Error('[ENGINE] Starter deck has no Mosjes');
  return pool[Math.floor(Math.random() * pool.length)];
}
