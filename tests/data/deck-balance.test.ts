// BAL-02, BAL-03, BAL-04: Data integrity checks for deck compositions and quest economy
// Filled in by Plan 02 (quest data) and Plan 05 (deck composition)
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';
// @ts-expect-error — JS module, no type declarations
import { QUESTS } from '../../src/data/quests.js';
// @ts-expect-error — JS module, no type declarations
import { PLACES } from '../../src/data/places.js';
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-expect-error — JS module, no type declarations
import { effect_de_box, effect_tesla, effect_eendjes_voeren } from '../../src/abilities/placeEffects.js';
// @ts-expect-error — JS module, no type declarations
import { getKickboxingBootcampDiceBonus, getMosjeTrait } from '../../src/abilities/questLogic.js';

describe('deck balance data integrity', () => {
  describe('quest economy (BAL-04)', () => {
    it('no quest has failMP worse than -20', () => {
      const violations = QUESTS.filter((q: { failMP: number }) => q.failMP < -20);
      expect(violations).toEqual([]);
    });

    it('all quests have successMP of at least 40', () => {
      const violations = QUESTS.filter((q: { successMP: number }) => q.successMP < 40);
      expect(violations).toEqual([]);
    });
  });

  describe('Digital Control deck (BAL-01)', () => {
    it('deck contains piecie_keyboard', () => {
      const dc = STARTER_DECKS.find((d: { id: string }) => d.id === 'DIGITAL_CONTROL');
      expect(dc?.piecies).toContain('piecie_keyboard');
    });

    it('deck contains piecie_controller', () => {
      const dc = STARTER_DECKS.find((d: { id: string }) => d.id === 'DIGITAL_CONTROL');
      expect(dc?.piecies).toContain('piecie_controller');
    });
  });

  describe('Physical Force deck (BAL-02)', () => {
    it('deck contains piecie_tikker', () => {
      const pf = STARTER_DECKS.find((d: { id: string }) => d.id === 'PHYSICAL_FORCE');
      expect(pf?.piecies).toContain('piecie_tikker');
    });
  });

  describe('Artistic Rhythm deck (BAL-03)', () => {
    it('deck contains piecie_grammetje_pieter', () => {
      const ar = STARTER_DECKS.find((d: { id: string }) => d.id === 'ARTISTIC_RHYTHM');
      expect(ar?.piecies).toContain('piecie_grammetje_pieter');
    });
  });
});

describe('Phase 15 — Physical Force rework (DECK-01/02/03/04)', () => {
  const pf = () => STARTER_DECKS.find((d: { id: string }) => d.id === 'PHYSICAL_FORCE');

  it('mosjes contains mosje_gandoe_destroyer', () => {
    expect(pf()?.mosjes).toContain('mosje_gandoe_destroyer');
  });
  it('mosjes contains mosje_michelle', () => {
    expect(pf()?.mosjes).toContain('mosje_michelle');
  });
  it('mosjes does NOT contain mosje_jeffrey', () => {
    expect(pf()?.mosjes).not.toContain('mosje_jeffrey');
  });
  it('piecies contains piecie_boxing_gloves', () => {
    expect(pf()?.piecies).toContain('piecie_boxing_gloves');
  });
  it('piecies contains piecie_bowie_stormey', () => {
    expect(pf()?.piecies).toContain('piecie_bowie_stormey');
  });
  it('piecies contains piecie_dikke_jonko', () => {
    expect(pf()?.piecies).toContain('piecie_dikke_jonko');
  });
  it('piecies does NOT contain piecie_eendjes_voeren (it is now a place)', () => {
    expect(pf()?.piecies).not.toContain('piecie_eendjes_voeren');
  });
  it('piecies contains piecie_laat_me_chillen', () => {
    expect(pf()?.piecies).toContain('piecie_laat_me_chillen');
  });
  it('piecies contains piecie_protein_shake', () => {
    expect(pf()?.piecies).toContain('piecie_protein_shake');
  });
  it('piecies contains piecie_quest_prep', () => {
    expect(pf()?.piecies).toContain('piecie_quest_prep');
  });
  it('piecies contains piecie_tikker', () => {
    expect(pf()?.piecies).toContain('piecie_tikker');
  });
  it('snellePiecies contains snelle_negate_elimination', () => {
    expect(pf()?.snellePiecies).toContain('snelle_negate_elimination');
  });
  it('places contains place_boxing_ring', () => {
    expect(pf()?.places).toContain('place_boxing_ring');
  });
  it('places contains place_de_box', () => {
    expect(pf()?.places).toContain('place_de_box');
  });
  it('quests contains quest_personal_kickboxing_bootcamp', () => {
    expect(pf()?.quests).toContain('quest_personal_kickboxing_bootcamp');
  });
});

describe('Phase 15 — place_de_box card definition (DECK-03)', () => {
  const deBox = () => PLACES.find((p: { id: string }) => p.id === 'place_de_box');

  it('PLACES contains place_de_box', () => {
    expect(deBox()).toBeDefined();
  });
  it('place_de_box has trigger END_PHASE', () => {
    expect(deBox()?.trigger).toBe('END_PHASE');
  });
  it('place_de_box has effectId effect_de_box', () => {
    expect(deBox()?.effectId).toBe('effect_de_box');
  });
  it('place_de_box has isBoosterOnly false', () => {
    expect(deBox()?.isBoosterOnly).toBe(false);
  });
});

describe('Phase 15 — quest_personal_kickboxing_bootcamp definition (DECK-04)', () => {
  const kb = () => QUESTS.find((q: { id: string }) => q.id === 'quest_personal_kickboxing_bootcamp');

  it('QUESTS contains quest_personal_kickboxing_bootcamp', () => {
    expect(kb()).toBeDefined();
  });
  it('quest_personal_kickboxing_bootcamp has requiredMosjeId mosje_michelle', () => {
    expect(kb()?.requiredMosjeId).toBe('mosje_michelle');
  });
  it('quest_personal_kickboxing_bootcamp has successMP 80', () => {
    expect(kb()?.successMP).toBe(80);
  });
  it('quest_personal_kickboxing_bootcamp has failMP -20', () => {
    expect(kb()?.failMP).toBe(-20);
  });
  it('quest_personal_kickboxing_bootcamp has isBoosterOnly false', () => {
    expect(kb()?.isBoosterOnly).toBe(false);
  });
});

describe('Phase 15 — effect_de_box (DECK-16)', () => {
  function makeState(mosjes: Array<{ cardId: string; isDefeated?: boolean }>) {
    return {
      players: {
        player_1: {
          activeSlots: mosjes.map(m => ({
            cardId: m.cardId,
            isDefeated: m.isDefeated ?? false,
            mp: 0,
          })),
        },
      },
    };
  }

  it('gives GANDOE Mosje +20 MP at END_PHASE', () => {
    const state = makeState([{ cardId: 'mosje_gandoe_destroyer' }]);
    const result = effect_de_box(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(20);
  });

  it('gives MICHELLE Mosje +15 MP at END_PHASE', () => {
    const state = makeState([{ cardId: 'mosje_michelle' }]);
    const result = effect_de_box(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(15);
  });

  it('gives +10 bonus to BOTH when both are simultaneously active', () => {
    const state = makeState([
      { cardId: 'mosje_gandoe_destroyer' },
      { cardId: 'mosje_michelle' },
    ]);
    const result = effect_de_box(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(30); // 20 + 10
    expect(result.players.player_1.activeSlots[1].mp).toBe(25); // 15 + 10
  });

  it('gives 0 MP change to non-GANDOE non-MICHELLE Mosje', () => {
    const state = makeState([{ cardId: 'mosje_jeffrey' }]);
    const result = effect_de_box(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(0);
  });
});

describe('Phase 15 — getKickboxingBootcampDiceBonus (DECK-14)', () => {
  const kickboxingQuest = { id: 'quest_personal_kickboxing_bootcamp' };
  const otherQuest = { id: 'quest_arm_wrestling' };

  function makeState(mosjes: Array<{ cardId: string; isDefeated?: boolean }>) {
    return {
      players: {
        player_1: {
          activeSlots: mosjes.map(m => ({
            cardId: m.cardId,
            isDefeated: m.isDefeated ?? false,
          })),
        },
      },
    };
  }

  it('returns 2 when Gandoe is on field', () => {
    const state = makeState([
      { cardId: 'mosje_michelle' },
      { cardId: 'mosje_gandoe_destroyer' },
    ]);
    expect(getKickboxingBootcampDiceBonus(kickboxingQuest, state, 'player_1')).toBe(2);
  });

  it('returns 0 when Gandoe is NOT on field', () => {
    const state = makeState([{ cardId: 'mosje_michelle' }]);
    expect(getKickboxingBootcampDiceBonus(kickboxingQuest, state, 'player_1')).toBe(0);
  });

  it('returns 0 for unrelated quest cards', () => {
    const state = makeState([{ cardId: 'mosje_gandoe_destroyer' }]);
    expect(getKickboxingBootcampDiceBonus(otherQuest, state, 'player_1')).toBe(0);
  });
});

describe('Phase 15 — Digital Control rework (DECK-05/06/07/08/17)', () => {
  const dc = () => STARTER_DECKS.find((d: { id: string }) => d.id === 'DIGITAL_CONTROL');

  it('mosjes contains mosje_coert_tech', () => {
    expect(dc()?.mosjes).toContain('mosje_coert_tech');
  });
  it('mosjes contains mosje_binti', () => {
    expect(dc()?.mosjes).toContain('mosje_binti');
  });
  it('mosjes does NOT contain mosje_martin_senor_west', () => {
    expect(dc()?.mosjes).not.toContain('mosje_martin_senor_west');
  });
  it('piecies contains piecie_kannetje_melk', () => {
    expect(dc()?.piecies).toContain('piecie_kannetje_melk');
  });
  it('piecies contains piecie_varkenspootjes', () => {
    expect(dc()?.piecies).toContain('piecie_varkenspootjes');
  });
  it('piecies contains piecie_bong_hit_demolition', () => {
    expect(dc()?.piecies).toContain('piecie_bong_hit_demolition');
  });
  it('piecies contains piecie_redbull', () => {
    expect(dc()?.piecies).toContain('piecie_redbull');
  });
  it('piecies contains piecie_keyboard', () => {
    expect(dc()?.piecies).toContain('piecie_keyboard');
  });
  it('piecies contains piecie_controller', () => {
    expect(dc()?.piecies).toContain('piecie_controller');
  });
  it('piecies does NOT contain piecie_mouse', () => {
    expect(dc()?.piecies).not.toContain('piecie_mouse');
  });
  it('snellePiecies contains snelle_counter_strikka', () => {
    expect(dc()?.snellePiecies).toContain('snelle_counter_strikka');
  });
  it('places contains place_tesla', () => {
    expect(dc()?.places).toContain('place_tesla');
  });
  it('places contains place_bank_chilling', () => {
    expect(dc()?.places).toContain('place_bank_chilling');
  });
  it('places does NOT contain place_quest_haven', () => {
    expect(dc()?.places).not.toContain('place_quest_haven');
  });
  it('quests contains quest_personal_winston_tijd', () => {
    expect(dc()?.quests).toContain('quest_personal_winston_tijd');
  });
});

describe('Phase 15 — place_tesla card definition (DECK-07)', () => {
  const tesla = () => PLACES.find((p: { id: string }) => p.id === 'place_tesla');

  it('PLACES contains place_tesla', () => {
    expect(tesla()).toBeDefined();
  });
  it('place_tesla has trigger START_PHASE', () => {
    expect(tesla()?.trigger).toBe('START_PHASE');
  });
  it('place_tesla has effectId effect_tesla', () => {
    expect(tesla()?.effectId).toBe('effect_tesla');
  });
  it('place_tesla has isBoosterOnly false', () => {
    expect(tesla()?.isBoosterOnly).toBe(false);
  });
});

describe('Phase 15 — quest_personal_winston_tijd definition (DECK-08)', () => {
  const winston = () => QUESTS.find((q: { id: string }) => q.id === 'quest_personal_winston_tijd');

  it('QUESTS contains quest_personal_winston_tijd', () => {
    expect(winston()).toBeDefined();
  });
  it('quest_personal_winston_tijd has requiredMosjeId mosje_binti', () => {
    expect(winston()?.requiredMosjeId).toBe('mosje_binti');
  });
  it('quest_personal_winston_tijd has successMP 100', () => {
    expect(winston()?.successMP).toBe(100);
  });
  it('quest_personal_winston_tijd has roll null', () => {
    expect(winston()?.roll).toBeNull();
  });
  it('quest_personal_winston_tijd has isBoosterOnly false', () => {
    expect(winston()?.isBoosterOnly).toBe(false);
  });
});

describe('Phase 15 — effect_tesla (DECK-17)', () => {
  function makeState(mosjes: Array<{ cardId: string; isDefeated?: boolean }>) {
    return {
      players: {
        player_1: {
          activeSlots: mosjes.map(m => ({
            cardId: m.cardId,
            isDefeated: m.isDefeated ?? false,
            mp: 0,
          })),
        },
      },
    };
  }

  it('gives COERT Mosje +20 MP when Coert is active', () => {
    const state = makeState([{ cardId: 'mosje_coert_tech' }]);
    const result = effect_tesla(state, 'player_1');
    expect(result.players.player_1.activeSlots[0].mp).toBe(20);
  });

  it('gives BINTI Mosje +20 MP base when Binti is active alongside Coert', () => {
    // When both are active the +10 road-trip bonus also applies → total 30 MP
    const state = makeState([{ cardId: 'mosje_coert_tech' }, { cardId: 'mosje_binti' }]);
    const result = effect_tesla(state, 'player_1');
    expect(result.players.player_1.activeSlots[1].mp).toBe(30);
  });

  it('gives +10 bonus each when both Coert and Binti active', () => {
    const state = makeState([{ cardId: 'mosje_coert_tech' }, { cardId: 'mosje_binti' }]);
    const result = effect_tesla(state, 'player_1');
    expect(result.players.player_1.activeSlots[0].mp).toBe(30); // 20 + 10
    expect(result.players.player_1.activeSlots[1].mp).toBe(30); // 20 + 10
  });

  it('gives 0 MP change when Coert is not active', () => {
    const state = makeState([{ cardId: 'mosje_binti' }]);
    const result = effect_tesla(state, 'player_1');
    expect(result.players.player_1.activeSlots[0].mp).toBe(0);
  });
});

describe('Phase 15 — Artistic Rhythm rework (DECK-09/10/11)', () => {
  const ar = () => STARTER_DECKS.find((d: { id: string }) => d.id === 'ARTISTIC_RHYTHM');

  it('mosjes contains mosje_youri', () => {
    expect(ar()?.mosjes).toContain('mosje_youri');
  });
  it('mosjes contains mosje_chris_ddr', () => {
    expect(ar()?.mosjes).toContain('mosje_chris_ddr');
  });
  it('mosjes does NOT contain mosje_binti', () => {
    expect(ar()?.mosjes).not.toContain('mosje_binti');
  });
  it('mosjes does NOT contain mosje_dj_8020', () => {
    expect(ar()?.mosjes).not.toContain('mosje_dj_8020');
  });
  it('piecies contains piecie_synergy_field', () => {
    expect(ar()?.piecies).toContain('piecie_synergy_field');
  });
  it('piecies contains piecie_grammetje_pieter', () => {
    expect(ar()?.piecies).toContain('piecie_grammetje_pieter');
  });
  it('piecies does NOT contain piecie_larry_zegeltje', () => {
    expect(ar()?.piecies).not.toContain('piecie_larry_zegeltje');
  });
  it('quests contains quest_improvise', () => {
    expect(ar()?.quests).toContain('quest_improvise');
  });
  it('quests does NOT contain quest_personal_lucky_crescendo', () => {
    expect(ar()?.quests).not.toContain('quest_personal_lucky_crescendo');
  });
});

describe('Phase 15 — synergyWith patches (DECK-18/19)', () => {
  const getMosje = (id: string) => MOSJES.find((m: { id: string }) => m.id === id);

  it('mosje_gandoe_destroyer.synergyWith contains mosje_michelle', () => {
    expect(getMosje('mosje_gandoe_destroyer')?.synergyWith).toContain('mosje_michelle');
  });
  it('mosje_michelle.synergyWith contains mosje_gandoe_destroyer', () => {
    expect(getMosje('mosje_michelle')?.synergyWith).toContain('mosje_gandoe_destroyer');
  });
  it('mosje_dj_8020.synergyWith contains mosje_chris_ddr', () => {
    expect(getMosje('mosje_dj_8020')?.synergyWith).toContain('mosje_chris_ddr');
  });
  it('mosje_youri.synergyWith contains mosje_chris_ddr', () => {
    expect(getMosje('mosje_youri')?.synergyWith).toContain('mosje_chris_ddr');
  });
  it('mosje_youri.synergyWith still contains mosje_chris (existing entry preserved)', () => {
    expect(getMosje('mosje_youri')?.synergyWith).toContain('mosje_chris');
  });
  it('quest_personal_iron_will retains isBoosterOnly true', () => {
    const q = QUESTS.find((q: { id: string }) => q.id === 'quest_personal_iron_will');
    expect(q?.isBoosterOnly).toBe(true);
  });
  it('quest_personal_perfect_sync retains isBoosterOnly true', () => {
    const q = QUESTS.find((q: { id: string }) => q.id === 'quest_personal_perfect_sync');
    expect(q?.isBoosterOnly).toBe(true);
  });
  it('quest_personal_lucky_crescendo retains isBoosterOnly true', () => {
    const q = QUESTS.find((q: { id: string }) => q.id === 'quest_personal_lucky_crescendo');
    expect(q?.isBoosterOnly).toBe(true);
  });
});

describe('Phase 16 — place_eendjes_voeren definition (EEV-01)', () => {
  const ev = () => PLACES.find((p: { id: string }) => p.id === 'place_eendjes_voeren');

  it('PLACES contains place_eendjes_voeren', () => {
    expect(ev()).toBeDefined();
  });
  it('has trigger END_PHASE', () => {
    expect(ev()?.trigger).toBe('END_PHASE');
  });
  it('has effectId effect_eendjes_voeren', () => {
    expect(ev()?.effectId).toBe('effect_eendjes_voeren');
  });
  it('has isBoosterOnly false', () => {
    expect(ev()?.isBoosterOnly).toBe(false);
  });
});

describe('Phase 16 — Physical Force deck update (EEV-05)', () => {
  const pf = () => STARTER_DECKS.find((d: { id: string }) => d.id === 'PHYSICAL_FORCE');

  it('places contains place_eendjes_voeren', () => {
    expect(pf()?.places).toContain('place_eendjes_voeren');
  });
  it('piecies contains piecie_dikke_jonko', () => {
    expect(pf()?.piecies).toContain('piecie_dikke_jonko');
  });
});

describe('Phase 16 — effect_eendjes_voeren (EEV-02)', () => {
  function makeState(mosjes: Array<{ cardId: string; isDefeated?: boolean }>) {
    return {
      activePlace: 'place_eendjes_voeren',
      players: {
        player_1: {
          activeSlots: mosjes.map(m => ({
            cardId: m.cardId,
            isDefeated: m.isDefeated ?? false,
            mp: 0,
          })),
        },
      },
    };
  }

  it('gives MICHELLE Mosje +10 MP at END_PHASE', () => {
    const state = makeState([{ cardId: 'mosje_michelle' }]);
    const result = effect_eendjes_voeren(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(10);
  });

  it('gives 0 MP to non-MICHELLE Mosje', () => {
    const state = makeState([{ cardId: 'mosje_gandoe_destroyer' }]);
    const result = effect_eendjes_voeren(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(0);
  });
});

describe('Phase 16 — getMosjeTrait resilience aura (EEV-03)', () => {
  function makeGameState(activePlace: string, resilient: number) {
    return {
      activePlace,
      players: {
        p1: {
          activeSlots: [{
            cardId: 'mosje_gandoe_destroyer',
            isDefeated: false,
            traits: { physical: 3, resilient },
          }],
        },
      },
    };
  }

  it('returns 3 for resilient when place_eendjes_voeren is active', () => {
    const state = makeGameState('place_eendjes_voeren', 1);
    expect(getMosjeTrait(state, 'p1', 'mosje_gandoe_destroyer', 'resilient')).toBe(3);
  });

  it('returns real resilient value when a different place is active', () => {
    const state = makeGameState('place_boxing_ring', 1);
    expect(getMosjeTrait(state, 'p1', 'mosje_gandoe_destroyer', 'resilient')).toBe(1);
  });

  it('returns real physical trait value (not overridden) when place is active', () => {
    const state = makeGameState('place_eendjes_voeren', 1);
    expect(getMosjeTrait(state, 'p1', 'mosje_gandoe_destroyer', 'physical')).toBe(3);
  });
});
