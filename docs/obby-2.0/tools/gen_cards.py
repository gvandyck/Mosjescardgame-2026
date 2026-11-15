import re,json,sys,unicodedata,subprocess
root=sys.argv[1];d=root+'/docs/obby-2.0/'
wp=open(d+'wording-pass.md',encoding='utf-8').read()
per=open(d+'mosje-personas.md',encoding='utf-8').read()
def norm(x):
    x=re.sub(r'\(.*?\)','',x).replace('*','').replace('"','')
    x=unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode()
    return re.sub(r'\s+',' ',x).strip().lower()
# data names
js=subprocess.run(['node','-e',"""
const r=process.argv[1];const out={};
for(const f of ['piecies','snellePiecies','places','mosjes']){const m=await import(r+'/src/data/'+f+'.js');out[f]=Object.values(m).flat().filter(x=>x&&x.name).map(x=>({name:x.name,id:x.id,disabled:!!x.disabled}))}
console.log(JSON.stringify(out))
""",root],capture_output=True,text=True,check=False)
if js.returncode!=0:
    js=subprocess.run(['node','--input-type=module','-e',"""
const r=process.argv[1];const out={};
for(const f of ['piecies','snellePiecies','places','mosjes']){const m=await import(r+'/src/data/'+f+'.js');out[f]=Object.values(m).flat().filter(x=>x&&x.name).map(x=>({name:x.name,id:x.id,disabled:!!x.disabled}))}
console.log(JSON.stringify(out))
""",root],capture_output=True,text=True,check=True)
data=json.loads(js.stdout)
byname={norm(c['name']):c for f in data.values() for c in f}
alias={"Gym":"The Gym","Late Night Döner":"Broodje Döner","Ctrl+S":"Momentum Boost","Spiegelen":"Nature's Gift","Kladje":"Shoettoe","Aansteker":"Momentum Rush","Oh nee toch niet":"Emergency Healings","Gekke Dobbel":"Loaded Dice","In De Groove":"Perfect Rhythm","Harken maar":"Momentum Diefje","Track Highscore":"F1 Telemetry Data","Touwtjespringen":"Skipping Rope","Nog Niet Klaar":"Not Today!","Dooie Boel":"The Void","Welloe Plekka":"Welloe Graveyard","Bed Chillings":"Momentum Stabilizer","Pre-order Market":"Digital Gaming Stop","Rebouleh":"Redbull"}
def datafor(name):
    n=norm(name)
    if n in byname: return byname[n]
    base=re.sub(r'\s*\(.*?\)','',name).strip()
    if base in alias and norm(alias[base]) in byname: return byname[norm(alias[base])]
    return None
cards=[];mosjes={};pqs=[]
sec=None;skip=('Balance round','Parked ideas','Booster skim')
for l in wp.split('\n'):
    if l.startswith('#'): sec=l.lstrip('# ').strip();continue
    if not l.startswith('| ') or l.startswith('|---') or not sec or any(s in sec for s in skip): continue
    c=[x.strip() for x in l.strip().strip('|').split('|')]
    if c[0] in('Card','Place','Mosje','Personal Quest','Idea','#','Doc'): continue
    if 'Mosje abilities' in sec:
        mosjes[norm(c[0])]={'name':re.sub(r'\s*\(.*?\)','',c[0]).strip(),'ability':c[1],'templates':c[2],'set':'starter' if 'starter' in sec else 'booster'};continue
    if 'Personal Quests' in sec:
        m=re.match(r'(★+) · (.*)',c[1])
        pqs.append({'name':re.sub(r'\s*\(NEW\)','',c[0]).strip(),'rarity':len(m.group(1)),'mosje':m.group(2),'text':c[2],'isNew':'(NEW)' in c[0],'set':'starter' if 'starter' in sec else 'booster'});continue
    if len(c)<4 or sec in('Open rulings',) or 'Deck list' in sec or 'Rulebook' in sec: continue
    meta=c[1];name=c[0]
    kind='place' if ('Place' in meta or 'Booster Places' in sec) else 'snelle' if ('Snelle' in meta or 'Booster Snelle' in sec) else 'piecie'
    parts=[p.strip() for p in meta.split('·')]
    sub=parts[0] if kind=='piecie' else None
    if sub and '(' in sub: sub=sub.split('(')[0].strip()
    stars=[p for p in parts if set(p)=={'★'}]
    cost=[p for p in parts if re.fullmatch(r'\d',p)]
    rest=[p for p in parts if p not in stars and p not in cost and p not in(sub,'Place','Snelle','chase') and not p.startswith('trick (was')]
    df=datafor(name)
    cards.append({'name':re.sub(r'\s*\((NEW|placeholder name|was [^)]*|NEW, was [^)]*|draft ability)\)','',name).strip(),
      'kind':kind,'subtype':sub,'rarity':len(stars[0]) if stars else None,'cost':int(cost[0]) if cost else None,
      'kit':' · '.join(r.replace('kit: ','') for r in rest) or None,'text':c[2],'templates':c[3] if len(c)>3 else '',
      'isNew':df is None,'dataName':df['name'] if df else None,'dataId':df.get('id') if df else None,
      'starter':not sec.startswith('Booster'),'chase':'chase' in meta})
# mosje stats from personas
power={'bruiser':'20/25/30','physical':'10/20/25','digital':'5/10/15','digital-physical':'10/15/20','creative':'5/10/15','creative-physical':'10/15/20'}
tier={'jeffrey, the strongman':'bruiser','gandoe, the destroyer':'bruiser','alyssa, the bulldozer':'bruiser','gandoe, the cloude wizard':'digital-physical','fps coert':'digital-physical','fps west':'digital-physical','jeffrey, the silent gambler':'creative-physical'}
retyped={'ronald, the master chef','martin, senor west','coert, kasteluck'}
for blk in re.split(r'\n### ',per)[1:]:
    head=blk.split('\n')[0]
    if 'archived' in head: continue
    n=norm(head.split('·')[0]);typ=head.split('·')[-1].strip()
    if n not in mosjes: continue
    st=re.search(r'\*\*Stats:\*\* cost (\d) · start MP (\d+)',blk);tr=re.search(r'\*\*Traits:\*\*(.*)',blk)
    m=mosjes[n];m.update({'type':typ,'cost':int(st.group(1)),'startMP':int(st.group(2)),'traits':[x.strip() for x in tr.group(1).split('→')]})
    t=tier.get(n,typ.lower());m['power']=power[t];m['powerProposed']=n in retyped
    df=byname.get(n);m['dataName']=df['name'] if df else None;m['dataId']=df.get('id') if df else None
fc=mosjes.get('flightsim coert')
if fc: fc.update({'type':'Digital','cost':3,'startMP':10,'traits':['LV1 Tech ★★ · Men ★★','LV2 Tech ★★ · Men ★★★','LV3 Tech ★★★ · Men ★★★'],'power':power['digital'],'powerProposed':True,'dataName':None,'dataId':None,'isNew':True})
for p in pqs:
    k=norm(p['mosje']);p['type']=mosjes.get(k,{}).get('type')
archived=[c['name'] for f in ('piecies','snellePiecies','places') for c in data[f] if not any(x['dataName']==c['name'] for x in cards)]
out={'generated':'from docs/obby-2.0/wording-pass.md and mosje-personas.md','mosjes':list(mosjes.values()),'personalQuests':pqs,'cards':cards,'dataCardsWithoutText':archived}
json.dump(out,open(d+'handover/cards.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
# markdown
L=['# Obby Card Game 2.0 — Card List (generated 15 Nov 2026)','','Generated by `tools/gen_cards.py` from `wording-pass.md` and `mosje-personas.md`. **Do not edit by hand**; change the wording pass and regenerate. The same data is in `cards.json`.','']
L.append(f"**Count:** {len(mosjes)} Mosjes · {len(pqs)} Personal Quests · {sum(c['kind']=='piecie' for c in cards)} Piecies · {sum(c['kind']=='snelle' for c in cards)} Snelle · {sum(c['kind']=='place' for c in cards)} Places = **{len(mosjes)+len(pqs)+len(cards)} cards**. The 38 general Quests are not in this list (see the handoff).");L.append('')
L+=['## Mosjes','','Every Mosje is ★★★★ (Gandoe, The Destroyer ★★★★★). Power follows the Power curve of 1 Nov; `(p)` = proposed, because that Mosje changed type after the curve was ruled or is new.','','| Mosje | Type | Set | Cost | Start MP | Power LV1/2/3 | Traits LV1 → LV2 → LV3 | Ability |','|---|---|---|---|---|---|---|---|']
order={'Physical':0,'Digital':1,'Creative':2}
for m in sorted(mosjes.values(),key=lambda m:(order.get(m.get('type'),9),m['set']!='starter',m['name'])):
    L.append(f"| {m['name']} | {m.get('type','?')} | {m['set']} | {m.get('cost','?')} | {m.get('startMP','?')} | {m.get('power','?')}{' (p)' if m.get('powerProposed') else ''} | {' → '.join(m.get('traits',['?']))} | {m['ability']} |")
L+=['','## Personal Quests','','| Personal Quest | Type | ★ | Set | Made for | Text |','|---|---|---|---|---|---|']
for p in sorted(pqs,key=lambda p:(order.get(p['type'],9),p['set']!='starter',p['name'])): L.append(f"| {p['name']} | {p['type']} | {'★'*p['rarity']} | {p['set']} | {p['mosje']} | {p['text']} |")
def tab(title,rows):
    L.extend(['',f'## {title}','','| Card | Subtype | ★ | Cost | Set | Kit | Text | Templates | In data as |','|---|---|---|---|---|---|---|---|---|'])
    for c in sorted(rows,key=lambda c:(c['subtype'] or '',not c['starter'],c['name'])):
        L.append(f"| {c['name']} | {c['subtype'] or '—'} | {'★'*c['rarity'] if c['rarity'] else 'tbd'} | {c['cost'] if c['cost'] is not None else 'tbd'} | {'starter' if c['starter'] else 'booster'} | {c['kit'] or '—'} | {c['text']} | {c['templates']} | {c['dataName'] if c['dataName'] else 'NEW'} |")
tab('Piecies',[c for c in cards if c['kind']=='piecie']);tab('Snelle',[c for c in cards if c['kind']=='snelle']);tab('Places',[c for c in cards if c['kind']=='place'])
L+=['','## Cards in `src/data` with no 2.0 text (archived or replaced)','',' · '.join(archived),'']
open(d+'handover/card-list.md','w',encoding='utf-8').write('\n'.join(L))
print(len(mosjes),len(pqs),len(cards),{k:sum(c['kind']==k for c in cards) for k in('piecie','snelle','place')})
print('no rarity',[c['name'] for c in cards if not c['rarity']]);print('no cost',[c['name'] for c in cards if c['cost'] is None])
print('new',sum(c['isNew'] for c in cards),'mosjes missing stats',[m['name'] for m in mosjes.values() if 'cost' not in m])
print('archived',len(archived),archived)
names=[c['name'] for c in cards];print('dupes',sorted({n for n in names if names.count(n)>1}))
