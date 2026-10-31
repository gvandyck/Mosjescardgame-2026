const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:640}});
const s=fs.readFileSync('gen/cardback_x2.svg','utf8');
await p.setContent('<body style="margin:0;background:#222;display:flex;gap:10px"><div style="width:440px;height:616px">'+s.replace('<svg ','<svg style="width:100%;height:100%" ')+'</div><div style="width:440px;height:616px;transform:rotate(180deg)">'+s.replace('<svg ','<svg style="width:100%;height:100%" ')+'</div></body>');
await p.waitForTimeout(500);await p.screenshot({path:'qa/final/cb.png'});await b.close();})();
