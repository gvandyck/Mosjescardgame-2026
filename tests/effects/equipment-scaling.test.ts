// BAL-01: Equipment MP scaling by Digital subtype and Mosje level
// Filled in by Plan 03 (Wave 2)
import { describe, it } from 'vitest';

describe('Equipment MP scaling (BAL-01)', () => {
  describe('effect_keyboard', () => {
    it.todo('gives 15 MP with Digital Mosje at level 1');
    it.todo('gives 25 MP with Digital Mosje at level 2');
    it.todo('gives 40 MP with Digital Mosje at level 3');
    it.todo('gives 5 MP base with non-Digital Mosje');
    it.todo('draws 1 card as flavor bonus with Digital Mosje');
    it.todo('draws 1 card as flavor bonus with non-Digital Mosje');
  });
  describe('effect_mouse', () => {
    it.todo('gives 15 MP with Digital Mosje at level 1');
    it.todo('gives 25 MP with Digital Mosje at level 2');
    it.todo('gives 40 MP with Digital Mosje at level 3');
    it.todo('gives 5 MP base with non-Digital Mosje');
  });
  describe('effect_controller', () => {
    it.todo('gives 15 MP with Digital Mosje at level 1');
    it.todo('gives 25 MP with Digital Mosje at level 2');
    it.todo('gives 40 MP with Digital Mosje at level 3');
    it.todo('gives 5 MP base with non-Digital Mosje');
    it.todo('sets questPrepBonus +1 as flavor bonus');
  });
  describe('effect_tikker', () => {
    it.todo('gains exactly 40 MP flat (no dice roll)');
    it.todo('pushes QUEST_BLOCKED status effect with turnsLeft=1');
  });
});
