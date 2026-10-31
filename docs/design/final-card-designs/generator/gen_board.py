#!/usr/bin/env python3
"""Tiers 22: board tiles. NOW = the v2.4c field tile (port of its face() in field mode);
A = 'mini card' in the locked style; B = 'glanceable' (numbers first, phone-first)."""
import os, re
import gen
from gen import esc, rgba, page, DIE, TY, die_face

TY2 = dict(TY)
TY2['SNELLE'] = ('#2DD4BF', '#CCFBF1')
QUEST = ('#CBD5E1', '#E2E8F0')
QTHEME = '#1c2040'
B = gen.BLOB
P = lambda n: '%spx' % (round(n * 100) / 100)

CARDS = {
    'gandoe': dict(kind='mosje', sub='FIGHTING', name='Gandoe', epi='The Unpredictable Wizard', art=B['mosje_gandoe_wizard'] if 'mosje_gandoe_wizard' in B else '4ea6d3f04b631f95863dd43978655733', pos='50% 28%',
                   power=10, mp=40, lvl=1, ability='Chaos Roll', short='Start of turn: roll a die. 1–2 −10 MP · 5–6 +10 Power', traits=[('Phys', 2), ('Res', 1), ('Cre', 2)]),
    'alyssa': dict(kind='mosje', sub='FIGHTING', name='Alyssa', epi='The Bulldozer', art='f14bf3a0e88ea140cfce5a7c5b956c20', pos='50% 12%',
                   power=30, mp=70, lvl=2, ability='Unstoppable', short='Taksed for 30+ in one turn: +25 MP and +10 Power', traits=[('Phys', 3), ('Res', 3), ('Soc', 3)], dmg=30, buff='+10'),
    'melk': dict(kind='piecie', name='Kannetje Melk', tag='FOOD', cost=0, art='fc7dd32c443142f1dc1196cdcf13d2b8', pos='50% 55%', short='One of your Mosjes gains 25 MP.', state='READY'),
    'tehard': dict(kind='piecie', name='Te Hard Gaan', tag='ATTACK', cost=2, art='a203e620ebfb551b5d7bc881dd7ae32b', pos='50% 40%', short='+20 Power this turn; at end of turn it loses 10 MP.', state='WAITS 1 TURN'),
    'coin': dict(kind='snelle', name='Lucky Cóin', tag='INSTANT', cost=1, art='61d9e9eebc75de43be7c39b16faa03d6', pos='50% 45%', short='Reroll any dice once. Creative ★★★: choose the result.'),
    'debox': dict(kind='place', name='De Box', cost=2, art='47f98db653db3501c099e793905d7c62', pos='50% 40%', short='Gandoe, Michelle, Tuk: +10 Power and +1 die on Physical Quests', good='Gandoe · Michelle · Tuk'),
    'arm': dict(kind='quest', sub='FIGHTING', name='Arm Wrestling', need='2× 4+', win='+40', lose='−30', short='Roll 1 die per Physical ★. Need two 4+.', rolls='Physical'),
}
ORDER = ['gandoe', 'alyssa', 'melk', 'tehard', 'coin', 'debox', 'arm']

def colours(c, locked):
    if c['kind'] == 'quest':
        return (QUEST if locked else TY['FIGHTING'])
    key = c['sub'] if c['kind'] == 'mosje' else c['kind'].upper()
    return (TY2 if locked else TY)[key]

def window(c, u, inset):
    o = ['<div style="position:absolute;left:%s;right:%s;top:%s;bottom:%s;border-radius:%s;overflow:hidden;background:%s">' % (P(inset * u), P(inset * u), P(inset * u), P(inset * u), P(4 * u), QTHEME if c['kind'] == 'quest' else '#0b0b0f')]
    if c['kind'] == 'quest':
        o.append('<svg aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%"><rect width="100%" height="100%" fill="url(#sgQT)"></rect></svg>')
        o.append(die_face(c.get('need', '4+'), round(40 * u if '2×' not in c.get('need', '') else 32 * u), '46%', '.55'))
    elif c.get('art'):
        o.append('<img src="/_blob/%s" alt="%s art" style="position:absolute;inset:0;width:100%%;height:100%%;object-fit:cover;object-position:%s">' % (c['art'], esc(c['name']), c.get('pos', '50% 40%')))
    o.append('<div style="position:absolute;left:0;right:0;top:0;height:%s;background:linear-gradient(180deg,rgba(0,0,0,.88),rgba(0,0,0,0))"></div>' % P(64 * u))
    o.append('<div style="position:absolute;left:0;right:0;bottom:0;height:%s;background:linear-gradient(0deg,rgba(0,0,0,.94),rgba(0,0,0,0))"></div>' % P(96 * u))
    return o

def mpbar(c, u):
    mp, dmg = c['mp'], c.get('dmg', 0)
    after = max(0, mp - dmg)
    return ('<div style="position:absolute;left:0;right:0;bottom:0;height:%s;background:rgba(255,255,255,.16)"><div style="position:absolute;left:0;top:0;bottom:0;width:%d%%;background:#fff"></div>%s</div>'
            % (P(max(3 * u, 2)), after, ('<div style="position:absolute;top:0;bottom:0;left:%d%%;width:%d%%;background:#ff4d6d;box-shadow:0 0 8px #ff4d6d"></div>' % (after, mp - after)) if dmg else ''))

# ───────── NOW: v2.4c field tile ─────────
def tile_now(c, W, H):
    u = W / 240
    col, tint = colours(c, False)
    f = lambda n, mn=0: P(max(n * u, mn))
    o = ['<div style="position:relative;width:%s;height:%s;border-radius:%s;overflow:hidden;background:#050505;color:#fff;font-family:Sora,sans-serif;box-shadow:0 %s %s rgba(0,0,0,.65)">' % (P(W), P(H), P(13 * u), P(10 * u), P(26 * u))]
    o += window(c, u, 6)
    if c['kind'] == 'mosje':
        o.append(mpbar(c, u))
    o.append('</div>')
    sub = {'mosje': c.get('epi', ''), 'quest': 'Fighting Quest'}.get(c['kind'], '')
    pips = ('<div style="margin-left:auto;display:flex;gap:%s;margin-top:%s">%s</div>' % (P(3 * u), P(3 * u), ('<div style="width:%s;height:%s;border-radius:50%%;border:1px solid rgba(255,255,255,.75)"></div>' % (P(7 * u), P(7 * u))) * 2)) if c['kind'] == 'quest' else ''
    o.append('<div style="position:absolute;left:%s;right:%s;top:%s;display:flex;justify-content:space-between;align-items:flex-start;gap:%s;text-shadow:0 1px 6px rgba(0,0,0,.6)"><div style="min-width:0"><div style="font-size:%s;font-weight:800;line-height:1.05;white-space:nowrap">%s</div><div style="font-size:%s;font-weight:600;color:rgba(255,255,255,.78);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:%s">%s</div></div>%s</div>'
             % (P(12 * u), P(12 * u), P(11 * u), P(6 * u), f(15, 11), esc(c['name']), f(9.5, 8), P(2 * u), esc(sub), pips))
    num = 'font-size:%s;font-weight:800;line-height:1' % f(21, 13)
    lab = 'font-size:%s;font-weight:700;letter-spacing:.16em;color:rgba(255,255,255,.72);margin-top:2px' % f(6.5, 6)
    foot = 'position:absolute;left:%s;right:%s;bottom:%s;display:flex;align-items:flex-end;justify-content:space-between;gap:6px' % (P(12 * u), P(12 * u), P(12 * u))
    if c['kind'] == 'mosje':
        mpnow = c['mp'] - c.get('dmg', 0)
        buff = ('<span style="font-size:%s;font-weight:800;background:%s;padding:0 4px;border-radius:4px">%s</span>' % (f(8, 8), TY['PLACE'][0], c['buff'])) if c.get('buff') else ''
        was = ('<span style="font-size:%s;font-weight:700;color:rgba(255,255,255,.5);text-decoration:line-through">%d</span>' % (f(11, 9), c['mp'])) if c.get('dmg') else ''
        o.append('<div style="%s"><div><div style="display:flex;align-items:baseline;gap:4px"><span style="%s">%d</span>%s</div><div style="%s">POWER</div></div><div style="padding:1px %s;border-radius:%s;background:%s;color:%s;font-size:%s;font-weight:800;margin-bottom:%s">L%d</div><div style="text-align:right"><div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end">%s<span style="%s%s">%d</span></div><div style="%s">MP</div></div></div>'
                 % (foot, num, c['power'], buff, lab, P(6 * u), P(4 * u), col, tint, f(9, 8), P(3 * u), c['lvl'], was, num, ';color:#ff4d6d' if c.get('dmg') else '', mpnow, lab))
    elif c['kind'] == 'quest':
        o.append('<div style="%s"><div><div style="%s">%s</div><div style="%s">NEED</div></div><div style="text-align:center"><div style="%s">%s</div><div style="%s">WIN</div></div><div style="text-align:right"><div style="%s">%s</div><div style="%s">LOSE</div></div></div>' % (foot, num, esc(c['need']), lab, num, c['win'], lab, num, c['lose'], lab))
    else:
        pill = 'display:inline-block;padding:%s %s;border-radius:999px;background:%s;color:#fff;font-size:%s;font-weight:700;letter-spacing:.12em' % (P(max(2 * u, 1.5)), P(max(7 * u, 5)), col, f(7.5, 7.5))
        tag = c.get('tag', '') if c['kind'] != 'place' else 'GOOD: ' + c['good'].upper()
        o.append('<div style="%s"><div style="display:flex;align-items:center;gap:6px;min-width:0"><span style="%s">%s</span><span style="font-size:%s;font-weight:700;letter-spacing:.14em;color:rgba(255,255,255,.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">%s</span></div></div>' % (foot, pill, c['kind'].upper(), f(7.5, 7.5), esc(tag)))
    o.append('</div>')
    return ''.join(o)

# ───────── A and B: locked style ─────────
def line(c, u, col):
    if c['kind'] == 'mosje':
        return ''
    return '<div style="position:absolute;inset:%s;border-radius:%s;box-shadow:inset 0 0 0 %s %s;pointer-events:none;z-index:3"></div>' % (P(2.2 * u), P(11 * u), P(max(1.6 * u, 1.25)), col)

def tile_locked(c, W, H, mode):
    u = W / 240
    small = W < 200
    col, tint = colours(c, True)
    f = lambda n, mn=0: P(max(n * u, mn))
    sh = 'text-shadow:0 1px 3px #000,0 0 8px rgba(0,0,0,.8)'
    o = ['<div style="position:relative;width:%s;height:%s;border-radius:%s;overflow:hidden;background:#050505;color:#fff;font-family:Sora,sans-serif;box-shadow:0 %s %s rgba(0,0,0,.65)">' % (P(W), P(H), P(13 * u), P(10 * u), P(26 * u))]
    o += window(c, u, 6)
    if c['kind'] == 'mosje':
        o.append(mpbar(c, u))
    o.append('</div>')
    o.append(line(c, u, col))
    # header: cost / need · divider · name (Mosjes: no cost on the board, level instead)
    head = []
    if c['kind'] in ('piecie', 'snelle'):
        head.append('<div style="text-align:center;line-height:1"><div style="font-size:%s;font-weight:800">%d</div><div style="font-size:%s;font-weight:800;letter-spacing:.16em;color:%s;margin-top:2px">%s</div></div><div style="width:1px;align-self:stretch;background:rgba(255,255,255,.3)"></div>'
                    % (f(19 if mode == 'A' else 22, 13), c['cost'], f(5.5, 5.5), tint, 'COST'))
    if c['kind'] == 'quest':
        head.append('<div style="text-align:center;line-height:1"><div style="font-size:%s;font-weight:800;white-space:nowrap">%s</div><div style="font-size:%s;font-weight:800;letter-spacing:.16em;color:%s;margin-top:2px">NEED</div></div><div style="width:1px;align-self:stretch;background:rgba(255,255,255,.3)"></div>' % (f(15, 11), esc(c['need']), f(5.5, 5.5), tint))
    name_fs = 15 if mode == 'A' else 14
    if small:
        name_fs = 15
    tr = ''
    if c['kind'] == 'mosje' and mode == 'A' and not small:
        tr = '<div style="font-family:\'DM Sans\',sans-serif;font-size:%s;font-weight:700;color:#e9e9ee;margin-top:%s;white-space:nowrap">%s</div>' % (f(8, 7.5), P(3 * u), ' · '.join('%s <span style="color:%s">%s</span>' % (k, tint, '★' * v) for k, v in c['traits']))
    head.append('<div style="min-width:0;flex:1"><div style="font-size:%s;font-weight:800;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">%s</div>%s</div>' % (f(name_fs, 11), esc(c['name']), tr))
    if c['kind'] == 'mosje':
        head.append('<div style="font-size:%s;font-weight:800;letter-spacing:.14em;color:%s;white-space:nowrap;margin-top:%s">LVL %d</div>' % (f(7.5, 7), tint, P(3 * u), c['lvl']))

    o.append('<div style="position:absolute;left:%s;right:%s;top:%s;display:flex;align-items:%s;gap:%s;%s;z-index:2">%s</div>' % (P(12 * u), P(12 * u), P(10 * u), 'flex-start', P(7 * u), sh, ''.join(head)))
    # middle line (A only, desktop size): the one thing you need to remember about the card
    if mode == 'A' and not small:
        if c['kind'] == 'mosje':
            txt = '<b>%s</b> · %s' % (esc(c['ability']), esc(c['short']))
        elif c['kind'] == 'place':
            txt = esc(c['short'])
        else:
            txt = esc(c['short'])
        o.append('<div style="position:absolute;left:%s;right:%s;bottom:%s;font-family:\'DM Sans\',sans-serif;font-size:%s;line-height:1.3;color:#f1f1f4;%s;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;z-index:2">%s</div>'
                 % (P(12 * u), P(12 * u), P((46 if c['kind'] in ('mosje', 'quest') else 26) * u), f(9.5, 8), sh, txt))
    # footer
    big = 21 if mode == 'A' else 26
    if small:
        big = 22
    num = 'font-size:%s;font-weight:800;line-height:1' % f(big, 14)
    lab = 'font-size:%s;font-weight:800;letter-spacing:.16em;color:%s;margin-top:2px' % (f(6, 6), tint)
    foot = 'position:absolute;left:%s;right:%s;bottom:%s;display:flex;align-items:flex-end;justify-content:space-between;gap:6px;%s;z-index:2' % (P(12 * u), P(12 * u), P(10 * u), sh)
    if c['kind'] == 'mosje':
        mpnow = c['mp'] - c.get('dmg', 0)
        buff = ('<span style="font-size:%s;font-weight:800;color:#fff;background:%s;padding:0 4px;border-radius:4px;text-shadow:none">%s</span>' % (f(8, 8), TY['PLACE'][0], c['buff'])) if c.get('buff') else ''
        was = ('<span style="font-size:%s;font-weight:700;color:rgba(255,255,255,.5);text-decoration:line-through">%d</span>' % (f(11, 9), c['mp'])) if c.get('dmg') else ''
        traits = ' '.join('%s<span style="color:%s">%s</span>' % (k, tint, '★' * v) for k, v in c['traits'])
        centre = ''
        o.append('<div style="%s"><div><div style="display:flex;align-items:baseline;gap:4px"><span style="%s">%d</span>%s</div><div style="%s">POWER</div></div>%s<div style="text-align:right"><div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end">%s<span style="%s%s">%d</span></div><div style="%s">MP</div></div></div>'
                 % (foot, num, c['power'], buff, lab, centre, was, num, ';color:#ff4d6d' if c.get('dmg') else '', mpnow, lab))
    elif c['kind'] == 'quest':
        o.append('<div style="%s"><div><div style="%s">%s</div><div style="%s">WIN</div></div>%s<div style="text-align:right"><div style="%s">%s</div><div style="%s">LOSE</div></div></div>'
                 % (foot, num, c['win'], lab, '' if small else '<div style="font-family:\'DM Sans\',sans-serif;font-size:%s;font-weight:700;color:#e9e9ee;padding-bottom:%s">Rolls %s</div>' % (f(8, 7.5), P(2 * u), esc(c['rolls'])), num, c['lose'], lab))
    else:
        label = {'piecie': 'PIECIE' + (' · ' + c['tag'] if c.get('tag') in ('FOOD', 'GEAR', 'SUBSTANCE', 'PET') else ''), 'snelle': 'SNELLE · INSTANT', 'place': 'PLACE'}[c['kind']]
        if mode == 'B' and c['kind'] == 'place':
            label = 'GOOD FOR ' + c['good'].upper()
        o.append('<div style="%s"><span style="font-size:%s;font-weight:800;letter-spacing:.16em;color:%s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">%s</span></div>' % (foot, f(7, 6.5), tint, esc(label)))
    o.append('</div>')
    return ''.join(o)

def chip(text, color):
    return '<div style="position:absolute;right:8px;bottom:-12px;padding:3px 9px;border-radius:999px;background:#07080f;border:1px solid %s;color:%s;font-family:Sora,sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;white-space:nowrap;z-index:4">%s</div>' % (color, color, esc(text))

def slot(x, y, W, H, inner, state=None):
    o = '<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;border-radius:%dpx;outline:1px solid rgba(63,208,255,.32);outline-offset:%dpx;box-shadow:0 16px 34px -12px rgba(63,208,255,.4)">%s%s</div>' % (x, y, W, H, round(13 * W / 240), 3 if W < 200 else 5, inner, chip(state, '#3fd0ff') if state else '')
    return o

def board():
    W = 2000
    b = ['<div style="position:absolute;left:40px;top:24px;font-family:Sora,sans-serif;font-weight:800;font-size:28px;color:#fff">Board tiles · now vs two directions in the locked card style</div>',
         '<div style="position:absolute;left:40px;top:70px;width:1900px;font-size:14px;line-height:1.5;color:#a8a3c0">On the table a card is a landscape tile (240×176 desktop, 142×104 / 118×86 phone). The full card text lives in the hover / tap panel; the tile only shows what you need to play. Sockets and chips as on board v2.4c (Alyssa shows a −30 taksen preview and a +10 Place buff).</div>']
    y = 140
    rows = [
        ('NOW · board v2.4c field tile', 'Type pills and Mosje epithet on every tile; same frame for every type; no cost on Piecies; MP bar on Mosjes.', lambda c, w, h: tile_now(c, w, h)),
        ('A · mini card (desktop first)', 'Locked look: black frame + type line (Mosjes none, Snelle mint). Cost on Piecies / Snelle, LVL and traits (for Quest rolls) on Mosjes, one remember-line: the ability or effect, 2 lines max.', lambda c, w, h: tile_locked(c, w, h, 'A')),
        ('B · glanceable (phone first)', 'Same frame, no text lines: only name, the numbers you act on (cost, Power, MP, WIN / LOSE) bigger, and the type label. Everything else in the tap panel.', lambda c, w, h: tile_locked(c, w, h, 'B')),
    ]
    states = {'melk': 'READY', 'tehard': 'WAITS 1 TURN', 'gandoe': 'READY', 'alyssa': 'TARGET · −30'}
    for title, desc, fn in rows:
        b.append('<div style="position:absolute;left:40px;top:%dpx"><span style="font-family:Sora,sans-serif;font-weight:800;font-size:18px;color:#fff">%s</span><span style="font-size:13.5px;color:#a8a3c0;margin-left:12px">%s</span></div>' % (y, esc(title), esc(desc)))
        y += 46
        x = 46
        for k in ORDER:
            c = CARDS[k]
            b.append(slot(x, y, 240, 176, fn(c, 240, 176), states.get(k)))
            x += 240 + 36
        y += 176 + 40
        # phone sizes
        b.append('<div style="position:absolute;left:46px;top:%dpx;font-family:Sora,sans-serif;font-size:11px;font-weight:800;letter-spacing:.2em;color:#8d93b3">PHONE · MOSJES 142×104 · OTHERS 118×86</div>' % y)
        y += 26
        x = 46
        for k in ORDER:
            c = CARDS[k]
            w, h = (142, 104) if c['kind'] == 'mosje' else (118, 86)
            b.append(slot(x, y + (104 - h), w, h, fn(c, w, h), None))
            x += w + 26
        y += 104 + 70
    H = y
    return page('Mosjes board tiles', W, H, '\n'.join(b)), W, H

if __name__ == '__main__':
    p, W, H = board()
    p = p.replace("font-family: 'DM Sans',sans-serif\">", "font-family: 'DM Sans',sans-serif\">", 1)
    open(os.path.join(gen.OUT, 'CardTiers22.dc.html'), 'w').write(p)
    print(W, H, len(p))
