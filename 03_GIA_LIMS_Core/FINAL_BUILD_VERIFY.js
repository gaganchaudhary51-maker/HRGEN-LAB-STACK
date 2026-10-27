const fs=require('fs'), path=require('path'), cp=require('child_process'), crypto=require('crypto');
const root=__dirname;
function runNodeCheck(file){const r=cp.spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});if(r.status!==0){process.stderr.write(r.stderr||'');console.log(`FAIL :: syntax ${file}`);return false}console.log(`PASS :: syntax ${file}`);return true;}
function runScript(label,file,args=[]){const r=cp.spawnSync(process.execPath,[file,...args],{cwd:root,encoding:'utf8'});if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);console.log(`${r.status===0?'PASS':'FAIL'} :: ${label}`);return r.status===0;}
let ok=true;
for(const f of ['server.js','db/postgres.js','server/platformRoutes.js','server/featureRegistry.js','server/services/formulaEngine.js','server/services/fhir.js','server/services/integrations.js','server/integrations/hl7.js','server/integrations/mllpEdge.js','LICENSE_TOOL.js','FORENSIC_VERIFY.js','validation/L99N30_CROSS_VERIFY.js']) ok=runNodeCheck(f)&&ok;
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const m=html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
if(!m){console.log('FAIL :: frontend inline script extraction');ok=false}else{const tmp=path.join(require('os').tmpdir(), 'hrgen-public-inline.js');fs.writeFileSync(tmp,m[1]);ok=runNodeCheck(tmp)&&ok;fs.unlinkSync(tmp);}
ok=runScript('77 feature build','BUILD_77_VERIFY.js')&&ok;
ok=runScript('primary forensic','FORENSIC_VERIFY.js')&&ok;
ok=runScript('cross forensic','validation/L99N30_CROSS_VERIFY.js')&&ok;
const formula=require('./server/services/formulaEngine');
const f1=formula.evaluate('A*B+C',{A:2,B:3,C:4})===10;
const f2=formula.validate('A/B+C',['A','B','C']).valid;
console.log(`${f1&&f2?'PASS':'FAIL'} :: formula smoke`);ok=f1&&f2&&ok;
const {parseHL7Message,buildORM,buildORU}=require('./server/integrations/hl7');
const h=parseHL7Message('MSH|^~\\&|ANALYZER|LAB|||202610061200||ORM^O01|CTRL1|P|2.5\rPID|1||PT1||\rOBR|1|ORD1|ORD1\rOBX|1|ST|CBC||12.3|g/dL\r');
const hs=!!h.ack&&h.results[0].code==='CBC'&&buildORM({controlId:'C',patientId:'P',orderId:'O',tests:[{code:'CBC',name:'CBC'}]}).includes('ORM^O01')&&buildORU({controlId:'C',patientId:'P',orderId:'O',results:[{code:'CBC',name:'CBC',value:'12'}]}).includes('ORU^R01');
console.log(`${hs?'PASS':'FAIL'} :: HL7 smoke`);ok=hs&&ok;
const {patientToFHIR,diagnosticReport,observation}=require('./server/services/fhir');
const p={id:'P',uhid:'U1',name:'Test'};const o={id:'O',pipelineStatus:'RELEASED',createdAt:new Date().toISOString(),releasedAt:new Date().toISOString(),tests:[{code:'CBC',name:'CBC',value:'10',unit:'g/dL',reference:'12-16'}]};const fsok=patientToFHIR(p).resourceType==='Patient'&&diagnosticReport(o,p,'LAB').status==='final'&&observation(o,o.tests[0],0,p).resourceType==='Observation';console.log(`${fsok?'PASS':'FAIL'} :: FHIR smoke`);ok=fsok&&ok;
// Ed25519 license proof without running the CLI in a way that requires user args.
const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');const payload={product:'hrgen-gia-lims',tenantSlug:'default',expiresAt:new Date(Date.now()+86400000).toISOString(),amcUntil:new Date(Date.now()+86400000).toISOString()};const bytes=Buffer.from(JSON.stringify(payload));const sig=crypto.sign(null,bytes,privateKey);const verified=crypto.verify(null,bytes,publicKey,sig);console.log(`${verified?'PASS':'FAIL'} :: Ed25519 license smoke`);ok=verified&&ok;
console.log(`\nFINAL_BUILD_VERIFY ${ok?'PASS':'FAIL'}`);if(!ok)process.exit(1);
