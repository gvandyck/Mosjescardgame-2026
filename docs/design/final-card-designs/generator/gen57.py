#!/usr/bin/env python3
"""Tiers 11: the current 2:3 card next to two poker-size (63x88 mm, 5:7) options."""
import os, json
import gen
from gen import card, prep, item, mosje, quest, page, esc

NOW = dict(H=660, side=268, artTop=124, artH=224, plateTop=366, plateH=186)
A = dict(H=616, side=246, artTop=124, artH=200, plateTop=338, plateH=170)   # same layout, height trimmed
B = dict(H=616, side=246, artTop=118, artH=262, plateTop=392, plateH=116)   # 3:2 art window, shorter text box
COLS = [
    (NOW, 'Now · 2:3', '440 × 660. Boxed art window 392 × 224 (1.75 : 1).'),
    (A, 'A · 5:7 poker size, trimmed', '440 × 616 = 63 × 88 mm. Art window 392 × 200 (1.96 : 1), text box 20px shorter.'),
    (B, 'B · 5:7 poker size, 3:2 art', '440 × 616. Art window 392 × 262 (3:2, close to Magic’s 4:3), text box 116 tall.'),
]
ROWS = [
    (lambda: item('piecie_kannetje_melk', 1, 'piecie'), 'Kannetje Melk · ★ Piecie', 'Short text: B fits easily and shows much more of the art.'),
    (lambda: item('piecie_bowie_stormey', 3, 'piecie'), 'Bowie & Stormey · ★★★ Piecie', 'Stress test, one of the longest texts: in B the text drops to the minimum size.'),
    (lambda: quest('quest_calculate_odds'), 'Calculate Odds · Quest', 'Quest with a “First you must” cost: fits in A, tight in B.'),
    (lambda: mosje('mosje_alyssa_bulldozer', 4), 'Alyssa, The Bulldozer · ★★★★ Mosje', 'Full art: the window becomes 404 × 580 (0.70) instead of 404 × 624 (0.65); the 2:3 art loses ~4% top and bottom.'),
    (lambda: mosje('mosje_gandoe_destroyer', 5), 'Gandoe, The Destroyer · ★★★★★ Mosje', 'Foil: same as tier 4, only the art crop changes.'),
]

def board():
    xs = [40 + i * 480 for i in range(3)]
    W = xs[-1] + 440 + 40
    b = ['<div style="position:absolute;left:40px;top:24px;font-family:\'Sora\',sans-serif;font-weight:800;font-size:26px;color:#fff">Card shape test · 2:3 now vs 5:7 poker size (Magic / Pokémon, 63 × 88 mm)</div>',
         '<div style="position:absolute;left:40px;top:66px;width:%dpx;font-size:14px;line-height:1.5;color:#a8a3c0">Same cards, same tokens. Only the card height, the art window and the text box change. Everything anchored to the bottom (footer, pill, Needs line) keeps its exact Tiers 9 position.</div>' % (W - 80)]
    for x, (g, t, s) in zip(xs, COLS):
        b.append('<div style="position:absolute;left:%dpx;top:120px;width:440px;font-family:\'Sora\',sans-serif;color:#fff"><div style="font-weight:800;font-size:17px">%s</div><div style="font-family:\'DM Sans\',sans-serif;font-size:13px;line-height:1.45;color:#a8a3c0;margin-top:4px">%s</div></div>' % (x, esc(t), esc(s)))
    y = 196
    for make, name, note in ROWS:
        for x, (g, t, s) in zip(xs, COLS):
            gen.G.clear(); gen.G.update(g)
            b.append('<div style="position:absolute;left:%dpx;top:%dpx;width:440px;height:%dpx">%s</div>' % (x, y, g['H'], card(prep(make()))))
        gen.G.clear(); gen.G.update(NOW)
        b.append('<div style="position:absolute;left:40px;top:%dpx;width:%dpx;font-family:\'DM Sans\',sans-serif;color:#e7e5f2"><span style="font-family:\'Sora\',sans-serif;font-weight:700;font-size:15px">%s</span><span style="font-size:13px;color:#a8a3c0;margin-left:10px">%s</span></div>' % (y + 676, W - 80, esc(name), esc(note)))
        y += 660 + 120
    H = y - 40
    return page('Mosjes card shape test 2:3 vs 5:7', W, H, '\n'.join(b)), W, H

if __name__ == '__main__':
    p, W, H = board()
    open(os.path.join(gen.OUT, 'CardTiers11.dc.html'), 'w').write(p)
    print(W, H, len(p))
