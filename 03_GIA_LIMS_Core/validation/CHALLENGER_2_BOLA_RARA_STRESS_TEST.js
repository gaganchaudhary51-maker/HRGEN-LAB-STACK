'use strict';

/**
 * validation/CHALLENGER_2_BOLA_RARA_STRESS_TEST.js
 * 
 * Comprehensive Empirical Stress Suite for Challenger 2:
 * 1. BOLA: Broken Object Level Authorization & Cross-Tenant Isolation
 * 2. RARA: Role-Based Action & Resource Authorization Mutations
 * 3. Clinical Gates: Pre-analytical specimen gate, QC gate, Sign-off gate, Release gate
 * 4. Westgard Statistical Edge Cases & Boundary Conditions
 */

const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const TEST_PORT = 3995;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

process.env.AUTH_SECRET = 'challenger_2_empirical_stress_test_secret_key_32_chars!';
process.env.PORT = String(TEST_PORT);
process.env.NODE_ENV = 'development';
process.env.BOOTSTRAP_ADMIN_USERNAME = 'admin_a';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'AdminA@12345678';

const salt = bcrypt.genSaltSync(10);

// Two separate tenants: TEN-ALPHA and TEN-BETA
const users = [
  // Tenant ALPHA users
  { id: 'USR-ADMIN-A', tenantId: 'TEN-ALPHA', username: 'admin_a', role: 'admin', status: 'ACTIVE', displayName: 'Admin Alpha', passwordHash: bcrypt.hashSync('AdminA@12345678', salt) },
  { id: 'USR-TECH-A', tenantId: 'TEN-ALPHA', username: 'tech_a', role: 'tech', status: 'ACTIVE', displayName: 'Tech Alpha', passwordHash: bcrypt.hashSync('TechA@12345678', salt) },
  { id: 'USR-PATH-A', tenantId: 'TEN-ALPHA', username: 'path_a', role: 'pathologist', status: 'ACTIVE', displayName: 'Path Alpha', passwordHash: bcrypt.hashSync('PathA@12345678', salt) },
  { id: 'USR-PHLEB-A', tenantId: 'TEN-ALPHA', username: 'phleb_a', role: 'phlebotomist', status: 'ACTIVE', displayName: 'Phleb Alpha', passwordHash: bcrypt.hashSync('PhlebA@12345678', salt) },
  // Tenant BETA users
  { id: 'USR-ADMIN-B', tenantId: 'TEN-BETA', username: 'admin_b', role: 'admin', status: 'ACTIVE', displayName: 'Admin Beta', passwordHash: bcrypt.hashSync('AdminB@12345678', salt) },
  { id: 'USR-TECH-B', tenantId: 'TEN-BETA', username: 'tech_b', role: 'tech', status: 'ACTIVE', displayName: 'Tech Beta', passwordHash: bcrypt.hashSync('TechB@12345678', salt) },
  { id: 'USR-PATH-B', tenantId: 'TEN-BETA', username: 'path_b', role: 'pathologist', status: 'ACTIVE', displayName: 'Path Beta', passwordHash: bcrypt.hashSync('PathB@12345678', salt) }
];

const mockState = {
  testCatalog: [
    { code: 'K', name: 'Serum Potassium (K+)', department: 'Electrolytes', unit: 'mmol/L', reference: '3.5 - 5.1', price: 250, tenantId: 'TEN-ALPHA', active: true },
    { code: 'K', name: 'Serum Potassium (K+)', department: 'Electrolytes', unit: 'mmol/L', reference: '3.5 - 5.1', price: 250, tenantId: 'TEN-BETA', active: true }
  ],
  patients: [
    { id: 'PT-ALPHA-01', tenantId: 'TEN-ALPHA', uhid: 'APX-2026-ALPHA-01', name: 'Patient Alpha', phone: '9876543210', active: true },
    { id: 'PT-BETA-01', tenantId: 'TEN-BETA', uhid: 'APX-2026-BETA-01', name: 'Patient Beta', phone: '9123456780', active: true }
  ],
  orders: [
    {
      id: 'ORD-BETA-01',
      tenantId: 'TEN-BETA',
      patientId: 'PT-BETA-01',
      barcode: 'BAR-BETA-01',
      specimenStatus: 'PENDING_COLLECTION',
      pipelineStatus: 'DRAFT',
      tests: [{ code: 'K', name: 'Serum Potassium (K+)', value: 'Pending', status: 'Pending' }]
    }
  ],
  qcRuns: [
    {
      id: 'QC-BETA-01',
      tenantId: 'TEN-BETA',
      instrumentId: 'INS-BETA-01',
      testCode: 'K',
      evaluation: { status: 'PASS', rules: [] }
    }
  ],
  instruments: [
    { id: 'INS-ALPHA-01', tenantId: 'TEN-ALPHA', name: 'Cobas Alpha', active: true },
    { id: 'INS-BETA-01', tenantId: 'TEN-BETA', name: 'Cobas Beta', active: true }
  ],
  reagentLots: [],
  calibrations: [],
  deltaChecks: [],
  criticalCommunications: [],
  reportVersions: [],
  backupManifest: [],
  validationEvidence: [],
  users,
  auditLedger: [],
  tenants: [
    { id: 'TEN-ALPHA', slug: 'alpha', name: 'Alpha Lab', mode: 'STANDARD', status: 'ACTIVE' },
    { id: 'TEN-BETA', slug: 'beta', name: 'Beta Lab', mode: 'STANDARD', status: 'ACTIVE' }
  ],
  platformRecords: []
};

// Mock PostgreSQL persistence layer
const pgPath = require.resolve('../db/postgres');
require.cache[pgPath] = {
  id: pgPath,
  filename: pgPath,
  loaded: true,
  exports: {
    ensureSchema: async () => {},
    assertRuntimeRole: async () => {},
    acquireSingleWriterLease: async () => {},
    loadState: async () => mockState,
    persistState: async (state) => {},
    pool: { query: async () => ({ rows: [] }) },
    createTenant: async () => {},
    nextSequence: async () => 1,
    getPlatformRecord: async () => null,
    upsertPlatformRecord: async () => ({}),
    listPlatformRecords: async () => []
  }
};

require('../server');

async function req(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, headers: res.headers, body: json };
}

let checksPassed = 0;
let totalChecks = 0;

function check(title, condition) {
  totalChecks++;
  if (condition) {
    checksPassed++;
    console.log(`[PASS] Check ${totalChecks}: ${title}`);
  } else {
    console.error(`[FAIL] Check ${totalChecks}: ${title}`);
    process.exit(1);
  }
}

async function runSuite() {
  console.log('Waiting for server initialization...');
  await new Promise(r => setTimeout(r, 600));

  // 1. Authenticate users across both tenants
  console.log('\n--- 1. Authenticating Users Across Tenants ---');
  const login = async (username, password, tenantSlug) => {
    const res = await req('POST', '/api/auth/login', { username, password, tenantSlug });
    assert.equal(res.status, 200, `Login failed for ${username}: ${JSON.stringify(res.body)}`);
    return res.body.token;
  };

  const tokenAdminA = await login('admin_a', 'AdminA@12345678', 'alpha');
  const tokenTechA = await login('tech_a', 'TechA@12345678', 'alpha');
  const tokenPathA = await login('path_a', 'PathA@12345678', 'alpha');
  const tokenPhlebA = await login('phleb_a', 'PhlebA@12345678', 'alpha');

  const tokenAdminB = await login('admin_b', 'AdminB@12345678', 'beta');
  const tokenTechB = await login('tech_b', 'TechB@12345678', 'beta');
  const tokenPathB = await login('path_b', 'PathB@12345678', 'beta');

  check('Obtained tokens for 4 users in Tenant ALPHA and 3 in Tenant BETA', Boolean(tokenAdminA && tokenTechB));

  // 2. BOLA: Broken Object Level Authorization Attacks
  console.log('\n--- 2. BOLA (Broken Object Level Authorization) Checks ---');

  // Attack 2.1: Tenant ALPHA user listing patients - must NOT see Tenant BETA patient
  const patientListRes = await req('GET', '/api/patients', null, tokenTechA);
  check('BOLA: Tenant ALPHA patients list returns 200', patientListRes.status === 200);
  const betaPatientVisible = (patientListRes.body.patients || []).some(p => p.id === 'PT-BETA-01');
  check('BOLA: Tenant ALPHA cannot see Tenant BETA patient in list', !betaPatientVisible);

  // Attack 2.2a: Tenant ALPHA tech trying to update Tenant BETA's patient (rejected by RARA with 403)
  const crossPatientUpdateTech = await req('PUT', '/api/patients/PT-BETA-01', { name: 'Hacked Beta', phone: '9123456780' }, tokenTechA);
  check('RARA: Tenant ALPHA tech cannot update patient (HTTP 403 Forbidden)', crossPatientUpdateTech.status === 403);

  // Attack 2.2b: Tenant ALPHA admin trying to update Tenant BETA's patient (rejected by BOLA with 404)
  const crossPatientUpdateAdmin = await req('PUT', '/api/patients/PT-BETA-01', { name: 'Hacked Beta', phone: '9123456780' }, tokenAdminA);
  check('BOLA: Tenant ALPHA admin cannot update Tenant BETA patient (HTTP 404 Not Found)', crossPatientUpdateAdmin.status === 404);

  // Attack 2.3: Tenant ALPHA user trying to deactivate Tenant BETA's patient
  const crossPatientDelete = await req('DELETE', '/api/patients/PT-BETA-01', null, tokenAdminA);
  check('BOLA: Tenant ALPHA admin cannot deactivate Tenant BETA patient (HTTP 404)', crossPatientDelete.status === 404);

  // Attack 2.4: Tenant ALPHA user listing orders - must NOT see Tenant BETA order
  const orderListRes = await req('GET', '/api/orders', null, tokenTechA);
  check('BOLA: Tenant ALPHA orders list returns 200', orderListRes.status === 200);
  const betaOrderVisible = (orderListRes.body.orders || []).some(o => o.id === 'ORD-BETA-01');
  check('BOLA: Tenant ALPHA cannot see Tenant BETA order in list', !betaOrderVisible);

  // Attack 2.5: Tenant ALPHA tech trying to enter results into Tenant BETA's order
  const crossResultEntry = await req('PUT', '/api/orders/ORD-BETA-01/results', {
    tests: [{ code: 'K', value: '4.2', unit: 'mmol/L' }]
  }, tokenTechA);
  check('BOLA: Tenant ALPHA cannot enter results into Tenant BETA order (HTTP 404)', crossResultEntry.status === 404);

  // Attack 2.6: Tenant ALPHA pathologist trying to sign off Tenant BETA's order
  const crossSignoff = await req('POST', '/api/orders/ORD-BETA-01/signoff', {
    password: 'PathA@12345678'
  }, tokenPathA);
  check('BOLA: Tenant ALPHA pathologist cannot sign off Tenant BETA order (HTTP 404)', crossSignoff.status === 404);

  // Attack 2.7: Tenant ALPHA user trying to mutate Tenant BETA user role
  const crossUserRoleMod = await req('POST', '/api/users/USR-TECH-B/role', {
    role: 'admin'
  }, tokenAdminA);
  check('BOLA: Tenant ALPHA admin cannot mutate Tenant BETA user role (HTTP 404)', crossUserRoleMod.status === 404);

  // Attack 2.8: Tenant ALPHA tech trying to import analyzer results using Tenant BETA instrument
  const crossInstrumentImport = await req('POST', '/api/instrument-results/import', {
    orderId: 'ORD-BETA-01',
    instrumentId: 'INS-BETA-01',
    results: [{ code: 'K', value: '4.5' }]
  }, tokenTechA);
  check('BOLA: Cross-tenant instrument import rejected (HTTP 404/409)', crossInstrumentImport.status === 404 || crossInstrumentImport.status === 409);

  // 3. RARA: Role-Based Action & Resource Authorization Checks
  console.log('\n--- 3. RARA (Role-Based Action & Resource Authorization) Checks ---');

  // Create an order in Tenant ALPHA for testing role permissions
  const createOrderRes = await req('POST', '/api/orders', {
    patientId: 'PT-ALPHA-01',
    tests: [{ code: 'K' }]
  }, tokenTechA);
  check('Tenant ALPHA order created successfully', createOrderRes.status === 201);
  const orderAlphaId = createOrderRes.body.order.id;

  // Attack 3.1: Phlebotomist attempting result entry
  const phlebResultEntry = await req('PUT', `/api/orders/${orderAlphaId}/results`, {
    tests: [{ code: 'K', value: '4.2', unit: 'mmol/L' }]
  }, tokenPhlebA);
  check('RARA: Phlebotomist result entry rejected (HTTP 403 Forbidden)', phlebResultEntry.status === 403);

  // Attack 3.2: Phlebotomist attempting clinical validation
  const phlebValidate = await req('POST', `/api/orders/${orderAlphaId}/validate`, {}, tokenPhlebA);
  check('RARA: Phlebotomist clinical validation rejected (HTTP 403 Forbidden)', phlebValidate.status === 403);

  // Attack 3.3: Phlebotomist attempting pathologist sign-off
  const phlebSignoff = await req('POST', `/api/orders/${orderAlphaId}/signoff`, { password: 'PhlebA@12345678' }, tokenPhlebA);
  check('RARA: Phlebotomist pathologist sign-off rejected (HTTP 403 Forbidden)', phlebSignoff.status === 403);

  // Attack 3.4: Technician attempting pathologist sign-off
  const techSignoff = await req('POST', `/api/orders/${orderAlphaId}/signoff`, { password: 'TechA@12345678' }, tokenTechA);
  check('RARA: Technician pathologist sign-off rejected (HTTP 403 Forbidden)', techSignoff.status === 403);

  // Attack 3.5: Technician attempting user creation
  const techUserCreate = await req('POST', '/api/users', {
    username: 'hacked_admin',
    password: 'Password@123456',
    role: 'admin'
  }, tokenTechA);
  check('RARA: Technician user creation rejected (HTTP 403 Forbidden)', techUserCreate.status === 403);

  // Attack 3.6: Technician attempting user role mutation
  const techRoleMod = await req('POST', `/api/users/USR-TECH-A/role`, { role: 'admin' }, tokenTechA);
  check('RARA: Technician role modification rejected (HTTP 403 Forbidden)', techRoleMod.status === 403);

  // Attack 3.7: Admin attempting self-role escalation/mutation
  const adminSelfMod = await req('POST', `/api/users/USR-ADMIN-A/role`, { role: 'pathologist' }, tokenAdminA);
  check('RARA: Self-role modification strictly prohibited (HTTP 403 Forbidden)', adminSelfMod.status === 403);

  // 4. Clinical State Progression & Gate Checks
  console.log('\n--- 4. Clinical Gate & Failure Mode Checks ---');

  // Gate 4.1: Result entry blocked when specimenStatus is PENDING_COLLECTION
  const prematureEntry = await req('PUT', `/api/orders/${orderAlphaId}/results`, {
    tests: [{ code: 'K', value: '4.2', unit: 'mmol/L' }]
  }, tokenTechA);
  check('Gate: Result entry blocked on unaccepted specimen (HTTP 409 Conflict)', prematureEntry.status === 409);

  // Gate 4.2: Reject specimen and attempt result entry
  const rejectRes = await req('POST', '/api/specimens/reject', {
    orderId: orderAlphaId,
    reason: 'CLOTTED'
  }, tokenTechA);
  check('Specimen marked REJECTED (CLOTTED)', rejectRes.status === 200);

  const rejectedEntry = await req('PUT', `/api/orders/${orderAlphaId}/results`, {
    tests: [{ code: 'K', value: '4.2', unit: 'mmol/L' }]
  }, tokenTechA);
  check('Gate: Result entry blocked on REJECTED specimen (HTTP 409 Conflict)', rejectedEntry.status === 409);

  // Gate 4.3a: Direct release blocked for technician (HTTP 403 Forbidden)
  const techRelease = await req('POST', `/api/orders/${orderAlphaId}/release`, {}, tokenTechA);
  check('RARA: Technician direct release blocked (HTTP 403 Forbidden)', techRelease.status === 403);

  // Gate 4.3b: Direct release blocked for pathologist on non-validated/rejected specimen (HTTP 409 Conflict)
  const pathRelease = await req('POST', `/api/orders/${orderAlphaId}/release`, {}, tokenPathA);
  check('Gate: Pathologist release blocked on REJECTED/DRAFT specimen (HTTP 409 Conflict)', pathRelease.status === 409);

  // Gate 4.4: Accept specimen and verify progression
  const acceptRes = await req('POST', '/api/specimens/accept', {
    orderId: orderAlphaId,
    tube: 'SERUM',
    centrifuged: true
  }, tokenTechA);
  check('Specimen accepted after re-collection workflow (HTTP 200)', acceptRes.status === 200);

  // Result entry now permitted on ACCEPTED specimen
  const validEntry = await req('PUT', `/api/orders/${orderAlphaId}/results`, {
    tests: [{ code: 'K', value: '4.2', unit: 'mmol/L' }]
  }, tokenTechA);
  check('Result entry succeeds on ACCEPTED specimen (HTTP 200)', validEntry.status === 200);

  // Gate 4.5: Release blocked without Pathologist sign-off
  const releaseWithoutSignoff = await req('POST', `/api/orders/${orderAlphaId}/release`, {}, tokenPathA);
  check('Gate: Release blocked without pathologist sign-off (HTTP 409 Conflict)', releaseWithoutSignoff.status === 409);

  // 5. Westgard Mathematical Edge Cases & Boundary Fuzzing
  console.log('\n--- 5. Westgard Boundary & Mathematical Fuzzing Checks ---');
  const { westgardEvaluate, MAX_POINTS } = require('../server/services/westgard');

  // Edge 5.1: Zero SD and Negative SD fail closed
  check('Westgard: zero SD returns INVALID', westgardEvaluate([100], 100, 0).status === 'INVALID');
  check('Westgard: negative SD returns INVALID', westgardEvaluate([100], 100, -2).status === 'INVALID');

  // Edge 5.2: Non-finite values (NaN, Infinity, -Infinity) fail closed
  check('Westgard: NaN in series returns INVALID', westgardEvaluate([100, NaN, 102], 100, 2).status === 'INVALID');
  check('Westgard: Infinity in series returns INVALID', westgardEvaluate([100, Infinity, 102], 100, 2).status === 'INVALID');
  check('Westgard: -Infinity in target returns INVALID', westgardEvaluate([100], -Infinity, 2).status === 'INVALID');

  // Edge 5.3: Non-numeric strings and nulls fail closed
  check('Westgard: string literal fails closed', westgardEvaluate([100, 'undefined', 102], 100, 2).status === 'INVALID');
  check('Westgard: null in series fails closed', westgardEvaluate([100, null, 102], 100, 2).status === 'INVALID');
  check('Westgard: empty string fails closed', westgardEvaluate([100, '', 102], 100, 2).status === 'INVALID');

  // Edge 5.4: Array size limits
  check('Westgard: empty series fails closed', westgardEvaluate([], 100, 2).status === 'INVALID');
  check('Westgard: oversized series (> MAX_POINTS) fails closed', westgardEvaluate(new Array(MAX_POINTS + 1).fill(100), 100, 2).status === 'INVALID');

  // Edge 5.5: Within-run malformed inputs
  check('Westgard: 1-item within-run pair fails closed', westgardEvaluate([100], 100, 2, [2.5]).status === 'INVALID');
  check('Westgard: 3-item within-run pair fails closed', westgardEvaluate([100], 100, 2, [2.5, -2.5, 1.0]).status === 'INVALID');
  check('Westgard: NaN in within-run pair fails closed', westgardEvaluate([100], 100, 2, [2.5, NaN]).status === 'INVALID');

  // Edge 5.6: Exact mathematical boundaries (strict-exceedance policy)
  const zRun = (zScores, pair = null) => westgardEvaluate(zScores.map(z => 100 + z * 2), 100, 2, pair);
  check('Westgard: exact 2.0 SD is PASS (strict exceedance, no 1_2s)', zRun([2.0]).status === 'PASS');
  check('Westgard: 2.0001 SD is WARNING (triggers 1_2s)', zRun([2.0001]).status === 'WARNING' && zRun([2.0001]).rules.includes('1_2s'));
  check('Westgard: exact 3.0 SD is WARNING (strict exceedance, no 1_3s)', zRun([3.0]).status === 'WARNING' && !zRun([3.0]).rules.includes('1_3s'));
  check('Westgard: 3.0001 SD is FAIL (triggers 1_3s)', zRun([3.0001]).status === 'FAIL' && zRun([3.0001]).rules.includes('1_3s'));

  // Edge 5.7: R_4s boundary and cross-side constraints
  check('Westgard: R_4s exact [-2.0, 2.0] does not trigger', !zRun([0], [-2.0, 2.0]).rules.includes('R_4s'));
  check('Westgard: R_4s [-2.001, 2.001] triggers rejection', zRun([0], [-2.001, 2.001]).rules.includes('R_4s'));
  check('Westgard: R_4s [-1.5, 2.6] (span 4.1, but one side not > 2 SD) does not trigger', !zRun([0], [-1.5, 2.6]).rules.includes('R_4s'));
  check('Westgard: R_4s [2.2, 3.5] (same side) does not trigger', !zRun([0], [2.2, 3.5]).rules.includes('R_4s'));

  // Edge 5.8: 10x with zero point (exact mean)
  check('Westgard: 10x with all positive triggers rejection', zRun([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]).rules.includes('10x'));
  check('Westgard: 10x with one point exactly on mean (z = 0) does NOT trigger', !zRun([0.1, 0.2, 0.3, 0.4, 0.0, 0.6, 0.7, 0.8, 0.9, 1.0]).rules.includes('10x'));

  console.log('\n================================================================');
  console.log(`ALL BOLA, RARA, CLINICAL GATE & WESTGARD STRESS CHECKS PASSED: ${checksPassed}/${totalChecks}`);
  console.log('================================================================\n');

  process.exit(0);
}

runSuite().catch(err => {
  console.error('\n[FATAL STRESS ERROR]:', err);
  process.exit(1);
});
