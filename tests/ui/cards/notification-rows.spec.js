// Notification rows: quest/passive gains are not hearts, no-change activations get an info row,
// many targets get compact rows, board tiles flash on heal.
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST, waitForBoard } from '../helpers.js';

const mk = (mp) => ({ players: { player_1: { activeSlots: [{ cardId: 'mosje_jisca', name: '[Jisca] The Maestro', mp, level: 1 }, { cardId: 'mosje_jisca', name: '[A] B', mp, level: 1 }, { cardId: 'mosje_jisca', name: '[C] D', mp, level: 1 }], piecieSlots: [], hand: [], graveyard: [] } } });

async function rows(page, before, after, options) {
  return page.evaluate(async ({ before, after, options }) => {
    const m = await import('/src/ui/actionAnimations.js');
    const s = await import('/src/ui/cardSpotlight.js');
    s.showCardSpotlight({ cardId: 'mosje_jisca', source: null });
    m.animateStateDelta(before, after, options);
    await new Promise(r => setTimeout(r, 300));
    return { texts: [...document.querySelectorAll('.spot-effect')].map(e => e.textContent), many: !!document.querySelector('.spot-effects--many') };
  }, { before, after, options });
}

test.beforeEach(async ({ page }) => {
  await seedOfflineSession(page);
  await page.goto(GAME_URL_TEST);
  await waitForBoard(page);
});

test('quest reward gain is a star, not a heart', async ({ page }) => {
  const r = await rows(page, mk(10), mk(20), { actionLabel: 'quest-resolution' });
  expect(r.texts.join('|')).toContain('★ +10 MP');
  expect(r.texts.join('|')).not.toContain('♥');
});

test('ability heal keeps the heart; turn-start passive is a sparkle', async ({ page }) => {
  expect((await rows(page, mk(10), mk(20), { actionLabel: 'mosje-ability' })).texts.join('|')).toContain('♥ +10 MP');
  expect((await rows(page, mk(10), mk(20), { actionLabel: 'turn-start' })).texts.join('|')).toContain('✦ +10 MP');
});

test('activation with no state change still shows an info row', async ({ page }) => {
  const r = await rows(page, mk(10), mk(10), { actionLabel: 'activate-piecie' });
  expect(r.texts.join('|')).toContain('Activated');
});

test('three targets hit at once get compact rows', async ({ page }) => {
  const r = await rows(page, mk(30), mk(20), { actionLabel: 'mosje-ability' });
  expect(r.texts.length).toBe(3);
  expect(r.many).toBe(true);
});
