// Phase 53-05 (E29, Quest part): Card List 2.0 vs quests.js.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { composeQuestText } from '../../scripts/obby2/composeQuestText.mjs';
// @ts-ignore JS module
import { QUEST_COST_IDS } from '../../scripts/obby2/questCostIds.mjs';
// @ts-ignore JS module
import { QUESTS } from '../../src/data/quests.js';
// @ts-ignore JS module
import { QUEST_BANDS } from '../../src/data/questBands.js';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const get = (id: string) => (QUESTS as any[]).find((q) => q.id === id);
const traitOf = (rolls: string) =>
  /^no (roll|trait)$/i.test(rolls) ? 'none' : /best trait/i.test(rolls) ? 'best' : rolls.toLowerCase();

describe('Quests carry Card List 2.0 data', () => {
  it('parses 38 quest rows', () => expect(list.quests).toHaveLength(38));

  for (const row of list.quests as any[]) {
    const id = CARD_ID_MAP.quests[row.name];
    it(`${row.name} (${id})`, () => {
      const q = get(id);
      expect(q, 'card exists').toBeTruthy();
      expect(q.name).toBe(row.name);
      expect(q.text).toBe(composeQuestText(row, list.bands));
      expect(q.stack).toBe(row.stack);
      expect(q.band).toBe(row.band);
      expect(q.rollTrait).toBe(traitOf(row.rolls));
      expect(q.costText).toBe(row.costText);
      expect(q.costId).toBe(row.costText ? QUEST_COST_IDS[row.costText] : null);
      expect(q.win).toBe(row.win);
      expect(q.lose).toBe(row.lose);
      expect(q.extras).toBe(row.extras);
      expect(q.win).toBe(QUEST_BANDS[row.band].win);
      expect(q.lose).toBe(QUEST_BANDS[row.band].lose);
    });
  }

  it('stacks are FIGHTING 13 / DIGITAL 13 / ARTISTIC 12', () => {
    const n = (s: string) => (QUESTS as any[]).filter((q) => q.stack === s).length;
    expect([n('FIGHTING'), n('DIGITAL'), n('ARTISTIC')]).toEqual([13, 13, 12]);
  });

  it('the handoff renames hold', () => {
    expect(get('quest_debug_system').name).toBe('Debug System');
    expect(get('quest_regelaar').name).toBe('Regelaar');
    expect(get('quest_larry_temmen').name).toBe('Larry Temmen Niemand Zeggen');
    expect(get('quest_create_masterpiece').name).toBe('Create Masterpiecie');
  });

  it('the two new quests satisfy the V4 guards', () => {
    for (const id of ['quest_dutch_courage', 'quest_cheat_code']) {
      const q = get(id);
      expect(q.questType).toBe('GENERAL');
      expect(q.successMP).toBeGreaterThanOrEqual(40);
      expect(q.failMP).toBeGreaterThanOrEqual(-20);
      expect(q.roll).not.toBeNull();
    }
  });

  it('every non-null costText has a costId', () => {
    for (const q of (QUESTS as any[]).filter((x) => x.costText)) expect(q.costId, q.id).toBeTruthy();
  });
});
