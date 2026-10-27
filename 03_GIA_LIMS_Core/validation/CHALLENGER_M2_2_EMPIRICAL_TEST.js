'use strict';

/**
 * validation/CHALLENGER_M2_2_EMPIRICAL_TEST.js
 * 
 * Empirical verification suite authored by challenger_m2_2:
 * 1. Test critical communication with incorrect password -> HTTP 401.
 * 2. Test critical communication with correct password -> HTTP 201 and dual authorization metadata recorded.
 * 3. Test pathologist sign-off with incorrect password -> HTTP 401.
 * 4. Test that fast-track release and batch validation cannot be accessed by any user role (HTTP 409 fail-closed).
 * 5. Additional adversarial stress tests (invalid witness passwords, role permissions, immutability).
 */

const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const TEST_PORT = 3992;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

process.env.AUTH_SECRET = 'empirical_challenger_m2_2_secret_key_minimum_32_characters!';
process.env.PORT = String(TEST_PORT);
process.env.NODE_ENV = 'development';
process.env.BOOTSTRAP_ADMIN_USERNAME = 'admin';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'Admin@12345678';

const salt = bcrypt.genSaltSync(10);
const users = [
  { id: 'USR-ADMIN', tenantId: 'TEN-DEFAULT', username: 'admin', role: 'admin', status: 'ACTIVE', displayName: 'System Administrator', passwordHash: bcrypt.hashSync('Admin@12345678', salt) },
  { id: 'USR-TECH', tenantId: 'TEN-DEFAULT', username: 'tech', role: 'tech', status: 'ACTIVE', displayName: 'Senior Technician', passwordHash: bcrypt.hashSync('Tech@12345678', salt) },
  { id: 'USR-PATH', tenantId: 'TEN-DEFAULT', username: 'pathologist', role: 'pathologist', status: 'ACTIVE', displayName: 'Dr. Pathologist', passwordHash: bcrypt.hashSync('Path@12345678', salt) },
  { id: 'USR-WITNESS', tenantId: 'TEN-DEFAULT', username: 'witness_doc', role: 'pathologist', status: 'ACTIVE', displayName: 'Dr. Witness Pathologist', passwordHash: bcrypt.hashSync('Witness@12345678', salt) },
  { id: 'USR-PHLEB', tenantId: 'TEN-DEFAULT', username: 'phleb', role: 'phlebotomist', status: 'ACTIVE', displayName: 'Phlebotomist', passwordHash: bcrypt.hashSync('Phleb@12345678', salt) }
];

const mockState = {
  testCatalog: [
    { code: 'K', name: 'Serum Potassium (K+)', department: 'Electrolytes', unit: 'mmol/L', reference: '3.5 - 5.1', price: 250, tenantId: 'TEN-DEFAULT', active: true },
    { code: 'CBC', name: 'Complete Blood Count', department: 'Hematology', unit: 'cells/uL', reference: '4000 - 11000', price: 350, tenantId: 'TEN-DEFAULT', active: true }
  ],
  patients: [
    { id: 'PT-01', tenantId: 'TEN-DEFAULT', uhid: 'APX-2026-CHALLENGE', name: 'Challenger Test Subject', phone: '9876543210', active: true }
  ],
  orders: [],
  qcRuns: [],
  instruments: [
    { id: 'INS-01', tenantId: 'TEN-DEFAULT', name: 'Cobas c311', active: true }
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
  tenants: [{ id: 'TEN-DEFAULT', slug: 'default', name: 'Default Laboratory', mode: 'STANDARD', status: 'ACTIVE' }],
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
    getPlatformRecord: async () => null
  }
};

// Require live server
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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let checksPassed = 0;
let totalChecks = 0;

function check(label, condition) {
  totalChecks++;
  if (condition) {
    checksPassed++;
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}`);
    throw new Error(`Verification failure: ${label}`);
  }
}

async function runEmpiricalSuite() {
  console.log('================================================================');
  console.log('CHALLENGER M2_2: LIVE EMPIRICAL CHALLENGE SUITE');
  console.log('================================================================\n');

  // Allow server startup
  await sleep(600);

  // 1. Authenticate tokens
  console.log('--- Step 1: User Authentication & Tokens ---');
  const adminRes = await req('POST', '/api/auth/login', { username: 'admin', password: 'Admin@12345678' });
  check('Admin token obtained', adminRes.status === 200 && adminRes.body.token);
  const adminToken = adminRes.body.token;

  const techRes = await req('POST', '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
  check('Tech token obtained', techRes.status === 200 && techRes.body.token);
  const techToken = techRes.body.token;

  const pathRes = await req('POST', '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
  check('Pathologist token obtained', pathRes.status === 200 && pathRes.body.token);
  const pathToken = pathRes.body.token;

  const phlebRes = await req('POST', '/api/auth/login', { username: 'phleb', password: 'Phleb@12345678' });
  check('Phlebotomist token obtained', phlebRes.status === 200 && phlebRes.body.token);
  const phlebToken = phlebRes.body.token;

  // 2. Setup Order with Critical Result
  console.log('\n--- Step 2: Accession Order & Specimen Acceptance ---');
  const orderRes = await req('POST', '/api/orders', {
    patientId: 'PT-01',
    tests: [{ code: 'K' }]
  }, techToken);
  check('Order initialized in DRAFT / PENDING_COLLECTION', orderRes.status === 201 && orderRes.body.order.specimenStatus === 'PENDING_COLLECTION');
  const orderId = orderRes.body.order.id;

  const acceptRes = await req('POST', '/api/specimens/accept', {
    orderId,
    tubeCode: 'ALL'
  }, techToken);
  check('Specimen accepted to ACCEPTED status', acceptRes.status === 200 && acceptRes.body.specimen.status === 'ACCEPTED');

  const resultsRes = await req('PUT', `/api/orders/${orderId}/results`, {
    tests: [{ code: 'K', value: '7.5', status: 'Critical' }]
  }, techToken);
  check('Critical potassium (7.5 mmol/L) entered into order', resultsRes.status === 200 && resultsRes.body.order.pipelineStatus === 'RESULTS_ENTERED');

  // ===========================================================================
  // TASK 1.1: CRITICAL COMMUNICATION RE-AUTHENTICATION
  // ===========================================================================
  console.log('\n--- Task 1.1: Critical Communication Empirical Challenge ---');

  // 1.1.1: Test critical communication with an INCORRECT password -> HTTP 401
  const critWrongPass = await req('POST', `/api/orders/${orderId}/critical-communication`, {
    testName: 'Serum Potassium (K+)',
    recipient: 'Dr. Emergency Consultant',
    method: 'PHONE',
    readBack: 'VERIFIED_BY_READBACK',
    password: 'INCORRECT_PASSWORD_123'
  }, techToken);
  check('Critical communication with incorrect password rejected with HTTP 401', critWrongPass.status === 401);
  check('Rejection error confirms re-authentication failure', critWrongPass.body.error === 'Critical communication re-authentication failed');

  // 1.1.2: Test critical communication with INCORRECT secondary witness password -> HTTP 401
  const critWrongWitness = await req('POST', `/api/orders/${orderId}/critical-communication`, {
    testName: 'Serum Potassium (K+)',
    recipient: 'Dr. Emergency Consultant',
    method: 'PHONE',
    readBack: 'VERIFIED_BY_READBACK',
    password: 'Tech@12345678',
    witnessUser: 'witness_doc',
    witnessPassword: 'WRONG_WITNESS_PASSWORD'
  }, techToken);
  check('Critical communication with invalid witness password rejected with HTTP 401', critWrongWitness.status === 401);
  check('Rejection error specifically identifies secondary witness failure', critWrongWitness.body.error === 'Secondary witness re-authentication failed');

  // 1.1.3: Test critical communication with CORRECT password -> HTTP 201 & dual authorization metadata
  const critSuccess = await req('POST', `/api/orders/${orderId}/critical-communication`, {
    testName: 'Serum Potassium (K+)',
    recipient: 'Dr. Emergency Consultant',
    method: 'PHONE',
    readBack: 'VERIFIED_BY_READBACK',
    notes: 'Urgent critical alert read back and confirmed by duty doctor',
    password: 'Tech@12345678',
    witness: 'Dr. Witness Pathologist',
    witnessUser: 'witness_doc',
    witnessPassword: 'Witness@12345678',
    witnessRole: 'CONSULTANT_PATHOLOGIST'
  }, techToken);
  check('Critical communication with valid primary & witness credentials returns HTTP 201', critSuccess.status === 201);
  check('Critical communication record includes dualAuthorization object', !!critSuccess.body.dualAuthorization);
  check('dualAuthorization.primarySigner matches technician displayName', critSuccess.body.dualAuthorization.primarySigner === 'Senior Technician');
  check('dualAuthorization.primaryRole is tech', critSuccess.body.dualAuthorization.primaryRole === 'tech');
  check('dualAuthorization.reauthenticated is true', critSuccess.body.dualAuthorization.reauthenticated === true);
  check('dualAuthorization.witness matches witness name', critSuccess.body.dualAuthorization.witness === 'Dr. Witness Pathologist');
  check('dualAuthorization.witnessRole is recorded', critSuccess.body.dualAuthorization.witnessRole === 'CONSULTANT_PATHOLOGIST');
  check('dualAuthorization.timestamp is valid ISO string', !isNaN(Date.parse(critSuccess.body.dualAuthorization.timestamp)));

  // Verify critical value acknowledged flag set on the test
  const orderAfterCrit = mockState.orders.find(o => o.id === orderId);
  const testObj = orderAfterCrit.tests.find(t => t.code === 'K');
  check('Order test criticalValueAcknowledged flag is set to true', testObj.criticalValueAcknowledged === true);

  // ===========================================================================
  // TASK 1.2: PATHOLOGIST SIGN-OFF DUAL AUTHENTICATION
  // ===========================================================================
  console.log('\n--- Task 1.2: Pathologist Sign-Off Empirical Challenge ---');

  // Advance order to VALIDATED state
  orderAfterCrit.pipelineStatus = 'VALIDATED';
  orderAfterCrit.validation = { validatedBy: 'pathologist', validatedAt: new Date().toISOString() };

  // 1.2.1: Test pathologist sign-off with an INCORRECT password -> HTTP 401
  const signoffWrongPass = await req('POST', `/api/orders/${orderId}/signoff`, {
    password: 'COMPLETELY_WRONG_PASSWORD_XYZ'
  }, pathToken);
  check('Pathologist sign-off with incorrect password rejected with HTTP 401', signoffWrongPass.status === 401);
  check('Sign-off rejection error confirms electronic signature failure', signoffWrongPass.body.error === 'Electronic signature re-authentication failed');

  // 1.2.2: Test pathologist sign-off with unauthorized role (tech) -> HTTP 403
  const signoffTech = await req('POST', `/api/orders/${orderId}/signoff`, {
    password: 'Tech@12345678'
  }, techToken);
  check('Technician attempting pathologist sign-off rejected with HTTP 403', signoffTech.status === 403);

  // 1.2.3: Test pathologist sign-off with INCORRECT secondary witness password -> HTTP 401
  const signoffWrongWitness = await req('POST', `/api/orders/${orderId}/signoff`, {
    password: 'Path@12345678',
    witnessUser: 'witness_doc',
    witnessPassword: 'INCORRECT_WITNESS_PASS'
  }, pathToken);
  check('Pathologist sign-off with invalid witness password rejected with HTTP 401', signoffWrongWitness.status === 401);
  check('Sign-off witness rejection error identifies secondary witness', signoffWrongWitness.body.error === 'Secondary witness re-authentication failed');

  // 1.2.4: Test pathologist sign-off with CORRECT password & witness -> HTTP 200 & dualCredential metadata
  const signoffSuccess = await req('POST', `/api/orders/${orderId}/signoff`, {
    password: 'Path@12345678',
    witness: 'Dr. Witness Pathologist Attestation',
    witnessUser: 'witness_doc',
    witnessPassword: 'Witness@12345678',
    witnessRole: 'SUPERVISORY_DIRECTOR'
  }, pathToken);
  check('Pathologist sign-off with valid credentials succeeds with HTTP 200', signoffSuccess.status === 200 && signoffSuccess.body.success === true);
  check('Sign-off object includes dualCredential metadata', !!signoffSuccess.body.signoff.dualCredential);
  check('dualCredential.primarySigner matches pathologist displayName', signoffSuccess.body.signoff.dualCredential.primarySigner === 'Dr. Pathologist');
  check('dualCredential.primaryRole is pathologist', signoffSuccess.body.signoff.dualCredential.primaryRole === 'pathologist');
  check('dualCredential.witness is recorded', signoffSuccess.body.signoff.dualCredential.witness === 'Dr. Witness Pathologist Attestation');
  check('dualCredential.witnessRole is recorded', signoffSuccess.body.signoff.dualCredential.witnessRole === 'SUPERVISORY_DIRECTOR');
  check('dualCredential.verifiedAt is valid ISO string', !isNaN(Date.parse(signoffSuccess.body.signoff.dualCredential.verifiedAt)));
  check('Order reportHash computed upon sign-off', typeof signoffSuccess.body.reportHash === 'string' && signoffSuccess.body.reportHash.length === 64);

  // ===========================================================================
  // TASK 1.3: FAIL-CLOSED FAST-TRACK & BATCH VALIDATION
  // ===========================================================================
  console.log('\n--- Task 1.3: Permanent Bypass Disablement (Fail-Closed) ---');

  // Test Fast-Track Release on all roles
  // Allowed route roles (admin, pathologist, tech) must return HTTP 409
  // Disallowed route roles (phlebotomist) must return HTTP 403
  const fastTrackScenarios = [
    { role: 'admin', token: adminToken, expected: 409 },
    { role: 'pathologist', token: pathToken, expected: 409 },
    { role: 'tech', token: techToken, expected: 409 },
    { role: 'phlebotomist', token: phlebToken, expected: 403 }
  ];

  for (const { role, token, expected } of fastTrackScenarios) {
    const res = await req('POST', `/api/orders/${orderId}/fast-track`, {}, token);
    check(`Fast-track release fail-closed for role '${role}': HTTP ${res.status} === expected ${expected}`, res.status === expected);
    if (res.status === 409) {
      check(`Fast-track 409 explanation explicitly states release is disabled for '${role}'`, res.body.error && res.body.error.includes('Direct fast-track release is disabled'));
    }
  }

  // Test Batch Validation on all roles
  // Allowed route roles (admin, pathologist) must return HTTP 409
  // Disallowed route roles (tech, phlebotomist) must return HTTP 403
  const batchScenarios = [
    { role: 'admin', token: adminToken, expected: 409 },
    { role: 'pathologist', token: pathToken, expected: 409 },
    { role: 'tech', token: techToken, expected: 403 },
    { role: 'phlebotomist', token: phlebToken, expected: 403 }
  ];

  for (const { role, token, expected } of batchScenarios) {
    const res = await req('POST', '/api/orders/batch-validate-normal', { orderIds: [orderId] }, token);
    check(`Batch validation fail-closed for role '${role}': HTTP ${res.status} === expected ${expected}`, res.status === expected);
    if (res.status === 409) {
      check(`Batch validation 409 explanation states temporary disablement for '${role}'`, res.body.error && res.body.error.includes('Batch validation is temporarily disabled'));
    }
  }

  // ===========================================================================
  // ADDITIONAL ADVERSARIAL CHECKS: IMMUTABILITY & PRE-ANALYTICAL GATES
  // ===========================================================================
  console.log('\n--- Additional Adversarial Checks: Immutability & Safety Gates ---');

  // Advance order to RELEASED
  orderAfterCrit.pipelineStatus = 'RELEASED';
  orderAfterCrit.releasedAt = new Date().toISOString();

  // Adversarial Check 1: Critical communication cannot mutate a RELEASED order
  const postReleaseCrit = await req('POST', `/api/orders/${orderId}/critical-communication`, {
    testName: 'Serum Potassium (K+)',
    recipient: 'Dr. Late Communicator',
    method: 'PHONE',
    readBack: 'VERIFIED',
    password: 'Tech@12345678'
  }, techToken);
  check('Critical communication mutation blocked on RELEASED order with HTTP 409', postReleaseCrit.status === 409);

  // Adversarial Check 2: Auto-derive cannot mutate a RELEASED order
  const postReleaseAutoDerive = await req('POST', `/api/orders/${orderId}/auto-derive`, {}, techToken);
  check('Auto-derive blocked on RELEASED order with HTTP 409', postReleaseAutoDerive.status === 409);

  // Adversarial Check 3: Timestamp update blocked on RELEASED order (admin gets 409, non-admin gets 403)
  const postReleaseTimestampsAdmin = await req('PUT', `/api/orders/${orderId}/timestamps`, {
    collectedAt: new Date().toISOString(),
    reason: 'Correction of sample collection time'
  }, adminToken);
  check('Timestamp update blocked on RELEASED order for admin with HTTP 409', postReleaseTimestampsAdmin.status === 409);
  check('Timestamp 409 error cites prohibition on validated/released orders', postReleaseTimestampsAdmin.body.error && postReleaseTimestampsAdmin.body.error.includes('prohibited on validated or released orders'));

  const postReleaseTimestampsTech = await req('PUT', `/api/orders/${orderId}/timestamps`, {
    collectedAt: new Date().toISOString(),
    reason: 'Tech timestamp edit attempt'
  }, techToken);
  check('Timestamp update blocked for non-admin tech with HTTP 403', postReleaseTimestampsTech.status === 403);

  // Adversarial Check 4: Pre-analytical gate blocks analyzer import on unaccepted specimen
  const freshOrder = await req('POST', '/api/orders', { patientId: 'PT-01', tests: [{ code: 'K' }] }, techToken);
  const freshId = freshOrder.body.order.id;
  const prematureImport = await req('POST', '/api/instrument-results/import', {
    orderId: freshId,
    instrumentId: 'INS-01',
    results: [{ code: 'K', value: '4.5', method: 'Cobas c311' }]
  }, techToken);
  check('Analyzer import blocked on PENDING_COLLECTION specimen with HTTP 409', prematureImport.status === 409);
  check('Analyzer import error cites pre-analytical gate', prematureImport.body.error && prematureImport.body.error.includes('Pre-analytical gate blocked'));

  console.log('\n================================================================');
  console.log(`ALL EMPIRICAL CHALLENGES PASSED SUCCESSFULLY: ${checksPassed}/${totalChecks} checks`);
  console.log('================================================================\n');

  process.exit(0);
}

runEmpiricalSuite().catch(err => {
  console.error('\n[FATAL CHALLENGE FAILURE]:', err);
  process.exit(1);
});
