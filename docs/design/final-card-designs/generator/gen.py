#!/usr/bin/env python3
"""Generate CardTiers9 (final 2.0 faces) and CardTiers10 (reference sheet) .dc.html boards.
Card markup is a straight port of the Tiers 7/8 boards (440x660 reference size), updated to 2.0."""
import json, math, re, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'data.json')))
OUT = os.path.join(HERE, '..', 'canvas', 'project')
os.makedirs(OUT, exist_ok=True)

BLOB = {
 'mosje_alyssa_bulldozer': 'f14bf3a0e88ea140cfce5a7c5b956c20', 'mosje_gandoe_destroyer': '195c9b09a23dfcbd40e54683d4a0ee18',
 'mosje_youri': '2f6092d0ae8453d333960cd26ee3b188', 'mosje_fps_west': '860397fd082deb2a8d89c34a290c2899',
 'mosje_jisca': '32e8b688f338cd6ed296d1bd4bad2f63', 'mosje_chris_ddr': '21240012f5d9e68da8c73fa55e5473ea',
 'piecie_kannetje_melk': 'fc7dd32c443142f1dc1196cdcf13d2b8', 'piecie_broodje_doner': 'cc570cd07aa463b50a5777af83a68fb2',
 'piecie_ronald_kip': '0e810c16376eeaafe8b4e6d10f82bba1', 'piecie_affoe': '54d5dc54921196f9bcae313fac7f5b2f',
 'piecie_pot_of_weed': '1c13c1998cdb7b1371315fa37d5dd733', 'piecie_bong_hit_demolition': 'bdd1f8b92d1e5d245ad70436af0ea2d7',
 'piecie_tony': 'd2313a96e13ab44c09d111be6a38421d', 'piecie_katjegang': 'f4d133f9dcf3402ed52626bc5aa66fe6',
 'piecie_bowie_stormey': '45bcf88cee83dc40dacb16e68152919e', 'piecie_te_hard_gaan': 'a203e620ebfb551b5d7bc881dd7ae32b',
 'piecie_dikke_taks': 'b9af5858e138040496acad0f46a2f506', 'piecie_eendjes_voeren': '277761337e28c943219e5d1b0a4618b8',
 'piecie_redbull': '3d216f4acdcb5ac5ea21a01a8c38eb94', 'piecie_call_of_welloes': '7096f894c7ab6cca81ae8a46c57eebb9',
 'snelle_lucky_coin': '61d9e9eebc75de43be7c39b16faa03d6', 'snelle_emergency_healings': '17cfac34b1f08431383a06dd1f84976d',
 'snelle_the_protector': 'bc21533bfe5a2e7d67621555dc1fb846', 'place_de_box': '47f98db653db3501c099e793905d7c62',
 'place_the_gym': '0667fece80c30ac6a0198a060b7cb7a9', 'place_welloe_graveyard': '4920af0eb29a6437910d7ea416421187',
}

TY = {
 'FIGHTING': ('#C2410C', '#FFEDD5'), 'DIGITAL': ('#0E7490', '#CFFAFE'), 'ARTISTIC': ('#A21CAF', '#FAE8FF'),
 'PIECIE': ('#15803D', '#DCFCE7'), 'PLACE': ('#6D28D9', '#EDE9FE'), 'SNELLE': ('#A16207', '#FEF9C3'),
}
QTHEME = ('#1c2040', '#c9cde6')
QLINE = {'QUEST': ('#CBD5E1', '#E2E8F0'), 'PERSONAL': ('#D4A017', '#FEF3C7')}   # line colours for full-art Quests (proposal)   # one shared board Quest theme (board v2.4)
TRAIT = {'physical': 'Phys', 'resilient': 'Res', 'social': 'Soc', 'creative': 'Cre', 'mental': 'Men', 'technical': 'Tech'}

BYID = {c['id']: c for k in ('M', 'P', 'S', 'PL', 'Q') for c in D[k]}

def esc(s):
    return html.escape(str(s), quote=False)

def rgba(h, a):
    n = int(h[1:], 16)
    return 'rgba(%d,%d,%d,%s)' % (n >> 16 & 255, n >> 8 & 255, n & 255, a)

# ───────── text fitting (estimates for Sora 800 / DM Sans) ─────────
def lines_for(paras, fs, width):
    cpl = max(8, width / (fs * 0.5))
    return sum(max(1, math.ceil(len(re.sub('<[^>]+>', '', p)) / cpl)) for p in paras)

def fit(paras, width, max_h, sizes, lh, gap):
    for fs in sizes:
        h = lines_for(paras, fs, width) * fs * lh + gap * (len(paras) - 1)
        if h <= max_h:
            return fs, h
    fs = sizes[-1]
    return fs, lines_for(paras, fs, width) * fs * lh + gap * (len(paras) - 1)

def name_fs(name, width, big):
    return round(min(big, width / (max(len(name), 1) * 0.64)), 1)

# ───────── shared defs (one seigaiha pattern instead of 447 <use> per layer) ─────────
def circles(fill, stroke):
    out = []
    for y, xs in ((-15, (0, 60)), (0, (-30, 30, 90)), (15, (0, 60)), (30, (-30, 30, 90)), (45, (0, 60))):
        for x in xs:
            out.append('<circle cx="%d" cy="%d" r="30" fill="%s"></circle>' % (x, y, fill))
            for r in (30, 22.5, 15, 7.5):
                out.append('<circle cx="%d" cy="%d" r="%s" fill="none" stroke="%s" stroke-width="1.5"></circle>' % (x, y, r, stroke))
    return ''.join(out)

def defs():
    pats = ['<pattern id="sgP" width="60" height="30" patternUnits="userSpaceOnUse">%s</pattern>' % circles('#050505', 'rgba(255,255,255,.55)')]
    for k in ('FIGHTING', 'DIGITAL', 'ARTISTIC'):
        pats.append('<pattern id="sgQ%s" width="60" height="30" patternUnits="userSpaceOnUse">%s</pattern>' % (k[0], circles(TY[k][0], 'rgba(255,255,255,.22)')))
    pats.append('<pattern id="sgQT" width="60" height="30" patternUnits="userSpaceOnUse">%s</pattern>' % circles(QTHEME[0], 'rgba(255,255,255,.13)'))
    grain = '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"></feTurbulence><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.1 -.15"></feColorMatrix></filter>'
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>%s%s</defs></svg>' % (''.join(pats), grain)

HELMET = """<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&amp;family=DM+Sans:ital,wght@0,400;0,600;0,700;1,400&amp;display=swap">
<style>
body{margin:0;font-family:'DM Sans',sans-serif}
@property --foil-a{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes foilturn{to{--foil-a:360deg}}
.ring{position:absolute;inset:0;border-radius:24px;box-sizing:border-box;pointer-events:none;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.foil{background:conic-gradient(from var(--foil-a),#f6d36a,#ff8fb4,#86c9ff,#9cf0c2,#f6d36a);animation:foilturn 10s linear infinite}
.rb{background:conic-gradient(from var(--foil-a) at 30% 20%,#f6d36a,#ff8fb4,#86c9ff,#9cf0c2,#f6d36a);animation:foilturn 10s linear infinite}
@media (prefers-reduced-motion:reduce){.foil,.rb{animation:none}}
@keyframes shinesweep{0%,55%{transform:translateX(-160%) skewX(-18deg)}100%{transform:translateX(420%) skewX(-18deg)}}@keyframes twinkle{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion:reduce){.sweep4,.glint4{animation:none}.glint4{opacity:.8}}@keyframes holoshift{from{background-position:0% 25%}to{background-position:100% 75%}}@media (prefers-reduced-motion:reduce){.holo4{animation:none}}</style>
</helmet>"""

def page(title, w, h, body):
    return """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>%s</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
%s
<div style="width: %dpx; height: %dpx; box-sizing: border-box; background: radial-gradient(ellipse at 30%% 4%%,#1b1730 0%%,#0d0b14 70%%); position: relative; font-family: 'DM Sans',sans-serif">
%s
%s
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
class Component extends DCLogic {
renderVals() { return {}; }
}
</script>
</body>
</html>
""" % (esc(title), HELMET, w, h, defs(), body, w, h)

# ───────── card model from src/data ─────────
def stars(n):
    return '★' * n

def mosje(cid, tier):
    m = BYID[cid]
    nm, _, sub = m['name'].partition(', ')
    ab = m['abilityDescription']
    head, sep, rest = ab.partition(': ')
    paras = ['<b>%s:</b> %s' % (esc(head), esc(rest))] if sep else [esc(ab)]
    if m.get('synergyEffect'):
        paras.append('<b>Synergy:</b> ' + esc(m['synergyEffect']))
    levels = []
    for i, lv in enumerate(m['levels']):
        tr = ' · '.join('%s %s' % (TRAIT.get(k, k.title()), stars(v)) for k, v in lv['traits'].items())
        levels.append(('L%d' % (i + 1), 'Power %d · %s%s' % (lv['power'], tr, ' · HOLD' if i == 2 else '')))
    return dict(kind='mosje', sub=m['subtype'], tier=tier, name=nm, subname=sub, cost=str(m['cost']), art=BLOB.get(cid),
                pos=m.get('artFocus') or '50% 22%', paras=paras, levels=levels, power=m['levels'][0]['power'], mp=m['startMP'], lvl=1,
                data_rarity=len(m['rarity']), foil=m.get('foil'))

def piecie_tag(p):
    if p.get('tag'):
        return p['tag'].upper()
    return (p.get('group') or 'utility').upper()

def needs_and_text(p):
    desc = p['description']
    needs = p.get('needsText')
    mt = re.match(r'Needs: ([^.]*)\.\s*(.*)$', desc)
    if mt:
        needs = needs or mt.group(1)
        desc = mt.group(2)
    return needs, desc

def item(cid, tier, kind):
    p = BYID[cid]
    needs, desc = needs_and_text(p)
    c = dict(kind=kind, sub=kind.upper(), tier=tier, name=p['name'], subname='', art=BLOB.get(cid), pos='50% 45%',
             paras=[esc(desc)], data_rarity=len(p['rarity']), needs=needs)
    if kind == 'piecie':
        c.update(cost=str(p['cost']), tag=piecie_tag(p), stays=bool(p.get('stays')))
    elif kind == 'snelle':
        c.update(cost=str(p['cost']), costNote='or free' if (p.get('costText') or '').endswith('or free') else '', tag='INSTANT · ANY TURN')
    elif kind == 'place':
        c.update(cost=str(p['cost']), tag='ONLY 1 IN PLAY', needs=None,
                 info='Good for: %s · Bad for: %s' % (', '.join(p.get('goodFor') or ['—']), ', '.join(p.get('badFor') or ['—'])))
    return c

def md(t):
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', esc(t))

def quest(cid, theme=False):
    q = BYID[cid]
    band = q.get('band') or ''
    text = q.get('text') or ''
    m = re.search(r'\((two|one) (\d)\+\)', text)
    count, th = (m.group(1), m.group(2)) if m else ('one', '4')
    mr = re.search(r'Rolls: ([^.]*)\.', text)
    rolls_t = mr.group(1) if mr else (q.get('rollTrait') or '').title()
    label, lose = 'NEED', '−%d' % abs(q['lose'] or 0)
    if band == 'trained':
        need, label, lose = '★★', 'TRAINED', '—'
    elif band == 'coin_flip':
        need, label = '4+', 'COIN'
    else:
        need = ('2× %s+' if count == 'two' else '%s+') % th
    paras = []
    if q.get('costText'):
        paras.append('<b>First you must:</b> %s.' % esc(q['costText']))
    if band == 'trained':
        paras.append('No roll: it can’t fail.')
    elif band == 'coin_flip':
        paras.append('No trait: roll 1 die, need 4+.')
    else:
        paras.append('Roll 1 die per %s ★. Need %s %s+.' % (esc(rolls_t if rolls_t[:1].isupper() and 'best' not in rolls_t else rolls_t), count, th))
    if q.get('extras'):
        paras.append(md(q['extras']))
    return dict(kind='quest', sub=q['stack'], tier=1, name=q['name'], need=need, needLabel=label, paras=paras,
                rolls='Rolls: %s · %s' % (rolls_t, band.replace('_', ' ').title()), win='+%d' % q['win'], lose=lose,
                loseLabel="CAN'T FAIL" if band == 'trained' else 'LOSE', theme=theme)

G = dict(H=660, side=268, artTop=124, artH=224, plateTop=366, plateH=186)

PIPS = {1: [(32, 32)], 2: [(20, 20), (44, 44)], 3: [(18, 18), (32, 32), (46, 46)], 4: [(20, 20), (44, 20), (20, 44), (44, 44)],
        5: [(20, 20), (44, 20), (32, 32), (20, 44), (44, 44)], 6: [(20, 18), (44, 18), (20, 32), (44, 32), (20, 46), (44, 46)]}

def die_face(need, size, top='50%', op='.55'):
    """Quest art die that shows the real need: '4+' -> one 4, '2× 4+' -> two 4s, '★★' (Trained) -> stars, no die."""
    need = str(need)
    if '★' in need:
        return ('<div aria-hidden="true" style="position:absolute;left:50%%;top:%s;transform:translate(-50%%,-50%%);opacity:%s;font-family:\'Sora\',sans-serif;font-weight:800;font-size:%spx;color:#fff;letter-spacing:.06em">%s</div>' % (top, op, round(size * .62), esc(need)))
    m = re.search(r'(\d)\+', need)
    n = int(m.group(1)) if m else 4
    k = 2 if ('2×' in need or '2x' in need) else 1
    one = lambda: ('<svg viewBox="0 0 64 64" style="width:%spx;height:%spx;flex-shrink:0"><rect x="4" y="4" width="56" height="56" rx="13" fill="none" stroke="#ffffff" stroke-width="4"></rect>%s</svg>'
                   % (size, size, ''.join('<circle cx="%d" cy="%d" r="5" fill="#fff"></circle>' % p for p in PIPS[n])))
    return ('<div aria-hidden="true" style="position:absolute;left:50%%;top:%s;transform:translate(-50%%,-50%%);opacity:%s;display:flex;gap:%spx">%s</div>' % (top, op, round(size * .18), ''.join(one() for _ in range(k))))

def masks(s):
    d = G['side'] - 268
    if not d:
        return s
    def fix(m):
        seg = m.group(0)
        for v in ('261.5', '385.5', '262', '386'):
            seg = seg.replace('%spx' % v, '%spx' % (float(v) + d if '.' in v else int(v) + d))
        return seg
    return re.sub(r'mask-image:linear-gradient\([^;]*\)', fix, s)

# ───────── one card face, 440x660 (Tiers 7/8 values, 2.0 content) ─────────
SIDE = ("position:absolute;top:%(side)spx;width:10px;height:124px;box-sizing:border-box;padding-top:.32em;display:flex;align-items:center;"
        "justify-content:center;writing-mode:vertical-rl;font-family:'Sora',sans-serif;font-weight:700;font-size:6.5px;letter-spacing:.32em;"
        "text-transform:uppercase;white-space:nowrap;color:rgba(255,255,255,.55);pointer-events:none")
SH_FULL = 'text-shadow:0 2px 8px rgba(0,0,0,.85)'
TRIPLE = 'box-shadow:0 0 0 1px rgba(255,255,255,.14),0 0 0 3px #050505,0 0 0 4px rgba(255,255,255,.07)'
DIE = ('<svg viewBox="0 0 64 64" aria-hidden="true" style="position:absolute;left:50%%;top:50%%;width:92px;height:92px;transform:translate(-50%%,-50%%);opacity:%s">'
       '<rect x="4" y="4" width="56" height="56" rx="13" fill="none" stroke="#ffffff" stroke-width="4"></rect><circle cx="20" cy="20" r="5" fill="#fff"></circle>'
       '<circle cx="44" cy="20" r="5" fill="#fff"></circle><circle cx="32" cy="32" r="5" fill="#fff"></circle><circle cx="20" cy="44" r="5" fill="#fff"></circle>'
       '<circle cx="44" cy="44" r="5" fill="#fff"></circle></svg>')
T5_LAYERS = ('<div class="holo4" style="position:absolute;inset:0;mix-blend-mode:overlay;opacity:.75;background:linear-gradient(115deg,#ff5fc4,#ffd36e,#6dffc9,#62a0ff,#c58bff,#ff5fc4,#ffd36e,#6dffc9);background-size:230% 230%;animation:holoshift 9s ease-in-out infinite alternate"></div>'
             '<div class="sweep4" style="position:absolute;top:-10%;bottom:-10%;left:0;width:30%;mix-blend-mode:screen;animation:shinesweep 6s ease-in-out infinite;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.30) 50%,rgba(255,255,255,0))"></div>'
             + ''.join('<div class="glint4" style="position:absolute;%s;width:30px;height:30px;opacity:0;animation:twinkle 3.2s ease-in-out %ss infinite;background:radial-gradient(circle,rgba(255,255,255,.95) 0 2px,rgba(255,255,255,0) 3px),linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.9) 50%%,rgba(255,255,255,0)) center/100%% 1px no-repeat,linear-gradient(0deg,rgba(255,255,255,0),rgba(255,255,255,.9) 50%%,rgba(255,255,255,0)) center/1px 100%% no-repeat"></div>' % (p, d)
                       for p, d in (('left:22%;top:16%', '0'), ('right:12%;top:30%', '1.1'), ('left:55%;top:8%', '2.1'))))

def sg(opacity, extra=''):
    return ('<svg viewBox="0 0 440 660" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%%;height:100%%;pointer-events:none;opacity:%s%s">'
            '<rect width="440" height="660" fill="url(#sgP)"></rect></svg>' % (opacity, extra)).replace('660', str(G['H']))

def card(c):
    kind, tier = c['kind'], c['tier']
    quest = kind == 'quest'
    theme = quest and c.get('theme')
    col, tint = QTHEME if theme else TY[c['sub']]
    if quest and c['tier'] >= 4:
        col, tint = QLINE['PERSONAL' if c.get('personal') else 'QUEST']
    if kind == 'snelle' and G.get('snellegreen'):
        col, tint = TY['PIECIE']
    if kind == 'snelle' and G.get('snellecol'):
        col, tint = G['snellecol']
    full = tier >= 4
    g = dict(G, bot=108)
    isitem = kind in ('piecie', 'snelle', 'place')
    foot = g.get('foot', 'stack') if isitem else 'stack'
    line = ('Needs: ' + c['needs']) if c.get('needs') else c.get('info')
    nl = max(1, math.ceil(len(line) * 12.5 * 0.5 / 356)) if line else 0
    wrap2 = nl > 1
    cparas = list(c['paras'])
    if foot == 'bar':
        g['bot'] = 62
        if c.get('needs'):
            cparas.insert(0, '<b style="color:%s">Needs:</b> %s' % (tint, esc(c['needs'])))
        elif c.get('info'):
            gf, _, bf = c['info'].partition(' · ')
            cparas.insert(0, '<b style="color:%s">%s</b>%s · <b style="color:%s">%s</b>%s' % (tint, esc(gf.split(':')[0] + ':'), esc(gf.split(':', 1)[1]), tint, esc(bf.split(':')[0] + ':'), esc(bf.split(':', 1)[1])))
    elif foot == 'none':
        g['bot'] = 26
        kw = []
        if kind == 'snelle' and not g.get('lean'):
            kw.append('<b style="color:%s">Instant</b> · any turn, also on your opponent’s · needs a free Piecie slot.' % tint)
        if kind == 'place' and not g.get('lean'):
            kw.append('<b style="color:%s">Only 1 in play.</b>' % tint)
        if c.get('needs'):
            kw.append('<b style="color:%s">Needs:</b> %s' % (tint, esc(c['needs'])))
        if c.get('info'):
            gf, _, bf = c['info'].partition(' · ')
            kw.append('<b style="color:%s">%s</b>%s · <b style="color:%s">%s</b>%s' % (tint, esc(gf.split(':')[0] + ':'), esc(gf.split(':', 1)[1]), tint, esc(bf.split(':')[0] + ':'), esc(bf.split(':', 1)[1])))
        body = []
        for p in cparas:
            m = re.match(r'(Stays [^.]*\.)\s*(.*)$', p)
            if m:
                body.append('<b style="color:%s">%s</b> %s' % (tint, m.group(1), m.group(2)))
            else:
                body.append(p)
        if c.get('stays') and not any(p.startswith('<b style="color:%s">Stays' % tint) for p in body):
            kw.append('<b style="color:%s">Stays in its slot.</b>' % tint)
        if kw and kind == 'place':
            kw = [' '.join(kw)]
        cparas = kw + body
        if g.get('kwwhite'):
            cparas = [p.replace('<b style="color:%s">' % tint, '<b>') for p in cparas]
    elif foot == 'head':
        g['bot'] = 24 + ((34 + (nl - 1) * 17) if line else 0)
    elif quest and g.get('foot'):
        g['bot'] = 86
    if foot == 'stack' and wrap2 and g.get('adaptive'):
        g['bot'] += 18 * (nl - 1)
    extra = max(0, g['bot'] - 108) if foot == 'stack' else 0
    if g.get('adaptive') and not full:
        # Adaptive text box: keep the 3:2 window when the text fits at 12px+, else grow the box upward.
        ps = cparas + (['<b>%s</b>' % esc(c['rolls'])] if quest else [])
        avail = g['H'] - g['bot'] - g['plateTop'] - 36
        fs12, h12 = fit(ps, 356, 9999, [12.0], 1.42, 7)
        need = 0 if fit(ps, 356, avail, [17, 16, 15, 14, 13, 12.5, 12], 1.42, 7)[1] <= avail else h12 - avail + 4
        g['artH'] = max(170, g['artH'] - need - extra)
        g['plateTop'] = g['artTop'] + g['artH'] + 12
    g['plateH'] = g['H'] - g['bot'] - g['plateTop']
    o = []
    glow = ',0 0 24px rgba(255,190,120,.08)' if tier == 3 else ''
    o.append('<div style="position:relative;width:440px;height:%dpx;box-sizing:border-box;border-radius:24px;background:#050505;overflow:hidden;box-shadow:0 24px 50px rgba(0,0,0,.7)%s">' % (g['H'], glow))
    if not full:
        # ── boxed frame (tiers 1–3): waves, calm gradients, grain, top-left light, inner line ──
        if tier == 3:
            o.append('<div style="position:absolute;inset:0;isolation:isolate;background:#050505">%s<div class="rb" style="position:absolute;inset:0;mix-blend-mode:color"></div></div>' % sg('.22'))
        else:
            o.append(sg('.16'))
        o.append('<div style="position:absolute;left:0;right:0;top:0;height:120px;background:linear-gradient(180deg,rgba(5,5,5,.7),rgba(5,5,5,0))"></div>'
                 '<div style="position:absolute;left:0;right:0;bottom:0;height:110px;background:linear-gradient(0deg,rgba(5,5,5,.75),rgba(5,5,5,0))"></div>'
                 '<svg aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:screen;opacity:.13;pointer-events:none"><rect width="100%" height="100%" filter="url(#grain)"></rect></svg>'
                 '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 18% 0%,rgba(255,255,255,.09),rgba(255,255,255,0) 52%)"></div>')
        if tier == 1:
            o.append('<div style="position:absolute;left:6.5px;right:6.5px;top:6.5px;bottom:6.5px;border-radius:17.5px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);-webkit-mask-image:linear-gradient(180deg,#000 0,#000 261.5px,transparent 261.5px,transparent 385.5px,#000 385.5px);mask-image:linear-gradient(180deg,#000 0,#000 261.5px,transparent 261.5px,transparent 385.5px,#000 385.5px)"></div>')
        elif tier == 2:
            o.append('<div style="position:absolute;left:6px;right:6px;top:6px;bottom:6px;border-radius:18px;box-shadow:inset 0 0 0 2px %s;-webkit-mask-image:linear-gradient(180deg,#000 0,#000 262px,transparent 262px,transparent 386px,#000 386px);mask-image:linear-gradient(180deg,#000 0,#000 262px,transparent 262px,transparent 386px,#000 386px)"></div>' % col)
        else:  # tier 3, simplified 29 Oct: one thin rainbow outer ring only
            o.append('<div style="position:absolute;left:6px;right:6px;top:6px;bottom:6px;border-radius:18px;-webkit-mask-image:linear-gradient(180deg,#000 0,#000 262px,transparent 262px,transparent 386px,#000 386px);mask-image:linear-gradient(180deg,#000 0,#000 262px,transparent 262px,transparent 386px,#000 386px)"><div class="ring foil" style="border-radius:18px;padding:1.25px"></div></div>')
    side = 4 if full else 2
    o.append('<div style="left:%dpx;transform:rotate(180deg);%s%s">%s</div>' % (side, SIDE % G, (';color:%s' % tint) if c.get('levelcard') else '', c.get('leftlabel') or (('level %d' % c['levelcard']) if c.get('levelcard') else 'obby card game')))
    if c.get('levelcard'):
        o.append('<div style="right:%dpx;%s;color:%s">%s mosje</div>' % (side, SIDE % G, tint, c['sub'].lower()))
    elif quest and g.get('sidetype'):
        o.append('<div style="right:%dpx;%s;color:%s">%s</div>' % (side, SIDE % G, tint, 'personal quest' if c.get('personal') else 'quest · ' + c['sub'].lower()))
    elif isitem and g.get('sidetype'):
        tg = c.get('tag') if kind == 'piecie' and c.get('tag') in ('FOOD', 'GEAR', 'SUBSTANCE', 'PET') else ('instant' if kind == 'snelle' else '')
        o.append('<div style="right:%dpx;%s;color:%s">%s</div>' % (side, SIDE % G, tint, esc(kind + (' · ' + tg.lower() if tg else ''))))
    else:
        o.append('<div style="right:%dpx;%s">obby card game</div>' % (side, SIDE % G))
    # ── lit rarity diamonds only, centred (none on Quests) ──
    if not quest and not g.get('nodia'):
        n = tier
        for i in range(n):
            x = 217.5 + (i - (n - 1) / 2) * 10
            o.append('<div style="position:absolute;top:22px;left:%spx;width:5px;height:5px;transform:rotate(45deg);background:%s;box-shadow:0 0 5px %s;z-index:2"></div>' % (round(x, 1), col, col))
    # ── art window ──
    if full:
        fade = c.get('fade', 250)
        o.append('<div style="position:absolute;left:18px;right:18px;top:18px;bottom:18px;border-radius:6px;overflow:hidden;background:#000;isolation:isolate;-webkit-clip-path:inset(0 round 6px);clip-path:inset(0 round 6px)">')
        if quest and c.get('art'):
            o.append(art(c, col, full=True))
        elif quest:
            o.append('<div style="position:absolute;inset:0;background:%s"></div><svg aria-hidden="true" style="position:absolute;inset:0;width:100%%;height:100%%"><rect width="100%%" height="100%%" fill="url(#sgQT)"></rect></svg>' % QTHEME[0])
            dn = c.get('dieneed', c['need']); o.append(die_face(dn, 110 if '2' not in dn[:2] else 92, '36%', '.55'))
        else:
            o.append(art(c, col, full=True))
        o.append('<div style="position:absolute;left:0;right:0;bottom:0;height:%dpx;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.6) 36%%,rgba(0,0,0,.9))"></div>' % fade)
        o.append('<div style="position:absolute;left:0;right:0;top:0;height:150px;background:linear-gradient(180deg,rgba(0,0,0,.88),rgba(0,0,0,0))"></div>')
        if tier == 5:
            o.append(T5_LAYERS)
        o.append('</div>')
    else:
        o.append('<div style="position:absolute;left:24px;right:24px;top:%dpx;height:%dpx;border-radius:6px;overflow:hidden;background:#000;%s">' % (g['artTop'], g['artH'], TRIPLE))
        if quest:
            o.append('<div style="position:absolute;inset:0;background:%s"></div>' % col)
            o.append('<svg aria-hidden="true" style="position:absolute;inset:0;width:100%%;height:100%%"><rect width="100%%" height="100%%" fill="url(#sgQ%s)"></rect></svg>' % ('T' if theme else c['sub'][0]))
            o.append(die_face(c['need'], 92, '50%', '.6' if theme else '1'))
        else:
            o.append(art(c, col, full=False))
        if tier == 3:
            o.append('<div style="position:absolute;inset:0;mix-blend-mode:screen;opacity:.24;background-image:radial-gradient(circle,rgba(255,255,255,.9) 0 2px,transparent 2.5px),radial-gradient(circle,rgba(255,255,255,.9) 0 4px,transparent 4.5px),radial-gradient(circle,rgba(255,255,255,.9) 0 1.5px,transparent 2px);background-size:41px 41px,83px 83px,29px 29px;background-position:6px 9px,31px 52px,17px 3px"></div>'
                     '<div class="rb" style="position:absolute;inset:0;opacity:.10;mix-blend-mode:color-dodge"></div>')
        o.append('</div>')
    # ── header: cost (or Quest need) · divider · name ──
    sh = SH_FULL if full else 'text-shadow:0 1px 8px rgba(0,0,0,.6)'
    if (c['need'] if quest else c.get('cost')) is None:
        nx = 42
    else:
        cost = c['need'] if quest else c.get('cost')
        cfs = 42 if len(cost) <= 1 else (36 if len(cost) <= 2 else 28)
        cw = max(48, round(sum(1.0 if ch == '★' else 0.62 for ch in cost) * cfs))
        label = c.get('needLabel', 'NEED') if quest else 'COST'
        note = c.get('costNote')
        o.append('<div style="position:absolute;left:28px;top:36px;width:%dpx;text-align:center;font-family:\'Sora\',sans-serif;color:#fff;%s;z-index:2"><div style="font-weight:800;font-size:%dpx;line-height:%dpx">%s</div><div style="font-size:9px;font-weight:800;letter-spacing:.16em;color:%s;margin-top:6px">%s</div>%s</div>'
                 % (cw, sh, cfs, 42, esc(cost), tint, label, ('<div style="font-size:9px;font-weight:700;letter-spacing:.08em;color:%s;margin-top:2px">%s</div>' % (tint, esc(note.upper()))) if note else ''))
        dx = 28 + cw + 10
        o.append('<div style="position:absolute;left:%dpx;top:40px;width:1px;height:50px;background:rgba(255,255,255,.3);z-index:2"></div>' % dx)
        nx = dx + 14
    right = 66 if (quest and not g.get('nopips')) else (86 if ((isitem and foot == 'none' and not g.get('sidetype')) or (c.get('levelcard') and g.get('lvlbadge'))) else 30)
    nw = 440 - nx - right
    fs = name_fs(c['name'], nw, 40)
    sub = ''
    nws = 'nowrap'
    if c.get('subname'):
        if g.get('subwrap'):
            fs, nws = max(fs, 32), 'normal'
            sub = '<div style="font-weight:600;font-size:20px;line-height:1.15;margin-top:4px">%s</div>' % esc(c['subname'])
        else:
            sub = '<div style="font-weight:600;font-size:%spx;line-height:1.2;margin-top:3px;white-space:nowrap">%s</div>' % (min(20, name_fs(c['subname'], nw, 20) * 1.15), esc(c['subname']))
    top = 40 if (sub or fs >= 34) else 40 + (40 - fs) * 0.6
    o.append('<div style="position:absolute;left:%dpx;right:%dpx;top:%spx;%s;z-index:2"><div style="display:flex;flex-direction:column;align-items:flex-start;font-family:\'Sora\',sans-serif;color:#fff;text-align:left"><div style="font-weight:800;font-size:%spx;line-height:1.05;letter-spacing:-.01em;white-space:%s">%s</div>%s</div></div>'
             % (nx, right, round(top, 1), sh, fs, nws, esc(c['name']), sub))
    if c.get('levelcard') and g.get('lvlbadge'):
        n = c['levelcard']
        pips = ''.join('<span style="width:6px;height:6px;border-radius:50%%;background:%s"></span>' % ('#fff' if i < n else 'rgba(255,255,255,.28)') for i in range(3))
        o.append('<div style="position:absolute;right:28px;top:36px;width:48px;display:flex;flex-direction:column;align-items:center;z-index:2;%s"><div style="width:38px;height:38px;border-radius:50%%;background:%s;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px rgba(5,5,5,.6),0 0 14px %s;font-family:\'Sora\',sans-serif;font-weight:800;font-size:19px;color:#fff">%d</div><div style="display:flex;gap:4px;margin-top:7px">%s</div><div style="font-size:9px;font-weight:800;letter-spacing:.16em;color:%s;margin-top:5px">LEVEL</div></div>'
                 % (sh, col, rgba(col, .55), n, pips, tint))
    if isitem and foot == 'none' and not g.get('sidetype'):
        ic, lab = glyph(c)
        o.append('<div style="position:absolute;right:28px;top:36px;width:48px;display:flex;flex-direction:column;align-items:center;z-index:2;%s"><div style="width:38px;height:38px;border-radius:50%%;background:%s;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px rgba(5,5,5,.6),0 0 14px %s">%s</div>%s</div>'
                 % (sh, col, rgba(col, .55), ic, ('<div style="font-size:9px;font-weight:800;letter-spacing:.16em;color:%s;margin-top:6px;white-space:nowrap">%s</div>' % (tint, lab)) if lab else ''))
    if quest and not g.get('nopips'):  # two fail pips
        o.append('<div style="position:absolute;right:30px;top:50px;display:flex;gap:6px;z-index:2" aria-label="2 fail pips">%s</div>'
                 % ('<div style="width:11px;height:11px;border-radius:50%;border:1.5px solid rgba(255,255,255,.75);box-sizing:border-box"></div>' * 2))
    # ── text ──
    if kind == 'mosje' and c.get('strip'):
        o.append(strip_block(c, tint, col))
    elif kind == 'mosje' and c.get('levelcard'):
        allp = c['paras'] + (c.get('pq') or [])
        fsz, th = fit(allp, 356, 250, [16, 15, 14.5, 14, 13.5, 13], 1.45, 8)
        pqh = ''
        if c.get('pq'):
            pqh = '<div style="margin-top:12px;padding:9px 0 0;border-top:1px solid %s"><div style="font-family:\'Sora\',sans-serif;font-size:10px;font-weight:800;letter-spacing:.18em;color:%s;margin-bottom:4px">PERSONAL QUEST · WIN THE GAME</div>%s</div>' % (rgba(tint, .55), tint, ''.join('<div style="margin-top:%dpx">%s</div>' % (0 if i == 0 else 6, p) for i, p in enumerate(c['pq'])))
        o.append('<div style="position:absolute;left:42px;right:42px;bottom:118px;color:#fff;font-size:%spx;line-height:1.45;text-shadow:0 1px 3px #000,0 0 8px #000,0 0 14px #000;z-index:2">%s%s<div style="margin-top:12px;padding-top:9px;border-top:1px solid rgba(255,255,255,.18);font-size:12.5px;font-weight:700;color:#f4f4f5;letter-spacing:.02em">%s</div></div>'
                 % (fsz, ''.join('<div style="margin-top:%dpx">%s</div>' % (0 if i == 0 else 9, p) for i, p in enumerate(c['paras'])), pqh, esc(c['traitsline'])))
    elif kind == 'mosje':
        fsz, th = fit(c['paras'], 356, 190, [14.5, 14, 13.5, 13, 12.5, 12], 1.45, 8)
        lv = ''.join('<div style="display:flex;gap:7px;align-items:baseline;padding:2px 7px;border-radius:3px;white-space:nowrap;%s"><span style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:11px">%s</span><span>%s</span></div>'
                     % (('background:rgba(255,255,255,.08);color:#fff;border-left:2px solid %s' % col) if i == 0 else 'color:rgba(255,255,255,.45);border-left:2px solid transparent', a, esc(b))
                     for i, (a, b) in enumerate(c['levels']))
        o.append('<div style="position:absolute;left:42px;right:42px;bottom:96px;color:#fff;font-size:%spx;line-height:1.45;text-shadow:0 1px 3px #000,0 0 8px #000,0 0 14px #000;z-index:2">%s<div style="margin-top:10px;display:flex;flex-direction:column;gap:2px;font-size:%spx;font-weight:600;line-height:1.35">%s</div></div>'
                 % (fsz, ''.join('<div style="margin-top:%dpx">%s</div>' % (0 if i == 0 else 8, p) for i, p in enumerate(c['paras'])), 11 if max(len(b) for a, b in c['levels']) > 44 else 11.5, lv))
    elif full:
        if quest:
            cparas = cparas + ['<b style="color:%s">%s</b>' % (tint, esc(c['rolls']))] if c.get('rolls') else cparas
        fsz, th = fit(cparas, 356, 240, [18, 17, 16, 15, 14, 13, 12.5], 1.5, 10)
        tb = 112 if quest else ((114 if line else 96) if foot == 'stack' else g['bot'] + 22)
        o.append('<div style="position:absolute;left:42px;right:42px;bottom:%dpx;color:#fff;font-size:%spx;line-height:1.5;text-shadow:0 1px 3px #000,0 0 8px #000,0 0 14px #000;z-index:2">%s</div>'
                 % (tb, fsz, ''.join('<div style="margin-top:%dpx">%s</div>' % (0 if i == 0 else 10, p) for i, p in enumerate(cparas))))
    else:
        paras = cparas + ([('<b style="color:#c9cde6">%s</b>' % esc(c['rolls']))] if quest else [])
        fsz, th = fit(paras, 356, g['plateH'] - 36, [17, 16, 15, 14, 13, 12.5, 12, 11.5, 11], 1.42, 7)
        if g.get('nobox'):
            if g['nobox'] == 'quiet':   # waves fade out under the text, inside the inner line
                o.append('<div style="position:absolute;left:8px;right:8px;bottom:8px;top:%dpx;border-radius:0 0 16px 16px;background:linear-gradient(180deg,rgba(5,5,5,0),rgba(5,5,5,.9) 30px,rgba(5,5,5,.9));pointer-events:none"></div>' % (g['plateTop'] - 6))
            o.append('<div style="position:absolute;left:24px;right:24px;top:%dpx;height:%dpx;box-sizing:border-box;padding:16px 18px;color:#fff;font-size:%spx;line-height:1.42;overflow:hidden;backdrop-filter:none;text-shadow:0 1px 3px rgba(0,0,0,.9);z-index:1"><div style="position:relative">%s</div></div>'
                     % (g['plateTop'], g['plateH'], fsz, ''.join('<div style="margin-top:%dpx">%s</div>' % (0 if i == 0 else 7, p) for i, p in enumerate(paras))))
        else:
            o.append(sg('.20', ';mix-blend-mode:screen;clip-path:inset(%dpx 24px %dpx 24px round 6px)' % (g['plateTop'], g['bot'])))
            o.append('<div style="position:absolute;left:24px;right:24px;top:%dpx;height:%dpx;box-sizing:border-box;border-radius:6px;padding:16px 18px;color:#fff;font-size:%spx;line-height:1.42;overflow:hidden;background:linear-gradient(180deg,rgba(19,19,24,.36),rgba(11,11,15,.36));-webkit-backdrop-filter:blur(4px) brightness(2.1) contrast(1.15);backdrop-filter:blur(4px) brightness(2.1) contrast(1.15);%s"><div style="position:relative">%s</div></div>'
                     % (g['plateTop'], g['plateH'], fsz, TRIPLE, ''.join('<div style="margin-top:%dpx">%s</div>' % (0 if i == 0 else 7, p) for i, p in enumerate(paras))))
    tsh = ';text-shadow:0 1px 4px #000' if full else ''
    # ── footer ──
    if kind == 'mosje' and c.get('strip'):
        pass
    elif kind == 'mosje' and c.get('levelcard'):
        o.append('<div style="position:absolute;left:42px;right:42px;bottom:36px;display:flex;align-items:flex-end;justify-content:space-between;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.9);z-index:2"><div><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:34px;line-height:1">%d</div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;margin-top:5px">POWER</div></div>%s</div>' % (c['power'], tint, (('<div style="text-align:right"><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:34px;line-height:1">%s</div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;margin-top:5px">%s</div></div>') % (c['mp'], tint, c.get('mplabel', 'MP'))) if c.get('mp') is not None else '<div style="width:48px"></div>'))
    elif kind == 'mosje':
        o.append('<div style="position:absolute;left:42px;right:42px;bottom:22px;display:flex;align-items:flex-end;justify-content:space-between;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.9);z-index:2">'
                 '<div><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:34px;line-height:1">%d</div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;margin-top:5px">POWER</div></div>'
                 '<div style="display:flex;flex-direction:column;align-items:center;padding-bottom:1px"><span style="height:22px;padding:0 9px;display:inline-flex;align-items:center;border-radius:5px;background:%s;color:#fff;font-size:12px;font-weight:800;letter-spacing:.08em;text-shadow:none">LVL %d</span><span style="font-family:\'Sora\',sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.16em;color:%s;margin-top:7px">%s MOSJE</span></div>'
                 '<div style="text-align:right"><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:34px;line-height:1">%d</div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;margin-top:5px">MP</div></div></div>'
                 % (c['power'], tint, col, c['lvl'], tint, c['sub'], c['mp'], tint))
    elif quest and full:
        o.append('<div style="position:absolute;left:42px;right:42px;bottom:36px;display:flex;align-items:flex-end;justify-content:space-between;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.9);z-index:2"><div><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:34px;line-height:1">%s</div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;margin-top:5px">%s</div></div><div style="text-align:right"><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:34px;line-height:1">%s</div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;margin-top:5px">%s</div></div></div>' % (c['win'], tint, c.get('winLabel', 'WIN'), c['lose'], tint, c.get('loseLabel', 'LOSE')))
    elif quest:
        if g.get('foot') == 'none':
            pill = ('<span style="font-family:\'Sora\',sans-serif;font-size:10px;font-weight:800;letter-spacing:.2em;color:rgba(255,255,255,.75);padding-bottom:6px">%s</span>' % c['sub']) if theme else ''
        else:
          pill = ('<span style="font-family:\'Sora\',sans-serif;font-size:11px;font-weight:800;letter-spacing:.18em;color:#fff;padding-bottom:4px">%s QUEST</span>' % c['sub']) if theme else \
               ('<span style="height:22px;padding:0 9px;display:inline-flex;align-items:center;border-radius:5px;background:%s;color:#fff;font-size:12px;font-weight:800;letter-spacing:.08em;margin-bottom:2px">%s QUEST</span>' % (col, c['sub']))
        o.append('<div style="position:absolute;left:42px;right:42px;bottom:22px;display:flex;align-items:flex-end;justify-content:space-between;color:#fff;z-index:2">'
                 '<div><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:34px;line-height:1">%s</div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;margin-top:5px">WIN</div></div>%s'
                 '<div style="text-align:right"><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:34px;line-height:1">%s</div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;margin-top:5px">%s</div></div></div>'
                 % (c['win'], tint, pill, c['lose'], tint, c.get('loseLabel', 'LOSE')))
    else:
        pill = '<span style="height:%dpx;padding:0 %dpx;display:inline-flex;align-items:center;border-radius:5px;background:%s;color:#fff;font-size:%spx;font-weight:800;letter-spacing:.08em">%s</span>'
        tagt = '<span style="font-family:\'Sora\',sans-serif;font-weight:700;font-size:%spx;letter-spacing:.16em;color:%s;text-transform:uppercase;white-space:nowrap%s">%s</span>'
        stayc = lambda h, f: '<span style="height:%dpx;padding:0 8px;box-sizing:border-box;display:inline-flex;align-items:center;border-radius:5px;border:1px solid %s;color:%s;font-size:%spx;font-weight:800;letter-spacing:.12em;background:rgba(5,5,5,.55)">STAYS</span>' % (h, rgba(tint, .7), tint, f)
        if foot == 'none':
            pass
        elif foot == 'bar':
            o.append('<div style="position:absolute;left:42px;right:42px;bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:2"><div style="display:flex;align-items:center;gap:10px;min-width:0">%s%s</div>%s</div>'
                     % (pill % (22, 9, col, 12, c['sub']), tagt % (10.5, tint, tsh, esc(c['tag'])), stayc(22, 11) if c.get('stays') else ''))
        elif foot == 'head':
            o.append('<div style="position:absolute;left:%dpx;right:30px;top:%dpx;display:flex;align-items:center;gap:8px;z-index:2">%s%s%s</div>'
                     % (nx, 92 if full else 90, pill % (18, 7, col, 10.5, c['sub']), tagt % (9.5, tint, tsh, esc(c['tag'])), stayc(18, 9.5) if c.get('stays') else ''))
            if line:
                hd, _, rest = line.partition(': ')
                if c.get('info'):
                    gf, _, bf = c['info'].partition(' · ')
                    txt = '<b style="color:%s">%s</b>%s · <b style="color:%s">%s</b>%s' % (tint, esc(gf.split(':')[0] + ':'), esc(gf.split(':', 1)[1]), tint, esc(bf.split(':')[0] + ':'), esc(bf.split(':', 1)[1]))
                else:
                    txt = '<b style="color:%s">Needs:</b> %s' % (tint, esc(c['needs']))
                o.append('<div style="position:absolute;left:42px;right:42px;bottom:24px;font-size:12.5px;font-weight:600;color:#f4f4f5;line-height:1.35%s;z-index:2">%s</div>' % (tsh, txt))
        else:
            if line:
                o.append('<div style="position:absolute;left:42px;right:42px;bottom:77px;font-size:12.5px;font-weight:600;color:#f4f4f5;line-height:1.35%s;z-index:2">%s</div>' % (tsh, esc(line)))
            stays = '<span style="height:22px;margin-left:8px;padding:0 8px;box-sizing:border-box;display:inline-flex;align-items:center;border-radius:5px;border:1px solid %s;color:%s;font-size:11px;font-weight:800;letter-spacing:.12em;background:rgba(5,5,5,.55)">STAYS</span>' % (rgba(tint, .7), tint) if c.get('stays') else ''
            o.append('<div style="position:absolute;left:42px;bottom:46px;display:flex;align-items:center;z-index:2"><span style="height:22px;padding:0 9px;display:inline-flex;align-items:center;border-radius:5px;background:%s;color:#fff;font-size:12px;font-weight:800;letter-spacing:.08em">%s</span>%s</div>' % (col, c['sub'], stays))
            o.append('<div style="position:absolute;left:42px;bottom:22px;font-family:\'Sora\',sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.16em;color:%s;text-transform:uppercase%s;z-index:2">%s</div>' % (tint, tsh, esc(c['tag'])))
    if full and g.get('typering') and kind != 'mosje':
        # type-colour line in the black frame, broken where the side labels sit; Mosjes keep the plain black frame
        # gap centred on the side label (label box: side .. side+124 in card px; the ring div starts 8px in)
        t0, t1 = g['side'] - 6 - 8, g['side'] + 130 - 8
        mk = '-webkit-mask-image:linear-gradient(180deg,#000 0,#000 %dpx,transparent %dpx,transparent %dpx,#000 %dpx);mask-image:linear-gradient(180deg,#000 0,#000 %dpx,transparent %dpx,transparent %dpx,#000 %dpx)' % (t0, t0, t1, t1, t0, t0, t1, t1)
        if tier == 5 and g.get('typering') == 'rainbowfoil':
            o.append('<div style="position:absolute;left:8px;right:8px;top:8px;bottom:8px;border-radius:17px;%s;z-index:3;pointer-events:none"><div class="ring foil" style="border-radius:17px;padding:2px"></div></div>' % mk)
        else:
            if kind == 'snelle' and g.get('snellegreen') == 'double':
                # two 2px lines with a 4px gap; the pair sits 2px further out so it keeps clear of the art
                o.append('<div style="position:absolute;left:6px;right:6px;top:6px;bottom:6px;border-radius:19px;box-shadow:inset 0 0 0 2px %s,inset 0 0 0 6px rgba(0,0,0,0),inset 0 0 0 6px #050505,inset 0 0 0 8px %s;%s;z-index:3;pointer-events:none"></div>' % (col, col, mk.replace('%dpx' % (g['side'] - 14), '%dpx' % (g['side'] - 6 - 6)).replace('%dpx' % (g['side'] + 122), '%dpx' % (g['side'] + 130 - 6))))
            else:
                o.append('<div style="position:absolute;left:8px;right:8px;top:8px;bottom:8px;border-radius:17px;box-shadow:inset 0 0 0 2px %s;%s;z-index:3;pointer-events:none"></div>' % (col, mk))
    o.append('</div>')
    out = masks('\n'.join(o))
    if g.get('sidewhite'):
        # every side label (OBBY CARD GAME, LEVEL n, card type) in the same white
        out = re.sub(r'pointer-events:none;color:#[0-9A-Fa-f]{6}', 'pointer-events:none', out)
        out = out.replace('color:rgba(255,255,255,.55);pointer-events:none', 'color:rgba(255,255,255,.85);pointer-events:none')
    return out

ICON = {
 'snelle': '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"></path>',
 'place': '<path d="M12 21s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.3"></circle>',
 'FOOD': '<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M16.5 21V3c-1.8 1.2-2.8 3.4-2.8 6.5V13h2.8"></path>',
 'GEAR': '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.3-.7-.7-2.3z"></path>',
 'SUBSTANCE': '<path d="M5 19C5 10 10.5 5 19 5c0 8.5-5 14-14 14z"></path><path d="M5 19 13 11"></path>',
 'PET': '<circle cx="6.5" cy="10" r="1.8"></circle><circle cx="10" cy="6" r="1.8"></circle><circle cx="14" cy="6" r="1.8"></circle><circle cx="17.5" cy="10" r="1.8"></circle><path d="M8 17.5c0-2.8 1.8-5 4-5s4 2.2 4 5c0 1.6-1.3 2.5-2.8 2.1L12 19.3l-1.2.3C9.3 20 8 19.1 8 17.5z"></path>',
 'piecie': '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"></path><path d="M4 7.5 12 12l8-4.5M12 12v9"></path>',
}

def glyph(c):
    if c['kind'] == 'piecie':
        tag = c.get('tag')
        key = tag if tag in ('FOOD', 'GEAR', 'SUBSTANCE', 'PET') else 'piecie'
        lab = tag if key != 'piecie' else ''
    else:
        key, lab = c['kind'], ('INSTANT' if c['kind'] == 'snelle' else '')
    svg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % ICON[key]
    return svg, lab

def art(c, col, full):
    if c.get('art'):
        pos = c['pos'] if full else c.get('boxpos', c['pos'])
        return '<img src="/_blob/%s" alt="%s art" style="position:absolute;left:0;top:0;width:100%%;height:100%%;object-fit:cover;object-position:%s;display:block">' % (c['art'], esc(c['name']), pos)
    return '<div style="position:absolute;inset:0;background:linear-gradient(160deg,%s,%s 55%%,#050505)"></div>' % (rgba(col, .95), rgba(col, .35))

SHORTT = {'physical': 'Phys', 'resilient': 'Res', 'creative': 'Cre', 'social': 'Soc', 'mental': 'Men', 'technical': 'Tech'}
LONGT = {'physical': 'Physical', 'resilient': 'Resilient', 'creative': 'Creative', 'social': 'Social', 'mental': 'Mental', 'technical': 'Technical'}
SORA = "font-family:'Sora',sans-serif;"
TSH = 'text-shadow:0 1px 3px #000,0 0 8px #000,0 0 14px #000'

def strip_block(c, tint, col):
    """One Mosje card, three levels. c['levels3'] = [(power, {trait: n}), x3]; c['strip'] = 'A' columns | 'B' rows | 'C' ladder."""
    L, st = c['levels3'], c['strip']
    cur = c.get('curlvl')
    fsz, th = fit(c['paras'], 356, 200, [15, 14.5, 14, 13.5, 13], 1.45, 8)
    paras = ''.join('<div style="margin-top:%dpx">%s</div>' % (0 if i == 0 else 9, p) for i, p in enumerate(c['paras']))
    lab = lambda t, extra='': '<div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:%s;%s">%s</div>' % (tint, extra, t)
    mpbox = '<div style="text-align:right">%s<div style="%sfont-weight:800;font-size:34px;line-height:1">%s</div>%s</div>' % ('', SORA, c['mp'], lab('MP', 'margin-top:5px'))
    dim = lambda i: '' if (cur is None or cur == i + 1) else 'opacity:.4;'
    if st == 'A':      # three level columns + MP
        cols = ''
        for i, (p, tr) in enumerate(L):
            rows = ''.join('<div style="white-space:nowrap">%s <span style="color:%s">%s</span></div>' % (SHORTT[k], tint, '★' * v) for k, v in tr.items())
            cols += ('<div style="flex:1;%spadding-left:%dpx;%s">%s<div style="%sfont-weight:800;font-size:28px;line-height:1;margin:5px 0 6px">%d</div>'
                     '<div style="font-size:11px;font-weight:700;line-height:1.4;color:#f4f4f5">%s</div></div>') % (
                dim(i), 0 if i == 0 else 10, '' if i == 0 else 'border-left:1px solid rgba(255,255,255,.18);', lab('LV%d' % (i + 1)), SORA, p, rows)
        foot = '<div style="display:flex;align-items:flex-end;gap:0">%s<div style="width:64px;align-self:flex-end">%s</div></div>' % (
            '<div style="flex:1;display:flex">%s</div>' % cols, mpbox)
        bottom_txt = 36 + 104 + 16
        foot_html = '<div style="position:absolute;left:42px;right:42px;bottom:36px;color:#fff;%s;z-index:2">%s<div style="margin-top:7px">%s</div></div>' % (TSH, '', foot)
        foot_html = foot_html.replace('<div style="margin-top:7px">', '<div style="margin-top:0">')
        foot_html = foot_html.replace(lab('LV1'), lab('LV1'), 1)
        powerlab = ''
    elif st == 'B':    # compact table rows left, MP right
        rows = ''
        for i, (p, tr) in enumerate(L):
            t = ' · '.join('%s <span style="color:%s">%s</span>' % (SHORTT[k], tint, '★' * v) for k, v in tr.items())
            rows += ('<div style="display:flex;align-items:baseline;gap:10px;%swhite-space:nowrap;padding:3px 0;%s">'
                     '<span style="%sfont-weight:800;font-size:10px;letter-spacing:.14em;color:%s;width:24px">LV%d</span>'
                     '<span style="%sfont-weight:800;font-size:17px;width:28px">%d</span><span style="font-size:12px;font-weight:700">%s</span></div>') % (
                dim(i), '' if i == 0 else 'border-top:1px solid rgba(255,255,255,.14);', SORA, tint, i + 1, SORA, p, t)
        head = '<div style="display:flex;gap:10px;font-size:9px;font-weight:800;letter-spacing:.14em;color:%s;margin-bottom:2px"><span style="width:24px"></span><span>POWER · TRAITS</span></div>' % tint
        foot_html = '<div style="position:absolute;left:42px;right:42px;bottom:36px;display:flex;align-items:flex-end;justify-content:space-between;color:#fff;%s;z-index:2"><div>%s%s</div>%s</div>' % (TSH, head, rows, mpbox)
        bottom_txt = 36 + 98 + 16
    else:              # C: ladder: base traits + per-level gains, Power 10 › 20 › 30
        base = L[0][1]
        gains = []
        for i in (1, 2):
            d = [(k, L[i][1].get(k, 0) - L[i - 1][1].get(k, 0)) for k in L[i][1]]
            d = [(k, n) for k, n in d if n > 0]
            if d:
                gains.append('<span style="%sfont-weight:800;font-size:10px;letter-spacing:.14em;color:%s">LV%d</span> +%s' % (SORA, tint, i + 1, ' +'.join('%s<span style="color:%s">%s</span>' % (LONGT[k], tint, '★' * n) for k, n in d)))
        tl = ' · '.join('%s <span style="color:%s">%s</span>' % (LONGT[k], tint, '★' * v) for k, v in base.items())
        traits = '<div style="margin-top:12px;padding-top:9px;border-top:1px solid rgba(255,255,255,.18);font-size:12.5px;font-weight:700;color:#f4f4f5;line-height:1.55">%s<div>%s</div></div>' % (tl, ' &nbsp;·&nbsp; '.join(gains))
        lad = ''.join('<span style="%s">%s%d</span>' % (dim(i), '' if i == 0 else '<span style="font-size:18px;color:%s;margin:0 7px;position:relative;top:-6px">›</span>' % tint, p) for i, (p, tr) in enumerate(L))
        foot_html = ('<div style="position:absolute;left:42px;right:42px;bottom:36px;display:flex;align-items:flex-end;justify-content:space-between;color:#fff;%s;z-index:2">'
                     '<div><div style="%sfont-weight:800;font-size:30px;line-height:1">%s</div>%s</div>%s</div>') % (TSH, SORA, lad, lab('POWER · LV1 › LV2 › LV3', 'margin-top:5px'), mpbox)
        return ('<div style="position:absolute;left:42px;right:42px;bottom:118px;color:#fff;font-size:%spx;line-height:1.45;%s;z-index:2">%s%s</div>' % (fsz, TSH, paras, traits)) + foot_html
    return ('<div style="position:absolute;left:42px;right:42px;bottom:%dpx;color:#fff;font-size:%spx;line-height:1.45;%s;z-index:2">%s</div>' % (bottom_txt, fsz, TSH, paras)) + foot_html

def prep(c):
    """Size the bottom fade on full-art cards to the text it has to carry."""
    if c['kind'] == 'mosje' and c.get('strip'):
        fsz, th = fit(c['paras'], 356, 200, [15, 14.5, 14, 13.5, 13], 1.45, 8)
        c['fade'] = int(min(600, max(400, th + {'A': 150, 'B': 120, 'C': 140}[c['strip']] + 200)))
    elif c['kind'] == 'mosje':
        fsz, th = fit(c['paras'] + (c.get('pq') or []), 356, 250, [14.5, 14, 13.5, 13, 12.5, 12], 1.45, 8)
        c['fade'] = int(min(580, max(380, 96 + th + 80 + 120 + (60 if c.get('pq') else 0))))
    elif c['tier'] >= 4:
        fsz, th = fit(c['paras'], 356, 240, [18, 17, 16, 15, 14, 13, 12.5], 1.5, 10)
        c['fade'] = int(min(520, max(250, 114 + th + 110)))
    return c

def scaled(c, x, y, s):
    w, h = round(440 * s), round(660 * s)
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx"><div style="width:440px;height:660px;transform:scale(%s);transform-origin:0 0">%s</div></div>'
            % (x, y, w, h, s, card(prep(c))))

# ═════════ Board 1 · Tiers 9: final 2.0 card faces at full size ═════════
def tiers9():
    W, H = 2440, 1720
    xs = [40 + i * 480 for i in range(5)]
    b = ['<div style="position:absolute;left:40px;top:24px;font-family:\'Sora\',sans-serif;font-weight:700;font-size:16px;color:#c4bfd6">Final 2.0 card faces · Energy cost top-left, lit diamonds only, tier 3 = one thin rainbow outer ring</div>',
         '<div style="position:absolute;left:40px;top:58px;font-family:\'Sora\',sans-serif;font-weight:800;font-size:17px;color:#fff">The five tiers</div>']
    row1 = [
        (item('piecie_kannetje_melk', 1, 'piecie'), '★  Tier 1 · Piecie', 'Boxed art, white pinline. FOOD tag; cost 0 shows 0.'),
        (item('place_de_box', 2, 'place'), '★★  Tier 2 · Place', 'Boxed art, 2px ring in the type colour. Good for / Bad for, Only 1 in play.'),
        (item('snelle_the_protector', 3, 'snelle'), '★★★  Tier 3 · Snelle', 'Boxed art, one thin rainbow outer ring only (no ring round the art). INSTANT · ANY TURN.'),
        (mosje('mosje_alyssa_bulldozer', 4), '★★★★  Tier 4 · Mosje (base)', 'Full art, even black frame, no shine. Power · LVL + type · MP; level table, L1 bright.'),
        (mosje('mosje_gandoe_destroyer', 5), '★★★★★  Tier 5 · Mosje (foil)', 'Tier 4 + holo wash, light sweep and three glints. Limit 1 per deck.'),
    ]
    row2 = [
        (quest('quest_arm_wrestling'), 'Quest · stack colour', 'Always tier 1. NEED instead of cost, two fail pips, +WIN / −LOSE. Hand and detail view.'),
        (quest('quest_arm_wrestling', theme=True), 'Quest · one shared theme', 'Board version: one theme for every stack, the type shows as text only.'),
        (item('piecie_bowie_stormey', 3, 'piecie'), '★★★  Piecie · PET + STAYS', 'Tag under the pill, STAYS chip next to it. Waits 1 turn face-down, then pay 1 to activate.'),
        (item('snelle_lucky_coin', 1, 'snelle'), '★  Snelle · with Needs', '"Needs: …" line only when the card has a requirement. Needs a free Piecie slot.'),
        (item('piecie_dikke_taks', 4, 'piecie'), '★★★★  Piecie · full art', 'Non-Mosje tier 4: full art, Needs line above the pill (Level 2+ gate).'),
    ]
    for (rows, top) in ((row1, 100), (row2, 940)):
        for x, (c, t, s) in zip(xs, rows):
            b.append('<div style="position:absolute;left:%dpx;top:%dpx;width:440px;height:660px">%s</div>' % (x, top, card(prep(c))))
            b.append('<div style="position:absolute;left:%dpx;top:%dpx;width:440px;font-family:\'DM Sans\',sans-serif;color:#e7e5f2"><div style="font-family:\'Sora\',sans-serif;font-weight:700;font-size:15px">%s</div><div style="font-size:13px;line-height:1.5;color:#a8a3c0;margin-top:2px">%s</div></div>' % (x, top + 676, esc(t), esc(s)))
    b.insert(2, '')
    b.append('<div style="position:absolute;left:40px;top:898px;font-family:\'Sora\',sans-serif;font-weight:800;font-size:17px;color:#fff">Quests and the item details</div>')
    return page('Mosjes rarity tiers - final 2.0 faces', W, H, '\n'.join(b)), W, H

# ═════════ Board 2 · Tiers 10: reference sheet ═════════
S = 0.6
CW, CH = round(440 * S), round(660 * S)
COLX = [300 + i * (CW + 40) for i in range(5)]
TIERDESC = ['Boxed · white pinline', 'Boxed · type-colour ring', 'Boxed · thin rainbow outer ring', 'Full art · black frame', 'Full art · holo foil']

def chip(text, color):
    return '<span style="display:inline-block;margin-top:4px;padding:2px 7px;border-radius:999px;border:1px solid %s;color:%s;font-family:\'Sora\',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:.1em">%s</span>' % (color, color, esc(text))

def empty(x, y, text):
    return ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;box-sizing:border-box;border-radius:15px;border:1.5px dashed rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;text-align:center;padding:0 24px;font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;letter-spacing:.2em;color:#8b86a3">%s</div>' % (x, y, CW, CH, esc(text)))

def tiers10():
    W = COLX[-1] + CW + 40
    b = []
    y = 28
    b.append('<div style="position:absolute;left:40px;top:%dpx;font-family:\'Sora\',sans-serif;font-weight:800;font-size:30px;color:#fff">Obby Card Game 2.0 · card reference sheet</div>' % y)
    b.append('<div style="position:absolute;left:40px;top:%dpx;width:%dpx;font-size:14px;line-height:1.55;color:#a8a3c0">Every card type and subtype at every allowed tier, real cards from src/data (obby-2.0). Energy is the cost: plain number top-left, 0 shows 0; placing is free, activating costs Energy (+1 per turn, carries over, max 6). Mosjes are only tier 4 or 5, Quests only tier 1, everything else tier 1–5. Cards are hand cards at 60%%. <span style="color:#ffc94d">FRAME DEMO</span> = a real card drawn at a tier it does not have, to show the frame; name, art and text are unchanged.</div>' % (y + 46, W - 80))
    y = 168
    for i, x in enumerate(COLX):
        b.append('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;font-family:\'Sora\',sans-serif;color:#fff"><div style="font-weight:800;font-size:15px;letter-spacing:.04em">TIER %d <span style="color:#ffc94d;letter-spacing:.1em">%s</span></div><div style="font-family:\'DM Sans\',sans-serif;font-size:12.5px;color:#a8a3c0;margin-top:3px">%s</div></div>' % (x, y, CW, i + 1, stars(i + 1), TIERDESC[i]))
    y = 236

    def rowlabel(y, title, kind, col, note):
        b.append('<div style="position:absolute;left:40px;top:%dpx;width:220px"><span style="height:22px;padding:0 9px;display:inline-flex;align-items:center;border-radius:5px;background:%s;color:#fff;font-family:\'DM Sans\',sans-serif;font-size:12px;font-weight:800;letter-spacing:.08em">%s</span><div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:22px;color:#fff;margin-top:10px">%s</div><div style="font-size:12.5px;line-height:1.5;color:#a8a3c0;margin-top:6px">%s</div></div>' % (y + 6, col, esc(kind), esc(title), esc(note)))

    def group(title):
        nonlocal y
        b.append('<div style="position:absolute;left:40px;right:40px;top:%dpx;height:1px;background:rgba(255,255,255,.12)"></div><div style="position:absolute;left:40px;top:%dpx;font-family:\'Sora\',sans-serif;font-weight:800;font-size:13px;letter-spacing:.22em;color:#c4bfd6">%s</div>' % (y + 14, y + 30, esc(title)))
        y += 72

    def row(title, kind, col, note, cells, caption):
        nonlocal y
        rowlabel(y, title, kind, col, note)
        for x, cell in zip(COLX, cells):
            if cell is None:
                continue
            if isinstance(cell, str):
                b.append(empty(x, y, cell))
                continue
            c, cap, tag = cell
            b.append(scaled(c, x, y, S))
            b.append('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;font-family:\'Sora\',sans-serif;font-size:12px;font-weight:700;color:#e7e5f2;line-height:1.35">%s%s</div>' % (x, y + CH + 10, CW, esc(cap), ('<br>' + chip(tag, '#ffc94d' if tag.startswith('FRAME') else '#9fe6ff')) if tag else ''))
        b.append('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;font-size:13px;line-height:1.45;color:#a8a3c0">%s</div>' % (COLX[0], y + CH + 66, W - COLX[0] - 40, caption))
        y += CH + 66 + 62

    NM = 'NOT USED FOR MOSJES'
    def mc(cid, t, note=''):
        c = mosje(cid, t)
        dr = c['data_rarity']
        cap = '%s · %s' % (BYID[cid]['name'], stars(t))
        tag = note or ('DATA ★%s → ★★★★' % ('★' * (dr - 1)) if dr < 4 else '')
        return (c, cap, tag)

    def ic(cid, t, kind):
        c = item(cid, t, kind)
        dr = c['data_rarity']
        cap = '%s · cost %s' % (BYID[cid]['name'], c['cost'])
        return (c, cap, '' if dr == t else 'FRAME DEMO · real rarity %s' % stars(dr))

    group('MOSJES · TIER 4 OR 5 ONLY')
    row('Fighting', 'MOSJE', TY['FIGHTING'][0], 'Full art only. Summon cost on the hand card; the board tile has none.',
        [NM, NM, NM, mc('mosje_alyssa_bulldozer', 4), mc('mosje_gandoe_destroyer', 5)],
        '<b style="color:#e7e5f2">Alyssa, The Bulldozer</b> ★★★★ · <b style="color:#e7e5f2">Gandoe, The Destroyer</b> ★★★★★ (foil, limit 1 per deck). Footer: Power · LVL + FIGHTING MOSJE · MP; the level table ends the text, L1 bright, L2/L3 dimmed, L3 · HOLD.')
    row('Digital', 'MOSJE', TY['DIGITAL'][0], 'Tier 5 can also come from the editor foil flag.',
        [NM, NM, NM, mc('mosje_youri', 4), mc('mosje_fps_west', 5, 'TIER 5 VIA FOIL FLAG · DATA ★★★★')],
        '<b style="color:#e7e5f2">Youri, The Speedrunner</b> ★★★★ · <b style="color:#e7e5f2">FPS West</b> ★★★★ with <code>foil: true</code>, so it renders as tier 5. Synergy text sits under the ability.')
    row('Artistic', 'MOSJE', TY['ARTISTIC'][0], 'No enabled ★★★★/★★★★★ Artistic Mosje in the data yet.',
        [NM, NM, NM, mc('mosje_jisca', 4), mc('mosje_chris_ddr', 5, 'FOIL FLAG · DATA ★★★ → ★★★★')],
        '<b style="color:#e7e5f2">Jisca, The Maestro</b> and <b style="color:#e7e5f2">Dancing/DDR Chris</b> are still ★★★ in src/data (cleanup backlog: raise to ★★★★); Chris has <code>foil: true</code> → tier 5. The real ★★★★/★★★★★ Artistic Mosjes (Binti The Creator, Kast-elein, The Amplifier) are disabled.')

    group('PIECIES · PLACED FACE-DOWN FREE, WAIT 1 TURN, PAY COST TO ACTIVATE')
    P = TY['PIECIE'][0]
    row('Food', 'PIECIE', P, 'Tag FOOD. Gives MP to the Mosje you choose.',
        [ic('piecie_kannetje_melk', 1, 'piecie'), ic('piecie_broodje_doner', 2, 'piecie'), ic('piecie_ronald_kip', 3, 'piecie'), ic('piecie_ronald_kip', 4, 'piecie'), ic('piecie_ronald_kip', 5, 'piecie')],
        'Kannetje Melk ★ · Broodje Döner ★★ · Ronald Kip ★★★, also drawn at ★★★★ and ★★★★★ as a frame demo. Some Quests ask you to discard a ready FOOD Piecie.')
    row('Gear', 'PIECIE', P, 'Tag GEAR. No GEAR art yet: the gradient window is the placeholder.',
        [ic('piecie_keyboard', 1, 'piecie'), ic('piecie_boxing_gloves', 2, 'piecie'), ic('piecie_boxing_gloves', 3, 'piecie'), ic('piecie_boxing_gloves', 4, 'piecie'), ic('piecie_boxing_gloves', 5, 'piecie')],
        'Keyboard ★ · Boxing Gloves ★★, also drawn at ★★★ to ★★★★★ as a frame demo. GEAR only goes up to ★★ in the data.')
    row('Substance', 'PIECIE', P, 'Tag SUBSTANCE. Used as a Quest cost (Dutch courage).',
        [ic('piecie_affoe', 1, 'piecie'), ic('piecie_pot_of_weed', 2, 'piecie'), ic('piecie_bong_hit_demolition', 3, 'piecie'), ic('piecie_bong_hit_demolition', 4, 'piecie'), ic('piecie_bong_hit_demolition', 5, 'piecie')],
        'Affoe ★ · Pot of Weed ★★ · Bong Hit Demolition ★★★, also drawn at ★★★★ and ★★★★★ as a frame demo.')
    row('Pet', 'PIECIE', P, 'Tag PET. Every PET has the STAYS chip.',
        [ic('piecie_katjegang', 1, 'piecie'), ic('piecie_katjegang', 2, 'piecie'), ic('piecie_bowie_stormey', 3, 'piecie'), ic('piecie_bowie_stormey', 4, 'piecie'), ic('piecie_bowie_stormey', 5, 'piecie')],
        'KatjeGang ★★ (also the ★ frame demo) · Bowie &amp; Stormey ★★★ (also the ★★★★ / ★★★★★ frame demos). Pets stay until the end of your next turn.')
    row('Attack', 'PIECIE', P, 'No tag → ATTACK. Real cards at every tier.',
        [ic('piecie_snoeiertje', 1, 'piecie'), ic('piecie_te_hard_gaan', 2, 'piecie'), ic('piecie_super_saiyan_mos', 3, 'piecie'), ic('piecie_dikke_taks', 4, 'piecie'), ic('piecie_klaar_met_jou', 5, 'piecie')],
        'Snoeiertje ★ · Te Hard Gaan ★★ · Super Saiyan Mos ★★★ · Dikke Taks ★★★★ · Klaar Met Jou ★★★★★. "This turn" Power boosts and removals; a Level 2+ gate shows as the Needs line.')
    row('MP', 'PIECIE', P, 'No tag → MP: untagged cards that give MP.',
        [ic('piecie_energy_surge', 1, 'piecie'), ic('piecie_eendjes_voeren', 2, 'piecie'), ic('piecie_eendjes_voeren', 3, 'piecie'), ic('piecie_eendjes_voeren', 4, 'piecie'), ic('piecie_eendjes_voeren', 5, 'piecie')],
        "Shoettoe ★ · Nature's Gift ★★, also drawn at ★★★ to ★★★★★ as a frame demo. MP only goes up to ★★ in the data.")
    row('Utility', 'PIECIE', P, 'No tag → UTILITY: everything else. Real cards at every tier.',
        [ic('piecie_laat_me_chillen', 1, 'piecie'), ic('piecie_redbull', 2, 'piecie'), ic('piecie_call_of_welloes', 3, 'piecie'), ic('piecie_double_trigger', 4, 'piecie'), ic('piecie_leipe_swap', 5, 'piecie')],
        'Laat me chillen! ★ · Redbull ★★ · Call of the Welloes ★★★ · Double Trigger ★★★★ · Leipe Swap ★★★★★. STAYS chip whenever the card stays in its slot.')

    group('SNELLE AND PLACE')
    row('Snelle', 'SNELLE', TY['SNELLE'][0], 'INSTANT · ANY TURN, from hand, also on the opponent’s turn. Needs a free Piecie slot.',
        [ic('snelle_lucky_coin', 1, 'snelle'), ic('snelle_emergency_healings', 2, 'snelle'), ic('snelle_the_protector', 3, 'snelle'), ic('snelle_negate_elimination', 4, 'snelle'), ic('snelle_blensen', 5, 'snelle')],
        'Lucky Cóin ★ · Emergency Healings ★★ · The Protector ★★★ · Not Today! ★★★★ · Blensen! ★★★★★ (cost 4 with “or free” under it). Real cards at every tier.')
    row('Place', 'PLACE', TY['PLACE'][0], 'Only 1 in play; it can’t be swapped, only destroyed.',
        [ic('place_de_box', 1, 'place'), ic('place_de_box', 2, 'place'), ic('place_the_gym', 3, 'place'), ic('place_welloe_graveyard', 4, 'place'), ic('place_synergy_chamber', 5, 'place')],
        'De Box ★★ (also the ★ frame demo, there is no ★ Place) · The Gym ★★★ · Welloe Graveyard ★★★★ · Synergy Chamber ★★★★★. Good for / Bad for on the info line.')

    group('QUESTS · ALWAYS TIER 1')
    QN = 'QUESTS ARE ALWAYS TIER 1'
    for sub, qid, note in (('Fighting', 'quest_arm_wrestling', 'Skilled: need 2× 4+.'), ('Digital', 'quest_calculate_odds', 'Steady, with a “First you must” cost.'), ('Artistic', 'quest_shotje_obby', 'Gated by a board condition.')):
        q = BYID[qid]
        row(sub, sub.upper() + ' QUEST', TY[sub.upper()][0], note,
            [(quest(qid), q['name'] + ' · stack colour', 'HAND / DETAIL VIEW'), (quest(qid, theme=True), q['name'] + ' · one theme', 'BOARD · TYPE AS TEXT'), QN, QN, QN],
            '<b style="color:#e7e5f2">%s</b> (%s, Win %s / Lose %s). Left: stack colour. Right: the one shared board Quest theme, same card, type as text only. Dice need instead of cost, two fail pips, no diamonds.' % (esc(q['name']), esc((q.get('band') or '').title()), '+%d' % q['win'], '−%d' % abs(q['lose'])))
    H = y + 10
    return page('Mosjes card reference sheet 2.0', W, H, '\n'.join(b)), W, H

if __name__ == '__main__':
    p9, w9, h9 = tiers9()
    open(os.path.join(OUT, 'CardTiers9.dc.html'), 'w').write(p9)
    p10, w10, h10 = tiers10()
    open(os.path.join(OUT, 'CardTiers10.dc.html'), 'w').write(p10)
    json.dump({'t9': [w9, h9], 't10': [w10, h10]}, open(os.path.join(HERE, 'sizes.json'), 'w'))
    print(w9, h9, len(p9), w10, h10, len(p10))
