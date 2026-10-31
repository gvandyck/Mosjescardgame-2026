#!/usr/bin/env python3
"""Final Card Designs handover canvas (Obby Card Game 2.0). One artboard per section.
Run: python3 final.py  -> writes ../final/project/*.dc.html + canvas.json"""
import os, re, json, math
import gen
from gen import card, prep, item, quest, page, esc, rgba, TY, QLINE, DIE
from gen57 import B
import gen_board as gb

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'final', 'project')
os.makedirs(OUT, exist_ok=True)

# ── art uploaded to the Final Card Designs canvas ──
NEW = {'affoe': '554628f31f486a08a9a882eaf50185d8', 'alyssa-bulldozer': '7305665c570d6d39f5c78fffbb83e362', 'alyssa-fissa': 'af55fd831e8c50a7a5791e0bebc40d57',
       'bong-hit': 'dc49356d4ff10b9004754eb0237edc8f', 'bowie-stormey': '3e5de0dc6dc02e6f5c2e7dcebe6c92c6', 'boxing-ring': 'ee4fd4e3931144435ce070600e7c4172',
       'broodje-doner': '464a1d406b6317fbc2f7aca6102e1d71', 'call-of-welloes': '5b463df47fc0c4fa27721041e03b8bd8', 'chris-ddr': '3ba972b6041866d08a770c66258758f9',
       'de-box': 'f042330f2c7b4c8dfcc45d9bca72676d', 'dikke-taks': 'b59a51e239e785d99b733bbd77bdc715', 'emergency-healings': '831d5033d5e11210ae2aa856a57ba7b6',
       'fps-west': '36cf4e1315e4b409c3127820cb9312d7', 'gandoe-destroyer': '67919f7f8f8fe7af35e779068ca48501', 'gandoe-wizard': '7f64349716aa27d33104f4ea2d9ac469',
       'jisca': '4a635ec6e6e6dde3a0f2bc067f731e8c', 'kannetje-melk': '9e1fac24e4502942173e724a0036b951', 'katjegang': '28cdc21824e69c2fc6df57ac2ec05b44',
       'lucky-coin': 'c431c9496a2d94751c6ccffd42f23fd9', 'martin-historian': '77f603c606681aa790a264932f9e856f', 'martin-senor-west': 'cdfa242e37089b72bdb930a1428d164f',
       'michelle-alt': '5b6e91c9b1a20ee86c6f62aafecd24ab', 'michelle': '322715d8bf4ca3037598213d64e1c1d3', 'natures-gift': '97bfb54147416142a0ed3c5c3242ffcd',
       'pot-of-weed': '342e67529ba133a43e54dc8e58393699', 'redbull': 'a8d10de575cc0de17d76f7a34b2f6160', 'ronald-kip': '420e3b5658e0cd5b90035798aad38797',
       'te-hard-gaan': '719f141dfa336b81072a11bcfa4fd4e4', 'the-gym': '48a83970b8e1a9b89e9a9fb5e25c24e6', 'the-protector': '7fbf95a6b8398b9736bd42669857fe5b',
       'tony': 'fa4a26f6f247bc81e6bc0555033935d0', 'welloe-graveyard': '19863e449158e7ebdfd9d587be3e63d8', 'youri': '1d1c0364a95fc4a5c9cbdfe242d61a26'}
CID = {'affoe': 'piecie_affoe', 'alyssa-bulldozer': 'mosje_alyssa_bulldozer', 'bong-hit': 'piecie_bong_hit_demolition', 'bowie-stormey': 'piecie_bowie_stormey',
       'boxing-ring': 'place_boxing_ring', 'broodje-doner': 'piecie_broodje_doner', 'call-of-welloes': 'piecie_call_of_welloes', 'chris-ddr': 'mosje_chris_ddr',
       'de-box': 'place_de_box', 'dikke-taks': 'piecie_dikke_taks', 'emergency-healings': 'snelle_emergency_healings', 'fps-west': 'mosje_fps_west',
       'gandoe-wizard': 'mosje_gandoe_wizard', 'gandoe-destroyer': 'mosje_gandoe_destroyer', 'jisca': 'mosje_jisca', 'kannetje-melk': 'piecie_kannetje_melk',
       'katjegang': 'piecie_katjegang', 'lucky-coin': 'snelle_lucky_coin', 'martin-historian': 'mosje_martin_historian', 'martin-senor-west': 'mosje_martin_senor_west',
       'michelle': 'mosje_michelle', 'natures-gift': 'piecie_eendjes_voeren', 'pot-of-weed': 'piecie_pot_of_weed', 'redbull': 'piecie_redbull',
       'ronald-kip': 'piecie_ronald_kip', 'te-hard-gaan': 'piecie_te_hard_gaan', 'the-gym': 'place_the_gym', 'the-protector': 'snelle_the_protector',
       'tony': 'piecie_tony', 'welloe-graveyard': 'place_welloe_graveyard', 'youri': 'mosje_youri'}
gen.BLOB.clear()
for k, cid in CID.items():
    gen.BLOB[cid] = NEW[k]

MINT = ('#2DD4BF', '#CCFBF1')
SILVER = QLINE['QUEST']
CFG = dict(sidewhite=True, kwwhite=True, nopips=True, side=202, snellecol=MINT, adaptive=True, foot='none', nodia=True, lean=True, sidetype=True, typering=True)
ME, BOT, GOLD, RED = '#3fd0ff', '#ff4d6d', '#ffc94d', '#ff4d6d'
TRAITN = {'physical': 'Physical', 'resilient': 'Resilient', 'creative': 'Creative', 'social': 'Social', 'mental': 'Mental', 'technical': 'Technical'}
TRAITS = {'physical': 'Phys', 'resilient': 'Res', 'creative': 'Cre', 'social': 'Soc', 'mental': 'Men', 'technical': 'Tech'}

def setg():
    gen.G.clear(); gen.G.update(B); gen.G.update(CFG)

# ───────── card data ─────────
def it(cid, kind, tier=None):
    p = gen.BYID[cid]
    return item(cid, tier or (5 if len(p['rarity']) == 5 else 4), kind)

def fq(qid):
    """Quest in the locked keyword style: Needs (condition) · Pay (cost) · Roll · Win (extra), all bold white."""
    c = quest(qid)
    q = gen.BYID[qid]
    band = q.get('band') or ''
    trait = (c['rolls'].split(':', 1)[1].split('·')[0]).strip()
    m = re.search(r'\((two|one) (\d)\+\)', q.get('text') or '')
    cnt, th = (m.group(1), m.group(2)) if m else ('one', '4')
    p = []
    if q.get('costText'):
        t = q['costText']
        t = 'this ' + t if t.startswith('Mosje ') else (t[0].lower() + t[1:] if t.split(' ')[0] in ('Your', 'Discard', 'Reveal', 'A', 'Pay') else t)
        p.append('<b>%s</b> %s.' % ('Pay:' if band == 'prepared' or t.startswith(('discard', 'reveal', 'pay')) else 'Needs:', esc(t)))
    if band == 'trained':
        p.append('<b>Roll:</b> none, it can’t fail.')
    elif band == 'coin_flip':
        p.append('<b>Roll:</b> 1 die, need 4+.')
    else:
        p.append('<b>Roll:</b> 1 die per %s ★, need %s %s+.' % (esc(trait), cnt, th))
    ex = q.get('extras')
    if ex:
        ex = re.sub(r'\*\*(.+?)\*\*', r'\1', ex)
        if ex.startswith('Win:'):
            p.append('<b>Win:</b> %s' % esc(ex[4:].strip()))
        else:
            p.append(esc(ex))
    c.update(tier=4, paras=p, rolls='')
    return c

def lv(cid, n, paras, pq=None, art=None, pos=None):
    m = gen.BYID[cid]
    nm, _, epi = m['name'].partition(', ')
    L = m['levels'][n - 1]
    traits = ' · '.join('%s %s' % (TRAITN[k], '★' * v) for k, v in L['traits'].items())
    return dict(kind='mosje', sub=m['subtype'], tier=5 if n == 3 else 4, name=nm, subname=epi, cost=str(m['cost']) if n == 1 else None,
                art=NEW[art] if art else gen.BLOB.get(cid), pos=pos or m.get('artFocus') or '50% 22%', paras=paras, pq=pq, levelcard=n,
                traitsline=traits, power=L['power'], mp=str(m['startMP'] if n == 1 else ENTRY_MP[n]), levels=[], lvl=n)

ENTRY_MP = {2: 10, 3: 10}   # default MP on a Mosje card is 10 (never 0); a card may print another value

GANDOE = {
    1: ['<b>Chaos Roll:</b> at the start of your turn roll a die: 1–2 this Mosje loses 10 MP; 3–4 nothing; 5–6 +10 Power this turn.'],
    2: ['<b>Chaos Storm:</b> at the start of your turn roll 2 dice. Each 5–6: +10 Power this turn. Each 1: this Mosje loses 10 MP.'],
    3: ['<b>Grand Chaos:</b> at the start of your turn roll a die: 1 this Mosje loses 20 MP; 2–5 +20 Power this turn; 6 one opponent Mosje loses 30 MP.'],
}
GANDOE_PQ = ['<b>Title Fight</b>', '<b>Needs:</b> De Box or Boxing Ring in play, and Boxing Gloves ready on your field.', '<b>Roll:</b> none.']
MICHELLE = {
    1: ['<b>Tough Gamble:</b> when this Mosje succeeds at a Quest, roll a die: 1–3 it gets half the MP, 4–6 it gets double.'],
    3: ['<b>Iron Gamble:</b> when this Mosje succeeds at a Quest, roll a die: 1–2 it gets the normal MP, 3–6 it gets double.'],
}
MICHELLE_PQ = ['<b>Cat Sanctuary</b>', '<b>Needs:</b> Bowie &amp; Stormey ready on your field.', '<b>Pay:</b> discard 2 FOOD Piecies.', '<b>Roll:</b> 1 die, need 4+.']

def gandoe(n):
    return lv('mosje_gandoe_wizard', n, GANDOE[n], GANDOE_PQ if n == 3 else None,
              art='gandoe-destroyer' if n == 3 else 'gandoe-wizard', pos={1: '50% 30%', 2: '50% 12%', 3: '50% 25%'}[n])

def michelle(n):
    return lv('mosje_michelle', n, MICHELLE[n], MICHELLE_PQ if n == 3 else None, art='michelle-alt' if n == 3 else 'michelle', pos='50% 20%')

def youri():
    a = gen.BYID['mosje_youri']['abilityDescription']; h, _, r = a.partition(': ')
    return lv('mosje_youri', 1, ['<b>%s:</b> %s' % (esc(h), esc(r))], art='youri', pos='50% 22%')

def jisca():
    a = gen.BYID['mosje_jisca']['abilityDescription']; h, _, r = a.partition(': ')
    return lv('mosje_jisca', 1, ['<b>%s:</b> %s' % (esc(h), esc(r))], art='jisca')

def martin_long():
    m = gen.BYID['mosje_martin_senor_west']
    h, _, r = m['abilityDescription'].partition(': ')
    p = ['<b>%s:</b> %s' % (esc(h), esc(r))]
    if m.get('synergyEffect'):
        p.append('<b>Synergy:</b> ' + esc(m['synergyEffect']))
    ABIL['mosje_martin_senor_west'] = p; ARTOF['mosje_martin_senor_west'] = ('martin-senor-west', '50% 20%')
    return mos('mosje_martin_senor_west', 'B')

CARDBACK_SVG = open(os.path.join(HERE, 'cardback_x2.svg')).read()   # "XXL · Engraved" (X2) with solid marks, 31 Oct

def cardback():
    return '<div style="position:relative;width:440px;height:616px;border-radius:24px;overflow:hidden;background:#050505;box-shadow:0 24px 50px rgba(0,0,0,.7)">%s</div>' % CARDBACK_SVG.replace('<svg ', '<svg style="display:block;width:100%;height:100%" ', 1)

# ───────── layout helpers ─────────
def at(html, x, y, s, h=616):
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx"><div style="width:440px;height:%dpx;transform:scale(%s);transform-origin:0 0">%s</div></div>'
            % (x, y, round(440 * s), round(h * s), h, s, html))

def C(c, x, y, s, key=None):
    setg()
    return ('<div data-k="%s" style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx"><div style="width:440px;height:616px;transform:scale(%s);transform-origin:0 0">%s</div></div>'
            % (key or '', x, y, round(440 * s), round(616 * s), s, card(prep(c))))

def H1(x, y, t, sub=None, w=2000):
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx"><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:30px;color:#fff">%s</div>%s</div>'
            % (x, y, w, esc(t), ('<div style="font-size:15px;line-height:1.55;color:#b4afc9;margin-top:8px">%s</div>' % sub) if sub else ''))

def H2(x, y, t, sub=None, w=2000):
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx"><span style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:19px;color:#fff">%s</span>%s</div>'
            % (x, y, w, esc(t), ('<span style="font-size:14px;color:#a8a3c0;margin-left:12px">%s</span>' % sub) if sub else ''))

def cap(x, y, w, title, lines):
    li = ''.join('<div style="margin-top:3px">%s</div>' % l for l in lines)
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;color:#e7e5f2"><div style="font-family:\'Sora\',sans-serif;font-weight:700;font-size:14px">%s</div><div style="font-size:12.5px;line-height:1.45;color:#a8a3c0;margin-top:2px">%s</div></div>'
            % (x, y, w, esc(title), li))

def panel(x, y, w, h, inner, pad=26):
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;%sbox-sizing:border-box;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.035);padding:%dpx">%s</div>'
            % (x, y, w, ('height:%dpx;' % h) if h else '', pad, inner))

def rules(items, size=14):
    return '<ul style="margin:0;padding-left:18px;font-size:%spx;line-height:1.55;color:#d6d2e6">%s</ul>' % (size, ''.join('<li style="margin-top:5px">%s</li>' % i for i in items))

def sw(col, w=26, h=26):
    return '<span style="display:inline-block;width:%dpx;height:%dpx;border-radius:6px;background:%s;box-shadow:0 0 0 1px rgba(255,255,255,.18);vertical-align:middle"></span>' % (w, h, col)

def mini(line, w=58, h=81):
    inner = ('box-shadow:inset 0 0 0 2px %s,inset 0 0 0 5px #050505,0 0 0 1px rgba(255,255,255,.14)' % line) if line else 'box-shadow:0 0 0 1px rgba(255,255,255,.14)'
    return '<span style="display:inline-block;width:%dpx;height:%dpx;border-radius:8px;background:#0b0b10;%s;vertical-align:middle"></span>' % (w, h, inner)

def T(rows, cols, widths):
    head = ''.join('<th style="text-align:left;padding:8px 12px;font-family:\'Sora\',sans-serif;font-size:11px;font-weight:800;letter-spacing:.14em;color:#8d93b3;border-bottom:1px solid rgba(255,255,255,.14);width:%s">%s</th>' % (wd, esc(c)) for c, wd in zip(cols, widths))
    body = ''.join('<tr>%s</tr>' % ''.join('<td style="padding:9px 12px;font-size:13.5px;line-height:1.45;color:#e7e5f2;border-bottom:1px solid rgba(255,255,255,.07);vertical-align:middle">%s</td>' % v for v in r) for r in rows)
    return '<table style="border-collapse:collapse;width:100%%"><thead><tr>%s</tr></thead><tbody>%s</tbody></table>' % (head, body)

def marker(x, y, n, col='#ffc94d'):
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%%;background:%s;color:#07080f;font-family:\'Sora\',sans-serif;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(5,5,5,.75);z-index:9">%d</div>' % (x, y, col, n))

# ═════════ 1. Overview & legend ═════════
def pf(inner, extra=''):
    return '<div style="box-sizing:border-box;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.035);padding:26px;%s">%s</div>' % (extra, inner)

def h3(t, col='#fff'):
    return '<div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:18px;color:%s;margin-bottom:10px">%s</div>' % (col, esc(t))

def Cr(c, s, key=''):
    setg()
    return ('<div data-k="%s" style="position:relative;width:%dpx;height:%dpx;flex-shrink:0"><div style="width:440px;height:616px;transform:scale(%s);transform-origin:0 0">%s</div></div>'
            % (key, round(440 * s), round(616 * s), s, card(prep(c))))

def overview():
    W, H = 2400, 1760
    boards = [('01 Overview', 'Colours, type, finishes, sizes, what never goes on a card'), ('02 Anatomy', 'Every measurement of the hand card, per type'),
              ('03 Mosjes', 'One Mosje card (level strip B), Ultimate, Personal Quest cards'), ('04 Piecie · Snelle · Place · Quest', 'Every type and subtype, plus the card back'),
              ('05 Rarity & finish', 'Full art vs foil per type, copy limits'), ('06 Text rules & edge cases', 'Auto-sizing and the longest real cards'),
              ('07 Board tiles', 'Tile per type, desktop and phone'), ('08 Board states', 'Every 2.0 state on the table'), ('09 Hand & detail', 'Hand fan, hover, detail panel')]
    toc = pf(h3('This canvas') + ''.join('<div style="display:flex;gap:14px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)"><span style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:14px;color:#ffc94d;width:250px;flex-shrink:0">%s</span><span style="font-size:13.5px;color:#c9c5dc">%s</span></div>' % (esc(a), esc(d)) for a, d in boards))
    rows = [
        [mini(None, 40, 56), '<b>Mosje</b> (all levels)', 'none: plain black frame', 'Mosje type colour (below)', 'FIGHTING MOSJE (Ultimate: left ULTIMATE)'],
        [mini('#15803D', 40, 56), '<b>Piecie</b>', sw('#15803D') + ' <code>#15803D</code>', sw('#DCFCE7') + ' <code>#DCFCE7</code>', 'PIECIE · FOOD / GEAR / SUBSTANCE / PET, else PIECIE'],
        [mini(MINT[0], 40, 56), '<b>Snelle</b>', sw(MINT[0]) + ' <code>%s</code>' % MINT[0], sw(MINT[1]) + ' <code>%s</code>' % MINT[1], 'SNELLE · INSTANT'],
        [mini('#6D28D9', 40, 56), '<b>Place</b>', sw('#6D28D9') + ' <code>#6D28D9</code>', sw('#EDE9FE') + ' <code>#EDE9FE</code>', 'PLACE'],
        [mini('#D4A017', 40, 56), '<b>Personal Quest</b>', sw('#D4A017') + ' <code>#D4A017</code>', sw('#FEF3C7') + ' <code>#FEF3C7</code>', 'PERSONAL QUEST · left: FIGHTING / DIGITAL / ARTISTIC ONLY'],
        [mini(SILVER[0], 40, 56), '<b>Quest</b>', sw(SILVER[0]) + ' <code>%s</code>' % SILVER[0], sw(SILVER[1]) + ' <code>%s</code>' % SILVER[1], 'QUEST · FIGHTING / DIGITAL / ARTISTIC'],
    ]
    colours = pf(h3('Card type colours') + '<div style="font-size:13.5px;line-height:1.5;color:#a8a3c0;margin-bottom:10px">The frame line is a 2 px line 8 px inside the card edge, broken around the side labels. The tint colours only the small labels (COST, POWER, MP, NEED, WIN, LOSE). All other text, keywords and both side labels included, is white. No other colour on a card.</div>' +
                 T(rows, ['', 'TYPE', 'FRAME LINE', 'TINT (small labels)', 'SIDE LABEL (right, white)'], ['70px', '190px', '210px', '240px', 'auto']))
    typ = pf(h3('Fonts') + '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 28px">'
             '<div><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:40px;color:#fff;line-height:1">Gandoe</div><div style="font-size:12.5px;color:#a8a3c0;margin-top:8px">Sora 800 · names (≤ 40 px), numbers (34 px)</div></div>'
             '<div><div style="font-family:\'Sora\',sans-serif;font-weight:600;font-size:20px;color:#fff">The Unpredictable Wizard</div><div style="font-size:12.5px;color:#a8a3c0;margin-top:8px">Sora 600 · epithet (≤ 20 px)</div></div>'
             '<div><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:10px;letter-spacing:.14em;color:#FFEDD5">COST · POWER · MP</div><div style="font-family:\'Sora\',sans-serif;font-weight:700;font-size:6.5px;letter-spacing:.32em;color:#FFEDD5;margin-top:6px">FIGHTING MOSJE</div><div style="font-size:12.5px;color:#a8a3c0;margin-top:8px">Sora 800 labels 9–10 px · side labels Sora 700 6.5 px, tint</div></div>'
             '<div><div style="font-size:16px;line-height:1.45;color:#fff"><b>Chaos Roll:</b> at the start of your turn roll a die.</div><div style="font-size:12.5px;color:#a8a3c0;margin-top:8px">DM Sans 400 / 700 · card text 18 → 12.5 px</div></div></div>')
    mos = [[sw(TY[k][0]) + ' <b>%s</b>' % k.title(), '<code>%s</code>' % TY[k][0], sw(TY[k][1]) + ' <code>%s</code>' % TY[k][1]] for k in ('FIGHTING', 'DIGITAL', 'ARTISTIC')]
    mosp = pf(h3('Mosje type colours') + '<div style="font-size:13.5px;line-height:1.5;color:#a8a3c0;margin-bottom:10px">Mosjes have no frame line. Their type colour shows only in the tint of the small labels (COST / MP / LV1–3 / POWER · TRAITS) and the trait stars.</div>' + T(mos, ['TYPE', 'MAIN', 'TINT'], ['180px', '160px', 'auto']))
    ui = [[sw('#050505'), 'Card base', '<code>#050505</code>, white text, soft black shadow'], [sw(ME), 'You (owner)', '<code>#3fd0ff</code> sockets, chips, Energy'],
          [sw(BOT), 'Opponent · damage', '<code>#ff4d6d</code> sockets, TARGET, −MP'], [sw(GOLD), 'Level up · win', '<code>#ffc94d</code> board UI (cards use the PQ gold #D4A017)'],
          [sw('#6D28D9'), 'Place effect chip', '<code>#6D28D9</code> “+10” Power buff'], [sw('#07080f'), 'Table', '<code>#07080f</code> + 48 px grid lines']]
    uip = pf(h3('Board UI colours (board v2.4c)') + T(ui, ['', 'USE', 'VALUE'], ['46px', '190px', 'auto']))
    never = ['Type pills (PIECIE, SNELLE, PLACE, QUEST)', 'Rarity diamonds or any rarity mark', 'STAYS chip (the card’s own “Stays …” sentence is enough)',
             'Rules sentences in the card text that the rulebook covers (e.g. “play any time, also on your opponent’s turn”)', 'Level-up, MP reset, “hold to win” text', 'Corner glyphs or a level badge', 'A text box behind the description',
             'Boxed art windows or tier 1–3 frames', 'Separate level cards (the level is a marker on the table)', 'A Personal Quest printed on a Mosje (it is its own card)', 'Fail pips on Quests (a Quest leaves after one attempt)']
    nev = pf(h3('Never on a card', '#ff8fa3') + rules(never))
    fin = pf(h3('Two finishes only') + '<div style="font-size:13.5px;color:#a8a3c0;margin-bottom:16px">Full art for everything; foil for ★★★★★ cards and every Ultimate.</div><div style="display:flex;gap:30px">' +
             '<div>%s<div style="margin-top:10px;font-family:\'Sora\',sans-serif;font-weight:700;font-size:14px;color:#fff">Full art</div><div style="font-size:12.5px;color:#a8a3c0;width:264px">Art fills the card inside an 18 px black frame.</div></div>' % Cr(it('piecie_kannetje_melk', 'piecie'), .6, 'f1') +
             '<div>%s<div style="margin-top:10px;font-family:\'Sora\',sans-serif;font-weight:700;font-size:14px;color:#fff">Full art foil</div><div style="font-size:12.5px;color:#a8a3c0;width:264px">Holo wash, light sweep, three glints. Animated on hover / zoom only; still with reduced motion.</div></div></div>' % Cr(it('snelle_the_protector', 'snelle', 5), .6, 'f2'))
    sizes = [(440, 616, 'Hand / print card', '440 × 616 · 63 × 88 mm (5:7)'), (360, 504, 'Detail panel', '360 × 504'), (240, 176, 'Board tile', '240 × 176'),
             (142, 104, 'Phone Mosje tile', '142 × 104'), (118, 86, 'Phone tile', '118 × 86')]
    sz = pf(h3('Sizes (drawn at 50 %)') + '<div style="display:flex;gap:26px;align-items:flex-end;flex-wrap:wrap">' + ''.join(
        '<div><div style="width:%dpx;height:%dpx;border-radius:%dpx;border:1.5px dashed rgba(255,255,255,.4);box-sizing:border-box"></div><div style="margin-top:8px;font-family:\'Sora\',sans-serif;font-weight:700;font-size:13px;color:#fff;white-space:nowrap">%s</div><div style="font-size:12px;color:#a8a3c0;white-space:nowrap">%s</div></div>'
        % (w // 2, h // 2, max(6, w // 36), esc(t), esc(d)) for w, h, t, d in sizes) + '</div><div style="font-size:12.5px;color:#a8a3c0;margin-top:14px">Cards scale from one unit: 1u = width ÷ 440 (cards) or ÷ 240 (tiles).</div>')
    body = ('<div style="position:absolute;left:60px;top:170px;width:2280px;display:grid;grid-template-columns:700px minmax(0,1fr);gap:36px;align-items:start">'
            '<div style="display:flex;flex-direction:column;gap:36px">%s%s%s</div>'
            '<div style="display:flex;flex-direction:column;gap:36px">%s<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:36px;align-items:start">%s%s</div>'
            '<div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:36px;align-items:start">%s%s</div></div></div>') % (toc, typ, nev, colours, mosp, uip, fin, sz)
    b = [H1(60, 50, 'Obby Card Game 2.0 · Final card designs',
            'Handover for Claude Code: how every card must look in the game. Locked 29–31 Oct 2026. Written spec with every value: project doc <b style="color:#fff">“Obby Card Game 2.0 - Card Design Spec”</b>. Rules: <b style="color:#fff">“Rules and Decisions”</b> (one Mosje card + level marker, Ultimate, Personal Quest cards).', 2200), body]
    return page('Final card designs - overview', W, H, '\n'.join(b)), W, H

# ═════════ 2. Anatomy ═════════
ANAT = [
    ('Mosje', lambda: mos('mosje_gandoe_wizard', 'B'), [
        (9, 130, 'Frame', '18 px black frame all round, card radius 24, art radius 6. Mosjes: no type line.'),
        (16, 26, 'Cost', 'Sora 800 42 px, “COST” Sora 800 9 px .16em in tint, at x 28 / y 36. Summon cost; levelling is free.'),
        (416, 60, 'Name + epithet', 'Name Sora 800 ≤ 40 px (shrinks to fit), epithet Sora 600 ≤ 20 px, after a 1 px divider (50 px tall).'),
        (431, 264, 'Right side label', '“FIGHTING MOSJE”, Sora 700 6.5 px .32em, white 85 %; y 202–326 (centred 44 px above the middle).'),
        (9, 264, 'Left side label', '“OBBY CARD GAME” on every card (Ultimate: “ULTIMATE”, Personal Quest: “FIGHTING ONLY”), same style and colour; the frame line gap sits behind both labels.'),
        (300, 200, 'Art + fades', 'Art cover-fit, focus per card. Top fade 150 px black 88 % → 0; bottom fade sized to the text (380–580 px).'),
        (24, 400, 'Ability', 'DM Sans 15 → 13 px (auto-fit), line-height 1.45, bold ability name; a growth line starts with bold “From LV3:”. 42 px side margins.'),
        (24, 490, 'Level strip (B)', 'Header “POWER · TRAITS” Sora 800 9 px tint. Three rows, 1 px white 14 % between: “LV1” Sora 800 10 px tint · Power Sora 800 17 px · traits DM Sans 700 12 px (short names, ★ in tint). Bottom 36 px from the edge.'),
        (330, 566, 'MP', 'Start MP (default 10, never 0): the MP after summoning and after every level up / drop. Live MP is tracked on the board.'),
    ]),
    ('Piecie / Snelle / Place', lambda: it('snelle_lucky_coin', 'snelle'), [
        (8, 120, 'Type line', '2 px line in the type colour, 8 px inside the card edge (radius 17), broken around the side labels.'),
        (16, 26, 'Cost', 'Same as Mosje. Snelle with an alternative cost: small second line (“OR FREE”).'),
        (416, 60, 'Name', 'Sora 800 ≤ 40 px, shrinks to fit one line; no epithet.'),
        (431, 264, 'Type label', '“SNELLE · INSTANT”, “PIECIE · FOOD”, “PLACE”… white 85 %, same as the left label.'),
        (24, 470, 'Keyword lines', 'First, bold white: Needs: … · Good for: … · Bad for: … · the card’s own “Stays …” sentence.'),
        (24, 530, 'Card text', 'DM Sans 18 → 12.5 px auto-fit, line-height 1.5, 10 px between paragraphs, no box.'),
        (220, 600, 'Bottom padding', 'Text block ends 48 px above the bottom edge. No footer on these types.'),
    ]),
    ('Quest', lambda: fq('quest_calculate_odds'), [
        (8, 120, 'Silver line', 'Quest line #CBD5E1, same geometry as other types.'),
        (16, 26, 'Need', 'Dice need instead of cost (“4+”, “2× 4+”, “★★ TRAINED”, “4+ COIN”).'),
        (330, 200, 'Quest art', 'Shared board theme #1c2040 with tinted seigaiha and a die at 55 % showing the real need (4+ = a 4, 2× 4+ = two 4s, Trained = stars), until a Quest has art.'),
        (24, 440, 'Keywords + text', 'Bold white keywords, one per line: Needs: (condition) · Pay: (cost) · Roll: (dice) · Win: (extra reward). Extras without a keyword in plain text.'),
        (110, 566, 'Win', '+MP, Sora 800 34 px, “WIN” label in tint.'),
        (330, 566, 'Lose', '−MP (Trained: “—” and “CAN’T FAIL”).'),
    ]),
    ('Personal Quest', lambda: PQS[1][0](), [
        (8, 120, 'Gold line', 'Personal Quest line #D4A017, tint #FEF3C7, same geometry as other types.'),
        (16, 26, 'Level', '“3” + “LEVEL”: the level the Mosje must be. Same box as cost / need.'),
        (9, 264, 'Type lock', 'Left side label “FIGHTING ONLY”: which Mosje type may attempt it. Right: “PERSONAL QUEST”.'),
        (330, 200, 'Art', 'Own art; without art it falls back to the Quest theme with the die (like Quests).'),
        (24, 440, 'Keywords', 'Same keywords as Quests: Needs: · Pay: · Roll:.'),
        (196, 548, 'Win', '“WIN” Sora 800 34 px + “THE GAME” in tint.'),
        (396, 548, 'Fail', '“✕” + “FAIL · SHUFFLE IN”: the cards it needed are discarded; the Personal Quest goes back into your deck, which is reshuffled.'),
    ]),
]

def anatomy():
    W, H = 3580, 860
    b = [H1(60, 40, 'Card anatomy · hand / print card 440 × 616', 'All values at 440 px wide; multiply by width ÷ 440 for other sizes. Numbers on the card match the list next to it.')]
    for i, (title, mk, marks) in enumerate(ANAT):
        x = 60 + i * 880
        b.append(H2(x, 140, title))
        setg()
        b.append('<div style="position:absolute;left:%dpx;top:190px;width:440px;height:616px">%s%s</div>' % (x, card(prep(mk())), ''.join(marker(mx, my, n + 1) for n, (mx, my, _, _) in enumerate(marks))))
        li = ''.join('<div style="display:flex;gap:10px;margin-bottom:9px"><span style="flex-shrink:0;width:22px;height:22px;border-radius:50%%;background:#ffc94d;color:#07080f;font-family:\'Sora\',sans-serif;font-weight:800;font-size:11.5px;display:flex;align-items:center;justify-content:center">%d</span><div><b style="font-family:\'Sora\',sans-serif;font-size:13.5px;color:#fff">%s</b><div style="font-size:12.5px;line-height:1.45;color:#b4afc9">%s</div></div></div>' % (n + 1, esc(t), esc(d)) for n, (_, _, t, d) in enumerate(marks))
        b.append('<div style="position:absolute;left:%dpx;top:190px;width:370px">%s</div>' % (x + 470, li))
    return page('Final card designs - anatomy', W, H, '\n'.join(b)), W, H


# ───────── 31 Oct model: one Mosje card (level strip) · Ultimate · Personal Quest cards ─────────
ABIL = {
    'mosje_gandoe_wizard': ['<b>Chaos Roll:</b> at the start of your turn roll a die: 1–2 this Mosje loses 10 MP; 3–4 nothing; 5–6 +10 Power this turn.', '<b>From LV3:</b> on a 6, one opponent Mosje also loses 20 MP.'],
    'mosje_michelle': ['<b>Tough Gamble:</b> when this Mosje succeeds at a Quest, roll a die: 1–3 it gets half the MP, 4–6 it gets double.', '<b>From LV3:</b> 1–2 normal MP, 3–6 double.'],
}
ARTOF = {'mosje_gandoe_wizard': ('gandoe-wizard', '50% 30%'), 'mosje_michelle': ('michelle', '50% 20%'), 'mosje_youri': ('youri', '50% 22%'), 'mosje_jisca': ('jisca', None)}

def mos(cid, st='A', cur=None):
    m = gen.BYID[cid]
    nm, _, epi = m['name'].partition(', ')
    if cid in ABIL:
        p = ABIL[cid]
    else:
        h, _, r = m['abilityDescription'].partition(': ')
        p = ['<b>%s:</b> %s' % (esc(h), esc(r))]
    a, pos = ARTOF[cid]
    return dict(kind='mosje', sub=m['subtype'], tier=4, name=nm, subname=epi, cost=str(m['cost']), art=NEW[a], pos=pos or m.get('artFocus') or '50% 22%',
                paras=p, levelcard=1, leftlabel='obby card game', strip=st, curlvl=cur, levels3=[(L['power'], L['traits']) for L in m['levels']],
                power=m['levels'][0]['power'], mp=str(m['startMP'] or 10), levels=[], lvl=1, traitsline='')

def ultimate():
    return dict(kind='mosje', sub='FIGHTING', tier=5, name='Gandoe', subname='Ultimate · The Destroyer', cost='3', costNote='or free', art=NEW['gandoe-destroyer'], pos='50% 25%',
                paras=['<b>Destroyer Slam:</b> when this Mosje attacks, roll a die. 4–6: the target loses double MP.'],
                levelcard=1, leftlabel='ultimate', traitsline='Physical ★★★★ · Resilient ★★★ · Creative ★★', power=60, mp=None, levels=[], lvl=3)

def pq(name, sub, paras, art=None, pos='50% 40%', need='3', needlabel='LEVEL', dieneed=None):
    return dict(dieneed=dieneed or '4+', kind='quest', sub=sub, tier=4, personal=True, leftlabel=sub.lower() + ' only', name=name, need=need, needLabel=needlabel, paras=paras, rolls='',
                win='WIN', winLabel='THE GAME', lose='✕', loseLabel='FAIL · SHUFFLE IN', art=NEW[art] if art else None, pos=pos)

PQS = [
    (lambda: pq('Title Fight', 'FIGHTING', ['<b>Needs:</b> De Box or Boxing Ring in play, and Boxing Gloves ready on your field.', '<b>Roll:</b> none, it can’t fail.'], art='boxing-ring'),
     'Personal Quest · Fighting', ['Pure board condition, no roll', 'Own art (Boxing Ring placeholder)']),
    (lambda: pq('Cat Sanctuary', 'FIGHTING', ['<b>Needs:</b> Bowie &amp; Stormey ready on your field.', '<b>Pay:</b> discard 2 FOOD Piecies.', '<b>Roll:</b> 1 die, need 4+.'], art='bowie-stormey'),
     'Personal Quest · Fighting', ['Condition + cost + roll', 'Draft (was Michelle’s PQ; now any Fighting Mosje)']),
    (lambda: pq('LAN Legend', 'DIGITAL', ['<b>Needs:</b> 2 GEAR Piecies ready on your field.', '<b>Roll:</b> 1 die per Technical ★, need two 5+.'], need='3', needlabel='LEVEL', dieneed='2× 5+'),
     'Personal Quest · Digital', ['No art yet: Quest theme, die shows the roll need (two 5s)', 'Draft name and requirements']),
]

def mosjes():
    s = 0.75; cw = round(440 * s); ch = round(616 * s)
    W = 60 + 4 * (cw + 50) + 560
    b = [H1(60, 40, 'Mosjes · one card, three levels · Ultimate · Personal Quest cards', 'Ruled 30–31 Oct 2026. One card per Mosje with a level strip (Power + traits per level); the level is a marker on the table. Ultimate = optional foil card placed on top for free. Personal Quests are their own gold cards in the deck: complete one with a Level 3 Mosje of that type to win.')]
    y = 170
    b.append(H2(60, y, 'Mosje card · level strip B (chosen 31 Oct)', 'Real Power and traits from src/data; the “From LV3” ability lines are drafts. Strips A (columns) and C (power ladder) were dropped.'))
    y += 44
    row = [(mos('mosje_gandoe_wizard', 'B'), 'Gandoe · hand / print card', ['Cost 3 · MP 10 (start MP) · strip LV1–LV3', 'Ability grows with a bold “From LV3:” line']),
           (mos('mosje_gandoe_wizard', 'B', cur=1), 'Detail panel · at Level 1', ['Current level row bright, other rows at 40 %', 'Only in the game UI; the printed card shows all rows']),
           (mos('mosje_gandoe_wizard', 'B', cur=3), 'Detail panel · at Level 3', ['Same card, level marker at 3'])]
    for i, (c, t, l) in enumerate(row):
        x = 60 + i * (cw + 50)
        b.append(C(c, x, y, s, 'v%d' % i))
        b.append(cap(x, y + ch + 14, cw, t, l))
    rl = ['<b>One card per Mosje.</b> Summon it (cost top-left); it starts at Level 1 with the printed MP (default 10).',
          '<b>Level up:</b> at 100 MP move the level marker up, MP back to 10. Power and traits come from that level’s line on the strip.',
          '<b>Getemt at Level 2/3:</b> drop one level, MP back to 10. No card is lost.',
          '<b>Ultimate:</b> from hand on that Mosje: free at Level 3, 3 Energy at Level 1–2. Replaces Power and traits; level and MP keep working underneath. Getemt: the Ultimate is discarded, the Mosje keeps its level at 10 MP.',
          '<b>Personal Quest:</b> its own card. Played from hand by a Level 3 Mosje of that type, as its action. Win: you win the game. Fail: the cards it needed are discarded; the PQ goes back into your deck (reshuffle). Every deck needs at least 1 PQ.',
          '<b>Left side label:</b> OBBY CARD GAME on Mosjes again (the level is no longer a card), ULTIMATE on Ultimates.']
    b.append(panel(60 + 3 * (cw + 50), y, 860, 0, '<div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:18px;color:#fff;margin-bottom:8px">Rules on this board</div>' + rules(rl)))
    y += ch + 140
    b.append(H2(60, y, 'Ultimate and Personal Quest cards', 'Ultimate: full art foil, own artwork, ★★★★★, limit 1, cost 3 or free at Level 3. Personal Quest: gold line #D4A017, tint #FEF3C7, top-left = the level it needs; left label = which Mosje type may attempt it.'))
    y += 44
    row = [(ultimate(), 'Ultimate · Gandoe', ['Placeholder art: Gandoe, The Destroyer (idea: turn that card into Gandoe’s Ultimate)', 'Cost 3, free on a Level 3 Mosje · Power 60 + traits replace the strip; no MP', 'Left label ULTIMATE · draft ability'])] + [(f(), t, l) for f, t, l in PQS]
    for i, (c, t, l) in enumerate(row):
        x = 60 + i * (cw + 50)
        b.append(C(c, x, y, s, 'u%d' % i))
        b.append(cap(x, y + ch + 14, cw, t, l))
    y += ch + 140
    b.append(H2(60, y, 'Every Mosje type', 'Michelle (Fighting), Youri (Digital), Jisca (Artistic): real abilities, Power and traits from src/data. Martin (longest text) is on board 06.'))
    y += 44
    row = [(mos('mosje_michelle', 'B'), 'Michelle · Fighting', ['Orange tint · “From LV3” line is a draft']), (mos('mosje_youri', 'B'), 'Youri · Digital', ['Teal tint']),
           (mos('mosje_jisca', 'B'), 'Jisca · Artistic', ['Purple tint · longest ability of the three'])]
    for i, (c, t, l) in enumerate(row):
        x = 60 + i * (cw + 50)
        b.append(C(c, x, y, s, 'm%d' % i))
        b.append(cap(x, y + ch + 14, cw, t, l))
    H = y + ch + 110
    return page('Final card designs - Mosjes', W, H, '\n'.join(b)), W, H

# ═════════ 4. Piecie · Snelle · Place · Quest ═════════
def items():
    s = 0.6; cw = round(440 * s); ch = round(616 * s); g = 36
    W = 60 + 7 * (cw + g) + 30
    b = [H1(60, 40, 'Piecie · Snelle · Place · Quest', 'Real cards from src/data. Every card is full art with its type line; the side label says what it is. Cards at 60 %.')]
    y = 150
    groups = [
        ('Piecie · green line', 'Tag in the side label for FOOD, GEAR, SUBSTANCE, PET; untagged (attack, MP, utility) shows just PIECIE.', [
            (it('piecie_kannetje_melk', 'piecie'), 'Kannetje Melk', 'FOOD · cost 0'), (it('piecie_boxing_gloves', 'piecie'), 'Boxing Gloves', 'GEAR · no art yet: gradient placeholder'),
            (it('piecie_pot_of_weed', 'piecie'), 'Pot of Weed', 'SUBSTANCE'), (it('piecie_bowie_stormey', 'piecie'), 'Bowie & Stormey', 'PET · “Stays …” as keyword'),
            (it('piecie_te_hard_gaan', 'piecie'), 'Te Hard Gaan', 'untagged (attack)'), (it('piecie_redbull', 'piecie'), 'Redbull', 'untagged (utility)'),
            (it('piecie_dikke_taks', 'piecie'), 'Dikke Taks', 'Needs line (Level 2+ gate)')]),
        ('Snelle · mint line', 'Instants: the mint line and the SNELLE · INSTANT side label mark them.', [
            (it('snelle_lucky_coin', 'snelle'), 'Lucky Cóin', 'Needs line'), (it('snelle_emergency_healings', 'snelle'), 'Emergency Healings', 'plain'),
            (it('snelle_the_protector', 'snelle', 4), 'The Protector', 'full art'), (it('snelle_blensen', 'snelle'), 'Blensen!', 'foil · cost 4 OR FREE · no art yet')]),
        ('Place · violet line', 'Good for / Bad for as the first line.', [
            (it('place_de_box', 'place'), 'De Box', 'short'), (it('place_the_gym', 'place'), 'The Gym', 'medium'),
            (it('place_boxing_ring', 'place'), 'Boxing Ring', 'medium'), (it('place_welloe_graveyard', 'place'), 'Welloe Graveyard', '★★★★ full art')]),
        ('Quest · silver line', 'The stack shows as text only (QUEST · FIGHTING). No fail pips. Every Quest band, plus the card back.', [
            (fq('quest_arm_wrestling'), 'Arm Wrestling', 'Fighting · Skilled · need 2× 4+'), (fq('quest_calculate_odds'), 'Calculate Odds', 'Digital · Steady · Pay + Roll'),
            (fq('quest_shotje_obby'), 'Shotje Obby', 'Artistic · Gated'), (fq('quest_debug_system'), 'Debug System', 'Trained · ★★ TRAINED · can’t fail'),
            (fq('quest_leap_of_faith'), 'Leap of Faith', 'Coin flip · 4+ COIN'), ('BACK', 'Card back', 'XXL · Solid (31 Oct): two solid indigo Obby marks + eclipse; same for every card, identical when turned')]),
    ]
    k = 0
    for title, sub, cards in groups:
        b.append(H2(60, y, title, sub, W - 120))
        y += 44
        for i, (c, t, l) in enumerate(cards):
            x = 60 + i * (cw + g)
            if c == 'BACK':
                b.append(at(cardback(), x, y, s))
            else:
                b.append(C(c, x, y, s, 'i%d' % k)); k += 1
            b.append(cap(x, y + ch + 12, cw, t, [esc(l)]))
        y += ch + 110
    return page('Final card designs - items', W, y, '\n'.join(b)), W, y

# ═════════ 5. Rarity ═════════
def rarity():
    s = 0.55; cw = round(440 * s); ch = round(616 * s); g = 30
    W = 2500
    b = [H1(60, 40, 'Rarity & finish', 'Rarity is not printed on the card. It sets the finish (★★★★★ = foil), copy limits and booster drop weights. Mosjes: ★★★★ full art, ★★★★★ foil; every Ultimate foil. Personal Quests follow their rarity.')]
    rows = [['★', 'Piecie, Snelle, Place', 'Full art', '2', '60'], ['★★', 'Piecie, Snelle, Place', 'Full art', '2', '30'], ['★★★', 'Piecie, Snelle, Place', 'Full art', '2', '10'],
            ['★★★★', 'Piecie, Snelle, Place, Mosje, Personal Quest', 'Full art', '2', '10'], ['★★★★★', 'Piecie, Snelle, Place, Mosje, Personal Quest', '<b style="color:#ffc94d">Full art foil</b>', '1', '4'],
            ['Ultimate', 'Mosje (optional card)', '<b style="color:#ffc94d">Full art foil</b> (always)', '1', '—'], ['—', 'Quest', 'Full art (no rarity)', '—', '—']]
    b.append(panel(60, 150, 1000, 0, '<div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:18px;color:#fff;margin-bottom:10px">Rarity → finish → limits</div>' +
                   T(rows, ['RARITY', 'TYPES', 'FINISH ON THE CARD', 'COPIES PER DECK', 'DROP WEIGHT'], ['110px', '260px', '250px', '160px', 'auto']) +
                   '<div style="font-size:12.5px;color:#a8a3c0;margin-top:10px">Copies and weights as in src/data (getCopyLimit, boosterEngine); an explicit limitPerDeck on a card wins. Deck: 40 cards. Personal Quest rarities and a minimum PQ count per deck are still open.</div>'))
    pairs = [('Mosje', mos('mosje_michelle', 'B'), '★★★★ · full art', ultimate(), 'Ultimate · foil'), ('Piecie', it('piecie_te_hard_gaan', 'piecie'), '★★ · full art', it('piecie_klaar_met_jou', 'piecie'), '★★★★★ · foil'),
             ('Snelle', it('snelle_emergency_healings', 'snelle'), '★★ · full art', it('snelle_blensen', 'snelle'), '★★★★★ · foil'),
             ('Place', it('place_the_gym', 'place'), '★★★ · full art', it('place_delluft', 'place'), '★★★★★ · foil')]
    y = 650
    for i, (t, a, la, f, lf) in enumerate(pairs):
        x = 60 + i * (2 * cw + g + 70)
        b.append(H2(x, y, t))
        b.append(C(a, x, y + 40, s, 'r%da' % i)); b.append(cap(x, y + 48 + ch, cw, la, []))
        b.append(C(f, x + cw + g, y + 40, s, 'r%db' % i)); b.append(cap(x + cw + g, y + 48 + ch, cw, lf, []))
    H = y + 40 + ch + 80
    return page('Final card designs - rarity', W, H, '\n'.join(b)), W, H

# ═════════ 6. Text rules & edge cases ═════════
def edges():
    s = 0.6; cw = round(440 * s); ch = round(616 * s); g = 36
    W = 60 + 6 * (cw + g) + 30
    tr = ['<b>Auto-fit:</b> card text starts at 18 px (items) / 16 px (Mosjes) and steps down until it fits; minimum 12.5 / 13 px. The bottom fade grows with the text.',
          '<b>Keywords</b> (bold white, always the same words): <b>Needs:</b> a condition that must be true · <b>Pay:</b> something you give up first · <b>Roll:</b> the dice · <b>Win:</b> extra reward · <b>Good for: / Bad for:</b> on Places · <b>Stays …</b> (the card’s own duration sentence) · ability names (<b>Chaos Roll:</b>). Nothing else is bold.', '<b>Order:</b> Needs → Pay → Roll → card text → Win. Places: Good for / Bad for first. Mosjes: ability (+ “From LV3:” line), then the level strip.',
          '<b>Names:</b> one line, Sora 800, 40 px down to ~22 px to fit. Epithet one line, ≤ 20 px.',
          '<b>Text is never reworded</b>, only split at sentence breaks. Bold = ability name or keyword.',
          '<b>No art yet:</b> the art window shows a gradient in the type colour (placeholder, not a style).',
          '<b>Contrast:</b> text stays ≥ 4.5 : 1 on the fade; raise the fade over bright art, never add a box.']
    b = [H1(60, 40, 'Text rules & edge cases', 'The longest real cards in src/data, rendered with the rules below. All fit in a browser render with Sora and DM Sans.'),
         panel(60, 140, W - 120, 0, rules(tr, 14.5))]
    y = 470
    cards = [(it('piecie_bowie_stormey', 'piecie'), 'Bowie & Stormey', 'Longest Piecie text (387 chars)'), (martin_long(), 'Martin, Senor West', 'Longest Mosje text (ability + synergy)'),
             (it('snelle_jantje_jantje_jantje', 'snelle'), 'Jantje Jantje... Jantje?', 'Longest name (24 chars) · no art'), (it('piecie_huisbaas', 'piecie'), 'Huisbaas', 'Longest Needs line (2 lines) · no art'),
             (it('place_delluft', 'place'), 'Delluft', 'Longest Place text + Good / Bad for · foil'), (it('piecie_gekke_vogels', 'piecie'), 'Gekke Vogels', 'Long text, PET, no art')]
    for i, (c, t, l) in enumerate(cards):
        x = 60 + i * (cw + g)
        b.append(C(c, x, y, s, 'e%d' % i)); b.append(cap(x, y + ch + 12, cw, t, [esc(l)]))
    H = y + ch + 100
    return page('Final card designs - edge cases', W, H, '\n'.join(b)), W, H

# ═════════ 7–9. Board ═════════
def tdat(kind, **k):
    k['kind'] = kind
    return k

def tiles_cards():
    gw = NEW
    return {
        'g1': tdat('mosje', sub='FIGHTING', name='Gandoe', art=gw['gandoe-wizard'], pos='50% 28%', power=10, mp=60, lvl=1, ability='Chaos Roll', short='Start of turn: roll a die. 1–2 −10 MP · 5–6 +10 Power', traits=[('Phys', 2), ('Res', 1), ('Cre', 2)]),
        'g3': tdat('mosje', sub='FIGHTING', name='Gandoe', art=gw['gandoe-wizard'], pos='50% 28%', power=30, mp=20, lvl=3, ability='Chaos Roll', short='Start of turn roll: 1–2 −10 MP · 5–6 +10 Power · 6 foe −20', traits=[('Phys', 3), ('Res', 2), ('Cre', 2)]),
        'gu': tdat('mosje', sub='FIGHTING', name='Gandoe', art=gw['gandoe-destroyer'], pos='50% 25%', power=60, mp=20, lvl=3, ability='Destroyer Slam', short='Attack: roll 4–6, the target loses double MP', traits=[('Phys', 4), ('Res', 3), ('Cre', 2)], foil=True),
        'mi': tdat('mosje', sub='FIGHTING', name='Michelle', art=gw['michelle'], pos='50% 20%', power=10, mp=40, lvl=1, ability='Tough Gamble', short='Quest success: roll. 1–3 half MP · 4–6 double', traits=[('Phys', 2), ('Soc', 1), ('Res', 2)]),
        'yo': tdat('mosje', sub='DIGITAL', name='Youri', art=gw['youri'], pos='50% 22%', power=10, mp=30, lvl=1, ability='Speed Activate', short='1 Energy: activate a Piecie the turn you place it', traits=[('Tech', 3), ('Men', 2), ('Res', 1)]),
        'ji': tdat('mosje', sub='ARTISTIC', name='Jisca', art=gw['jisca'], pos='50% 31%', power=20, mp=10, lvl=2, ability='Perfect Combo', short='After a Piecie: roll 4–6 free Piecie + 15 MP hit', traits=[('Cre', 3), ('Soc', 3), ('Men', 2)]),
        'km': tdat('piecie', name='Kannetje Melk', tag='FOOD', cost=0, art=gw['kannetje-melk'], pos='50% 55%', short='One of your Mosjes gains 25 MP.'),
        'th': tdat('piecie', name='Te Hard Gaan', tag='ATTACK', cost=2, art=gw['te-hard-gaan'], pos='50% 40%', short='+20 Power this turn; at end of turn it loses 10 MP.'),
        'bs': tdat('piecie', name='Bowie & Stormey', tag='PET', cost=1, art=gw['bowie-stormey'], pos='50% 40%', short='Stays: one of your Mosjes loses 10 less MP each hit.'),
        'lc': tdat('snelle', name='Lucky Cóin', tag='INSTANT', cost=1, art=gw['lucky-coin'], pos='50% 45%', short='Reroll any dice once. Creative ★★★: choose the result.'),
        'pr': tdat('snelle', name='The Protector', tag='INSTANT', cost=0, art=gw['the-protector'], pos='50% 40%', short='One of your Mosjes would lose MP: it loses 30 less.'),
        'db': tdat('place', name='De Box', cost=2, art=gw['de-box'], pos='50% 40%', short='Gandoe, Michelle, Tuk: +10 Power, +1 die on Physical Quests', good='Gandoe · Michelle · Tuk'),
        'gy': tdat('place', name='The Gym', cost=3, art=gw['the-gym'], pos='50% 50%', short='Fighting +10 Power · non-Fighting −10 MP each turn', good='Fighting'),
        'aw': tdat('quest', sub='FIGHTING', name='Arm Wrestling', need='2× 4+', win='+40', lose='−30', short='Roll: 1 die per Physical ★, need two 4+.', rolls='Physical'),
        'co': tdat('quest', sub='DIGITAL', name='Calculate Odds', need='4+', win='+25', lose='−15', short='Pay: reveal your top 3 cards. Roll: need one 4+.', rolls='Mental'),
    }

def tile(c, W, H, mode='A'):
    html = gb.tile_locked(c, W, H, mode)
    if c.get('foil'):
        u = W / 240
        html = html.replace('</div><div style="position:absolute;left:', '<div style="position:absolute;inset:0;background:linear-gradient(115deg,#ff5fc4,#ffd36e,#6dffc9,#62a0ff,#c58bff,#ff5fc4);background-size:230% 230%;background-position:30% 50%;mix-blend-mode:overlay;opacity:.35;pointer-events:none"></div></div><div style="position:absolute;left:', 1)
    if c.get('pip'):
        html = html.replace('border-radius:50%;border:1px solid rgba(255,255,255,.75)', 'border-radius:50%;border:1px solid rgba(255,255,255,.75);background:#fff', 1)
    return html

def back_tile(W, H, peek=None):
    """Board tile face-down: the chosen card back, turned 90° to fit the landscape tile (point-symmetric, so either way round)."""
    u = W / 240
    p = ('<div style="position:absolute;left:%s;right:%s;bottom:%s;display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:7px;background:rgba(5,5,5,.85);font-family:Sora,sans-serif;font-size:%spx;font-weight:700;color:#dfe3f7;white-space:nowrap;overflow:hidden;z-index:2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>%s</div>'
         % ('%spx' % (10 * u), '%spx' % (10 * u), '%spx' % (9 * u), max(9, round(10 * u, 1)), esc(peek))) if peek else ''
    k = min(W / 616, H / 440)
    return ('<div style="position:relative;width:%dpx;height:%dpx;border-radius:%spx;overflow:hidden;background:#050505;box-shadow:0 10px 26px rgba(0,0,0,.65)">'
            '<div style="position:absolute;left:50%%;top:50%%;width:440px;height:616px;transform:translate(-50%%,-50%%) rotate(90deg) scale(%s)">%s</div>%s</div>'
            % (W, H, round(13 * u, 1), round(k, 4), CARDBACK_SVG.replace('<svg ', '<svg style="display:block;width:100%;height:100%" ', 1), p))

def chipd(text, col, shield=False):
    sh = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"></path></svg>' if shield else ''
    return '<div style="display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:#07080f;border:1px solid %s;color:%s;font-family:Sora,sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;white-space:nowrap">%s%s</div>' % (col, col, sh, esc(text))

def sock(x, y, W, H, inner, owner=ME, chips=(), outline=None, extra='', over=''):
    out = outline or ('1px solid %s' % rgba(owner, .32))
    ch = ('<div style="position:absolute;right:8px;bottom:-13px;display:flex;gap:6px;z-index:4">%s</div>' % ''.join(chips)) if chips else ''
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;border-radius:%dpx;outline:%s;outline-offset:%dpx;box-shadow:0 16px 34px -12px %s;%s">%s%s%s</div>'
            % (x, y, W, H, round(13 * W / 240), out, 3 if W < 200 else 5, rgba(owner, .4), extra, inner, over, ch))

def empty(x, y, W, H, label, owner=ME):
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;border-radius:13px;border:1.5px dashed %s;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-family:Sora,sans-serif;font-size:10px;font-weight:700;letter-spacing:.22em;color:#6f7699">%s</div>'
            % (x, y, W, H, rgba(owner, .35), esc(label)))

def tiles():
    TC = tiles_cards()
    W = 2300
    anat = ['<b>Same look as the hand card:</b> black frame, 2 px type line (none on Mosjes), Sora / DM Sans, tint labels.',
            '<b>Mosje tile:</b> name · LVL n (top-right, tint) · traits line (for Quest rolls) · remember-line (ability, max 2 lines) · Power (+ Place buff chip) · MP · 3 px MP bar along the bottom (white fill = MP %, red = damage preview).',
            '<b>Level:</b> LVL n comes from the level marker; Power and traits from that level’s strip row. <b>Ultimate on top:</b> the tile shows the Ultimate (its art, Power, traits, ability) with a foil wash; LVL and MP stay.',
            '<b>Piecie / Snelle tile:</b> cost · name · effect line · type label in tint. <b>Place:</b> name · effect line · PLACE. <b>Quest:</b> NEED · name · roll line · WIN / LOSE · “Rolls …”. No fail pips (a Quest leaves after one attempt).',
            '<b>Tile unit:</b> u = width ÷ 240. Art inset 6u, radius 13u, type line inset 2.2u, header 10u from the top / 12u from the sides, name 15u, numbers 21u, labels 6u, footer 10u from the bottom, remember-line 9.5u DM Sans.',
            '<b>Phone:</b> Mosjes 142 × 104, others 118 × 86. The remember-line and traits drop; numbers and names stay (names ≥ 11 px).',
            '<b>Remember-line text:</b> new field per card (e.g. <code>tileText</code>), drafted by Claude Code, approved by Gandalf. Never auto-shortened rules text.']
    b = [H1(60, 40, 'Board tiles', 'What a card looks like on the table (direction A). The full card text lives in the hover / tap panel.'), panel(60, 130, W - 120, 0, rules(anat, 14))]
    y = 470
    rows = [('Mosjes', ['g1', 'mi', 'yo', 'ji', 'g3', 'gu']), ('Piecie · Snelle · Place · Quest', ['km', 'th', 'bs', 'lc', 'pr', 'db', 'gy', 'aw', 'co'])]
    for t, ks in rows:
        b.append(H2(60, y, t + ' · desktop 240 × 176'))
        y += 44
        x = 66
        for i, k in enumerate(ks):
            if i and i % 7 == 0:
                x = 66; y += 176 + 50
            b.append(sock(x, y, 240, 176, tile(TC[k], 240, 176)))
            x += 240 + 36
        y += 176 + 60
        b.append(H2(60, y, t + ' · phone'))
        y += 44
        x = 66
        for k in ks:
            c = TC[k]
            w, h = (142, 104) if c['kind'] == 'mosje' else (118, 86)
            b.append(sock(x, y + 104 - h, w, h, tile(c, w, h)))
            x += w + 26
        y += 104 + 80
    return page('Final card designs - board tiles', W, y, '\n'.join(b)), W, y

def states():
    TC = tiles_cards()
    W = 2300
    b = [H1(60, 40, 'Board states', 'Every 2.0 state as it shows on a tile. Chips hang under the tile (right-aligned, 13 px below the edge, dark pill with a coloured outline). Sockets carry the owner colour: you cyan, opponent rose.')]
    S = []
    g1 = TC['g1']; mi = TC['mi']; yo = TC['yo']; ji = TC['ji']
    def C2(**kw):
        d = dict(g1); d.update(kw); return d
    S.append(('Ready', 'Can taks OR Quest OR (Level 3) play a Personal Quest this turn.', lambda x, y: sock(x, y, 240, 176, tile(g1, 240, 176), chips=[chipd('READY', ME)])))
    S.append(('Picking a target', 'Attacker lifts 6 px; 2 px owner outline.', lambda x, y: sock(x, y - 6, 240, 176, tile(g1, 240, 176), outline='2px solid %s' % ME, chips=[chipd('TAKSEN · PICK A TARGET', ME)])))
    S.append(('Valid target', 'Opponent Mosje that may be taksed: dashed red socket.', lambda x, y: sock(x, y, 240, 176, tile(yo, 240, 176), owner=BOT, outline='2px dashed %s' % RED, chips=[chipd('TARGET', RED)])))
    S.append(('Damage preview', 'Hovered target: big −MP, old MP struck, red part of the MP bar.', lambda x, y: sock(x, y, 240, 176, tile(dict(yo, dmg=10), 240, 176), owner=BOT, outline='2px dashed %s' % RED, chips=[chipd('TARGET', RED)],
              over='<div style="position:absolute;left:0;right:0;top:52px;text-align:center;font-family:Sora,sans-serif;font-size:46px;font-weight:800;color:#ff4d6d;text-shadow:0 0 18px rgba(255,77,109,.8),0 2px 0 #000;z-index:5">−10</div>')))
    S.append(('Fresh · protected', 'Just summoned: can’t attack or be taksed until its owner’s next turn.', lambda x, y: sock(x, y, 240, 176, tile(ji, 240, 176), owner=BOT, chips=[chipd('FRESH · PROTECTED', '#9fe6ff', True)], extra='opacity:.92;')))
    S.append(('Acted this turn', 'Its one action is used: dimmed, no chip actions.', lambda x, y: sock(x, y, 240, 176, tile(mi, 240, 176), chips=[chipd('DONE', '#8d93b3')], extra='filter:saturate(.5) brightness(.7);')))
    S.append(('At 100 MP · Level 3', 'MP stops at 100 at Level 3 (no higher level).', lambda x, y: sock(x, y, 240, 176, tile(dict(TC['g3'], mp=100), 240, 176), chips=[chipd('MAX 100 · LEVEL 3', '#c9cde6')])))
    S.append(('Ultimate placed', 'Ultimate from hand on top (free at Level 3, else 3 Energy): foil tile with its Power and traits; LVL and MP stay.', lambda x, y: sock(x, y, 240, 176, tile(TC['gu'], 240, 176), outline='2px solid %s' % GOLD, chips=[chipd('ULTIMATE · POWER 60', GOLD)])))
    S.append(('Level up', 'The big moment at 100 MP: flash + sound; level marker +1, Power and traits from the next strip row, MP back to 10.', lambda x, y: sock(x, y, 240, 176, tile(C2(lvl=2, power=20, mp=10, traits=[('Phys', 3), ('Res', 1), ('Cre', 2)]), 240, 176), outline='2px solid %s' % GOLD, chips=[chipd('LEVEL UP → LV2 · 10 MP', GOLD)])))
    S.append(('Level drop', 'Getemt at Level 2/3: level marker −1, MP back to 10. No card is lost. (With an Ultimate on top: the Ultimate is discarded instead, level stays.)', lambda x, y: sock(x, y, 240, 176, tile(C2(mp=10), 240, 176), chips=[chipd('LV2 → LV1 · 10 MP', '#ff8fa3')])))
    S.append(('Getemt · Level 1', 'At 0 MP: tile turns sideways, desaturated, skips its next turn.', lambda x, y: sock(x, y, 240, 176, tile(C2(mp=0), 240, 176), extra='transform:rotate(90deg) scale(.72);filter:saturate(.5);')))
    S.append(('Personal Quest ready', 'Level 3 Mosje with a Personal Quest of its type in hand whose needs are met: gold socket, button “PLAY TITLE FIGHT”.', lambda x, y: sock(x, y, 240, 176, tile(TC['g3'], 240, 176), outline='2px solid %s' % GOLD, chips=[chipd('TITLE FIGHT READY · PLAY FROM HAND', GOLD)])))
    S.append(('Personal Quest not met', 'PQ in hand but its needs aren’t met: chip lists what is missing (owner only).', lambda x, y: sock(x, y, 240, 176, tile(TC['g3'], 240, 176), chips=[chipd('NEEDS BOXING GLOVES', '#c9cde6')])))
    S.append(('Place buff', 'A Place that raises Power shows a +10 chip next to the Power number.', lambda x, y: sock(x, y, 240, 176, tile(dict(g1, buff='+10'), 240, 176), chips=[chipd('THE GYM +10 POWER', '#b79cff')])))
    S.append(('Place drain', 'A Place that drains MP hangs a chip under the Mosjes it hits.', lambda x, y: sock(x, y, 240, 176, tile(dict(yo, buff=None), 240, 176), owner=BOT, chips=[chipd('THE GYM −10 MP / TURN', '#b79cff')])))
    S.append(('Piecie face-down · waiting', 'Placed this turn: card back + peek line (owner only).', lambda x, y: sock(x, y, 240, 176, back_tile(240, 176, 'Te Hard Gaan · only you see this'), chips=[chipd('WAITS 1 TURN', '#c9cde6')])))
    S.append(('Piecie face-down · opponent', 'Opponent’s waiting Piecie: plain card back.', lambda x, y: sock(x, y, 240, 176, back_tile(240, 176), owner=BOT)))
    S.append(('Piecie ready', 'Face-up, can be activated: chip shows its cost.', lambda x, y: sock(x, y, 240, 176, tile(TC['th'], 240, 176), chips=[chipd('READY · 2 ENERGY', ME)])))
    S.append(('Piecie stays', 'Activated card that stays in its slot (e.g. a PET).', lambda x, y: sock(x, y, 240, 176, tile(TC['bs'], 240, 176), chips=[chipd('ACTIVE · UNTIL END OF NEXT TURN', '#86efac')])))
    S.append(('Snelle in a slot', 'Played on any turn; occupies a Piecie slot while it resolves / stays.', lambda x, y: sock(x, y, 240, 176, tile(TC['pr'], 240, 176), owner=BOT, chips=[chipd('PLAYED ON YOUR TURN', MINT[0])])))
    S.append(('Place in play', 'Owner and turns in play under the tile.', lambda x, y: sock(x, y, 240, 176, tile(TC['gy'], 240, 176), chips=[chipd('YOU · 2 TURNS', ME)])))
    S.append(('Quest · modifiers', 'Place modifiers hang under the Quest.', lambda x, y: sock(x, y, 240, 176, tile(TC['aw'], 240, 176), owner='#8d93b3', chips=[chipd('+1 DIE · THE GYM', '#b79cff')])))
    S.append(('Empty slots', 'Dashed owner colour with a label.', lambda x, y: empty(x, y, 240, 176, 'PIECIE SLOT')))
    S.append(('Deck pile', 'Stacked card backs, count chip in the owner colour.', lambda x, y: '<div style="position:absolute;left:%dpx;top:%dpx;width:240px;height:176px"><div style="position:absolute;left:12px;top:12px">%s</div><div style="position:absolute;left:6px;top:6px">%s</div><div style="position:absolute;left:0;top:0">%s</div><div style="position:absolute;right:-6px;bottom:-6px;min-width:34px;height:30px;padding:0 9px;box-sizing:border-box;border-radius:999px;background:%s;color:#07080f;font-family:Sora,sans-serif;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center">26</div></div>' % (x, y, back_tile(228, 164), back_tile(228, 164), back_tile(228, 164), ME)))
    cols = 5; cw = 240; gx = 200; gy = 150
    y0 = 160
    for i, (t, d, fn) in enumerate(S):
        x = 66 + (i % cols) * (cw + gx // 1 - 120 + 120)
        x = 66 + (i % cols) * (cw + 210)
        y = y0 + (i // cols) * (176 + 160)
        b.append(fn(x, y))
        b.append(cap(x, y + 176 + 26, cw + 160, t, [esc(d)]))
    H = y0 + ((len(S) - 1) // cols + 1) * (176 + 160) + 20
    W = 66 + cols * (cw + 210)
    return page('Final card designs - board states', W, H, '\n'.join(b)), W, H

def handpanel():
    W, H = 2200, 1180
    b = [H1(60, 40, 'Hand & detail panel', 'Hand cards are the real card (5:7), fanned and sunk; hovering lifts a card and drives the Energy spend preview. The detail panel shows the full card plus the information that is not on the face.')]
    hand = [PQS[0][0](), it('piecie_kannetje_melk', 'piecie'), it('snelle_lucky_coin', 'snelle'), it('place_the_gym', 'place'), it('piecie_te_hard_gaan', 'piecie'), it('piecie_klaar_met_jou', 'piecie')]
    labels = [('NEEDS LV3 FIGHTING', '#ff8fa3'), None, None, ('PLACE IN PLAY · DESTROY IT FIRST', '#ff8fa3'), None, ('NEEDS A MOSJE AT LEVEL 2+', '#ff8fa3')]
    s = 0.5; cw = 220; chh = 308
    for i, c in enumerate(hand):
        x = 80 + i * 170; rot = (i - 2.5) * 3
        lift = -60 if i == 1 else 0
        glow = 'filter:drop-shadow(0 0 18px rgba(63,208,255,.55));' if i == 1 else ''
        dim = 'filter:saturate(.45) brightness(.7);' if labels[i] else ''
        setg()
        b.append('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;transform:rotate(%sdeg);transform-origin:50%% 120%%;%s%s"><div style="width:440px;height:616px;transform:scale(%s);transform-origin:0 0">%s</div></div>' % (x, 250 + lift, cw, chh, rot, glow, dim, s, card(prep(c))))
        if labels[i]:
            b.append('<div style="position:absolute;left:%dpx;top:%dpx;transform:rotate(%sdeg)">%s</div>' % (x + 10, 220, rot, chipd(labels[i][0], labels[i][1])))
    b.append(cap(80, 600, 1000, 'Hand', ['Desktop hand cards 280 × 392 (here at 220), fanned ±3° per step, sunk so ~70 % shows. Hover: lift to fully visible + owner glow; can’t-play cards are dimmed with the reason in a chip above.']))
    b.append(cap(80, 680, 1000, 'Energy spend preview', ['Hovering a playable card with a cost turns the crystals it would spend to owner 28 %: “4/6 → 3/6 · COST 1”.']))
    # detail panel
    px = 1200
    setg()
    c = mos('mosje_gandoe_wizard', 'B', cur=3)
    b.append('<div style="position:absolute;left:%dpx;top:150px;width:360px;height:504px"><div style="width:440px;height:616px;transform:scale(%s);transform-origin:0 0">%s</div></div>' % (px, 360 / 440, card(prep(c))))
    info = ('<div style="font-style:italic;color:#dfe3f7">“Is it a healing spell? A fireball? Not even he knows until it happens!”</div>'
            '<div style="margin-top:10px;font-family:Sora,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;color:#ffc94d">★★★★ · FULL ART · 2 PER DECK</div>'
            '<div style="margin-top:6px;font-family:Sora,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;color:#8d93b3">MOSJE · AT LEVEL 3 (OTHER ROWS DIMMED) · ATTACK OR QUEST OR PERSONAL QUEST</div>'
            '<div style="margin-top:10px;color:#ffc94d">Title Fight in hand: missing Boxing Gloves (ready). De Box is in play.</div>'
            '<div style="margin-top:6px;color:#b79cff">The Gym: +10 Power this turn.</div>'
            '<div style="margin-top:6px;color:#9fe6ff">MP 20 / 100 · getemt at 0 MP: back to Level 2 at 10 MP.</div>')
    b.append('<div style="position:absolute;left:%dpx;top:670px;width:360px;box-sizing:border-box;border-radius:14px;background:rgba(12,14,28,.94);border:1px solid rgba(140,160,255,.22);padding:14px 16px;font-size:13px;line-height:1.5;color:#dfe3f7">%s</div>' % (px, info))
    b.append(cap(1600, 150, 520, 'Detail / hover panel', ['Docked right (x ≈ 1530 on the 1920 board), card at 360 × 504 with side labels visible.',
                                                          'Info box under it: flavour text, rarity + finish + copy limit (the only place rarity is shown), type reminder, and context notes in colour: Personal Quest status (gold), Place effects (violet), MP / getemt info (cyan), taksen preview (red), why a hand card can’t be played.',
                                                          'Phone: the same panel opens as a bottom sheet on tap.']))
    return page('Final card designs - hand and detail', W, H, '\n'.join(b)), W, H

BOARDS = [('Main.dc.html', '01 · Overview & legend', overview), ('Anatomy.dc.html', '02 · Card anatomy', anatomy), ('Mosjes.dc.html', '03 · Mosjes, Ultimate & Personal Quest', mosjes),
          ('Items.dc.html', '04 · Piecie, Snelle, Place, Quest', items), ('Rarity.dc.html', '05 · Rarity & finish', rarity), ('Edges.dc.html', '06 · Text rules & edge cases', edges),
          ('Tiles.dc.html', '07 · Board tiles', tiles), ('States.dc.html', '08 · Board states', states), ('Hand.dc.html', '09 · Hand & detail panel', handpanel)]

if __name__ == '__main__':
    import sys
    only = sys.argv[1:]
    idx = {'v': 3, 'createdOnFiles': {'v': 1, 'at': '2026-10-30T20:00:00Z'}, 'title': 'Obby Card Game 2.0 · Final Card Designs', 'launch': {'view': 'canvas'},
           'pages': [], 'boards': {}, 'order': [], 'notes': {}, 'designSystems': []}
    y = 0
    sizes = {}
    for f, title, fn in BOARDS:
        p, W, H = fn()
        if not only or f in only:
            open(os.path.join(OUT, f), 'w').write(p)
        idx['boards'][f] = {'x': 0, 'y': y, 'w': W, 'h': H, 'title': title}
        idx['order'].append(f)
        y += H + 160
        print(f, W, H, len(p))
    json.dump(idx, open(os.path.join(OUT, 'canvas.json'), 'w'), indent=2, ensure_ascii=False)
