// testHelpers.js
// Shared utilities for browser-based tests.

export const results = [];

export function clearResults() {
  results.length = 0;
}

// Run a single test and record result
export function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`[TEST] PASS - ${name}`);
  } catch (err) {
    const message = err?.message || String(err);
    results.push({ name, passed: false, error: message });
    console.error(`[TEST] FAIL - ${name}: ${message}`);
  }
}

// Assertion helpers
export function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertTrue(value, msg) {
  if (!value) throw new Error(msg || `Expected true, got ${JSON.stringify(value)}`);
}

export function assertFalse(value, msg) {
  if (value) throw new Error(msg || `Expected false, got ${JSON.stringify(value)}`);
}

export function assertGreaterThan(actual, threshold, msg) {
  if (actual <= threshold) {
    throw new Error(msg || `Expected ${actual} to be greater than ${threshold}`);
  }
}

export function assertLessThan(actual, threshold, msg) {
  if (actual >= threshold) {
    throw new Error(msg || `Expected ${actual} to be less than ${threshold}`);
  }
}

export function assertDefined(value, msg) {
  if (typeof value === 'undefined') {
    throw new Error(msg || 'Expected value to be defined');
  }
}

// Legacy-style mock state requested in the brief.
// Individual tests can override fields.
export function mockState(overrides = {}) {
  const base = {
    roomId: 'TEST_ROOM',
    currentTurn: 'player_1',
    phase: 'MAIN',
    turnNumber: 1,
    players: {
      player_1: {
        hand: [],
        deck: ['piecie_kannetje_melk', 'piecie_broodje_doner'],
        discard: [],
        welloe: [],
        activeSlots: ['inst_west', null],
        piecieSlots: [null, null, null, null, null],
        activePlaceId: null,
        questsCompleted: 0
      },
      player_2: {
        hand: [],
        deck: [],
        discard: [],
        welloe: [],
        activeSlots: ['inst_jeffrey', null],
        piecieSlots: [null, null, null, null, null],
        activePlaceId: null,
        questsCompleted: 0
      }
    },
    mosjeStates: {
      inst_west: {
        cardId: 'mosje_west',
        ownerId: 'player_1',
        level: 1,
        mp: 15,
        statusEffects: [],
        isFaceDown: false,
        defeated: false,
        abilitiesUsedThisTurn: []
      },
      inst_jeffrey: {
        cardId: 'mosje_jeffrey',
        ownerId: 'player_2',
        level: 1,
        mp: 20,
        statusEffects: [],
        isFaceDown: false,
        defeated: false,
        abilitiesUsedThisTurn: []
      }
    },
    piecieStates: {},
    sharedGeneralQuestDeck: ['quest_arm_wrestling', 'quest_quick_thinking'],
    sharedGeneralQuestDiscard: [],
    sharedPlaceSlot: null,
    log: [],
    winner: null
  };

  return deepMerge(base, overrides);
}

// Engine-format state helper for Phase 3 modules.
// This mirrors the current src/engine shape.
export function createEngineState(overrides = {}) {
  const base = {
    roomCode: '1234',
    status: 'PLAYING',
    turnNumber: 1,
    activePlayerId: 'player_1',
    winnerId: null,
    winReason: null,
    momentumCheckPhase: false,
    sharedGeneralQuestDeck: [
      { cardId: 'quest_arm_wrestling', type: 'QUEST' },
      { cardId: 'quest_quick_thinking', type: 'QUEST' }
    ],
    sharedGeneralQuestDiscard: [],
    activePlace: null,
    activePlacePlayedBy: null,
    activePlaceTurnsActive: 0,
    sharedPlaceDiscard: [],
    players: {
      player_1: {
        playerId: 'player_1',
        name: 'Player One',
        deckId: 'DIGITAL_CONTROL',
        hand: [{ cardId: 'quest_west_perfect_read', type: 'QUEST', questType: 'PERSONAL' }],
        deck: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
        discard: [],
        welloe: [],
        activeSlots: [
          {
            cardId: 'mosje_west',
            name: '[West] Sr.Tactical',
            traits: { mental: 3, technical: 1 },
            mp: 15,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false
          },
          null
        ],
        piecieSlots: [null, null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        totalDamageTaken: 0,
        questPrepBonus: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false
      },
      player_2: {
        playerId: 'player_2',
        name: 'Player Two',
        deckId: 'PHYSICAL_FORCE',
        hand: [],
        deck: [{ cardId: 'piecie_affoe', type: 'PIECIE' }],
        discard: [],
        welloe: [],
        activeSlots: [
          {
            cardId: 'mosje_jeffrey',
            name: '[Jeffrey] The Strongman',
            traits: { physical: 3, resilient: 1 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false
          },
          null
        ],
        piecieSlots: [null, null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        totalDamageTaken: 0,
        questPrepBonus: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false
      }
    }
  };

  return deepMerge(base, overrides);
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return source === undefined ? target : source;
  }

  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = out[key];
    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      out[key] = deepMerge(tgtVal || {}, srcVal);
    } else {
      out[key] = srcVal;
    }
  }
  return out;
}
