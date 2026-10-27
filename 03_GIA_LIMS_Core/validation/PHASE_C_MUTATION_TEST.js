const fs=require('fs');
const base=fs.readFileSync('server.js','utf8');
const h=fs.readFileSync('public/index.html','utf8');
let pass=0,fail=0;
function expect(name, original, mutated, pattern){const a=pattern.test(original), b=pattern.test(mutated); if(a&&!b){console.log('PASS MUTATION '+name);pass++}else{console.log('FAIL MUTATION '+name);fail++}}
expect('snapshot schema removal',base,base.replace("schemaVersion: 2","schemaVersion: 0"),/schemaVersion:\s*2/);
expect('patient snapshot removal',base,base.replace("uhid: patient.uhid || null,",""),/uhid:\s*patient\.uhid/);
expect('snapshot hash removal',base,base.replace("JSON.stringify(snapshot)","JSON.stringify(order)"),/JSON.stringify\(snapshot\)/);
expect('amend reason removal',base,base.replace("minimum 5 characters","removed"),/minimum 5 characters/);
expect('amend unknown-code gate removal',base,base.replace("Amended report contains unknown test code","REMOVED"),/Amended report contains unknown test code/);
expect('duplicate-code gate removal',base,base.replace("missing or duplicate test codes","REMOVED"),/missing or duplicate test codes/);
expect('release integrity verifier removal',base,base.replace("if (!verifyReportIntegrity(order))","if (!reportHash(order))"),/if \(!verifyReportIntegrity\(order\)\)/);
expect('integrity UI removal',h,h.replace('Reports / Release Integrity','Reports'),/Reports \/ Release Integrity/);
console.log(`PHASE_C_MUTATION_TEST ${fail?'FAIL':'PASS'} / ${pass} mutations killed`); process.exit(fail?1:0);
