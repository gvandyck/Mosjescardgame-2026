"""Obby 2.0 desk playtest: a rough Monte Carlo of the core loop with the 3 starter decks.
Models: Energy, Power attacks, MP, levels, getemt/sideways/Welloe, typed Quest stacks with bands,
fail tokens, jabs, Places in the decks, the simple Piecies/Snelle, cooldown turn, a few simple abilities.
Not modelled: hidden-info cards, counters (Jensen!/Jammertje/Counter Strikka), chains, most abilities.
Usage: python obby_sim.py [games_per_pairing] [variant]
"""
import random, sys, statistics
from collections import Counter, defaultdict

# ---------------- Mosjes ----------------
M = {}
def mosje(name, typ, cost, power, mp, l1, l2, l3, ability=None):
    M[name] = dict(name=name, typ=typ, cost=cost, power=power, mp=mp, path=[l1, l2, l3], ability=ability)

mosje('Parkour West', 'F', 3, 20, 10, dict(Phys=3, Cre=2, Res=2), dict(Cre=3), dict(Res=3), None)
mosje('Alyssa Bulldozer', 'F', 4, 30, 0, dict(Phys=3, Res=2, Soc=3), dict(Res=3), dict(), None)
mosje('Drainer', 'D', 2, 20, 20, dict(Men=2, Tech=3, Res=1), dict(Res=2), dict(Men=3), None)
mosje('Chris All-Rounder', 'D', 3, 20, 20, dict(Phys=3, Tech=2, Soc=2), dict(Tech=3), dict(Soc=3), None)
mosje('DJ 80/20', 'A', 2, 10, 30, dict(Cre=3, Res=2), dict(Res=3), dict(Soc=1), None)
mosje('DDR Chris', 'A', 3, 20, 15, dict(Phys=3, Cre=3, Soc=2), dict(Soc=3), dict(Res=1), None)
mosje('Gandoe Wizard', 'F', 3, 20, 10, dict(Phys=2, Res=1, Cre=2), dict(Phys=3), dict(Res=2), 'chaos')
mosje('Michelle', 'F', 3, 20, 10, dict(Phys=2, Soc=1, Res=2), dict(Res=3), dict(Soc=2), 'gamble')
mosje('Alyssa Fissa', 'F', 2, 20, 20, dict(Phys=2, Soc=3, Res=1), dict(Phys=3), dict(Res=2), 'party')
mosje('AZN Cless', 'F', 2, 10, 30, dict(Phys=2, Soc=2, Cre=1), dict(Phys=3), dict(Cre=2), 'risk')
mosje('Coert Savant', 'D', 3, 20, 20, dict(Men=2, Tech=3, Soc=1), dict(Men=3), dict(Soc=2), 'extra')
mosje('Hacker', 'D', 2, 10, 30, dict(Men=3, Tech=2), dict(Tech=3), dict(Soc=1), 'hack')
mosje('FPS Coert', 'D', 3, 20, 20, dict(Tech=3, Phys=2, Men=2), dict(Phys=3), dict(Men=3), None)
mosje('FPS West', 'D', 3, 20, 10, dict(Tech=3, Men=3, Phys=1), dict(Phys=2), dict(Phys=3), None)
mosje('Jisca', 'A', 3, 20, 10, dict(Cre=3, Soc=2, Men=2), dict(Soc=3), dict(Men=3), None)
mosje('Tuk Healing', 'A', 2, 10, 30, dict(Cre=2, Soc=2, Res=3), dict(Cre=3), dict(Soc=3), 'heal')
mosje('Cless Teacher', 'A', 2, 10, 30, dict(Cre=3, Men=2), dict(Men=3), dict(Soc=1), 'teach')
mosje('Binti', 'A', 2, 10, 20, dict(Cre=2, Soc=3), dict(Cre=3), dict(Res=1), None)

# ---------------- Cards ----------------
# kind: P piecie, S snelle, PL place, MO mosje
C = {}
def card(name, kind, cost, tag=None, **fx):
    C[name] = dict(name=name, kind=kind, cost=cost, tag=tag, fx=fx)

card('Kannetje Melk', 'P', 0, 'food', heal=25)
card('Protein Shake', 'P', 0, 'food', heal=25, heal_phys3=35)
card('Broodje Döner', 'P', 1, 'food', heal=35)
card('Dumbbells', 'P', 0, 'gear', heal=20)
card('Boxing Gloves', 'P', 1, 'gear', power=10)
card('Te Hard Gaan', 'P', 2, None, power=20, selfcost=10)
card('Super Saiyan Mos', 'P', 3, None, power=30)
card('Bowie & Stormey', 'P', 1, 'pet', shield=10, stays=True)
card('ViannaPoes', 'P', 1, 'pet', shield=10, stays=True)
card('Grammetje Pieter', 'P', 0, 'substance', gamble=(15, 30))
card('Affoe', 'P', 1, 'substance', hit=15, heal=10)
card('Straffoe', 'P', 0, 'substance', hitall=10, selfcost=5)
card('Tikker', 'P', 0, 'substance', heal=40, noquest=True)
card('Bong Hit Demolition', 'P', 2, 'substance', destroy=True, draw=2)
card('Slecht Gezet', 'P', 1, None, destroy=True)
card('Shhh, popo komt!', 'P', 0, None, destroy=True, need3=True)
card('Huisbaas', 'P', 1, None, destroy=True, needsub=True)
card('Harde Didde', 'P', 4, None, kill=40)
card('Klaar Met Jou', 'P', 4, None, kill=30, draw=1)
card('Keyboard', 'P', 0, 'gear', heal=10, draw=1, digital=True)
card('Mouse', 'P', 0, 'gear', heal=10, digital=True)
card('Controller', 'P', 0, 'gear', heal=10, dice=1, digital=True)
card('Boosterpackkie', 'P', 0, None, draw=1, coert=10)
card('Zie je die Dingetjes', 'P', 0, None, draw=1)
card('Dubbele Dosis', 'P', 1, None, dice=1)
card('Loaded Dice', 'P', 0, None, dice=1)
card('Dikke Plaat', 'P', 0, None, dice=1)
card('Momentum Diefje', 'P', 2, None, power=10, steal=20)
card('Kleine Taks', 'P', 1, None, hit=10, hit2=10)
card('Afblijven!', 'P', 1, None, shield=10, stays=True)
card('Laat me chillen!', 'P', 1, None, shield=20, stays=True, once=True)
card('Momentum Boost', 'P', 0, None, heal=15)
card("Nature's Gift", 'P', 1, None, heal=30)
card('Bagga of Greed', 'P', 0, None, draw=1)
card('Chain Reaction', 'P', 2, None)
card('Larry / Zegeltje', 'P', 0, 'substance', larry=True)
card('Dikke Jonko', 'P', 0, 'substance', heal=25, opp_heal=10, draw=1)
card('Stookerino', 'P', 2, None, heal=20)
card('Varkenspootjes', 'P', 1, 'food', binti=40, hit=15)
card('Dikke Taks', 'P', 3, None, power=10, sweep=True, draw=1, needl2=True)
card('Snoeiertje', 'P', 0, None, power=10, selfcost=10)
card('Redbull', 'P', 2, None)
card('Pot of Weed', 'P', 1, 'substance', draw=2)
# Snelle
card('Perfect Dodge', 'S', 2, None, react=20, needphys2=True)
card('Emergency Healings', 'S', 1, None, react=25)
card('Drain Reversal', 'S', 2, None, react=20, rhit=10)
card('Not Today!', 'S', 2, None, antikill=True)
card('Jensen!', 'S', 1, None)
card('Jammertje Gepakt!', 'S', 2, None)
card('Counter Strikka', 'S', 2, None)
card('Sleutelpuntje', 'S', 1, None, dice=1)
card('Ff Haaltje Nemen', 'S', 2, None, draw=2)
card('Lucky Cóin', 'S', 1, None, reroll=True)
card('Jantje Jantje... Jantje?', 'S', 0, None, bank=True)
card('Bijna Welloe', 'S', 0, None, low_heal=20)
card('Momentum Rush', 'S', 0, None, heal=15)
# Places
for n, c in [('The Gym', 3), ('De Box', 2), ('Arcade', 3), ("Coert's Caravan", 3), ('Skiffa', 3), ('Bank Chilling', 2), ('Quest Haven', 3)]:
    card(n, 'PL', c)
for n in M:
    C[n] = dict(name=n, kind='MO', cost=M[n]['cost'], tag=None, fx={})

DECKS = {
    'Fighting': dict(start='Alyssa Fissa', cards=
        ['Gandoe Wizard', 'Michelle', 'Alyssa Fissa', 'AZN Cless', 'The Gym', 'De Box',
         'Kannetje Melk', 'Kannetje Melk', 'Protein Shake', 'Protein Shake', 'Broodje Döner', 'Dumbbells',
         'Boxing Gloves', 'Te Hard Gaan', 'Te Hard Gaan', 'Super Saiyan Mos', 'Bowie & Stormey', 'ViannaPoes',
         'Grammetje Pieter', 'Affoe', 'Straffoe', 'Tikker', 'Bong Hit Demolition', 'Slecht Gezet', 'Harde Didde',
         'Perfect Dodge', 'Emergency Healings', 'Jensen!', 'Sleutelpuntje', 'Not Today!']),
    'Digital': dict(start='Hacker', cards=
        ['Coert Savant', 'Hacker', 'FPS Coert', 'FPS West', 'Arcade', "Coert's Caravan",
         'Keyboard', 'Mouse', 'Controller', 'Kannetje Melk', 'Kannetje Melk', 'Broodje Döner',
         'Boosterpackkie', 'Boosterpackkie', 'Zie je die Dingetjes', 'Dubbele Dosis', 'Loaded Dice',
         'Te Hard Gaan', 'Momentum Diefje', 'Kleine Taks', 'Afblijven!', 'Klaar Met Jou', 'Slecht Gezet', 'Shhh, popo komt!',
         'Jammertje Gepakt!', 'Counter Strikka', 'Jensen!', 'Sleutelpuntje', 'Sleutelpuntje', 'Ff Haaltje Nemen']),
    'Artistic': dict(start='Tuk Healing', cards=
        ['Jisca', 'Tuk Healing', 'Cless Teacher', 'Binti', 'Skiffa', 'Bank Chilling',
         'Kannetje Melk', 'Kannetje Melk', 'Momentum Boost', "Nature's Gift", 'Zie je die Dingetjes', 'Bagga of Greed',
         'Dubbele Dosis', 'Chain Reaction', 'Te Hard Gaan', 'Larry / Zegeltje', 'Dikke Jonko', 'Grammetje Pieter',
         'ViannaPoes', 'Stookerino', 'Varkenspootjes', 'Laat me chillen!', 'Dikke Taks', 'Slecht Gezet', 'Huisbaas',
         'Lucky Cóin', 'Lucky Cóin', 'Jantje Jantje... Jantje?', 'Drain Reversal', 'Bijna Welloe']),
}

import copy
DECKS_V1 = copy.deepcopy(DECKS)
def swap(deck, out, inn):
    for o in out: DECKS[deck]['cards'].remove(o)
    DECKS[deck]['cards'].extend(inn)
swap('Fighting', ['Dumbbells', 'Sleutelpuntje'], ['Parkour West', 'Alyssa Bulldozer'])
swap('Digital', ['Counter Strikka', 'Jensen!'], ['Drainer', 'Chris All-Rounder'])
swap('Artistic', ['Bagga of Greed', 'Bijna Welloe'], ['DJ 80/20', 'DDR Chris'])
DECKS_V2 = copy.deepcopy(DECKS)
swap('Digital', ['Ff Haaltje Nemen', 'Zie je die Dingetjes', 'Kleine Taks'], ['Momentum Rush', 'Momentum Boost', 'Te Hard Gaan'])
DECKS['Digital']['start'] = 'Coert Savant'
DECKS_V3 = copy.deepcopy(DECKS)
swap('Digital', ['Mouse', 'Loaded Dice'], ['Broodje Döner', 'Super Saiyan Mos'])
DECKS_V4 = copy.deepcopy(DECKS)
for d in DECKS_V2.values(): assert len(d['cards']) == 30, len(d['cards'])
for d in DECKS_V1.values(): assert len(d['cards']) == 30, len(d['cards'])

# ---------------- Quests ----------------
# (name, band, trait, req, extra)
Q_F = [('Arm Wrestling', 'Skilled', 'Phys', None, None), ('Sprint Race', 'Trained', 'Phys', None, None),
       ('Sustained Assault', 'Steady', 'Phys', None, 'jab'), ('Tough It Out', 'Steady', 'Res', None, None),
       ('Survive Storm', 'Steady', 'Res', 'low30', None), ('Never Give Up', 'Skilled', 'Res', 'lvl1', None),
       ('Parkour Challenge', 'Prepared', 'Phys', 'ready', None), ('Endurance Test', 'Prepared', 'Phys', 'ready_food', None),
       ('Endure Pain', 'Gated', 'Res', 'stays', None), ('Momentum Master', 'Gated', 'Phys', 'mp80', None),
       ('Ultimate Challenge', 'Heroic', 'best', 'place', None), ('Geen Raad', 'Coin', None, None, 'aad'),
       ('Dutch courage', 'Prepared', 'Phys', 'sub', 'jab')]
Q_D = [('Debug System', 'Trained', 'Tech', None, None), ('Quick Thinking', 'Steady', 'Men', None, None),
       ('Calculate Odds', 'Steady', 'Men', None, 'maybe_die'), ('Late Night Questing', 'Steady', 'Tech', None, 'jab'),
       ('Hack Mainframe', 'Skilled', 'Tech', None, None), ('Strategy Puzzle', 'Skilled', 'Men', None, 'discard_die'),
       ('Synergy Mastery', 'Heroic', 'Tech', None, None), ('Build Gadget', 'Prepared', 'Tech', 'ready', None),
       ('Speed Run', 'Prepared', 'Tech', 'ready2', None), ('Master Plan', 'Gated', 'Men', 'three_down', None),
       ('Regelaar', 'Gated', 'Tech', 'more_piecies', 'jab'), ('Perfect Timing', 'Coin', None, 'mp70_80', None),
       ('Cheat code', 'Prepared', 'Men', 'snelle', 'draw')]
Q_A = [('Team Building', 'Trained', 'Soc', None, None), ('Artistic Expression', 'Steady', 'Cre', None, None),
       ('Inspire Crowd', 'Steady', 'Soc', None, None), ('Improvise!', 'Steady', 'Cre', None, 'pay_die'),
       ('Form Alliance', 'Skilled', 'Soc', None, 'ally'), ('Lucky Break', 'Heroic', 'Cre', None, None),
       ('Negotiation', 'Prepared', 'Soc', 'hand_piecie', None), ('Larry Temmen', 'Prepared', 'Soc', 'sub', None),
       ('Parkeren Delft', 'Prepared', 'Cre', 'ready', None), ('Create Masterpiecie', 'Gated', 'Cre', 'three_in_play', None),
       ('Shotje Obby', 'Gated', 'Soc', 'behind', 'jab_leader'), ('Leap of Faith', 'Coin', None, None, None)]
BAND = {'Steady': (1, 4, 25, 15), 'Skilled': (2, 4, 40, 30), 'Heroic': (2, 5, 60, 25), 'Prepared': (1, 4, 50, 30),
        'Gated': (1, 4, 35, 20), 'Coin': (1, 4, 50, 25), 'Trained': (0, 0, 25, 0)}

def p_success(ndice, need, face):
    p = (7 - face) / 6
    # P(at least `need` successes in ndice)
    from math import comb
    return sum(comb(ndice, k) * p**k * (1 - p)**(ndice - k) for k in range(need, ndice + 1))

# ---------------- Game ----------------
class Mos:
    def __init__(s, name, fresh=True):
        d = M[name]; s.name = name; s.d = d; s.level = 1; s.mp = d['mp']; s.side = False; s.skip = False
        s.fresh = fresh; s.pbonus = 0; s.shields = []; s.levelled_turn = -1; s.noquest = False; s.selfcost = 0
    def traits(s):
        t = {}
        for i in range(s.level): t.update(s.d['path'][i])
        return t
    def power(s, g):
        base = s.d['power']
        if 'lowpower10' in g.variant: base = max(10, base - 10)
        elif 'lowpower' in g.variant: base = base - 10
        p = base + 10 * (s.level - 1) + s.pbonus
        pl = g.place[0] if g.place else None
        if not s.fresh and pl:
            if pl == 'The Gym' and s.d['typ'] == 'F': p += 10
            if pl == 'De Box' and s.name in ('Gandoe Wizard', 'Michelle'): p += 10
            if pl == 'Arcade' and s.d['typ'] == 'F': p -= 10
            if pl == 'Skiffa' and s.d['typ'] == 'D': p -= 10
            if pl == 'Bank Chilling': p -= 10
        return max(0, p)
    def prog(s): return (s.level - 1) * 100 + s.mp

class Player:
    def __init__(s, deck, rng):
        s.deckname = deck; d = DECKSET[deck]; cards = list(d['cards']); cards.remove(d['start'])
        rng.shuffle(cards); s.deck = cards; s.hand = []; s.discard = []; s.welloe = []
        s.field = [Mos(d['start'], fresh=False)]; s.slots = []  # [card, ready]
        s.energy = 2; s.stats = Counter()
        for _ in range(3): s.draw(None)
    def draw(s, g):
        if not s.deck:
            if g is None: return
            if not s.discard: return
            s.deck = s.discard; s.discard = []; random.shuffle(s.deck); g.cooldown = True; s.stats['deckouts'] += 1
        s.hand.append(s.deck.pop())

class Game:
    def __init__(s, d1, d2, seed, variant):
        s.rng = random.Random(seed); random.seed(seed); s.variant = variant
        s.p = [Player(d1, s.rng), Player(d2, s.rng)]
        s.stacks = []
        for q in (Q_F, Q_D, Q_A):
            st = list(q); s.rng.shuffle(st); s.stacks.append(st)
        s.open = [[st.pop(0), 0] for st in s.stacks]
        s.place = None; s.turn = 0; s.cooldown = False; s.place_changes = 0
        s.l3_reached = 0; s.log = Counter()
        if 'p2energy' in variant: s.p[1].energy = 3

    def opp(s, i): return s.p[1 - i]

    # --- MP changes ---
    def lose(s, owner, m, amt, src_attack=False, attacker=None):
        if amt <= 0: return
        # shields
        for sh in list(m.shields):
            amt -= sh[0]
            if sh[1] == 'once': m.shields.remove(sh)
        if src_attack and s.place and s.place[0] == 'Zo is Natuur': pass
        # reactive Snelle
        pl = s.p[owner]
        if amt > 0 and amt >= m.mp and len(pl.slots) < 3 and not m.fresh:
            for c in list(pl.hand):
                fx = C[c]['fx']
                if C[c]['kind'] == 'S' and pl.energy >= C[c]['cost'] and ('react' in fx):
                    if fx.get('needphys2') and (not src_attack or m.traits().get('Phys', 0) < 2): continue
                    pl.energy -= C[c]['cost']; pl.hand.remove(c); pl.discard.append(c); pl.stats['snelle'] += 1
                    if c == 'Emergency Healings': s.gain(owner, m, 25)
                    else: amt -= fx['react']
                    if fx.get('rhit'): s.hit_best(owner, 10)
                    break
        if amt <= 0: return
        m.mp -= amt
        if m.mp <= 0: s.getemt(owner, m)

    def getemt(s, owner, m):
        pl = s.p[owner]; pl.stats['getemt'] += 1
        if m.level >= 2:
            m.level -= 1; m.mp = 50
        else:
            if m.side:
                # Not Today!
                for c in pl.hand:
                    if c == 'Not Today!' and pl.energy >= 2 and len(pl.slots) < 3:
                        pl.energy -= 2; pl.hand.remove(c); pl.discard.append(c); m.mp = 5; return
                pl.field.remove(m); pl.welloe.append(m.name); pl.stats['welloe'] += 1
            else:
                m.mp = 0; m.side = True; m.skip = True

    def gain(s, owner, m, amt):
        if amt <= 0: return
        m.mp += amt
        while m.mp >= 100 and m.level < 3:
            m.level += 1; m.mp = 0; m.levelled_turn = s.turn
            s.p[owner].stats['levelups'] += 1
            if m.level == 3: s.l3_reached += 1; s.p[owner].stats['l3'] += 1
        if m.level == 3: m.mp = min(m.mp, 95)

    def hit_best(s, i, amt):
        o = 1 - i; targets = [m for m in s.p[o].field if not m.fresh]
        if not targets: return
        t = max(targets, key=lambda m: (m.level, m.mp <= amt, m.prog()))
        s.lose(o, t, amt)

    # --- Quests ---
    def dice_for(s, i, m, q, extra):
        name, band, trait, req, ex = q
        t = m.traits()
        if trait == 'best': n = max(t.values())
        elif trait is None: n = 1
        else: n = t.get(trait, 0)
        n = max(1, n) + extra
        pl = s.place[0] if (s.place and not m.fresh) else None
        if pl == 'The Gym' and trait == 'Phys': n += 1
        if pl == 'De Box' and trait == 'Phys' and m.name in ('Gandoe Wizard', 'Michelle'): n += 1
        if pl == 'Arcade' and trait == 'Tech': n += 1
        if trait is None: n = 1
        return min(4, n)

    def req_ok(s, i, m, q):
        name, band, trait, req, ex = q; pl = s.p[i]
        if band == 'Trained': return m.traits().get(trait, 0) >= 2
        ready = [c for c, r in pl.slots if r and C[c]['kind'] == 'P']
        if req is None: return True
        if req == 'low30': return True
        if req == 'lvl1': return m.level == 1
        if req == 'ready': return len(ready) >= 1
        if req == 'ready2': return len(ready) >= 2
        if req == 'ready_food': return any(C[c]['tag'] == 'food' for c in ready)
        if req == 'sub': return any(C[c]['tag'] == 'substance' for c in ready + pl.hand)
        if req == 'stays': return any(C[c]['fx'].get('stays') for c, r in pl.slots if r == 'on')
        if req == 'mp80': return m.mp >= 80
        if req == 'mp70_80': return 70 <= m.mp <= 80
        if req == 'place': return s.place is not None
        if req == 'three_down': return len(pl.slots) == 3 and all(r != 'on' for c, r in pl.slots)
        if req == 'three_in_play': return len(pl.slots) == 3
        if req == 'more_piecies': return len(pl.slots) > len(s.opp(i).slots)
        if req == 'snelle': return any(C[c]['kind'] == 'S' for c in pl.hand)
        if req == 'hand_piecie': return any(C[c]['kind'] == 'P' for c in pl.hand)
        if req == 'behind': return sum(x.prog() for x in pl.field) < sum(x.prog() for x in s.opp(i).field)
        return False

    def quest_ev(s, i, m, qi, extra=0):
        q = s.open[qi][0]; name, band, trait, req, ex = q
        if m.noquest or not s.req_ok(i, m, q): return None
        need, face, win, lose = BAND[band]
        if 'questplus' in s.variant: win += 10
        if req in ('ready', 'ready2', 'ready_food', 'sub', 'snelle', 'hand_piecie'): cost_v = 8 if req != 'ready2' else 16
        else: cost_v = 0
        if band == 'Trained': p = 1.0
        else:
            n = s.dice_for(i, m, q, extra + (1 if req == 'low30' and m.mp <= 30 else 0))
            p = p_success(n, need, face)
        if s.place and s.place[0] == 'Quest Haven': win += 10
        if ex == 'aad': lose = 10
        wv = s.value_gain(m, win) + (10 if ex in ('jab', 'jab_leader') else 0)
        lv = s.value_loss(m, lose) if band != 'Trained' else 0
        return p * wv - (1 - p) * lv - cost_v, p

    def value_gain(s, m, amt):
        v = amt
        if m.level < 3 and m.mp + amt >= 100:
            v += 25 if m.level == 1 else 60  # levelling, esp. to L3
        return v

    def value_loss(s, m, amt):
        if amt <= 0: return 0
        if m.mp - amt <= 0:
            if m.level >= 2: return m.mp + 50 + (60 if m.level == 3 else 0)
            return m.mp + (25 if not m.side else 120)
        return amt

    def do_quest(s, i, m, qi, extra):
        slot = s.open[qi]; q = slot[0]; name, band, trait, req, ex = q; pl = s.p[i]
        s.log['quests'] += 1; pl.stats['quests'] += 1
        # pay
        ready = [k for k, (c, r) in enumerate(pl.slots) if r and C[c]['kind'] == 'P']
        def discard_slot(pred):
            for k, (c, r) in enumerate(pl.slots):
                if r and r != 'on' and pred(c):
                    pl.slots.pop(k); pl.discard.append(c); return True
            return False
        if req == 'ready': discard_slot(lambda c: True)
        if req == 'ready2': discard_slot(lambda c: True); discard_slot(lambda c: True)
        if req == 'ready_food': discard_slot(lambda c: C[c]['tag'] == 'food')
        if req == 'sub':
            if not discard_slot(lambda c: C[c]['tag'] == 'substance'):
                c = next(c for c in pl.hand if C[c]['tag'] == 'substance'); pl.hand.remove(c); pl.discard.append(c)
        if req == 'snelle':
            c = next(c for c in pl.hand if C[c]['kind'] == 'S'); pl.hand.remove(c); pl.discard.append(c)
        if req == 'hand_piecie':
            c = next(c for c in pl.hand if C[c]['kind'] == 'P'); pl.hand.remove(c); pl.discard.append(c)
        need, face, win, lose = BAND[band]
        if 'questplus' in s.variant: win += 10
        if band == 'Trained': ok = True
        else:
            n = s.dice_for(i, m, q, extra + (1 if req == 'low30' and m.mp <= 30 else 0))
            rolls = [s.rng.randint(1, 6) for _ in range(n)]
            ok = sum(r >= face for r in rolls) >= need
            if not ok and s.place and s.place[0] == 'Skiffa' and m.d['typ'] == 'A' and not m.fresh:
                rolls.sort(); rolls[0] = s.rng.randint(1, 6); ok = sum(r >= face for r in rolls) >= need
            if not ok:  # Lucky Coin
                for c in pl.hand:
                    if c == 'Lucky Cóin' and pl.energy >= 1 and len(pl.slots) < 3:
                        pl.energy -= 1; pl.hand.remove(c); pl.discard.append(c)
                        rolls = [s.rng.randint(1, 6) for _ in range(n)]; ok = sum(r >= face for r in rolls) >= need; break
        if s.place and s.place[0] == 'Quest Haven': win += 10
        if ok:
            pl.stats['qwin'] += 1; amt = win
            if m.name == 'Michelle': amt = amt * 2 if s.rng.randint(1, 6) >= 4 else (amt // 2) // 5 * 5
            s.gain(i, m, amt)
            if ex in ('jab', 'jab_leader'): s.hit_best(i, 10)
            if ex == 'draw': pl.draw(s)
            if ex == 'ally':
                o = s.opp(i)
                if o.field: s.gain(1 - i, min(o.field, key=lambda x: x.prog()), 10)
            s.replace_quest(qi)
        else:
            if ex == 'aad' and pl.hand:
                c = pl.hand.pop(); pl.discard.append(c); lose = 10
            s.lose(i, m, lose)
            slot[1] += 1
            if slot[1] >= 2: s.replace_quest(qi)

    def replace_quest(s, qi):
        st = s.stacks[qi]; st.append(s.open[qi][0]); s.open[qi] = [st.pop(0), 0]

    # --- Card play ---
    def best_target_own(s, i):
        f = [m for m in s.p[i].field]
        if not f: return None
        l3 = [m for m in f if m.level == 3]
        if l3: return min(l3, key=lambda m: m.mp)
        return max(f, key=lambda m: (m.mp + m.level * 100) if not m.side else -1)

    def activate(s, i, k):
        pl = s.p[i]; c, r = pl.slots[k]; fx = C[c]['fx']; cost = C[c]['cost']
        if s.place and s.place[0] == "Coert's Caravan" and not pl.stats.get('carav_t') == s.turn and any('Coert' in m.name for m in pl.field):
            cost = 0; pl.stats['carav_t'] = s.turn
        pl.energy -= cost; pl.stats['activations'] += 1; pl.stats['energy_spent'] += cost
        t = s.best_target_own(i)
        if fx.get('stays'):
            pl.slots[k] = (c, 'on'); tgt = t
            if tgt: tgt.shields.append((fx['shield'] + (10 if c == 'Bowie & Stormey' and tgt.name in ('Michelle', 'Gandoe Wizard') else 0)
                                       + (10 if c == 'ViannaPoes' and 'Cless' in tgt.name else 0), 'once' if fx.get('once') else 'turn', c))
            pl.stats[('stays_until', c)] = s.turn + 2
            return
        pl.slots.pop(k); pl.discard.append(c)
        if 'heal' in fx and t:
            amt = fx['heal']
            if fx.get('heal_phys3') and t.traits().get('Phys', 0) >= 3: amt = 35
            s.gain(i, t, amt)
        if fx.get('binti'):
            b = [m for m in pl.field if m.name == 'Binti']
            if b: s.gain(i, b[0], 40)
            else: s.hit_best(i, 15)
        elif 'hit' in fx: s.hit_best(i, fx['hit'])
        if fx.get('hitall'):
            for m in list(s.opp(i).field):
                if not m.fresh: s.lose(1 - i, m, 10)
        if fx.get('selfcost') and t: t.selfcost += fx['selfcost']
        if fx.get('gamble') and t:
            if s.rng.randint(1, 6) >= 4: s.gain(i, t, 30)
            else: s.lose(i, t, 15)
        if fx.get('larry') and t:
            r = s.rng.randint(1, 6)
            if r <= 2:
                s.lose(i, t, 25)
                if pl.hand: pl.discard.append(pl.hand.pop())
            elif r <= 4: s.gain(i, t, 20)
            else: s.gain(i, t, 40); pl.draw(s); pl.draw(s)
        if fx.get('opp_heal'):
            o = s.opp(i)
            if o.field: s.gain(1 - i, min(o.field, key=lambda m: m.prog()), 10)
            o.draw(s)
        if fx.get('coert'):
            co = [m for m in pl.field if 'Coert' in m.name]
            if co: s.gain(i, co[0], 10)
        for _ in range(fx.get('draw', 0)): pl.draw(s)
        if fx.get('destroy') and s.place:
            s.destroy_place(i)
        if fx.get('kill'):
            o = s.opp(i); tg = [m for m in o.field if not m.fresh and m.mp <= fx['kill']]
            if tg:
                tgt = max(tg, key=lambda m: m.prog())
                # Not Today!
                if 'Not Today!' in o.hand and o.energy >= 2 and len(o.slots) < 3:
                    o.hand.remove('Not Today!'); o.discard.append('Not Today!'); o.energy -= 2
                else:
                    o.field.remove(tgt); o.welloe.append(tgt.name); o.stats['welloe'] += 1; pl.stats['kills'] += 1
        if fx.get('dice'): pl.stats['dice_t'] = s.turn; pl.stats['dice_n'] = pl.stats.get('dice_n', 0) + 1 if pl.stats.get('dice_tt') == s.turn else 1; pl.stats['dice_tt'] = s.turn
        if fx.get('power'): pl.stats['pending_power'] += fx['power']; pl.stats['pending_steal'] += fx.get('steal', 0)
        if fx.get('sweep'): pl.stats['sweep'] = s.turn

    def destroy_place(s, i):
        owner = s.place[1]; s.p[owner].discard.append(s.place[0]); s.place = None; s.place_changes += 1
        s.p[i].stats['destroys'] += 1
        for m in s.p[i].field:
            if m.name == 'Alyssa Fissa': s.gain(i, m, 20)

    def can_activate(s, i, c):
        pl = s.p[i]; fx = C[c]['fx']
        if C[c]['cost'] > pl.energy and not (s.place and s.place[0] == "Coert's Caravan" and any('Coert' in m.name for m in pl.field) and pl.stats.get('carav_t') != s.turn): return False
        if fx.get('destroy'):
            if not s.place or s.place[1] == i: return False
            if fx.get('need3') and len(pl.field) + len(s.opp(i).field) < 3: return False
            if fx.get('needsub') and not any(d and C[d[-1]]['tag'] == 'substance' for d in (pl.discard, s.opp(i).discard)): return False
        if fx.get('kill') or fx.get('needl2'):
            if not any(m.level >= 2 for m in pl.field): return False
            if fx.get('kill') and not any(not m.fresh and m.mp <= fx['kill'] for m in s.opp(i).field): return False
        if fx.get('digital') and not any(m.d['typ'] == 'D' for m in pl.field): return False
        if fx.get('stays') and not pl.field: return False
        if 'heal' in fx and not fx.get('draw') and pl.field and all(m.level == 3 and m.mp >= 60 for m in pl.field): return False
        if fx.get('power') or fx.get('dice'): return False  # used in the action step
        if c in ('Chain Reaction', 'Redbull'): return False
        if fx.get('hit') and not any(not m.fresh for m in s.opp(i).field) and not fx.get('heal'): return False
        return True

    def turn_of(s, i):
        pl = s.p[i]; o = s.opp(i); s.turn += 1; s.cooldown = False
        # start of turn: win check
        if any(m.level == 3 for m in pl.field): return 'win'
        for m in pl.field: m.fresh = False
        for m in pl.field: m.shields = [sh for sh in m.shields if sh[1] == 'once']
        # stays expire
        pl.slots = [(c, r) for c, r in pl.slots if not (r == 'on' and pl.stats[('stays_until', c)] <= s.turn)]
        for c, r in list(pl.slots): pass
        pl.energy = min(6, pl.energy + 1)
        if not ('p1nodraw' in s.variant and s.turn == 1): pl.draw(s)
        cool = s.cooldown
        if cool: s.log['cooldowns'] += 1
        # ready piecies
        pl.slots = [(c, (r if r == 'on' else True)) for c, r in pl.slots]
        # place turn start
        if s.place:
            pn = s.place[0]
            for m in list(pl.field):
                if m.fresh: continue
                if pn == 'The Gym' and m.d['typ'] != 'F': s.lose(i, m, 10)
                if pn == 'Bank Chilling' and m.traits().get('Soc', 0) >= 2: s.gain(i, m, 10)
        # abilities at start
        for m in list(pl.field):
            if m.d['ability'] == 'chaos':
                r = s.rng.randint(1, 6)
                if r <= 2: s.lose(i, m, 10)
                elif r >= 5: m.pbonus += 10
        if not pl.field and not any(C[c]['kind'] == 'MO' for c in pl.hand + pl.deck + pl.discard): return 'lose'
        if not pl.field and 'emptysummon' in s.variant:
            for src in (pl.hand, pl.deck, pl.discard):
                ms = [c for c in src if C[c]['kind'] == 'MO']
                if ms:
                    c = min(ms, key=lambda x: C[x]['cost']); src.remove(c); pl.field.append(Mos(c)); pl.stats['free_summons'] += 1
                    if src is pl.deck: random.shuffle(pl.deck)
                    break
        # summon
        if not cool:
            while len(pl.field) < 2:
                ms = [c for c in pl.hand if C[c]['kind'] == 'MO' and C[c]['cost'] <= pl.energy]
                if not ms: break
                c = max(ms, key=lambda x: C[x]['cost']); pl.hand.remove(c); pl.energy -= C[c]['cost']
                pl.field.append(Mos(c)); pl.stats['summons'] += 1; pl.stats['energy_spent'] += C[c]['cost']
            # place
            if s.place is None:
                pls = [c for c in pl.hand if C[c]['kind'] == 'PL' and C[c]['cost'] <= pl.energy]
                if pls:
                    c = pls[0]; pl.hand.remove(c); pl.energy -= C[c]['cost']; s.place = (c, i); s.place_changes += 1
                    pl.stats['places'] += 1; pl.stats['energy_spent'] += C[c]['cost']
        # set piecies face-down (keep 1 slot if holding a useful snelle)
        keep = 1 if any(C[c]['kind'] == 'S' for c in pl.hand) else 0
        for c in sorted([c for c in pl.hand if C[c]['kind'] == 'P'], key=lambda c: C[c]['cost']):
            if len(pl.slots) < 3 - keep: pl.hand.remove(c); pl.slots.append((c, False))
        if pl.field and not cool:
            # abilities
            for m in pl.field:
                if m.d['ability'] == 'heal' and ('tukcost' not in s.variant or pl.energy >= 1):
                    if 'tukcost' in s.variant: pl.energy -= 1
                    t = s.best_target_own(i); s.gain(i, t, 20)
                if m.d['ability'] == 'hack' and pl.energy >= 2: pl.energy -= 1; s.gain(i, m, 10)
                if m.d['ability'] == 'extra':
                    for _ in range(2):
                        if pl.energy >= 3 and len(pl.hand) < 6: pl.energy -= 1; pl.draw(s)
            # activate useful ready piecies
            changed = True
            while changed:
                changed = False
                for k, (c, r) in enumerate(pl.slots):
                    if r is True and s.can_activate(i, c):
                        s.activate(i, k); changed = True
                        if c == 'Cless Teacher': pass
                        if any(m.name == 'Cless Teacher' for m in pl.field) and s.rng.randint(1, 6) >= 5: pl.draw(s)
                        break
            # actions per Mosje
            s.actions(i)
        # Ff Haaltje / sleutel unused; end of turn
        for m in list(pl.field):
            if m.selfcost: c = m.selfcost; m.selfcost = 0; s.lose(i, m, c)
            m.pbonus = 0; m.noquest = False
            if m.d['ability'] == 'risk' and m in pl.field:
                r = s.rng.randint(1, 6)
                if r == 1 and pl.hand: pl.discard.append(pl.hand.pop())
                if r == 6: pl.draw(s); pl.draw(s); s.gain(i, m, 10)
        for m in pl.field:
            if m.skip and m.side:
                pass
        # sideways Mosjes that skipped this turn stand up at end of turn
        for m in pl.field:
            if m.side and m.skip_done: m.side = False; m.skip = False
        pl.stats['energy_cap_waste'] += 1 if pl.energy == 6 else 0
        pl.stats['energy_left'] += pl.energy
        pl.stats['turns'] += 1
        pl.stats['pending_power'] = 0; pl.stats['pending_steal'] = 0
        return None

    def actions(s, i):
        pl = s.p[i]; o = s.opp(i)
        ready_power = [k for k, (c, r) in enumerate(pl.slots) if r is True and C[c]['fx'].get('power') and C[c]['cost'] <= pl.energy and (not C[c]['fx'].get('needl2') or any(m.level >= 2 for m in pl.field))]
        ready_dice = [k for k, (c, r) in enumerate(pl.slots) if r is True and C[c]['fx'].get('dice') and C[c]['cost'] <= pl.energy]
        snelle_dice = [c for c in pl.hand if C[c]['fx'].get('dice') and C[c]['kind'] == 'S']
        order = sorted([m for m in pl.field], key=lambda m: -m.prog())
        for m in order:
            if m not in pl.field: continue
            if m.side:
                m.skip_done = True; continue
            m.skip_done = False
            ready_power = [k for k, (c, r) in enumerate(pl.slots) if r is True and C[c]['fx'].get('power') and C[c]['cost'] <= pl.energy and (not C[c]['fx'].get('needl2') or any(x.level >= 2 for x in pl.field))]
            ready_dice = [k for k, (c, r) in enumerate(pl.slots) if r is True and C[c]['fx'].get('dice') and C[c]['cost'] <= pl.energy]
            snelle_dice = [c for c in pl.hand if C[c]['fx'].get('dice') and C[c]['kind'] == 'S']
            # quest options
            extra_av = (1 if ready_dice else 0) + (1 if snelle_dice and len(pl.slots) < 3 else 0)
            best_q = None
            for qi in range(3):
                costly = s.open[qi][0][3] in ('ready', 'ready2', 'ready_food', 'sub', 'snelle', 'hand_piecie', 'three_down', 'three_in_play', 'more_piecies', 'stays')
                for extra in sorted(set([0, 0 if costly else min(1, extra_av)])):
                    r = s.quest_ev(i, m, qi, extra)
                    if r is None: continue
                    ev, p = r
                    ev -= 4 * extra
                    if best_q is None or ev > best_q[0]: best_q = (ev, qi, extra)
            # attack options
            best_a = None
            if not m.fresh and not ('p1noattack' in s.variant and s.turn == 1):
                pw = m.power(s)
                boost = 0; bk = None
                if ready_power:
                    bk = max(ready_power, key=lambda k: C[pl.slots[k][0]]['fx']['power']); boost = C[pl.slots[bk][0]]['fx']['power']
                for t in o.field:
                    if t.fresh: continue
                    if 'sidesafe' in s.variant and t.side: continue
                    if 'levelprot' in s.variant and t.levelled_turn >= s.turn - 1 and t.level >= 2: continue
                    for b in ([0, boost] if boost else [0]):
                        dmg = pw + b
                        if dmg <= 0: continue
                        v = s.value_loss(t, dmg)
                        if t.level == 3: v += 40
                        v += 5 * (t.level - 1)
                        v -= 6 * (b > 0) * C[pl.slots[bk][0]]['cost'] if b else 0
                        if best_a is None or v > best_a[0]: best_a = (v, t, b, bk if b else None)
            qv = best_q[0] if best_q else -99
            av = best_a[0] if best_a else -99
            if max(qv, av) <= 0:
                pl.stats['idle'] += 1; continue
            if av >= qv:
                v, t, b, k = best_a
                if k is not None and k < len(pl.slots):
                    c = pl.slots[k][0]; fx = C[c]['fx']; pl.energy -= C[c]['cost']; pl.slots.pop(k); pl.discard.append(c)
                    pl.stats['energy_spent'] += C[c]['cost']
                    if fx.get('selfcost'): m.selfcost += fx['selfcost']
                    for _ in range(fx.get('draw', 0)): pl.draw(s)
                    ready_power = [kk for kk, (cc, rr) in enumerate(pl.slots) if rr is True and C[cc]['fx'].get('power') and C[cc]['cost'] <= pl.energy]
                    ready_dice = [kk for kk, (cc, rr) in enumerate(pl.slots) if rr is True and C[cc]['fx'].get('dice') and C[cc]['cost'] <= pl.energy]
                dmg = m.power(s) + b
                pl.stats['attacks'] += 1; s.log['attacks'] += 1
                before = t.prog(); s.lose(1 - i, t, dmg, src_attack=True, attacker=m)
                if t.level == 3 or before >= 200: pl.stats['hit_l3'] += 1
            else:
                ev, qi, extra = best_q
                if extra:
                    if ready_dice:
                        k = ready_dice.pop(0); c = pl.slots[k][0]; pl.energy -= C[c]['cost']; pl.slots.pop(k); pl.discard.append(c)
                        ready_power = [kk for kk, (cc, rr) in enumerate(pl.slots) if rr is True and C[cc]['fx'].get('power') and C[cc]['cost'] <= pl.energy]
                        ready_dice = [kk for kk, (cc, rr) in enumerate(pl.slots) if rr is True and C[cc]['fx'].get('dice') and C[cc]['cost'] <= pl.energy]
                    elif snelle_dice and pl.energy >= 1:
                        c = snelle_dice.pop(0); pl.hand.remove(c); pl.discard.append(c); pl.energy -= 1
                    else: extra = 0
                s.do_quest(i, m, qi, extra)

    def play(s, max_turns=60):
        Mos.skip_done = False
        winner = None
        while s.turn < max_turns:
            i = s.turn % 2
            r = s.turn_of(i)
            if r == 'win': winner = i; s.how = 'L3'; break
            if r == 'lose': winner = 1 - i; s.how = 'wipe'; break
            if not s.p[1 - i].field and not any(C[c]['kind'] == 'MO' for c in s.p[1 - i].hand + s.p[1 - i].deck + s.p[1 - i].discard):
                winner = i; s.how = 'wipe'; break
            for pp in s.p:
                if not pp.field: pp.stats['empty_field_turns'] += 1
        return winner

def run(n, variant):
    global DECKSET
    DECKSET = DECKS_V4 if 'v4' in variant else DECKS_V3 if 'v3' in variant else DECKS_V2 if 'v2' in variant else DECKS_V1
    names = list(DECKS)
    res = {}
    allstats = Counter(); rounds = []; seatwins = Counter(); timeouts = 0; l3r = []; plc = []; cool = []
    deckwins = Counter(); deckgames = Counter(); hows = Counter()
    for a in names:
        for b in names:
            w = Counter(); rr = []
            for g_ in range(n):
                g = Game(a, b, hash((a, b, g_, variant)) & 0xffffffff, variant)
                win = g.play()
                rnd = (g.turn + 1) // 2
                hows[getattr(g, 'how', 'timeout')] += 1
                if win is None: timeouts += 1
                else:
                    seatwins[win] += 1; rounds.append(rnd); rr.append(rnd)
                    w[[a, b][win]] += 1
                    if a != b: deckwins[[a, b][win]] += 1
                if a != b: deckgames[a] += 1; deckgames[b] += 1
                l3r.append(g.l3_reached); plc.append(g.place_changes); cool.append(g.log['cooldowns'])
                for p in g.p: allstats.update({k: v for k, v in p.stats.items() if isinstance(v, (int, float)) and not isinstance(k, tuple) and k not in ('carav_t', 'dice_t', 'dice_tt', 'dice_n', 'sweep', 'pending_power', 'pending_steal')})
            res[(a, b)] = (w, statistics.mean(rr) if rr else 0)
    G = n * len(names) ** 2
    print(f'== variant {variant}: {G} games ==')
    print(f'rounds per game (finished): mean {statistics.mean(rounds):.1f}, median {statistics.median(rounds)}, p10 {sorted(rounds)[len(rounds)//10]}, p90 {sorted(rounds)[len(rounds)*9//10]}')
    print(f'timeouts (30 rounds each): {timeouts/G:.1%}')
    print(f'seat 1 wins {seatwins[0]/max(1,sum(seatwins.values())):.1%}')
    print(f'deck win rate (non-mirror, timeouts count as no win): ' + ', '.join(f'{d} {deckwins[d]/deckgames[d]:.1%}' for d in names))
    print(f'how games end: ' + ', '.join(f'{k} {v/G:.0%}' for k, v in hows.items()))
    for (a, b), (w, mr) in res.items():
        print(f'  {a:9s} vs {b:9s}: {a} {w[a]}  {b} {w[b]}  (mean rounds {mr:.1f})' if a != b else f'  {a:9s} mirror: seat-split n/a, mean rounds {mr:.1f}')
    t = allstats
    acts = t['attacks'] + t['quests']
    print(f'per game: attacks {t["attacks"]/G:.1f}, quests {t["quests"]/G:.1f} (attack share {t["attacks"]/acts:.0%}), quest win rate {t["qwin"]/max(1,t["quests"]):.0%}, idle Mosje-turns {t["idle"]/G:.1f}')
    print(f'per game: level-ups {t["levelups"]/G:.1f}, Level 3 reached {sum(l3r)/G:.2f}, getemt {t["getemt"]/G:.1f}, Welloe {t["welloe"]/G:.2f}, kills {t["kills"]/G:.2f}')
    print(f'per game: deck-outs {t["deckouts"]/G:.2f}, cooldown turns {sum(cool)/G:.2f}, places played {t["places"]/G:.2f}, places destroyed {t["destroys"]/G:.2f}, snelle {t["snelle"]/G:.2f}')
    print(f'empty-field player-turns per game {t["empty_field_turns"]/G:.1f}, summons {t["summons"]/G:.1f}')
    print(f'per player-turn: energy left at end {t["energy_left"]/t["turns"]:.1f}, turns ending at 6 Energy {t["energy_cap_waste"]/t["turns"]:.0%}')
    wins_total = sum(seatwins.values())
    print(f'Level 3 holds: {hows["L3"]} L3 wins from {sum(l3r)} Level 3 arrivals = {hows["L3"]/max(1,sum(l3r)):.0%} held')
    print()

if __name__ == '__main__':
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    for v in (sys.argv[2:] or ['base']):
        run(n, v)
