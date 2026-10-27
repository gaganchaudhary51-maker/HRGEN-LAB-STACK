const fs=require('fs');
const s=fs.readFileSync('server/platformRoutes.js','utf8');
const checks=[
 ['HL7 ORM tenant scoped', /app\.get\('\/api\/hl7\/orm\/\:orderId',[\s\S]{0,500}tenantOf\(req\)/],
 ['HL7 ORU tenant scoped', /app\.get\('\/api\/hl7\/oru\/\:orderId',[\s\S]{0,500}tenantOf\(req\)/],
 ['AI summary tenant scoped', /app\.post\('\/api\/ai\/report-summary',[\s\S]{0,900}tenantOf\(req\)/],
 ['Portal orders tenant scoped', /app\.get\('\/api\/portal\/me\/orders',[\s\S]{0,1300}tenantId\|\|'default'\)===tid/],
 ['AI copilot evaluate tenant scoped', /app\.post\('\/api\/ai\/copilot\/evaluate',[\s\S]{0,400}tenantId\|\|'default'\)===tid/],
 ['WhatsApp webhook tenant scoped', /app\.post\('\/api\/whatsapp\/webhook',[\s\S]{0,600}tenantId\|\|'default'\)===tid/],
 ['Batch validate normal tenant scoped', /app\.post\('\/api\/orders\/batch-validate-normal',[\s\S]{0,400}tenantId\|\|'default'\)===tid/],
 ['Simulate analyzer tenant scoped', /app\.post\('\/api\/integrations\/simulate-analyzer',[\s\S]{0,500}tenantId\|\|'default'\)===tid/]
];
let n=0;for(const [name,re] of checks){if(!re.test(s))throw new Error('FAIL '+name);console.log('PASS '+name);n++;}
console.log(`DEEP_FORENSIC_TENANT_LEAK_TEST PASS / ${n}`);
