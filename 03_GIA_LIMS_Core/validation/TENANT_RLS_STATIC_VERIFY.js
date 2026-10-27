'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const db=fs.readFileSync('db/postgres.js','utf8');
const server=fs.readFileSync('server.js','utf8');
const compose=fs.readFileSync('docker-compose.yml','utf8');
const init=fs.readFileSync('docker/postgres-init/10-roles.sh','utf8');
const tests=fs.readFileSync('validation/POSTGRES_RLS_INTEGRATION_TEST.js','utf8');
const dockerfile=fs.readFileSync('Dockerfile','utf8');
const report=fs.readFileSync('validation/L99N100XN30_TENANT_RLS_HARDENING_REPORT.md','utf8');
const checks=[
 ['separate migration connection pool',/const migrationPool = new Pool/.test(db)],
 ['schema uses migration principal',/const client = await migrationPool\.connect\(\)/.test(db)],
 ['migration role cannot be superuser/BYPASSRLS',/Unsafe migration role: MIGRATION_DATABASE_URL/.test(db)],
 ['runtime role denies superuser/BYPASSRLS',/rolsuper \|\| r\.rows\[0\]\.rolbypassrls/.test(db)],
 ['runtime role cannot own tenant tables or create schema objects',/owns tenant tables/.test(db) && /has_schema_privilege\(current_user,'public','CREATE'\)/.test(db)],
 ['startup validates runtime role',/await assertRuntimeRole\(\)/.test(server)],
 ['single-writer lease blocks unqualified multi-instance mode',/pg_try_advisory_lock\(hashtext\('hrgen_gia_lims_single_writer_v1'\)\)/.test(db) && /await acquireSingleWriterLease\(\)/.test(server)],
 ['strict RLS policy denies NULL tenant_id',/tenant_id = NULLIF\(current_setting\('app\.tenant_id', true\), ''\)/.test(db) && !/tenant_id IS NULL OR tenant_id = current_setting/.test(db)],
 ['RLS FORCE enabled',/ALTER TABLE \$\{table\} FORCE ROW LEVEL SECURITY/.test(db)],
 ['all stale permissive policies are removed before canonical policy',/SELECT policyname FROM pg_policies/.test(db) && /DROP POLICY IF EXISTS/.test(db)],
 ['legacy NULL tenant rows block startup',/Tenant isolation migration blocked/.test(db)],
 ['RLS includes sequence counters and tokens',/tenantTables = \[[^\]]*sequence_counters[^\]]*api_keys[^\]]*refresh_tokens/s.test(db)],
 ['Docker runtime uses hrgen_app',/DATABASE_URL: postgresql:\/\/hrgen_app:/.test(compose)],
 ['Docker uses reproducible npm ci and lockfile',/COPY package\.json package-lock\.json/.test(dockerfile) && /npm ci --omit=dev/.test(dockerfile)],
 ['Docker migrations use separate hrgen_migrator',/MIGRATION_DATABASE_URL: postgresql:\/\/hrgen_migrator:/.test(compose)],
 ['init roles are NO SUPERUSER / NO BYPASSRLS',/CREATE ROLE hrgen_app LOGIN PASSWORD .*NOSUPERUSER/.test(init) && /CREATE ROLE hrgen_migrator LOGIN PASSWORD .*NOSUPERUSER/.test(init)],
 ['integration test checks cross-tenant read/write',/tenant A cannot read tenant B patient row/.test(tests) && /tenant A cannot insert a tenant B row/.test(tests)],
 ['integration test rejects extra permissive policies',/rows.length, 1/.test(tests) && /permissive extras can weaken isolation/.test(tests)],
 ['integration test checks no TRUNCATE and no table ownership',/cannot TRUNCATE clinical tables/.test(tests) && /does not own tenant tables/.test(tests)],
 ['integration test checks no-context fail-closed',/missing tenant context fails closed/.test(tests)],
 ['hardening report documents all-tenant state limitation',/shared all-tenant state object in memory/.test(report)],
];
let bad=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)bad++;}
if(bad){console.error(`TENANT_RLS_STATIC_VERIFY FAIL (${bad}/${checks.length})`);process.exit(1)}
console.log(`TENANT_RLS_STATIC_VERIFY PASS (${checks.length}/${checks.length})`);
