'use strict';

/**
 * EMPIRICAL CHALLENGER M2 TEST SUITE
 * 
 * Directly executes live HTTP requests against HRGen LIS API to stress-test
 * pre-analytical specimen gates, mutation barriers, and immutability controls.
 */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const TEST_PORT = 3288;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Configure process environment before requiring server
process.env.AUTH_SECRET = 'challenge-secret-for-pre-analytical-gates-32-chars-long';
process.env.PORT = String(TEST_PORT);
process.env.BOOTSTRAP_ADMIN_USERNAME = 'admin';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'Admin@12345678';
process.env.NODE_ENV = 'development';
process.env.DATA_DIR = './data_test_challenger';

// Shim PostgreSQL persistence adapter so server boots without external PostgreSQL
const postgresPath = require.resolve('../db/postgres');
const testDbState = {
  tenants: [
    { id: 'TEN-DEFAULT', slug: 'default', name: 'Default Standard Lab', mode: 'STANDARD', status: 'ACTIVE' },
    { id: 'TEN-NABL', slug: 'nabl', name: 'NABL Accredited Lab', mode: 'NABL', status: 'ACTIVE' }
  ],
  users: [
    { id: 'USR-ADMIN', tenantId: 'TEN-DEFAULT', username: 'admin', role: 'admin', displayName: 'System Admin', status: 'ACTIVE', passwordHash: bcrypt.hashSync('Admin@12345678', 10) },
    { id: 'USR-TECH', tenantId: 'TEN-DEFAULT', username: 'tech', role: 'tech', displayName: 'Lab Tech', status: 'ACTIVE', passwordHash: bcrypt.hashSync('Tech@12345678', 10) },
    { id: 'USR-PATH', tenantId: 'TEN-DEFAULT', username: 'pathologist', role: 'pathologist', displayName: 'Dr. Pathologist', status: 'ACTIVE', passwordHash: bcrypt.hashSync('Path@12345678', 10) },
    { id: 'USR-WITNESS', tenantId: 'TEN-DEFAULT', username: 'witness_path', role: 'pathologist', displayName: 'Dr. Witness Pathologist', status: 'ACTIVE', passwordHash: bcrypt.hashSync('Witness@12345678', 10) },
    // NABL tenant user
    { id: 'USR-NABL-ADMIN', tenantId: 'TEN-NABL', username: 'nabl_admin', role: 'admin', displayName: 'NABL Admin', status: 'ACTIVE', passwordHash: bcrypt.hashSync('NablAdmin@123456', 10) }
  ],
  patients: [],
  testCatalog: [
    { code: 'CBC', name: 'Complete Blood Count', department: 'Hematology', unit: 'cells/uL', reference: '4000 - 11000', price: 350, tenantId: 'TEN-DEFAULT', active: true },
    { code: 'CREAT', name: 'Serum Creatinine', department: 'Biochemistry', unit: 'mg/dL', reference: '0.7 - 1.2', price: 180, tenantId: 'TEN-DEFAULT', active: true },
    { code: 'EGFR', name: 'Estimated GFR', department: 'Biochemistry', unit: 'mL/min/1.73m2', reference: '>60', price: 0, tenantId: 'TEN-DEFAULT', active: true },
    { code: 'K', name: 'Serum Potassium', department: 'Electrolytes', unit: 'mmol/L', reference: '3.5 - 5.1', price: 250, tenantId: 'TEN-DEFAULT', active: true },
    // NABL Catalog
    { code: 'CBC', name: 'Complete Blood Count', department: 'Hematology', unit: 'cells/uL', reference: '4000 - 11000', price: 350, tenantId: 'TEN-NABL', active: true }
  ],
  orders: [],
  orderTests: [],
  qcRuns: [],
  instruments: [
    { id: 'INST-01', tenantId: 'TEN-DEFAULT', name: 'Sysmex XN-550', active: true },
    { id: 'INST-NABL', tenantId: 'TEN-NABL', name: 'Roche Cobas 6000', active: true }
  ],
  reagentLots: [],
  calibrations: [],
  deltaChecks: [],
  criticalCommunications: [],
  reportVersions: [],
  backupManifest: [],
  validationEvidence: [],
  auditLedger: [],
  platformRecords: [],
  sequenceCounters: []
};

require.cache[postgresPath] = {
  id: postgresPath,
  filename: postgresPath,
  loaded: true,
  exports: {
    ensureSchema: async () => {},
    assertRuntimeRole: async () => {},
    acquireSingleWriterLease: async () => true,
    releaseSingleWriterLease: async () => {},
    loadState: async () => testDbState,
    persistState: async () => {},
    createTenant: async () => {},
    nextSequence: async (tid, key, prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`,
    getPlatformRecord: async (tid, entity, id) => testDbState.platformRecords.find(r => r.entityType === entity && r.id === id && (r.tenantId || 'default') === tid) || null,
    upsertPlatformRecord: async (tid, entity, id, data, status = 'ACTIVE') => {
      let r = testDbState.platformRecords.find(x => x.entityType === entity && x.id === id && (x.tenantId || 'default') === tid);
      if (r) { r.data = data; r.status = status; }
      else { r = { id, tenantId: tid, entityType: entity, data, status }; testDbState.platformRecords.unshift(r); }
      return r;
    },
    listPlatformRecords: async (tid, entity) => testDbState.platformRecords.filter(x => x.entityType === entity && (x.tenantId || 'default') === tid),
    pool: { query: async () => ({ rows: [] }) },
    migrationPool: { query: async () => ({ rows: [] }) }
  }
};

// Require real server.js (boots Express and platformRoutes)
require('../server.js');

let adminToken = '';
let techToken = '';
let pathToken = '';
let nablAdminToken = '';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { rawText: text };
  }
  return { status: res.status, headers: res.headers, body: data };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runEmpiricalChallenges() {
  console.log('--- STARTING EMPIRICAL CHALLENGE SUITE (M2 CLINICAL GATES) ---');
  
  // Wait 600ms for server port to bind
  await sleep(600);

  // 1. Authentication
  console.log('[AUTH] Logging in test roles...');
  const aLogin = await req('POST', '/api/auth/login', { username: 'admin', password: 'Admin@12345678', tenantSlug: 'default' });
  assert.equal(aLogin.status, 200, 'Admin login failed');
  adminToken = aLogin.body.token;

  const tLogin = await req('POST', '/api/auth/login', { username: 'tech', password: 'Tech@12345678', tenantSlug: 'default' });
  assert.equal(tLogin.status, 200, 'Tech login failed');
  techToken = tLogin.body.token;

  const pLogin = await req('POST', '/api/auth/login', { username: 'pathologist', password: 'Path@12345678', tenantSlug: 'default' });
  assert.equal(pLogin.status, 200, 'Pathologist login failed');
  pathToken = pLogin.body.token;

  const nLogin = await req('POST', '/api/auth/login', { username: 'nabl_admin', password: 'NablAdmin@123456', tenantSlug: 'nabl' });
  assert.equal(nLogin.status, 200, 'NABL Admin login failed');
  nablAdminToken = nLogin.body.token;
  console.log('PASS [AUTH] Successfully obtained JWTs for admin, tech, pathologist, and nabl_admin');

  // Register patient
  const ptRes = await req('POST', '/api/patients', { name: 'Test Patient', phone: '9876543210', age: 45, gender: 'Male' }, adminToken);
  assert.equal(ptRes.status, 201, 'Patient creation failed');
  const patientId = ptRes.body.patient?.id || ptRes.body.id;

  // =========================================================================
  // CHALLENGE 1: Analyzer Result Import on PENDING_COLLECTION specimen
  // =========================================================================
  console.log('\n[CHALLENGE 1] Analyzer import on PENDING_COLLECTION specimen');
  const ord1Res = await req('POST', '/api/orders', {
    patientId,
    tests: [{ code: 'CBC' }],
    paymentMode: 'Cash',
    paidAmount: 350
  }, adminToken);
  assert.equal(ord1Res.status, 201, 'Order creation failed');
  const order1 = ord1Res.body.order;
  assert.equal(order1.specimenStatus, 'PENDING_COLLECTION', 'New order must explicitly initialize specimenStatus as PENDING_COLLECTION');
  assert.equal(order1.pipelineStatus, 'DRAFT');

  // Attempt analyzer import on order1 (specimenStatus === 'PENDING_COLLECTION')
  const imp1 = await req('POST', '/api/instrument-results/import', {
    orderId: order1.id,
    instrumentId: 'INST-01',
    interfaceType: 'JSON',
    messageId: 'MSG-001',
    results: [{ code: 'CBC', value: '7500' }]
  }, techToken);

  console.log(`  -> Response status: ${imp1.status}, error: "${imp1.body.error}"`);
  assert.equal(imp1.status, 409, 'Import on PENDING_COLLECTION specimen MUST return HTTP 409');
  assert.match(imp1.body.error, /Pre-analytical gate blocked: specimen must be ACCEPTED/, 'Error must explain pre-analytical gate');
  console.log('PASS [CHALLENGE 1] Pre-analytical gate correctly blocked analyzer import on PENDING_COLLECTION with HTTP 409');

  // =========================================================================
  // CHALLENGE 2: Analyzer Result Import on REJECTED specimen
  // =========================================================================
  console.log('\n[CHALLENGE 2] Analyzer import on REJECTED specimen');
  // Create order2 and reject its specimen
  const ord2Res = await req('POST', '/api/orders', {
    patientId,
    tests: [{ code: 'CBC' }],
    paymentMode: 'Cash',
    paidAmount: 350
  }, adminToken);
  const order2 = ord2Res.body.order;

  // Reject specimen with valid reason
  const rejRes = await req('POST', '/api/specimens/reject', {
    orderId: order2.id,
    reason: 'HEMOLYSIS',
    notes: 'Severe in vitro hemolysis observed'
  }, techToken);
  assert.equal(rejRes.status, 200, 'Specimen rejection failed');
  assert.equal(rejRes.body.specimen.status, 'REJECTED');

  // Attempt analyzer import on order2 (specimenStatus === 'REJECTED')
  const imp2 = await req('POST', '/api/instrument-results/import', {
    orderId: order2.id,
    instrumentId: 'INST-01',
    interfaceType: 'JSON',
    messageId: 'MSG-002',
    results: [{ code: 'CBC', value: '7500' }]
  }, techToken);

  console.log(`  -> Response status: ${imp2.status}, error: "${imp2.body.error}"`);
  assert.equal(imp2.status, 409, 'Import on REJECTED specimen MUST return HTTP 409');
  assert.match(imp2.body.error, /Pre-analytical gate blocked: specimen must be ACCEPTED/, 'Error must explain pre-analytical gate');
  console.log('PASS [CHALLENGE 2] Pre-analytical gate correctly blocked analyzer import on REJECTED specimen with HTTP 409');

  // =========================================================================
  // CHALLENGE 3: Analyzer Simulator on PENDING_COLLECTION & REJECTED specimen
  // =========================================================================
  console.log('\n[CHALLENGE 3] Analyzer simulator on unaccepted specimen');
  const sim1 = await req('POST', '/api/integrations/simulate-analyzer', {
    barcode: order1.barcode,
    instrumentId: 'INST-01',
    protocol: 'ASTM',
    results: [{ code: 'CBC', value: '7500' }]
  }, techToken);
  console.log(`  -> Simulator on PENDING_COLLECTION: status ${sim1.status}, error: "${sim1.body.error}"`);
  assert.equal(sim1.status, 409, 'Simulator on PENDING_COLLECTION must return HTTP 409');

  const sim2 = await req('POST', '/api/integrations/simulate-analyzer', {
    barcode: order2.barcode,
    instrumentId: 'INST-01',
    protocol: 'ASTM',
    results: [{ code: 'CBC', value: '7500' }]
  }, techToken);
  console.log(`  -> Simulator on REJECTED: status ${sim2.status}, error: "${sim2.body.error}"`);
  assert.equal(sim2.status, 409, 'Simulator on REJECTED must return HTTP 409');
  console.log('PASS [CHALLENGE 3] Pre-analytical gate correctly blocked simulator feed on unaccepted specimen with HTTP 409');

  // =========================================================================
  // CHALLENGE 4: Auto-Derive on unaccepted specimen
  // =========================================================================
  console.log('\n[CHALLENGE 4] Auto-derive on unaccepted specimen');
  // Order 1 is PENDING_COLLECTION
  const adPending = await req('POST', `/api/orders/${order1.id}/auto-derive`, {}, techToken);
  console.log(`  -> Auto-derive on PENDING_COLLECTION: status ${adPending.status}, error: "${adPending.body.error}"`);
  assert.equal(adPending.status, 409, 'Auto-derive on PENDING_COLLECTION must return HTTP 409');
  assert.match(adPending.body.error, /Pre-analytical gate blocked: specimen must be ACCEPTED/);

  // Order 2 is REJECTED
  const adRejected = await req('POST', `/api/orders/${order2.id}/auto-derive`, {}, techToken);
  console.log(`  -> Auto-derive on REJECTED: status ${adRejected.status}, error: "${adRejected.body.error}"`);
  assert.equal(adRejected.status, 409, 'Auto-derive on REJECTED must return HTTP 409');
  assert.match(adRejected.body.error, /Pre-analytical gate blocked: specimen must be ACCEPTED/);
  console.log('PASS [CHALLENGE 4] Auto-derive blocked on unaccepted specimen with HTTP 409');

  // =========================================================================
  // CHALLENGE 5: Auto-Derive on VALIDATED & RELEASED orders
  // =========================================================================
  console.log('\n[CHALLENGE 5] Auto-derive on VALIDATED and RELEASED orders');
  // Create order3 with Creatinine + eGFR, accept specimen, enter results, advance to VALIDATED
  const ord3Res = await req('POST', '/api/orders', {
    patientId,
    tests: [{ code: 'CREAT' }, { code: 'EGFR' }],
    paymentMode: 'Cash',
    paidAmount: 180
  }, adminToken);
  const order3 = ord3Res.body.order;

  // Accept specimen
  const accRes = await req('POST', '/api/specimens/accept', { orderId: order3.id, tubeCode: 'ALL' }, techToken);
  assert.equal(accRes.status, 200, 'Specimen accept failed');

  // Enter results
  const resEnt = await req('PUT', `/api/orders/${order3.id}/results`, {
    tests: [
      { code: 'CREAT', value: '1.1', status: 'Normal' },
      { code: 'EGFR', value: '95', status: 'Normal' }
    ]
  }, techToken);
  assert.equal(resEnt.status, 200, 'Result entry failed');

  // Advance order3 to VALIDATED state
  const targetOrd3 = testDbState.orders.find(o => o.id === order3.id);
  targetOrd3.pipelineStatus = 'VALIDATED';
  targetOrd3.qcPassed = true;

  // Attempt auto-derive on VALIDATED order3
  const adVal = await req('POST', `/api/orders/${order3.id}/auto-derive`, {}, techToken);
  console.log(`  -> Auto-derive on VALIDATED order: status ${adVal.status}, error: "${adVal.body.error}"`);
  assert.equal(adVal.status, 409, 'Auto-derive on VALIDATED order must return HTTP 409');
  assert.match(adVal.body.error, /Auto-derive is prohibited on validated or released orders/);

  // Advance order3 to RELEASED state
  targetOrd3.pipelineStatus = 'RELEASED';
  targetOrd3.releasedAt = new Date().toISOString();

  // Attempt auto-derive on RELEASED order3
  const adRel = await req('POST', `/api/orders/${order3.id}/auto-derive`, {}, techToken);
  console.log(`  -> Auto-derive on RELEASED order: status ${adRel.status}, error: "${adRel.body.error}"`);
  assert.equal(adRel.status, 409, 'Auto-derive on RELEASED order must return HTTP 409');
  assert.match(adRel.body.error, /Auto-derive is prohibited on validated or released orders/);
  console.log('PASS [CHALLENGE 5] Auto-derive strictly blocked on VALIDATED and RELEASED orders with HTTP 409');

  // =========================================================================
  // CHALLENGE 6: Timestamp modification on VALIDATED and RELEASED orders
  // =========================================================================
  console.log('\n[CHALLENGE 6] Timestamp modification on VALIDATED and RELEASED orders');
  // Attempt timestamp modification on RELEASED order3
  const tsRel = await req('PUT', `/api/orders/${order3.id}/timestamps`, {
    createdAt: '2026-01-01T00:00:00.000Z',
    reason: 'Administrative correction of historical collection timestamp'
  }, adminToken);
  console.log(`  -> Timestamp mod on RELEASED order: status ${tsRel.status}, error: "${tsRel.body.error}"`);
  assert.equal(tsRel.status, 409, 'Timestamp modification on RELEASED order must return HTTP 409');
  assert.match(tsRel.body.error, /Timestamp modification is prohibited on validated or released orders/);

  // Create order4 and advance to VALIDATED
  const ord4Res = await req('POST', '/api/orders', {
    patientId,
    tests: [{ code: 'CREAT' }],
    paymentMode: 'Cash',
    paidAmount: 180
  }, adminToken);
  const order4 = ord4Res.body.order;
  await req('POST', '/api/specimens/accept', { orderId: order4.id, tubeCode: 'ALL' }, techToken);
  await req('PUT', `/api/orders/${order4.id}/results`, { tests: [{ code: 'CREAT', value: '1.0', status: 'Normal' }] }, techToken);
  const targetOrd4 = testDbState.orders.find(o => o.id === order4.id);
  targetOrd4.pipelineStatus = 'VALIDATED';
  targetOrd4.qcPassed = true;

  // Attempt timestamp modification on VALIDATED order4
  const tsVal = await req('PUT', `/api/orders/${order4.id}/timestamps`, {
    createdAt: '2026-01-01T00:00:00.000Z',
    reason: 'Administrative correction of accession booking timestamp'
  }, adminToken);
  console.log(`  -> Timestamp mod on VALIDATED order: status ${tsVal.status}, error: "${tsVal.body.error}"`);
  assert.equal(tsVal.status, 409, 'Timestamp modification on VALIDATED order must return HTTP 409');
  assert.match(tsVal.body.error, /Timestamp modification is prohibited on validated or released orders/);
  console.log('PASS [CHALLENGE 6] Timestamp modification strictly blocked on VALIDATED and RELEASED orders with HTTP 409');

  // =========================================================================
  // CHALLENGE 7: Timestamp modification controls under NABL compliance mode
  // =========================================================================
  console.log('\n[CHALLENGE 7] Timestamp modification under NABL compliance mode');
  // Create patient & order in NABL tenant
  const ptNabl = await req('POST', '/api/patients', { name: 'NABL Patient', phone: '9123456780', age: 50, gender: 'Female' }, nablAdminToken);
  const nablPtId = ptNabl.body.patient?.id || ptNabl.body.id;
  const nablOrd = await req('POST', '/api/orders', { patientId: nablPtId, tests: [{ code: 'CBC' }], paymentMode: 'Cash', paidAmount: 350 }, nablAdminToken);
  const nablOrder = nablOrd.body.order;

  // Attempt timestamp modification in NABL tenant
  const tsNabl = await req('PUT', `/api/orders/${nablOrder.id}/timestamps`, {
    createdAt: '2026-01-01T00:00:00.000Z',
    reason: 'Attempted timestamp correction in accredited laboratory'
  }, nablAdminToken);
  console.log(`  -> Timestamp mod in NABL mode: status ${tsNabl.status}, error: "${tsNabl.body.error}"`);
  assert.equal(tsNabl.status, 403, 'Timestamp mod under NABL mode must return HTTP 403');
  assert.match(tsNabl.body.error, /Timestamp modification is strictly prohibited under NABL/);
  console.log('PASS [CHALLENGE 7] NABL tamper protection guard strictly blocked timestamp mutation with HTTP 403');

  // =========================================================================
  // CHALLENGE 8: Permanent bypass disabled checks (/fast-track & /batch-validate-normal)
  // =========================================================================
  console.log('\n[CHALLENGE 8] Permanent bypass endpoints remain fail-closed');
  const ftRes = await req('POST', `/api/orders/${order1.id}/fast-track`, {}, adminToken);
  console.log(`  -> Direct fast-track release: status ${ftRes.status}, error: "${ftRes.body.error}"`);
  assert.equal(ftRes.status, 409, 'Fast-track bypass must return HTTP 409');
  assert.match(ftRes.body.error, /Direct fast-track release is disabled/);

  const bvRes = await req('POST', '/api/orders/batch-validate-normal', {}, adminToken);
  console.log(`  -> Batch validate normal: status ${bvRes.status}, error: "${bvRes.body.error}"`);
  assert.equal(bvRes.status, 409, 'Batch validation bypass must return HTTP 409');
  assert.match(bvRes.body.error, /Batch validation is temporarily disabled/);
  console.log('PASS [CHALLENGE 8] Bypass routes permanently fail-closed with HTTP 409');

  // =========================================================================
  // CHALLENGE 9: Re-authentication & Dual Credential Verification
  // =========================================================================
  console.log('\n[CHALLENGE 9] Re-authentication and Dual Authorization controls');
  // 1. Signoff with invalid password
  const badSign = await req('POST', `/api/orders/${order4.id}/signoff`, {
    password: 'WrongPassword123'
  }, pathToken);
  console.log(`  -> Pathologist signoff with invalid password: status ${badSign.status}`);
  assert.equal(badSign.status, 401, 'Invalid password signoff must return HTTP 401');

  // 2. Signoff with invalid witness password
  const badWitness = await req('POST', `/api/orders/${order4.id}/signoff`, {
    password: 'Path@12345678',
    witnessUser: 'witness_path',
    witnessPassword: 'InvalidWitnessPassword'
  }, pathToken);
  console.log(`  -> Signoff with invalid witness password: status ${badWitness.status}`);
  assert.equal(badWitness.status, 401, 'Invalid witness password signoff must return HTTP 401');

  // 3. Signoff with valid primary + witness credentials
  const goodSign = await req('POST', `/api/orders/${order4.id}/signoff`, {
    password: 'Path@12345678',
    witnessUser: 'witness_path',
    witnessPassword: 'Witness@12345678',
    witness: 'Dr. Witness Pathologist'
  }, pathToken);
  console.log(`  -> Signoff with valid credentials: status ${goodSign.status}`);
  assert.equal(goodSign.status, 200, 'Signoff with valid credentials must succeed');
  assert.ok(goodSign.body.signoff?.dualCredential, 'Order signoff must contain dualCredential object');
  assert.equal(goodSign.body.signoff.dualCredential.primaryRole, 'pathologist');
  assert.equal(goodSign.body.signoff.dualCredential.witness, 'Dr. Witness Pathologist');
  console.log('PASS [CHALLENGE 9] Dual re-authentication and dualCredential metadata verified');

  // =========================================================================
  // CHALLENGE 10: Positive Controls: Accepted Specimen Lifecycle Progression
  // =========================================================================
  console.log('\n[CHALLENGE 10] Positive control: ACCEPTED specimen lifecycle progression');
  // Create order5
  const ord5Res = await req('POST', '/api/orders', {
    patientId,
    tests: [{ code: 'CBC' }],
    paymentMode: 'Cash',
    paidAmount: 350
  }, adminToken);
  const order5 = ord5Res.body.order;

  // Accept specimen
  const acc5 = await req('POST', '/api/specimens/accept', {
    orderId: order5.id,
    tubeCode: 'ALL'
  }, techToken);
  assert.equal(acc5.status, 200);
  assert.equal(acc5.body.specimen.status, 'ACCEPTED');

  // Import analyzer results on ACCEPTED specimen
  const imp5 = await req('POST', '/api/instrument-results/import', {
    orderId: order5.id,
    instrumentId: 'INST-01',
    interfaceType: 'JSON',
    messageId: 'MSG-ACCEPT-555',
    results: [{ code: 'CBC', value: '6200' }]
  }, techToken);
  assert.equal(imp5.status, 200, `Analyzer import on ACCEPTED specimen failed: ${JSON.stringify(imp5.body)}`);
  assert.equal(imp5.body.order.pipelineStatus, 'RESULTS_ENTERED');
  assert.equal(imp5.body.order.tests[0].status, 'UNREVIEWED');
  assert.equal(imp5.body.order.tests[0].value, '6200');
  assert.equal(imp5.body.order.tests[0].source, 'INSTRUMENT');
  assert.equal(imp5.body.order.tests[0].instrumentId, 'INST-01');

  // Verify auto-derive works on ACCEPTED specimen in RESULTS_ENTERED
  const ad5 = await req('POST', `/api/orders/${order5.id}/auto-derive`, {}, techToken);
  assert.equal(ad5.status, 200, 'Auto-derive on ACCEPTED specimen in RESULTS_ENTERED must succeed');
  console.log('PASS [CHALLENGE 10] Positive control passed: ACCEPTED specimen imported results, tagged UNREVIEWED, and auto-derived successfully');

  console.log('\n=============================================================');
  console.log('EMPIRICAL CHALLENGER REPORT: ALL 10 CHALLENGE PHASES PASSED!');
  console.log('=============================================================\n');
  try {
    const fs = require('fs');
    if (fs.existsSync('./data_test_challenger')) fs.rmSync('./data_test_challenger', { recursive: true, force: true });
  } catch (e) {}
  process.exit(0);
}

runEmpiricalChallenges().catch(err => {
  try {
    const fs = require('fs');
    if (fs.existsSync('./data_test_challenger')) fs.rmSync('./data_test_challenger', { recursive: true, force: true });
  } catch (e) {}
  console.error('\nFAIL [EMPIRICAL CHALLENGER FAILURE]:', err);
  process.exit(1);
});
