const fs=require('fs');
const s=fs.readFileSync('server/platformRoutes.js','utf8');
const muts=[
 ['HL7 ORM tenant gate', "const o=db().orders.find(x=>x.id===req.params.orderId&&(x.tenantId||'default')===tenantOf(req))"],
 ['HL7 ORU tenant gate', "const o=db().orders.find(x=>x.id===req.params.orderId&&(x.tenantId||'default')===tenantOf(req))"],
 ['AI tenant gate', "const D=db(),tid=tenantOf(req),o=D.orders.find(x=>x.id===text(req.body?.orderId,80)&&(x.tenantId||'default')===tid)"],
 ['Portal tenant gate', "o.patientId===sess.data.patientId&&(o.tenantId||'default')===tid"]
];
let n=0;for(const [name,needle] of muts){if(!s.includes(needle))throw new Error('MUTATION BASE MISSING '+name);const mutated=s.split(needle).join(needle.replace(/&&\(x\.tenantId\|\|'default'\)===tenantOf\(req\)|&&\(x\.tenantId\|\|'default'\)===tid|&&\(o\.tenantId\|\|'default'\)===tid/g,''));if(mutated===s)throw new Error('MUTATION NOT APPLIED '+name);console.log('KILLABLE '+name);n++}
console.log(`DEEP_FORENSIC_MUTATION PRECHECK PASS / ${n}`)
