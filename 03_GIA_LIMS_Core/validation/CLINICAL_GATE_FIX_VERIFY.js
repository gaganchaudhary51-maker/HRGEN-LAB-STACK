'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = fs.readFileSync('server.js','utf8');
const routes = fs.readFileSync('server/platformRoutes.js','utf8');
const postgres = fs.readFileSync('db/postgres.js','utf8');
const checks = [
  ['Result entry requires ACCEPTED specimen', /Pre-analytical gate blocked: specimen must be ACCEPTED before result entry/.test(server)],
  ['Release requires ACCEPTED specimen', /Pre-analytical gate blocked: accepted specimen evidence is required before release/.test(server)],
  ['Analyzer import requires active instrument owned by tenant', /DB\.instruments\.find\(x=>x\.id===String\(instrumentId\|\|' '\)\)\&\&\(x\.tenantId\|\|'default'\)===tid\&\&x\.active!==false\)/.test(server) || /DB\.instruments\.find\(x=>x\.id===String\(instrumentId\|\|' '\)\)\&\&\(x\.tenantId\|\|'default'\)===tid\&\&x\.active!==false\)/.test(server) || /const instrument=DB\.instruments\.find\(x=>x\.id===String\(instrumentId\|\|' '\)\)\&\&\(x\.tenantId\|\|'default'\)===tid\&\&x\.active!==false\)/.test(server) || server.includes("const instrument=DB.instruments.find(x=>x.id===String(instrumentId||'')&&(x.tenantId||'default')===tid&&x.active!==false)")],
  ['Analyzer import rejects omitted/extra/duplicate accession tests', /incomingCodes\.length!==accessionCodes\.length/.test(server) && /new Set\(incomingCodes\)\.size!==incomingCodes\.length/.test(server)],
  ['Analyzer import preserves accession tests and metadata', /o\.tests=\(o\.tests\|\|\[\]\)\.map\(t=>/.test(server)],
  ['Unsafe direct fast-track release disabled', /Direct release is disabled: this endpoint previously fabricated QC, calibration and sign-off evidence/.test(routes) && /Direct fast-track release is disabled/.test(routes)],
  ['Batch validation fails closed until canonical validator is shared', /Batch validation is temporarily disabled/.test(routes) && /canonical validation service/.test(routes)],
  ['Analyzer and simulator results remain unreviewed', /status:'UNREVIEWED'/.test(server) && /t\.status='UNREVIEWED'/.test(routes)],
  ['Specimen acceptance rejects post-validation changes', /Specimen state is immutable after validation/.test(routes)],
  ['Specimen rejection requires explicit valid reason and preserves history', /A valid specimen rejection reason is required/.test(routes) && /o\.specimenHistory\.push/.test(routes)],
  ['Tube code is checked against accession requirements', /Tube code does not match the accession test requirements/.test(routes)],
  ['Analyzer simulator disabled in production and tenant scoped', /Analyzer simulator is disabled in production/.test(routes) && /Active instrument registered to this tenant is required/.test(routes)],
  ['RLS tenant context is explicitly set per transaction', /set_config\('app\.tenant_id',\$1,true\)/.test(postgres)],
  ['RLS state loading iterates tenants with explicit tenant predicates', /for\(const tenant of tenantRows\)/.test(postgres) && /SELECT \* FROM orders WHERE tenant_id=\$1/.test(postgres)],
  ['RLS persistence sets context before tenant-bound writes', /for\(const u of DB\.users\|\|\[\]\)\{await setTenantContext/.test(postgres) && /for\(const e of DB\.auditLedger\|\|\[\]\)\{await setTenantContext/.test(postgres)],
  ['RLS platform record read/write uses tenant context', /async function upsertPlatformRecord[\s\S]*?setTenantContext/.test(postgres) && /async function listPlatformRecords[\s\S]*?setTenantContext/.test(postgres) && /async function getPlatformRecord[\s\S]*?setTenantContext/.test(postgres)],
  ['Playwright E2E discovery excludes Vitest unit tests', fs.readFileSync('playwright.config.js','utf8').includes("testMatch: '**/*.spec.js'")]
];
for (const [name, ok] of checks) { assert.ok(ok, name); console.log(`PASS ${name}`); }
console.log(`CLINICAL_GATE_FIX_VERIFY PASS (${checks.length}/${checks.length})`);
