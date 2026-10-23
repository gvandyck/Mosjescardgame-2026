// buildQuestSpecV1.js — Quest card -> 2.0 face spec (62-02 SPEC CONTRACT, consumed by buildPopupFace; Phase 7 A7, D-08).
// Only the 38 2.0 Quests (those with a `stack`) get this face; a leftover V4 Quest returns null and the
// unified template draws it. The whole card is in its stack colour. Corner = dice need (getQuestNeed), info =
// "Rolls: <trait> · <band>", text = "First you must: …" then the Also text, footer = WIN left, "<STACK> QUEST"
// pill in the centre, LOSE right (Trained: "can't fail"). No LVL chip, no Power / MP, no cost.
// failTokens is read by the field tile (buildFieldTile): it fills the 2 fail pips.
import { TYPE_COLORS } from './typeColors.js';
import { getQuestNeed } from './getQuestNeed.js';
import { formatQuestRollsLine } from './formatQuestRollsLine.js';
import { formatQuestStakes } from './formatQuestStakes.js';
import { getQuestTextLines } from './getQuestTextLines.js';

const STACKS = ['FIGHTING', 'DIGITAL', 'ARTISTIC'];

export function buildQuestSpecV1(card) {
  if (!STACKS.includes(card.stack)) return null;
  const colors = TYPE_COLORS[card.stack];
  const stakes = formatQuestStakes(card);
  const cantFail = stakes.lose.hookValue === 'none';
  return {
    face: 2,
    typeKey: 'QUEST',
    colors,
    name: { first: String(card.name || 'Quest'), nick: '' },
    corner: getQuestNeed(card),
    lines: getQuestTextLines(card),
    levelRows: [],
    info: formatQuestRollsLine(card),
    pill: '',
    stays: false,
    label: '',
    footer: {
      left: { value: stakes.win.value, label: 'WIN', hook: 'win', hookValue: stakes.win.hookValue },
      centre: { kind: 'pill', chip: `${card.stack} QUEST`, label: '' },
      right: { value: stakes.lose.value, label: cantFail ? '' : 'LOSE', hook: 'lose', hookValue: stakes.lose.hookValue, word: cantFail },
    },
    card,
    allowLarge: true,
    fieldArtPos: '50% 50%',
    failTokens: Number(card.failTokens ?? card.tokens ?? 0) || 0,
  };
}
