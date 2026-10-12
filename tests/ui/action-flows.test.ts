// 56-06: the human Attack / Quest flows, driven with a stub modal (no DOM) against the real engine.
import { describe, expect, it } from 'vitest';
// @ts-expect-error JS module without type declarations
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-expect-error JS module without type declarations
import { mkSlot } from '../helpers/quest56.js';
// @ts-expect-error JS module without type declarations
import { runAttackFlow } from '../../src/ui/actions/runAttackFlow.js';
// @ts-expect-error JS module without type declarations
import { runQuestFlow } from '../../src/ui/actions/runQuestFlow.js';
// @ts-expect-error JS module without type declarations
import { renderQuestStacks } from '../../src/ui/renderQuestStacks.js';

type Opt = { id: string; label: string; metaLabel?: string; disabled?: boolean };
// Stub modal: `answers` picks an id per showOptionSelect call (default: first enabled); every call is recorded.
function stubModal(answers: Array<string | null | undefined> = []) {
  const calls: Array<{ title: string; options: Opt[] }> = [];
  return {
    calls,
    showOptionSelect: async (cfg: { title: string; options: Opt[] }) => {
      calls.push({ title: cfg.title, options: cfg.options });
      const a = answers.shift();
      if (a !== undefined) return a;
      return cfg.options.find(o => !o.disabled)?.id ?? null;
    },
  };
}
const stacks = (f: Record<string, string | null>) => {
  const o: any = {};
  for (const id of ['FIGHTING', 'DIGITAL', 'ARTISTIC']) o[id] = { deck: [], faceUp: f[id] ?? null, tokens: 0, discard: [] };
  return o;
};
const fresh = () => mkSlot({ mp: 40, entryProtected: true });

describe('runAttackFlow', () => {
  const base = () => makeEngineState({
    questStacks: stacks({}),
    players: { player_1: { activeSlots: [mkSlot({ mp: 30 }), mkSlot({ mp: 30, actedThisTurn: true })] }, player_2: { activeSlots: [fresh(), mkSlot({ mp: 40 })] } },
  });

  it('disables fresh targets and Mosjes that already acted, then applies the attack', async () => {
    const modal = stubModal();
    const { state, log } = await runAttackFlow({ state: base(), playerId: 'player_1', modal });
    const [actor, target] = modal.calls;
    expect(actor.options.map(o => o.disabled)).toEqual([false, true]);
    expect(target.options.map(o => o.disabled)).toEqual([true, false]);
    expect(state.players.player_2.activeSlots[1].mp).toBeLessThan(40);
    expect(state.players.player_1.activeSlots[0].actedThisTurn).toBe(true);
    expect(log).toHaveLength(1);
  });

  it('cancel returns the input state unchanged', async () => {
    const s = base();
    const out = await runAttackFlow({ state: s, playerId: 'player_1', modal: stubModal([null]) });
    expect(out.state).toBe(s);
    expect(out.log).toEqual([]);
  });
});

describe('runQuestFlow', () => {
  const base = () => makeEngineState({
    questStacks: { ...stacks({ FIGHTING: 'quest_tough_it_out', DIGITAL: 'quest_debug_system' }), FIGHTING: { deck: ['quest_improvise'], faceUp: 'quest_tough_it_out', tokens: 0, discard: [] } },
    players: { player_1: { activeSlots: [mkSlot({ mp: 30 }), null] }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
  });

  it('offers the Quest with the reason when its condition fails, and rolls then resolves a legal one', async () => {
    const modal = stubModal();
    const { state, log } = await runQuestFlow({ state: base(), playerId: 'player_1', modal, rng: () => 0.99 });
    const quests = modal.calls.find(c => c.title === 'Attempt which Quest?')!;
    const debug = quests.options.find(o => o.id === 'DIGITAL')!;
    expect(debug.disabled).toBe(true);
    expect(debug.metaLabel).toMatch(/Condition not met/);
    expect(state.players.player_1.activeSlots[0].mp).toBe(55); // Tough It Out: dice [6] -> +25
    expect(state.players.player_1.activeSlots[0].actedThisTurn).toBe(true);
    expect(log[0]).toMatch(/won Tough It Out/);
    expect(state.questStacks.FIGHTING.faceUp).toBe('quest_improvise');
  });

  it('a failed roll loses MP and adds a fail token', async () => {
    const { state } = await runQuestFlow({ state: base(), playerId: 'player_1', modal: stubModal(), rng: () => 0 });
    expect(state.players.player_1.activeSlots[0].mp).toBe(15);
    expect(state.questStacks.FIGHTING.tokens).toBe(1);
  });

  it('cancel at the Mosje or Quest step returns the input state unchanged', async () => {
    const s = base();
    expect((await runQuestFlow({ state: s, playerId: 'player_1', modal: stubModal([null]) })).state).toBe(s);
    expect((await runQuestFlow({ state: s, playerId: 'player_1', modal: stubModal(['0', null]) })).state).toBe(s);
  });
});

describe('renderQuestStacks', () => {
  it('renders name, band, roll trait, cost and tokens for each face-up Quest', () => {
    const container: any = { innerHTML: '' };
    const qs = stacks({ FIGHTING: 'quest_tough_it_out', DIGITAL: 'quest_debug_system' });
    qs.FIGHTING.tokens = 1;
    renderQuestStacks(container, { questStacks: qs });
    expect(container.innerHTML).toContain('Tough It Out');
    expect(container.innerHTML).toContain('steady');
    expect(container.innerHTML).toContain('roll resilient');
    expect(container.innerHTML).toContain('Fail tokens: 1/2');
    expect(container.innerHTML).toContain('Mosje has Technical');
    expect(container.innerHTML).toContain('Artistic: empty');
  });
});

describe('reaction windows through the injected settle', () => {
  // player_2 holds The Protector (free slot + Energy): the human attack opens a window the settle callback answers.
  const withProtector = (energy: number) => {
    const s = makeEngineState({
      questStacks: stacks({}),
      players: { player_1: { activeSlots: [mkSlot({ mp: 30 })] }, player_2: { activeSlots: [mkSlot({ mp: 40 })] } },
    });
    // The Protector costs 0 Energy, so the "no holder" case simply has an empty hand.
    s.players.player_2.hand = energy > 0 ? [{ cardId: 'snelle_the_protector', type: 'SNELLE_PIECIE' }] : [];
    s.players.player_2.energy = energy;
    return s;
  };
  it('settle is called with the paused state and its result is returned', async () => {
    let seen: any = null;
    const out = await runAttackFlow({ state: withProtector(5), playerId: 'player_1', modal: stubModal(), settle: async (st: any) => { seen = st; return st; } });
    expect(seen).not.toBeNull();
    expect(seen.pendingReaction.responderId).toBe('player_2');
    expect(out.log).toHaveLength(1);
  });
  it('without a holder the flow never calls settle', async () => {
    let called = false;
    await runAttackFlow({ state: withProtector(0), playerId: 'player_1', modal: stubModal(), settle: async (st: any) => { called = true; return st; } });
    expect(called).toBe(false);
  });
});
