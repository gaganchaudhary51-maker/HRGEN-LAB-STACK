'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { xmlAttribute } = require('../server/platformRoutes');

const routes = fs.readFileSync(path.join(__dirname, '..', 'server', 'platformRoutes.js'), 'utf8');
const rlsHarness = fs.readFileSync(path.join(__dirname, 'RUN_LIVE_POSTGRES_RLS_SUITE.js'), 'utf8');
let checks = 0;
function pass(label) { checks++; console.log(`PASS ${label}`); }

assert.equal(xmlAttribute('a" onload="x&<\u0001'), 'a&quot; onload=&quot;x&amp;&lt;');
pass('SAML XML attributes escape markup and strip invalid control characters');

for (const route of [
  "'/api/fhir/DiagnosticReport/:id'",
  "'/api/fhir/Observation/:orderId'",
  "'/api/hl7/oru/:orderId'"
]) {
  const line = routes.split(/\r?\n/).find(value => value.includes(`app.get(${route}`));
  assert.ok(line, `${route} exists`);
  assert.match(line, /requireRole\('admin','pathologist','tech'\)/);
  assert.match(line, /pipelineStatus==='RELEASED'/);
}
pass('FHIR and HL7 result exports require clinical roles and released reports');

const publicOrder = routes.split(/\r?\n/).find(value => value.includes("app.get('/api/public/v1/orders/:id'"));
assert.match(publicOrder, /pipelineStatus!=='RELEASED'/);
assert.match(publicOrder, /json\(res,409/);
pass('Public API refuses to disclose unreleased order results');

const offlineRoute = routes.split(/\r?\n/).find(value => value.includes("app.post('/api/offline/sync'"));
assert.match(offlineRoute, /status:\s*'NOT_IMPLEMENTED'/);
assert.match(offlineRoute, /501/);
assert.doesNotMatch(offlineRoute, /upsertPlatformRecord|accepted:true/);
pass('Offline sync stub fails closed without recording false acceptance');

const featureRoute = routes.split(/\r?\n/).find(value => value.includes("app.get('/api/features'"));
assert.match(featureRoute, /status:'REGISTERED'/);
assert.doesNotMatch(featureRoute, /status:'IMPLEMENTED'/);
const validationRoute = routes.split(/\r?\n/).find(value => value.includes("app.get('/api/validation/77'"));
assert.match(validationRoute, /status:'NOT_VERIFIED'/);
assert.match(validationRoute, /ready:null/);
assert.doesNotMatch(validationRoute, /server:true|ui:true|evidence:true|ready:77/);
pass('Capability endpoints no longer fabricate implementation or validation proof');

assert.match(rlsHarness, /fs\.mkdtempSync\(path\.join\(os\.tmpdir\(\),\s*'hrgen-lims-rls-'\)\)/);
assert.match(rlsHarness, /getAvailablePort/);
assert.doesNotMatch(rlsHarness, /\.tmp_postgres_live/);
assert.match(rlsHarness, /fs\.rmSync\(PG_DATA,\s*\{ recursive:\s*true, force:\s*true \}\)/);
pass('RLS harness uses a unique temporary cluster and removes only its owned directory');

console.log(`ENTERPRISE_AUDIT_VERIFY PASS (${checks} checks)`);
