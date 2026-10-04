// Shared helpers for the card frame v1 specs (render real cards in the live page).
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';

export const OUT = 'tests/ui/screenshots/cardv1';

export async function openGame(page) {
  await seedOfflineSession(page);
  await page.setViewportSize({ width: 2400, height: 2200 });
  await page.goto(GAME_URL_TEST);
  await page.waitForFunction(() => window.__testHooks, { timeout: 20000 });
}

// Renders the given cards into a gallery in the live page (mode: full or field).
export async function renderGallery(page, mode, widthPx, ids) {
  return page.evaluate(async ({ mode, widthPx, ids }) => {
    const { renderCard } = await import('/src/ui/cardRenderer.js');
    const { getCardById } = await import('/src/data/cardIndex.js');
    document.getElementById('cv1-gallery')?.remove();
    const root = document.createElement('div');
    root.id = 'cv1-gallery';
    root.style.cssText = 'position:fixed;left:0;top:0;width:2400px;min-height:2200px;z-index:99999;background:#0d0b14;display:flex;flex-wrap:wrap;gap:24px;padding:24px;align-content:flex-start';
    for (const id of ids) {
      const el = renderCard(getCardById(id), { compact: mode === 'field', fieldMode: mode === 'field' });
      el.style.setProperty('--cv1-w', `${widthPx}px`);
      el.dataset.testCard = id;
      root.appendChild(el);
    }
    document.body.appendChild(root);
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 400));
  }, { mode, widthPx, ids });
}

// Measures geometry of every rendered gallery card (positions relative to the card).
export async function measureGallery(page) {
  return page.evaluate(() => [...document.querySelectorAll('#cv1-gallery [data-test-card]')].map((card) => {
    const c = card.getBoundingClientRect();
    const rel = (sel) => {
      const el = card.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: +(r.left - c.left).toFixed(1), right: +(r.right - c.left).toFixed(1), top: +(r.top - c.top).toFixed(1), bottom: +(r.bottom - c.top).toFixed(1) };
    };
    const first = rel('.cv1-first'), nick = rel('.cv1-nick'), desc = rel('.cv1-desc'), info = rel('.cv1-info'),
      pill = rel('.cv1-pill'), border = rel('.cv1-border-text'), badge = rel('.cv1-badge');
    const q = (s) => card.querySelector(s);
    return {
      id: card.dataset.testCard,
      lefts: { first: first?.left, nick: nick?.left ?? null, desc: desc?.left, info: info?.left, pill: pill?.left, border: border?.left },
      descTop: desc?.top, descBottom: desc?.bottom, infoTop: info?.top,
      descNameGap: desc ? +(desc.top - (nick || first).bottom).toFixed(1) : null,
      descHeightPct: desc ? +(((desc.bottom - desc.top) / c.height) * 100).toFixed(1) : null,
      descClearOfInfo: desc ? desc.bottom <= info.top + 1 : null,
      infoRight: info?.right, badgeLeft: badge?.left ?? null, badgeTop: badge?.top ?? null,
      infoOverBadge: badge ? info.right > badge.left && info.bottom > badge.top : false,
      hasBadge: !!badge,
      badgeValueFits: badge ? q('.cv1-badge-val').scrollWidth <= q('.cv1-badge').clientWidth : null,
      badgeLabelFits: badge ? q('.cv1-badge-label').scrollWidth <= q('.cv1-badge').clientWidth : null,
      firstOverflow: q('.cv1-first').scrollWidth > q('.cv1-name').clientWidth + 1,
      firstSize: parseFloat(getComputedStyle(q('.cv1-first')).fontSize),
      descSize: desc ? parseFloat(getComputedStyle(q('.cv1-desc')).fontSize) : null,
      flaggedOverflow: q('.cv1-face').dataset.cv1Overflow === 'true',
      pillText: q('.cv1-pill')?.textContent, infoText: q('.cv1-info')?.textContent, borderText: q('.cv1-border-text')?.textContent,
      badgeText: badge ? `${q('.cv1-badge-val').textContent} ${q('.cv1-badge-label').textContent}` : null,
      pillColor: getComputedStyle(q('.cv1-pill')).backgroundColor,
    };
  }));
}
