const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const out={};
for(const f of process.argv.slice(2)){const p=await b.newPage({viewport:{width:2800,height:1200}});
await p.goto('file://'+process.cwd()+'/qa/final/'+f+'.html');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const o={};const R=e=>e.getBoundingClientRect();
for(const w of document.querySelectorAll('[data-k]')){if(!w.dataset.k)continue;const els=[...w.querySelectorAll('div')];const iss=[];
 const tb=els.find(e=>e.style.textShadow&&e.style.textShadow.includes('14px')&&e.style.bottom);
 const nameC=els.find(e=>e.style.left&&e.style.right&&e.querySelector('div[style*="flex-direction:column"]')&&e.style.top&&parseFloat(e.style.top)<60);
 if(nameC){const col=nameC.firstElementChild;for(const x of col.children){if(x.scrollWidth>x.clientWidth+1)iss.push('NAME WIDE')}
   if(tb&&R(tb).top<R(col).bottom+6)iss.push('TEXT HITS NAME');}
 o[w.dataset.k]={iss,fs:tb?tb.style.fontSize:null};}
return o;});
out[f]=r;await p.screenshot({path:'qa/final/'+f+'.png',fullPage:true});await p.close();}
console.log(JSON.stringify(out));await b.close();})();
