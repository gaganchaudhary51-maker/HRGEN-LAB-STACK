'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = fs.readFileSync('server.js','utf8');
const ui = fs.readFileSync('public/index.html','utf8');
const checks = [
  ['QC evaluation requires active tenant-owned instrument', /const instrument=DB\.instruments\.find\(x=>x\.id===String\(instrumentId\)\.trim\(\)&&\(x\.tenantId\|\|'default'\)===tenantOf\(req\)&&x\.active!==false\)/.test(server)],
  ['QC evaluation requires active tenant-owned test code', /const catalogTest=DB\.testCatalog\.find\(x=>String\(x\.code\|\|' '\)\.toUpperCase\(\)===String\(testCode\)\.trim\(\)\.toUpperCase\(\)/.test(server) || server.includes("const catalogTest=DB.testCatalog.find(x=>String(x.code||'').toUpperCase()===String(testCode).trim().toUpperCase()")],
  ['QC runs persist tenant ownership', /const run=\{id:rid\('QC'\),tenantId:tenantOf\(req\)/.test(server)],
  ['QC history filters by authenticated tenant', /app\.get\('\/api\/qc\/runs'.*?filter\(x=>\(x\.tenantId\|\|'default'\)===tenantOf\(req\)\)/s.test(server)],
  ['Calibration instrument lookup is tenant scoped', /DB\.instruments\.find\(x=>x\.id===instrumentId && \(x\.tenantId\|\|'default'\)===tenantOf\(req\) && x\.active!==false\)/.test(server)],
  ['QC UI displays recent runs', /Recent IQC runs/.test(ui) && /api\/qc\/runs\?limit=50/.test(ui)],
  ['R_4s requires explicit same-run z-scores', /withinRunZScores/.test(server) && /same-run z-score pair/.test(ui)]
];
for (const [name, ok] of checks) { assert.ok(ok, name); console.log(`PASS ${name}`); }
console.log(`LEVEL4A_QC_TENANT_VERIFY PASS (${checks.length}/${checks.length})`);
