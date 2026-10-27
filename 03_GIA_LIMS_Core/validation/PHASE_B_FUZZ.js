const svc=require('../server/services/opdService');
let seed=0xB20261006;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;}
let checks=0;
for(let i=0;i<20000;i++){
  const items=Array.from({length:1+Math.floor(rnd()*8)},(_,j)=>({code:'T'+j,name:'T'+j,price:Number((rnd()*5000).toFixed(2))}));
  const gross=items.reduce((s,x)=>s+x.price,0); const type=rnd()<.5?'PERCENTAGE':'FIXED'; const dv=rnd()*500;
  const p=svc.calculatePricing(items,type,dv); checks++;
  if(!Number.isFinite(p.gross)||!Number.isFinite(p.discount)||!Number.isFinite(p.net)||p.gross<0||p.discount<0||p.discount>p.gross||p.net<0||p.net>p.gross) throw new Error('pricing invariant failed at '+i);
  const paid=p.net===0?0:rnd()*p.net; const d=svc.calculateDue(p.net,paid); checks++;
  if(d.balanceDue<0||d.balanceDue>p.net||Math.abs(d.paid+d.balanceDue-p.net)>0.011) throw new Error('due invariant failed at '+i);
}
for(let i=0;i<5000;i++){
  const age={years:Math.floor(rnd()*131),months:Math.floor(rnd()*12),days:Math.floor(rnd()*32)};
  if(age.years===0&&age.months===0&&age.days===0){try{svc.normalizeAge(age);throw new Error('zero age accepted')}catch(e){if(e.message==='zero age accepted')throw e}}
  else {const x=svc.normalizeAge(age);if(x.display!==`${age.years}Y ${age.months}M ${age.days}D`)throw new Error('age invariant failed');}
  checks++;
}
for(let i=0;i<5000;i++){const txt='INV-'+Math.floor(rnd()*1e9);const vals=svc.code128BValues(txt);if(vals[0]!==104||vals.at(-1)!==106||vals.length!==txt.length+3)throw new Error('barcode invariant failed');checks++;}
console.log(`PHASE_B_FUZZ PASS / ${checks} deterministic property checks`);
