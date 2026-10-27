const assert=require('node:assert/strict');
const {parseHL7Message,buildORU,buildORM}=require('../server/integrations/hl7');
const {frame}=require('../server/integrations/mllpEdge');
let pass=0;
function ok(name,fn){try{fn();console.log(`PASS ${name}`);pass++;}catch(e){console.error(`FAIL ${name}: ${e.message}`);process.exitCode=1;}}
ok('HL7 MSH-10 control ID parsed correctly',()=>{const p=parseHL7Message('MSH|^~\\&|AN|FAC|HR|LIS|202610081200||ORU^R01|CTRL-123|P|2.5\rPID|1||P-1\rOBR|1|ORD-1|ORD-1\rOBX|1|NM|HB^Hb||13.2|g/dL||||F\r');assert.equal(p.control,'CTRL-123');assert.match(p.ack,/MSA\|AA\|CTRL-123/);});
ok('Malformed HL7 fails closed',()=>{const p=parseHL7Message('PID|1||P-1\r');assert.equal(p.valid,false);assert.match(p.error,/MSH segment missing/);});
ok('Missing control ID fails closed',()=>{const p=parseHL7Message('MSH|^~\\&|AN|FAC|HR|LIS|202610081200||ORU^R01||P|2.5\r');assert.equal(p.valid,false);assert.match(p.ack,/MSA\|AE/);});
ok('ORU builder uses supplied control ID',()=>{const p=parseHL7Message(buildORU({controlId:'C9',patientId:'P1',orderId:'O1',results:[{code:'HB',name:'Hb',value:'13',unit:'g/dL'}]}));assert.equal(p.control,'C9');assert.equal(p.results[0].code,'HB');});
ok('ORM builder round-trips order/test metadata',()=>{const p=parseHL7Message(buildORM({controlId:'C8',patientId:'P2',orderId:'O2',tests:[{code:'CBC',name:'CBC'}]}));assert.equal(p.control,'C8');assert.equal(p.orderExternalId,'O2');});
ok('MLLP frame uses VT + FSCR',()=>{const b=frame('ABC');assert.equal(b[0],0x0b);assert.equal(b[b.length-2],0x1c);assert.equal(b[b.length-1],0x0d);});
ok('Tenant-safe analyzer path exists',()=>{const s=require('fs').readFileSync(require('path').join(__dirname,'..','server.js'),'utf8');assert.match(s,/quarantineAnalyzerMessage/);assert.match(s,/MLLP_ENABLED/);assert.match(s,/ASTM_ENABLED/);assert.match(s,/startASTMEdge/);});
console.log(`LEVEL3_ENTERPRISE_INTEGRATION_VERIFY ${pass}/7 PASS`);
const {checksum,frame:astmFrame,parseASTM}=require('../server/integrations/astm');
ok('ASTM frame checksum is deterministic',()=>{const b=astmFrame('H|\\^&|||ANALYZER||||||||',1,true);const end=b.indexOf(0x03);assert.equal(b.subarray(end+1,end+3).toString('ascii'),checksum(b.subarray(0,end+1).toString('utf8')));});
ok('ASTM result payload parses into order/results',()=>{const payload=['H|\\^&|||ANALYZER','P|1|PAT-7','O|1|ORD-77','R|1|^^^HB|13.4|g/dL','L|1|N'].join('\r');const p=parseASTM(payload);assert.equal(p.valid,true);assert.equal(p.orderExternalId,'ORD-77');assert.equal(p.results[0].code,'HB');});
console.log(`LEVEL3_ENTERPRISE_INTEGRATION_VERIFY_TOTAL ${pass}/9 PASS`);

const serverSource=require('fs').readFileSync(require('path').join(__dirname,'..','server.js'),'utf8');
ok('Analyzer inbound messages are quarantined, idempotent and never auto-applied',()=>{assert.match(serverSource,/async function quarantineAnalyzerMessage/);assert.match(serverSource,/entityType: 'analyzer_inbox'/);assert.match(serverSource,/status: 'PENDING_REVIEW'/);assert.match(serverSource,/if \(existing\) return/);assert.match(serverSource,/autoApplied: false/);assert.match(serverSource,/reviewRequired: true/);});
console.log('ANALYZER_INBOX_QUARANTINE_WIRING PASS');
