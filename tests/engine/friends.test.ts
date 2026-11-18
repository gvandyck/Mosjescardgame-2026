// Phase 71-01 (D-05, D-06): one helper per friend form of rules section 9.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { getFriends } from '../../src/engine/friends/getFriends.js';
// @ts-ignore JS module
import { isFriend } from '../../src/engine/friends/isFriend.js';
// @ts-ignore JS module
import { friendSlotsOnField } from '../../src/engine/friends/friendSlotsOnField.js';
// @ts-ignore JS module
import { pickFriendOnField } from '../../src/engine/friends/pickFriendOnField.js';
// @ts-ignore JS module
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-ignore JS module
import { mkSlot } from '../helpers/quest56.js';
// @ts-ignore JS module
import { MOSJES } from '../../src/data/mosjes.js';

const slotOf = (id: string, over: any = {}) => mkSlot(over, MOSJES.find((m: any) => m.id === id));
const field = (...slots: any[]) => makeEngineState({ players: { player_1: { activeSlots: slots }, player_2: { activeSlots: [null, null] } } });

describe('getFriends', () => {
  it('adds also-friends and groups to the card friend', () => {
    expect(getFriends('mosje_dj_8020')).toEqual(['DJ', 'Gandoe']);
    expect(getFriends('mosje_fps_coert')).toEqual(expect.arrayContaining(['Coert', 'FPS']));
    expect(getFriends('mosje_fps_west')).toEqual(expect.arrayContaining(['West', 'FPS']));
    expect(getFriends('nope')).toEqual([]);
  });
});

describe('isFriend', () => {
  it('Coert / Gandoe / Ronald / FPS', () => {
    expect(isFriend(slotOf('mosje_fps_coert'), ['Coert'])).toBe(true);
    expect(isFriend(slotOf('mosje_coert_tech'), ['Coert'])).toBe(true);
    expect(isFriend(slotOf('mosje_dj_8020'), ['Gandoe'])).toBe(true);
    expect(isFriend(slotOf('mosje_ronald_chef'), ['Ronald'])).toBe(true);
    expect(isFriend(slotOf('mosje_ronald_mastermind'), ['Ronald'])).toBe(true);
    expect(isFriend(slotOf('mosje_fps_coert'), ['fps'])).toBe(true);
    expect(isFriend(slotOf('mosje_fps_west'), ['FPS'])).toBe(true);
    expect(isFriend(slotOf('mosje_coert_tech'), ['FPS'])).toBe(false);
    expect(isFriend(slotOf('mosje_youri'), ['Coert', 'Youri'])).toBe(true);
  });
  it('takes a card id; defeated and null are false', () => {
    expect(isFriend('mosje_fps_west', ['West'])).toBe(true);
    expect(isFriend(slotOf('mosje_fps_west', { isDefeated: true }), ['West'])).toBe(false);
    expect(isFriend(null, ['West'])).toBe(false);
  });
});

describe('friendSlotsOnField', () => {
  it('lists live matching slots in order, sideways included', () => {
    const s = field(slotOf('mosje_chris_ddr', { sideways: true }), slotOf('mosje_youri'));
    expect(friendSlotsOnField(s, 'player_1', ['Chris'])).toEqual([0]);
    expect(friendSlotsOnField(s, 'player_1', ['Binti'])).toEqual([]);
    const d = field(slotOf('mosje_chris_ddr', { isDefeated: true }), null);
    expect(friendSlotsOnField(d, 'player_1', ['Chris'])).toEqual([]);
  });
});

describe('pickFriendOnField', () => {
  it('none / one / two / answer / forged answer', () => {
    expect(pickFriendOnField(field(slotOf('mosje_youri'), null), 'player_1', ['Chris'], 'k', 'p')).toEqual({ none: true });
    expect(pickFriendOnField(field(slotOf('mosje_chris_ddr'), null), 'player_1', ['Chris'], 'k', 'p')).toEqual({ slotIndex: 0 });
    const s = field(slotOf('mosje_ronald_chef'), slotOf('mosje_ronald_mastermind'));
    const r = pickFriendOnField(s, 'player_1', ['Ronald'], 'k', 'Pick');
    expect(r.needChoice.choiceKind).toBe('ownMosje');
    expect(r.needChoice.options.map((o: any) => o.slotIndex)).toEqual([0, 1]);
    s.players.player_1._pendingTargets = { k: 1 };
    expect(pickFriendOnField(s, 'player_1', ['Ronald'], 'k', 'Pick')).toEqual({ slotIndex: 1 });
    expect(s.players.player_1._pendingTargets.k).toBeUndefined();
    s.players.player_1._pendingTargets = { k: 7 };
    expect(pickFriendOnField(s, 'player_1', ['Ronald'], 'k', 'Pick').needChoice).toBeTruthy();
  });
});
