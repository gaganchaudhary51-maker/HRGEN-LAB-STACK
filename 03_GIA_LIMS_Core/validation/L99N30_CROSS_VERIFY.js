const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(root+'/'+p,'utf8');
const s=read('server.js'), h=read('public/index.html'), db=read('db/postgres.js'), c=read('docker-compose.yml');
const checks=[
 ['duplicate legacy QC route removed', !s.includes("/api/orders/:id/qc-approve")],
 ['canonical QC evaluate route present', s.includes("/api/qc/evaluate")],
 ['canonical QC approve route present', s.includes("/api/qc/approve/:orderId")],
 ['catalog GET protected and tenant filtered', /app.get\('\/api\/catalog', auth/.test(s) && /DB.testCatalog.filter/.test(s) && /tenantOf\(req\)/.test(s)],
 ['signoff UI sends re-auth password', /signoff[^\n]*body:\s*JSON\.stringify\(\{password\}/.test(h)],
 ['structured result-entry UI preserves each catalog test code', /tests\.map\(\(t,i\)=>`<tr><td><b>\$\{esc\(t\.code\)\}<\/b>/.test(h) && /code:t\.code|\.\.\.\.t,value/.test(h)],
 ['fake billing fallback removed', !h.includes('const gross = p.gross || 500')],
 ['fake history date removed', !h.includes('Date.now() - 86400000')],
 ['offline sync claim removed', !h.includes('PWA Online (Sync Active)')],
 ['misleading accreditation badge removed', !h.includes('ISO 15189:2022 controls')],
 ['production reference catalog seeding disabled', /NODE_ENV !== 'production'\?SEED_DATABASE\.testCatalog:\[\]/.test(s)],
 ['backup persistent volume present', c.includes('/app/data/backups') && c.includes('hrgen_backupdata')],
 ['audit append-only trigger defined', db.includes('prevent_audit_ledger_mutation') && db.includes('trg_audit_ledger_immutable')],
 ['report version uniqueness protected', db.includes('uq_report_versions_order_version')],
 ['whole-database rewrite removed from normal persistence', db.includes('async function persistState(DB, options = {})') && db.includes('if (options.replace === true)') && db.includes('pg_advisory_xact_lock') && (db.match(/TRUNCATE TABLE tenants CASCADE/g)||[]).length === 1],
 ['transaction serialized', db.includes('pg_advisory_xact_lock')],
 ['postgres-only adapter', s.includes("require('./db/postgres')") && !s.includes('sqlite')],
 ['browser patient/report localStorage absent', !/localStorage\.(setItem|getItem)/i.test(h)],
 ['math random hash absent', !/Math\.random\(\).*SHA/i.test(h)],
 ['static test tooling retained', read('package.json').includes('vitest run') && read('package.json').includes('playwright test')],
 ['cross-forensic matrix has 77 rows', (read('validation/FEATURE_FORENSIC_MATRIX.md').match(/^\| \d+ \|/gm)||[]).length===77],
 ['audit ordering deterministic', db.includes('audit_seq') && db.includes('ORDER BY audit_seq DESC')],
 ['released delta mutation blocked', s.includes('requirePreReleaseMutation') && s.includes("'/api/orders/:id/delta-check'")],
 ['released critical mutation blocked', s.includes('requirePreReleaseMutation') && s.includes("'/api/orders/:id/critical-communication'")],
 ['placeholder patient data removed', !/Sunil Kumar Verma|Dr\. A\. K\. Gupta|APX-LAB-992147/.test(h)]
];
let failed=0; for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)failed++;} if(failed)process.exit(1);console.log(`\nL99N30_CROSS_VERIFY_OK (${checks.length})`);
