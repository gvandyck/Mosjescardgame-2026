// Synergy/ability text clarity guard (2026-07-12 UX fix).
// Card texts used to say things like "Both may play Piecies..." without naming
// WHO the synergy partner is. Every synergyEffect must now spell out the
// activation condition ("While <partner> is also on your field:") and name the
// partner(s), so the card is readable on its own — on screen and in print.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from '../../src/data/mosjes.js';

type Mosje = {
  id: string;
  name: string;
  synergyWith: string[];
  synergyEffect: string | null;
};

// For each Mosje with a partner synergy, the text must contain these
// partner-identifying substrings (derived from the partner cards' names).
const REQUIRED_PARTNER_MENTIONS: Record<string, string[]> = {
  mosje_azn_cless: ['Martin Senor West'],
  mosje_michelle: ['Gandoe'],
  mosje_gandoe_destroyer: ['Michelle'],
  mosje_martin_senor_west: ['AZN Cless'],
  mosje_coert_tech: ['Binti'],
  mosje_chris: ['Youri'],
  mosje_youri: ['Chris'],
  mosje_fps_coert: ['FPS West'],
  mosje_fps_west: ['FPS Coert', 'AZN Cless'],
  mosje_dj_8020: ['Chris'],
  mosje_coert_kasteluck: ['Binti'],
  mosje_binti: ['Coert'],
  mosje_cless_teacher: ['Martin Senor West'],
  mosje_coert_kastelein: ['Binti'],
  mosje_chris_ddr: ['Youri'],
};

const withSynergyText = (MOSJES as Mosje[]).filter(m => m.synergyEffect);

describe('synergy text clarity', () => {
  it('every synergyEffect states its activation condition ("While ... on your field")', () => {
    const violations = withSynergyText
      .filter(m => !(m.synergyEffect!.startsWith('While ') && m.synergyEffect!.includes('on your field')))
      .map(m => `${m.id}: "${m.synergyEffect}"`);
    expect(violations).toEqual([]);
  });

  it('every partner synergy names its partner Mosje(s) in the text', () => {
    const violations: string[] = [];
    for (const m of withSynergyText) {
      const required = REQUIRED_PARTNER_MENTIONS[m.id];
      if (!required) continue;
      for (const partnerName of required) {
        if (!m.synergyEffect!.includes(partnerName)) {
          violations.push(`${m.id} text does not mention "${partnerName}": "${m.synergyEffect}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('no Mosje with a partner synergy is missing from the mention table (keeps this test honest)', () => {
    // Alyssa x2 + Jisca declare partners but have no synergyEffect text yet —
    // known design gap, tracked outside this test. Skip null-effect cards.
    const untracked = (MOSJES as Mosje[])
      .filter(m => m.synergyWith?.length > 0 && m.synergyEffect && !REQUIRED_PARTNER_MENTIONS[m.id])
      .map(m => m.id);
    expect(untracked).toEqual([]);
  });
});
