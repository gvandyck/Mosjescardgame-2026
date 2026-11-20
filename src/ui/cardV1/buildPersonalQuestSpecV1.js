// buildPersonalQuestSpecV1.js — Personal Quest card -> 2.0 face spec for buildPopupFace (Phase 72-02, D-01).
// Type colour from mosjeType (unknown falls back to Physical), name on top, then the Needs / Pay / Roll blocks.
// `lines` carries the block texts so the shared text box can size itself; `blocks` is what buildFaceTextBox draws.
import { TYPE_COLORS } from './typeColors.js';
import { getPersonalQuestBlocks } from './getPersonalQuestBlocks.js';

export function buildPersonalQuestSpecV1(card) {
  const type = TYPE_COLORS[card.mosjeType] && ['PHYSICAL', 'DIGITAL', 'CREATIVE'].includes(card.mosjeType) ? card.mosjeType : 'PHYSICAL';
  const word = type.charAt(0) + type.slice(1).toLowerCase();
  const blocks = getPersonalQuestBlocks(card);
  return {
    face: 2,
    typeKey: 'PERSONAL_QUEST',
    colors: TYPE_COLORS[type],
    name: { first: String(card.name || 'Personal Quest'), nick: '' },
    corner: null,
    lines: blocks.map((b) => b.text),
    blocks,
    levelRows: [],
    info: '',
    pill: 'PERSONAL QUEST',
    stays: false,
    label: `${word} Mosje, Level 3`,
    footer: null,
    card,
    allowLarge: true,
    fieldArtPos: '50% 50%',
  };
}
