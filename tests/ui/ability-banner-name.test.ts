// 72-10: the ability banner and log text helpers.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { getAbilityBannerName } from '../../src/ui/abilities/getAbilityBannerName.js';
// @ts-ignore JS module
import { getAbilityLogLine } from '../../src/ui/abilities/getAbilityLogLine.js';

describe('getAbilityBannerName', () => {
  it('uses the real ability name', () => {
    expect(getAbilityBannerName({ name: '[Alyssa] The Bulldozer', abilityName: 'Unstoppable' })).toBe('Unstoppable');
  });
  it('falls back to "<First name> ability" for an empty or missing name', () => {
    expect(getAbilityBannerName({ name: '[Alyssa] The Bulldozer', abilityName: '' })).toBe('Alyssa ability');
    expect(getAbilityBannerName({ name: 'Jeffrey, The Strongman' })).toBe('Jeffrey ability');
    expect(getAbilityBannerName({ name: 'FPS Coert', abilityName: '  ' })).toBe('FPS Coert ability');
  });
  it('returns "Ability" without a card', () => {
    expect(getAbilityBannerName(null)).toBe('Ability');
    expect(getAbilityBannerName(undefined)).toBe('Ability');
  });
});

describe('getAbilityLogLine', () => {
  it('names the ability', () => {
    expect(getAbilityLogLine({ name: 'Binti, The Sharp Tongue', abilityName: 'Cutting Words' })).toBe('Binti, The Sharp Tongue uses Cutting Words');
  });
  it('says "its ability" without a name', () => {
    expect(getAbilityLogLine({ name: 'Jeffrey, The Strongman', abilityName: '' })).toBe('Jeffrey, The Strongman uses its ability');
    expect(getAbilityLogLine({ name: 'FPS Coert' })).toBe('FPS Coert uses its ability');
  });
});
