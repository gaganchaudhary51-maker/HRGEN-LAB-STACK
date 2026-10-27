const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const root=process.cwd(), verifier=path.join(root,'validation/LEVEL2_USER_ROLE_RIGHTS_VERIFY.js');
const src=fs.readFileSync('server.js','utf8'), pr=fs.readFileSync('server/platformRoutes.js','utf8');
const checks=[
 ['remove self-escalation guard',src.replace("if(u.id===req.auth.userId)return res.status(403).json({error:'Self role modification is prohibited'});",'')],
 ['remove tenant binding guard',src.replace("if (u && (u.tenantId||'default') !== (s.tenantId||'default')) { sessions.delete(token); return res.status(403).json({ error:'Tenant binding mismatch' }); }",'')],
 ['remove route DENY enforcement',src.replace("if(keys.some(k=>eff.deny.has(k)||eff.deny.has('*'))) return res.status(403).json({error:'Permission explicitly denied',permission:keys.find(k=>eff.deny.has(k)||eff.deny.has('*'))});",'')],
 ['remove role inheritance',src.replace("const parents=Array.isArray(d?.inherits)?d.inherits:[];",'const parents=[];')],
 ['remove live role resolution',src.replace("const u=s.userId ? (DB.users || []).find(x => x.id === s.userId) : null;",'const u=null;')]
];
let fail=0,n=0;
for(const [name,mutated] of checks){n++; const d=fs.mkdtempSync(path.join(os.tmpdir(),'l2mut-')); fs.writeFileSync(path.join(d,'server.js'),mutated); fs.writeFileSync(path.join(d,'server_platform_routes.js'),pr); fs.writeFileSync(path.join(d,'platformRoutes.js'),pr); const r=cp.spawnSync(process.execPath,[verifier],{cwd:d,encoding:'utf8'}); if(r.status!==0) console.log('PASS MUTATION KILLED '+name); else {console.log('FAIL MUTATION SURVIVED '+name); fail++;} fs.rmSync(d,{recursive:true,force:true});}
console.log(`LEVEL2_MUTATION_BREAK_IT ${fail?'FAIL':'PASS'} / ${n} mutations killed`); process.exit(fail?1:0);
