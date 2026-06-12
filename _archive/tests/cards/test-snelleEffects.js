import { test, assertDefined, assertEqual, assertTrue, assertFalse, createEngineState } from '../helpers/testHelpers.js';
import * as snelleEffects from '../../src/abilities/snelleEffects.js';

export function runSnelleEffectsTests() {
  console.log('[TEST] Running snelleEffects tests...');

  test('Snelle effects module exists', () => {
    assertDefined(snelleEffects, 'snelleEffects module failed to load');
  });

  test('Snelle Jensen applies to selected own Mosje when target is provided', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_gandoe',
              name: '[Gandoe] Prime',
              traits: { technical: 2 },
              mp: 9,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
      _pendingTargets: { own_slot_index: 1 },
    });

    const result = snelleEffects.effect_snelle_jensen(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
    assertEqual(result.players.player_1.activeSlots[1].mp, 29);
  });

  test('Emergency Healings gives +25 MP normally', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_emergency_healings(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 40);
  });

  test('Emergency Healings gives +35 MP when resilient is 2+', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_michelle',
              name: '[Michelle] Iron Tuk',
              traits: { physical: 2, resilient: 2 },
              mp: 10,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
      },
    });

    const result = snelleEffects.effect_emergency_healings(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 45);
  });

  test('FF Haaltje Nemen adds incoming MP loss reduction status', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_ff_haaltje_nemen(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].statusEffects.length, 1);
    assertEqual(result.players.player_1.activeSlots[0].statusEffects[0].type, 'MP_LOSS_REDUCTION');
    assertEqual(result.players.player_1.activeSlots[0].statusEffects[0].value, 20);
  });

  // ── Phase 9: new Snelle effects ──────────────────────────────

  test('Momentum Rush gives +15 MP', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_momentum_rush(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 30);
  });

  test('Bijna Welloe gives +20 MP when Mosje is at 10 MP or less', () => {
    const state = createEngineState({ players: { player_1: { activeSlots: [{ cardId: 'mosje_martin_senor_west', name: '[West]', traits: { mental: 3, technical: 1 }, mp: 8, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false }, null] } } });
    const result = snelleEffects.effect_snelle_bijna_welloe(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 28);
  });

  test('Bijna Welloe has no effect when Mosje is above 10 MP', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_bijna_welloe(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('Counter Strikka sets negateNextPiecie flag', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_counter_strikka(state, 'player_1');
    assertTrue(result._snelleFlags?.negateNextPiecie?.['player_1'] === true);
  });

  test('Perfect Dodge sets negateNextAttack flag', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_perfect_dodge(state, 'player_1');
    assertTrue(result._snelleFlags?.negateNextAttack?.['player_1'] === true);
  });

  test('Not Today! sets negateNextElimination flag', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_negate_elimination(state, 'player_1');
    assertTrue(result._snelleFlags?.negateNextElimination?.['player_1'] === true);
  });

  test('The Protector sets mpLossReduction flag to 30', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_the_protector(state, 'player_1');
    assertEqual(result._snelleFlags?.mpLossReduction?.['player_1'], 30);
  });

  test('Drain Reversal sets drainReversal flag', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_drain_reversal(state, 'player_1');
    assertTrue(result._snelleFlags?.drainReversal?.['player_1'] === true);
  });

  test('Je Weet Niet sets forceReroll flag on opponent', () => {
    const state = createEngineState({ activePlayerId: 'player_1' });
    const result = snelleEffects.effect_snelle_jeweetniet(state, 'player_1');
    assertTrue(result._snelleFlags?.forceReroll?.['player_2'] === true);
  });

  test('Sleutelpuntje sets questDiceBonus to 1', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_sleutelpuntje(state, 'player_1');
    assertEqual(result._snelleFlags?.questDiceBonus, 1);
  });

  test('Sleutelpuntje stacks with existing bonus', () => {
    const state = createEngineState();
    state._snelleFlags = { questDiceBonus: 1 };
    const result = snelleEffects.effect_snelle_sleutelpuntje(state, 'player_1');
    assertEqual(result._snelleFlags?.questDiceBonus, 2);
  });

  test('Jantje Jantje Jantje steals 30 MP when Bank Chilling active', () => {
    const state = createEngineState({ activePlace: { id: 'place_bank_chilling', name: 'Bank Chilling' } });
    const result = snelleEffects.effect_snelle_jantje_jantje_jantje(state, 'player_1');
    assertEqual(result.players.player_2.activeSlots[0].mp, 20 - 30); // Jeffrey starts at 20
    assertEqual(result.players.player_1.activeSlots[0].mp, 15 + 30);
  });

  test('Jantje Jantje Jantje has no effect without Bank Chilling', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_jantje_jantje_jantje(state, 'player_1');
    assertEqual(result.players.player_2.activeSlots[0].mp, 20);
  });

  test('Dubbele Temminks sets doubleNextPiecie flag', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_dubbele_temminks(state, 'player_1');
    assertTrue(result._snelleFlags?.doubleNextPiecie?.['player_1'] === true);
  });

  test('Frenssen adds entry to counterChain stack', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_frenssen(state, 'player_1');
    assertEqual(result._snelleFlags?.counterChain?.length, 1);
    assertEqual(result._snelleFlags.counterChain[0].card, 'frenssen');
  });

  test('Blensen adds entry to counterChain stack', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_blensen(state, 'player_1');
    assertEqual(result._snelleFlags?.counterChain?.length, 1);
    assertEqual(result._snelleFlags.counterChain[0].card, 'blensen');
  });

  // ── Lucky Coin full implementation ───────────────────────────────────────
  test('Lucky Coin heads: sets forceReroll flag for player', () => {
    assertDefined(snelleEffects.effect_snelle_lucky_coin, 'effect_snelle_lucky_coin missing');
    const state = createEngineState({
      _pendingTargets: { lucky_coin_result: 'heads' },
    });
    const result = snelleEffects.effect_snelle_lucky_coin(state, 'player_1');
    assertTrue(result._snelleFlags?.forceReroll?.['player_1'] === true, 'Should set forceReroll flag on heads');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15, 'Should not change MP on heads');
  });

  test('Lucky Coin tails: deducts 10 MP from active Mosje', () => {
    const state = createEngineState({
      _pendingTargets: { lucky_coin_result: 'tails' },
    });
    const result = snelleEffects.effect_snelle_lucky_coin(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 5, 'Should lose 10 MP on tails');
    assertFalse(result._snelleFlags?.forceReroll?.['player_1'] === true, 'Should not set forceReroll flag on tails');
  });

  test('Lucky Coin tails: uses lucky_coin_tails_slot when set', () => {
    const state = createEngineState({
      _pendingTargets: { lucky_coin_result: 'tails', lucky_coin_tails_slot: 1 },
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West]',
              traits: { mental: 3, technical: 1 },
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_coert_tech',
              name: '[Coert]',
              traits: { mental: 2, technical: 3, social: 1 },
              mp: 20,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
    });
    const result = snelleEffects.effect_snelle_lucky_coin(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 30, 'Slot 0 should be unaffected');
    assertEqual(result.players.player_1.activeSlots[1].mp, 10, 'Slot 1 should lose 10 MP');
  });

  // ── Jantje Jantje Jantje (const/let bug fix) ─────────────────────────────
  test('Jantje Jantje Jantje: no crash when Bank Chilling is active', () => {
    assertDefined(
      snelleEffects.effect_snelle_jantje_jantje_jantje,
      'effect_snelle_jantje_jantje_jantje missing'
    );
    const state = createEngineState({
      activePlace: 'place_bank_chilling',
      players: {
        player_1: {
          activeSlots: [{
            cardId: 'mosje_martin_senor_west',
            name: '[West]',
            traits: { mental: 3 },
            mp: 50, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false,
          }, null],
        },
        player_2: {
          activeSlots: [{
            cardId: 'mosje_jeffrey',
            name: '[Jeffrey]',
            traits: { physical: 3 },
            mp: 50, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false,
          }, null],
        },
      },
    });
    let result;
    let threw = false;
    try {
      result = snelleEffects.effect_snelle_jantje_jantje_jantje(state, 'player_1');
    } catch {
      threw = true;
    }
    assertFalse(threw, 'effect_snelle_jantje_jantje_jantje should not throw');
    assertEqual(result.players.player_2.activeSlots[0].mp, 20, 'opponent should lose 30 MP (50→20)');
    assertEqual(result.players.player_1.activeSlots[0].mp, 80, 'own Mosje should gain 30 MP (50→80)');
  });

  test('Jantje Jantje Jantje: no effect when Bank Chilling is NOT active', () => {
    const state = createEngineState({
      activePlace: null,
      players: {
        player_1: { activeSlots: [{ cardId: 'mosje_x', name: 'X', traits: {}, mp: 50, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false }, null] },
        player_2: { activeSlots: [{ cardId: 'mosje_y', name: 'Y', traits: {}, mp: 50, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false }, null] },
      },
    });
    const result = snelleEffects.effect_snelle_jantje_jantje_jantje(state, 'player_1');
    assertEqual(result.players.player_2.activeSlots[0].mp, 50, 'opponent MP unchanged without Bank Chilling');
    assertEqual(result.players.player_1.activeSlots[0].mp, 50, 'own MP unchanged without Bank Chilling');
  });

  // ── Blensen free-cost flag ───────────────────────────────────────────────
  test('Blensen: sets blensenIsFreeThisActivation when last counterChain entry is frenssen', () => {
    assertDefined(
      snelleEffects.effect_snelle_blensen,
      'effect_snelle_blensen missing'
    );
    const state = createEngineState({
      _snelleFlags: {
        counterChain: [{ playerId: 'player_1', card: 'frenssen' }],
      },
    });
    const result = snelleEffects.effect_snelle_blensen(state, 'player_2');
    assertTrue(
      result._snelleFlags.blensenIsFreeThisActivation === true,
      'blensenIsFreeThisActivation should be true when countering Frenssen'
    );
  });

  test('Blensen: does NOT set blensenIsFreeThisActivation when counterChain is empty', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_snelle_blensen(state, 'player_1');
    assertFalse(
      result._snelleFlags?.blensenIsFreeThisActivation === true,
      'blensenIsFreeThisActivation should NOT be set when counterChain is empty'
    );
  });

  test('Blensen: does NOT set blensenIsFreeThisActivation when last chain entry is not frenssen', () => {
    const state = createEngineState({
      _snelleFlags: {
        counterChain: [{ playerId: 'player_2', card: 'blensen' }],
      },
    });
    const result = snelleEffects.effect_snelle_blensen(state, 'player_1');
    assertFalse(
      result._snelleFlags?.blensenIsFreeThisActivation === true,
      'blensenIsFreeThisActivation should NOT be set when countering a non-Frenssen'
    );
  });

  test('Blensen: always pushes own entry to counterChain', () => {
    const state = createEngineState({
      _snelleFlags: { counterChain: [{ playerId: 'player_1', card: 'frenssen' }] },
    });
    const result = snelleEffects.effect_snelle_blensen(state, 'player_2');
    const chain = result._snelleFlags.counterChain;
    assertEqual(chain.length, 2, 'counterChain should have 2 entries');
    assertEqual(chain[1].card, 'blensen', 'last entry should be blensen');
    assertEqual(chain[1].playerId, 'player_2', 'last entry should be player_2');
  });
}
