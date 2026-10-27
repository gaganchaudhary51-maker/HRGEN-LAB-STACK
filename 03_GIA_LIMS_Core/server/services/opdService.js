const crypto = require('crypto');

function money(v){
  const n=Number(v);
  return Number.isFinite(n) && n>=0 ? Number(n.toFixed(2)) : 0;
}
function normalizeAge(input={}){
  const y=Number(input.years??input.ageYears??0);
  const m=Number(input.months??input.ageMonths??0);
  const d=Number(input.days??input.ageDays??0);
  if(!Number.isInteger(y)||!Number.isInteger(m)||!Number.isInteger(d)||y<0||y>130||m<0||m>11||d<0||d>31) throw new Error('Age must be exact Y/M/D: years 0-130, months 0-11, days 0-31');
  if(y===0&&m===0&&d===0) throw new Error('Exact age cannot be 0Y 0M 0D');
  return {years:y,months:m,days:d,display:`${y}Y ${m}M ${d}D`};
}
function calculatePricing(items, discountType='NONE', discountValue=0){
  const lines=items.map((x)=>({code:String(x.code).trim().toUpperCase(),name:String(x.name||''),qty:Math.max(1,Number(x.qty||1)),unitPrice:money(x.price)}));
  const gross=money(lines.reduce((s,x)=>s+x.unitPrice*x.qty,0));
  const dv=money(discountValue);
  const type=String(discountType||'NONE').toUpperCase();
  let discount=0;
  if(type==='PERCENTAGE') discount=money(Math.min(gross,gross*Math.min(dv,100)/100));
  else if(type==='FIXED') discount=money(Math.min(gross,dv));
  const net=money(gross-discount);
  return {lines,gross,discount,discountType:type,discountValue:dv,net};
}
function calculateDue(net, paid){
  const p=money(paid); if(p>net) throw new Error('Payment exceeds net payable');
  return {paid:p,balanceDue:money(net-p),paymentStatus:p===0?'UNPAID':p<net?'PARTIAL':'PAID'};
}
function normalizePhone(phone){
  const raw=String(phone||'').replace(/\D/g,'');
  if(raw.length===10) return `91${raw}`;
  if(raw.length===12 && raw.startsWith('91')) return raw;
  throw new Error('Valid 10-digit Indian mobile number required');
}
function buildUpiUri({upiId,payeeName,amount,invoiceNumber,note}){
  if(!/^[A-Za-z0-9._-]{2,100}@[A-Za-z0-9.-]{2,100}$/.test(String(upiId||''))) throw new Error('Valid UPI ID required');
  const am=money(amount); if(am<=0) throw new Error('UPI amount must be positive');
  const p=new URLSearchParams({pa:String(upiId),pn:String(payeeName||'HRGen Laboratory'),am:am.toFixed(2),cu:'INR',tn:String(note||invoiceNumber||'LAB PAYMENT').slice(0,80)});
  return `upi://pay?${p.toString()}`;
}
function tubeForTest(test){
  const dept=String(test.department||'').toLowerCase(), name=String(test.name||'').toLowerCase(), code=String(test.code||'').toUpperCase();
  if(code.includes('PT')||code.includes('INR')||name.includes('prothrombin')||name.includes('coag')) return {sampleType:'CITRATED PLASMA',tubeColor:'LIGHT BLUE',tubeCode:'BLUE'};
  if(dept.includes('hemat')||['CBC','HB','WBC','PLT','PCV','MCV','MCH','MCHC','DLC','ESR'].includes(code)) return {sampleType:'EDTA WHOLE BLOOD',tubeColor:'LAVENDER',tubeCode:'EDTA'};
  if(dept.includes('microbiology')||name.includes('culture')) return {sampleType:'MICROBIOLOGY',tubeColor:'STERILE',tubeCode:'STERILE'};
  if(dept.includes('serology')||dept.includes('immun')) return {sampleType:'SERUM',tubeColor:'RED/GOLD',tubeCode:'SERUM'};
  if(code.match(/^(GLU|FBS|PPBS|RBS|GTT|PP2H|GLUCOSE)/)
     || name.includes('glucose') || name.includes('fasting blood sugar') || name.includes('postprandial')
     || name.includes('random blood sugar') || code==='SUGAR')
    return {sampleType:'FLUORIDE PLASMA',tubeColor:'GREY',tubeCode:'GREY'};
  if(code.match(/^(HBA1C|A1C|GLYCO|HAEMOGLOBIN_A1C)/) || name.includes('hba1c') || name.includes('glycated haemoglobin') || name.includes('glycated hemoglobin'))
    return {sampleType:'EDTA WHOLE BLOOD',tubeColor:'LAVENDER',tubeCode:'EDTA'};
  if(dept.includes('urine')||code.startsWith('URN')||code.startsWith('URINE')||code==='UA'||name.includes('urine')||name.includes('urinalysis'))
    return {sampleType:'URINE',tubeColor:'YELLOW (URINE CONTAINER)',tubeCode:'URINE'};
  return {sampleType:'SERUM',tubeColor:'RED/GOLD',tubeCode:'SERUM'};

}
function makeLabelData(order,patient,catalog){
  const grouped=new Map();
  for(const t of order.tests||[]){
    const c=catalog.find(x=>x.code===String(t.code).toUpperCase())||{};
    const tube=tubeForTest({...c,...t});
    const key=tube.tubeCode;
    if(!grouped.has(key)) grouped.set(key,{...tube,testCodes:[],testNames:[]});
    const g=grouped.get(key);g.testCodes.push(t.code);g.testNames.push(t.name);
  }
  return [...grouped.values()].map((g,i)=>({
    labelId:`LBL-${order.id}-${i+1}`,
    widthMm:50,heightMm:25,
    barcode:order.barcode,
    patientName:patient?.name||'',uhid:patient?.uhid||'',
    age:patient?.ageExact?.display||`${patient?.age||''} ${patient?.ageUnit||''}`.trim(),gender:patient?.gender||'',
    tubeCode:g.tubeCode,tubeColor:g.tubeColor,sampleType:g.sampleType,
    testCodes:g.testCodes,testNames:g.testNames,printedAt:new Date().toISOString()
  }));
}

// Code 128-B encoder: deterministic, printable, self-checking checksum.
const CODE128_B_START=104;
const CODE128_PATTERNS=[
'212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'
];
function code128BValues(text){
  const s=String(text||''); if(!s||s.length>80) throw new Error('Barcode text length 1-80 required');
  const vals=[CODE128_B_START];
  for(const ch of s){const c=ch.charCodeAt(0);if(c<32||c>126)throw new Error('Code128-B supports ASCII 32-126');vals.push(c-32)}
  const checksum=(CODE128_B_START+vals.slice(1).reduce((sum,v,i)=>sum+v*(i+1),0))%103; vals.push(checksum,106); return vals;
}
function code128BModuleString(text){return code128BValues(text).map(v=>CODE128_PATTERNS[v]).join('');}
module.exports={money,normalizeAge,calculatePricing,calculateDue,normalizePhone,buildUpiUri,tubeForTest,makeLabelData,code128BValues,code128BModuleString};
function code128BSvg(text){
  const modules=code128BModuleString(text); const scale=1.35,height=34,quiet=8;
  let x=quiet, rects='';
  for(const bit of modules){if(bit==='1')rects+=`<rect x="${x.toFixed(2)}" y="0" width="${scale}" height="${height}"/>`;x+=scale;}
  const width=x+quiet;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(2)}" height="${height}" viewBox="0 0 ${width.toFixed(2)} ${height}" role="img" aria-label="Code128 ${String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;')}"><rect width="100%" height="100%" fill="white"/>${rects}</svg>`;
}
module.exports.code128BSvg=code128BSvg;
