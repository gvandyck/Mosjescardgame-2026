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
  // Card List 2.0: exactly 5 Mosjes carry a synergy text.
  mosje_martin_historian: ['Cless, The Teacher'],
  mosje_martin_senor_west: ['AZN Cless'],
  mosje_youri: ['Dancing/DDR Chris'],
  mosje_binti: ['Coert, The Hawaiian Tech Savant'],
  mosje_fps_west: ['FPS Coert'],
  // Not in Card List 2.0 (still V4 data, untouched until its own plan):
  mosje_coert_kastelein: ['Binti'],
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
    // Alyssa x2 + Jisca (Phase 38, D-01..D-05) now carry real synergyEffect
    // text and are tracked in REQUIRED_PARTNER_MENTIONS above. Skip null-effect
    // cards (any future declared-but-unwritten synergy pair).
    const untracked = (MOSJES as Mosje[])
      .filter(m => m.synergyWith?.length > 0 && m.synergyEffect && !REQUIRED_PARTNER_MENTIONS[m.id])
      .map(m => m.id);
    expect(untracked).toEqual([]);
  });
});
