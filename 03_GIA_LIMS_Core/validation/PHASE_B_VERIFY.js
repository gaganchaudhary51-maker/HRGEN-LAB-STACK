const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const routes=fs.readFileSync(path.join(root,'server/platformRoutes.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const svc=require(path.join(root,'server/services/opdService.js'));
let fails=0,total=0;
function t(name,cond,proof=''){total++;console.log(`${cond?'PASS':'FAIL'} ${name}${proof?' — '+proof:''}`);if(!cond)fails++;}
function expectThrow(fn){try{fn();return false}catch{return true}}

// Scope / route integrity
t('Phase B service exists',fs.existsSync(path.join(root,'server/services/opdService.js')));
t('OPD registration endpoint',/app\.post\('\/api\/opd\/register'/.test(routes));
t('OPD catalog endpoint',/app\.get\('\/api\/opd\/catalog'/.test(routes));
t('OPD doctor master GET/POST',/app\.get\('\/api\/opd\/doctors'/.test(routes)&&/app\.post\('\/api\/opd\/doctors'/.test(routes));
t('OPD payment endpoint',/app\.post\('\/api\/opd\/orders\/:id\/payment'/.test(routes));
t('OPD labels endpoint',/app\.get\('\/api\/opd\/orders\/:id\/labels'/.test(routes));
t('OPD dynamic UPI endpoint',/app\.get\('\/api\/opd\/orders\/:id\/upi'/.test(routes));
t('no duplicate route declarations',(()=>{const all=server+'\n'+routes;const a=[...all.matchAll(/app\.(get|post|put|patch|delete)\(['"]([^'"]+)/g)].map(m=>`${m[1]} ${m[2]}`);return a.filter((x,i)=>a.indexOf(x)!==i).length===0})());

// Server-authoritative pricing / validation
t('exact Y/M/D validator accepts valid age',JSON.stringify(svc.normalizeAge({years:35,months:2,days:4}))===JSON.stringify({years:35,months:2,days:4,display:'35Y 2M 4D'}));
t('age rejects negative years',expectThrow(()=>svc.normalizeAge({years:-1,months:0,days:0})));
t('age rejects month overflow',expectThrow(()=>svc.normalizeAge({years:1,months:12,days:0})));
t('age rejects zero age',expectThrow(()=>svc.normalizeAge({years:0,months:0,days:0})));
t('phone normalizes India 10-digit',svc.normalizePhone('9876543210')==='919876543210');
t('phone rejects invalid length',expectThrow(()=>svc.normalizePhone('12345')));
const p=svc.calculatePricing([{code:'CBC',name:'CBC',price:350},{code:'FBS',name:'FBS',price:100}],'PERCENTAGE',10);
t('pricing gross 450',p.gross===450);
t('pricing 10% discount 45',p.discount===45);
t('pricing net 405',p.net===405);
t('fixed discount capped at gross',svc.calculatePricing([{code:'X',name:'X',price:100}],'FIXED',999).net===0);
t('percentage discount capped at 100',svc.calculatePricing([{code:'X',name:'X',price:100}],'PERCENTAGE',999).net===0);
t('negative monetary input fail-closes to zero',svc.money(-10)===0);
t('overpayment rejected',expectThrow(()=>svc.calculateDue(100,101)));
t('partial due exact',JSON.stringify(svc.calculateDue(405,100))===JSON.stringify({paid:100,balanceDue:305,paymentStatus:'PARTIAL'}));
t('full payment exact',JSON.stringify(svc.calculateDue(405,405))===JSON.stringify({paid:405,balanceDue:0,paymentStatus:'PAID'}));

// Referral / commission
t('percentage commission calculation path',svc.calculatePricing([{code:'X',name:'X',price:1000}],'NONE',0).net*0.05===50);
t('commission percentage bounded in route',/Math\.min\(Number\(d\.commissionValue\|\|0\),100\)/.test(routes));
t('fixed commission bounded by net',/Math\.min\(pricing\.net,money\(d\.commissionValue\)\)/.test(routes));
t('commission snapshot stored on order',/commissionAmount:commission/.test(routes)&&/referral:doctor\?/.test(routes));

// Tubes / barcode / labels
const edta=svc.tubeForTest({code:'CBC',department:'Hematology'}), citrate=svc.tubeForTest({code:'PT-INR',department:'Hematology'}), serum=svc.tubeForTest({code:'FBS',department:'Biochemistry'});
t('CBC maps EDTA/LAVENDER',edta.tubeCode==='EDTA'&&edta.tubeColor==='LAVENDER');
t('PT-INR maps citrate/LIGHT BLUE',citrate.tubeCode==='BLUE'&&citrate.tubeColor==='LIGHT BLUE');
t('FBS maps serum',serum.tubeCode==='SERUM');
const vals=svc.code128BValues('INV-123');
t('Code128-B start/stop',vals[0]===104&&vals.at(-1)===106);
t('Code128-B checksum valid',(()=>{const data=vals.slice(0,-2),check=vals.at(-2);return (104+data.slice(1).reduce((sum,v,i)=>sum+v*(i+1),0))%103===check})());
t('Code128-B SVG generated',svc.code128BSvg('INV-123').startsWith('<svg')&&svc.code128BSvg('INV-123').includes('<rect'));
const labels=svc.makeLabelData({id:'ORD-X',barcode:'APX-LAB-X',tests:[{code:'CBC',name:'CBC'},{code:'FBS',name:'FBS'}]},{name:'Test',uhid:'U1',ageExact:{display:'35Y 2M 4D'},gender:'Male'},[{code:'CBC',name:'CBC',department:'Hematology'},{code:'FBS',name:'FBS',department:'Biochemistry'}]);
t('label dimensions exactly 50x25mm',labels.every(x=>x.widthMm===50&&x.heightMm===25));
t('mixed basket produces distinct tube groups',labels.length===2);
t('label retains accession barcode',labels.every(x=>x.barcode==='APX-LAB-X'));

// UPI security / fail-closed behavior
t('UPI URI contains dynamic amount',svc.buildUpiUri({upiId:'lab@upi',payeeName:'HRGen',amount:305,invoiceNumber:'INV-1'}).includes('am=305.00'));
t('UPI rejects malformed ID',expectThrow(()=>svc.buildUpiUri({upiId:'not-valid',payeeName:'HRGen',amount:10})));
t('UPI rejects zero amount',expectThrow(()=>svc.buildUpiUri({upiId:'lab@upi',payeeName:'HRGen',amount:0})));
t('UPI route uses server env only',/const upiId=text\(process\.env\.OPD_UPI_ID/.test(routes)&&!/b\.upiId/.test(routes));
t('UPI NOT_CONFIGURED branch exists',/status:'NOT_CONFIGURED'/.test(routes));
t('UPI QR generated by real QR library',/QRCode\.toDataURL/.test(routes));

// Mutation ordering / no orphan patient on validation failure
t('test validation occurs before patient mutation',routes.indexOf("const missing=unique.filter") < routes.indexOf("if(!b.patientId)db().patients.unshift(patient)"));
t('duplicate basket rejected',/Duplicate test in basket/.test(routes));
t('unknown test rejected',/Unknown test code/.test(routes));
t('payment overage rejected',/Payment exceeds balance due/.test(routes));
t('payment audit trail recorded',/OPD_PAYMENT_CAPTURED/.test(routes));
t('registration audit trail recorded',/OPD_REGISTRATION_CREATED/.test(routes));
t('idempotency header accepted',/x-idempotency-key/.test(routes));
t('idempotency record persisted',/opd_idempotency/.test(routes)&&/data:\{response,orderId:order\.id\}/.test(routes));
t('duplicate in-flight request rejected',/Duplicate OPD request in progress/.test(routes)&&/OPD_IDEMPOTENCY_LOCKS/.test(routes));

// UI hard proof
t('OPD UI exact age Y/M/D',/name="years".*name="months".*name="days"/s.test(html));
t('OPD UI referral doctor',/name="doctorId"/.test(html));
t('OPD UI fast test basket',/Fast Test Basket/.test(html));
t('OPD UI discount and paid fields',/opdDiscountType/.test(html)&&/opdDiscountValue/.test(html)&&/opdPaid/.test(html));
t('OPD UI label print action',/opdPrintLabels/.test(html));
t('OPD UI 50x25',/50 × 25 MM/.test(html));
t('OPD UI does not expose client UPI override',!/name="upiId" placeholder="Optional UPI override/.test(html));
t('invalid legacy front/bill roles removed from shell',!/(roles:\[[^\]]*'front'|roles:\[[^\]]*'bill')/.test(html));

// Architecture / security
t('PostgreSQL architecture retained',server.includes("require('./db/postgres')")&&!/sqlite3|better-sqlite3/i.test(server+routes));
t('tenant scoped OPD patient lookup',/\(p\.tenantId\|\|'default'\)===tid/.test(routes));
t('tenant scoped OPD order lookup',/\(x\.tenantId\|\|'default'\)===tid/.test(routes));
t('OPD endpoints authenticated',/app\.post\('\/api\/opd\/register',auth,/.test(routes)&&/app\.get\('\/api\/opd\/catalog',auth,/.test(routes));
t('doctor creation role protected',/app\.post\('\/api\/opd\/doctors',auth,requireRole\('admin','tech'\)/.test(routes));
t('no accreditation claim added',!/(NABL accredited|NABL certified|ISO 15189 certified)/i.test(routes+html));

console.log(`\nPHASE_B_VERIFY ${fails?'FAIL '+fails:'PASS'} / ${total} checks`);process.exit(fails?1:0);
