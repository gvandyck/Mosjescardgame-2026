// makeEngineState.js — Obby 2.0 engine-state builder for vitest (not a test file).
// Plain 2-player state; overrides are deep-merged (arrays replaced, not merged).
function merge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return source === undefined ? target : source;
  }
  const out = { ...target };
  for (const key of Object.keys(source)) {
    const base = target ? target[key] : undefined;
    const isObj = base && typeof base === 'object' && !Array.isArray(base);
    out[key] = isObj ? merge(base, source[key]) : source[key];
  }
  return out;
}

function basePlayer(playerId, name) {
  return {
    playerId,
    name,
    hand: [],
    deck: [],
    graveyard: [],
    welloePile: [],
    energy: 6,
    activeSlots: [null, null],
    piecieSlots: [null, null, null, null],
    totalDamageTaken: 0,
  };
}

export function makeEngineState(overrides = {}) {
  const base = {
    status: 'PLAYING',
    turnNumber: 1,
    activePlayerId: 'player_1',
    winnerId: null,
    winReason: null,
    activePlace: null,
    players: {
      player_1: basePlayer('player_1', 'Player One'),
      player_2: basePlayer('player_2', 'Player Two'),
    },
  };
  return merge(base, overrides);
}
