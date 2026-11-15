// Phase 69-02: the three Obby 2.1 starter decks (draft: docs/obby-2.0/starter-decks-draft.md) and how a game deals them.
import { describe, it, expect, vi } from 'vitest';
// @ts-ignore JS module
import { STARTER_DECKS } from '../../src/data/starterDecks.js';
// @ts-ignore JS module
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';
// @ts-ignore JS module
import { getCardById } from '../../src/data/cardIndex.js';
// @ts-ignore JS module
import { getCopyLimit } from '../../src/data/getCopyLimit.js';
// @ts-ignore JS module
import { createInitialGameState } from '../../src/engine/gameState.js';
// @ts-ignore JS module
import { startTurn } from '../../src/engine/turnManager.js';
// @ts-ignore JS module
import { driveBotTurn } from '../../src/bot/botDriver.js';
// @ts-ignore JS module
import { pickBotDeck } from '../../src/bot/pickBotDeck.js';

const IDS = ['STARTER_PHYSICAL', 'STARTER_DIGITAL', 'STARTER_CREATIVE'];
const KINDS: Record<string, string> = { STARTER_PHYSICAL: 'PHYSICAL', STARTER_DIGITAL: 'DIGITAL', STARTER_CREATIVE: 'CREATIVE' };
const deck = (id: string) => STARTER_DECKS.find((d: any) => d.id === id);
const counts = (ids: string[]) => ids.reduce((m: Record<string, number>, id) => ((m[id] = (m[id] || 0) + 1), m), {});

// The draft's copy counts per card: name -> copies, for Piecies and Snelle (id -> n).
const DRAFT: Record<string, Record<string, number>> = {
  STARTER_PHYSICAL: {
    piecie_kannetje_melk: 2, piecie_broodje_doner: 2, piecie_ronald_kip: 2, piecie_protein_shake: 2,
    piecie_dumbbells: 2, piecie_dancepad: 2, piecie_rugbybal: 2, piecie_koksmes: 1,
    piecie_te_hard_gaan: 2, piecie_snoeiertje: 1, piecie_ronalds_fles_fireman: 1, piecie_super_saiyan_mos: 1, piecie_kleine_taks: 1,
    piecie_bowie_stormey: 1, piecie_afblijven: 1, piecie_perfect_rhythm: 1,
    snelle_chriss_handdoek: 2, snelle_momentum_rush: 1, snelle_jensen: 1,
  },
  STARTER_DIGITAL: {
    piecie_keyboard: 2, piecie_hawaiishirt: 1, piecie_mouse: 1, piecie_controller: 2, piecie_headset: 2, piecie_magicprompt: 2,
    piecie_hawaii_pizza: 2, piecie_kannetje_melk: 1,
    piecie_boosterpackkie: 2, piecie_blikje_monsteros: 2, piecie_zie_je_die_dingetjes: 1, piecie_redbull: 1,
    piecie_kleine_taks: 2, piecie_te_hard_gaan: 1, piecie_those_eyelashes: 1, piecie_momentum_boost: 1,
    snelle_jensen: 1, snelle_sleutelpuntje: 1, snelle_jeweetniet: 1, snelle_ff_haaltje_nemen: 1,
  },
  STARTER_CREATIVE: {
    piecie_dikke_plaat: 2, piecie_schetsboek: 2, piecie_loaded_dice: 2, piecie_quest_prep: 1,
    piecie_varkenspootjes: 2, piecie_stookerino: 1, piecie_jantje_jantje: 1,
    piecie_zie_je_die_dingetjes: 2, piecie_energy_surge: 1, piecie_bagga_of_greed: 1,
    piecie_ronalds_fles_fireman: 1, piecie_zwoele_ming_power: 2, piecie_tempiecie: 1,
    piecie_kannetje_melk: 1, piecie_eendjes_voeren: 1, piecie_larry_zegeltje: 1, piecie_te_hard_gaan: 1,
    snelle_lucky_coin: 2, snelle_jeweetniet: 1, snelle_jensen: 1, snelle_emergency_healings: 1,
  },
};

describe('the three starter decks', () => {
  for (const id of IDS) {
    describe(id, () => {
      const d = deck(id);
      const all = [...d.mosjes, ...d.personalQuests, ...d.places, ...d.piecies, ...d.snellePiecies];
      it('has 5 Mosjes, 4 Personal Quests, 3 Places, 28 Piecies and Snelle = 40, no fixed startingMosje', () => {
        expect(d.mosjes).toHaveLength(5);
        expect(d.personalQuests).toHaveLength(4);
        expect(d.places).toHaveLength(3);
        expect(d.piecies.length + d.snellePiecies.length).toBe(28);
        expect(all).toHaveLength(40);
        expect(d.startingMosje).toBeUndefined();
        expect(d.disabled).toBeFalsy();
      });
      it('every id resolves, to the right type, not disabled and not booster-only', () => {
        const want: [string[], string][] = [[d.mosjes, 'MOSJE'], [d.personalQuests, 'PERSONAL_QUEST'], [d.places, 'PLACE'], [d.piecies, 'PIECIE'], [d.snellePiecies, 'SNELLE_PIECIE']];
        for (const [ids, type] of want) {
          for (const cid of ids) {
            const c = getCardById(cid);
            expect(c, cid).toBeTruthy();
            expect(c.type, cid).toBe(type);
            expect(c.disabled, cid).toBeFalsy();
            expect(c.isBoosterOnly, cid).toBeFalsy();
          }
        }
      });
      it('respects the copy limit of every card (getCopyLimit)', () => {
        for (const [cid, n] of Object.entries(counts(all))) expect(n, cid).toBeLessThanOrEqual(getCopyLimit(getCardById(cid)));
      });
      it('its Personal Quests match the deck type and are designed for Mosjes in the deck', () => {
        for (const pq of d.personalQuests) {
          const c = getCardById(pq);
          expect(c.mosjeType).toBe(KINDS[id]);
          expect(d.mosjes).toContain(c.designedFor);
        }
        expect(new Set(d.personalQuests).size).toBe(4);
        expect(new Set(d.mosjes).size).toBe(5);
        for (const m of d.mosjes) expect(String(getCardById(m).subtype).toUpperCase()).toBe(KINDS[id]);
      });
      it("has the draft's copy count for every Piecie and Snelle", () => {
        expect(counts([...d.piecies, ...d.snellePiecies])).toEqual(DRAFT[id]);
      });
    });
  }

  it('the player-facing decks are exactly these three; Example Decks stay in the data, hidden', () => {
    expect(getPlayerFacingDecks().map((d: any) => d.id)).toEqual(IDS);
    expect(getPlayerFacingDecks().map((d: any) => [d.name, d.tagline])).toEqual([['Physical', 'Hit hard'], ['Digital', 'Gear up'], ['Creative', 'Outsmart']]);
    expect(STARTER_DECKS.some((d: any) => d.id === 'EXAMPLE_TAKSEN')).toBe(true);
    for (let i = 0; i < 30; i++) expect(IDS).toContain(pickBotDeck(getPlayerFacingDecks()).id);
  });
});

describe('a game set up with each starter deck', () => {
  for (const id of IDS) {
    it(`${id}: 3-card hand, 1 Mosje from the deck on the field, Personal Quests in the deck, bot turns run`, () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const players = [
          { playerId: 'player_1', name: 'A', deckId: id },
          { playerId: 'player_2', name: 'B', deckId: id },
        ];
        let state = createInitialGameState(players, 'STARTER_21', { firstPlayerId: 'player_1' });
        for (const pid of ['player_1', 'player_2']) {
          const p = state.players[pid];
          expect(p.hand).toHaveLength(3);
          const onField = p.activeSlots.filter(Boolean);
          expect(onField).toHaveLength(1);
          expect(deck(id).mosjes).toContain(onField[0].cardId);
          const all = [...p.hand, ...p.deck];
          expect(all).toHaveLength(39); // 40 minus the starting Mosje, which left the deck
          expect(all.filter((c: any) => c.type === 'MOSJE')).toHaveLength(4);
          expect(all.filter((c: any) => c.type === 'PERSONAL_QUEST')).toHaveLength(4);
        }
        state = startTurn(state);
        for (let turns = 0; turns < 6 && state.status !== 'FINISHED'; turns++) {
          state = driveBotTurn(state, state.activePlayerId);
          if (state.status === 'FINISHED') break;
          state = startTurn(state);
        }
        expect(state.turnNumber).toBeGreaterThanOrEqual(1);
      } finally {
        log.mockRestore();
        warn.mockRestore();
      }
    });
  }
});
