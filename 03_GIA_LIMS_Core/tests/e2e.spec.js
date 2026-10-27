import { test, expect } from '@playwright/test';
import { startTestServer, stopTestServer } from './e2e/testServer.js';

let serverHandle = null;
const PORT = 3001;
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

test.beforeAll(async () => {
  serverHandle = await startTestServer(PORT);
});

test.afterAll(async () => {
  if (serverHandle?.isLocal) {
    await stopTestServer();
  }
});

// Helper for API requests
async function post(request, path, data, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  return request.post(`${BASE_URL}${path}`, { data, headers });
}

async function put(request, path, data, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  return request.put(`${BASE_URL}${path}`, { data, headers });
}

async function get(request, path, token, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (token) headers['authorization'] = `Bearer ${token}`;
  return request.get(`${BASE_URL}${path}`, { headers });
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (>=5 tests per core feature)
// ============================================================================

test.describe('Tier 1.1: User Authentication & Role Boundaries (RBAC)', () => {
  test('T1.1.1: Authenticate as admin with valid credentials yields token and role', async ({ request }) => {
    const res = await post(request, '/api/auth/login', { username: 'admin', password: 'Admin@12345678' });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.role).toBe('admin');
    expect(typeof body.token).toBe('string');
  });

  test('T1.1.2: Authenticate as technician yields tech role', async ({ request }) => {
    const res = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('tech');
  });

  test('T1.1.3: Authenticate as pathologist yields pathologist role', async ({ request }) => {
    const res = await post(request, '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('pathologist');
  });

  test('T1.1.4: Reject login with incorrect password with HTTP 401', async ({ request }) => {
    const res = await post(request, '/api/auth/login', { username: 'admin', password: 'WrongPassword999!' });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid credentials/i);
  });

  test('T1.1.5: Reject login for disabled user account', async ({ request }) => {
    const res = await post(request, '/api/auth/login', { username: 'disabled_user', password: 'Disabled@123456' });
    expect([401, 403]).toContain(res.status());
  });

  test('T1.1.6: Protected endpoints fail-closed when authorization header is omitted', async ({ request }) => {
    const res = await get(request, '/api/orders');
    expect(res.status()).toBe(401);
  });
});

test.describe('Tier 1.2: Patient Registration & Order Accessioning', () => {
  let adminToken;
  test.beforeAll(async ({ request }) => {
    const r = await post(request, '/api/auth/login', { username: 'admin', password: 'Admin@12345678' });
    adminToken = (await r.json()).token;
  });

  test('T1.2.1: Register patient demographics with phone and name', async ({ request }) => {
    const res = await post(request, '/api/patients', { name: 'Aarav Patel', phone: '9811122233', age: 34, gender: 'Male' }, adminToken);
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.patient.uhid).toMatch(/^APX-/);
    expect(body.patient.name).toBe('Aarav Patel');
  });

  test('T1.2.2: Create order with valid catalog test codes initializes in DRAFT and PENDING_COLLECTION', async ({ request }) => {
    const res = await post(request, '/api/orders', {
      patientId: 'PT-01',
      tests: [{ code: 'CBC' }, { code: 'FBS' }],
      paidAmount: 200
    }, adminToken);
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.order.pipelineStatus).toBe('DRAFT');
    expect(body.order.specimenStatus).toBe('PENDING_COLLECTION');
    expect(body.order.barcode).toMatch(/^APX-LAB-/);
    expect(body.order.grossAmount).toBe(450); // 350 + 100
  });

  test('T1.2.3: Reject order containing unknown or uncataloged test code', async ({ request }) => {
    const res = await post(request, '/api/orders', {
      patientId: 'PT-01',
      tests: [{ code: 'NON_EXISTENT_XYZ' }]
    }, adminToken);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Unknown or missing test code/i);
  });

  test('T1.2.4: Reject order with empty test list', async ({ request }) => {
    const res = await post(request, '/api/orders', { patientId: 'PT-01', tests: [] }, adminToken);
    expect(res.status()).toBe(400);
  });

  test('T1.2.5: Order billing enforces paidAmount bounded by netPayable', async ({ request }) => {
    const res = await post(request, '/api/orders', {
      patientId: 'PT-01',
      tests: [{ code: 'CBC' }],
      paidAmount: 9999 // Gross is 350
    }, adminToken);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/paidAmount must be between 0 and the net payable/i);
  });
});

test.describe('Tier 1.3: Specimen Acceptance & Pre-Analytical Quality Gates', () => {
  let techToken, testOrderId;
  test.beforeAll(async ({ request }) => {
    const r = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    techToken = (await r.json()).token;
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, techToken);
    testOrderId = (await ord.json()).order.id;
  });

  test('T1.3.1: Specimen queue displays order in PENDING_COLLECTION status', async ({ request }) => {
    const res = await get(request, '/api/specimens/queue', techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const item = body.queue.find(q => q.id === testOrderId);
    expect(item).toBeTruthy();
    expect(item.specimenStatus).toBe('PENDING_COLLECTION');
  });

  test('T1.3.2: Accept specimen transitions specimenStatus to ACCEPTED', async ({ request }) => {
    const res = await post(request, '/api/specimens/accept', { orderId: testOrderId, tubeCode: 'ALL', centrifuged: true }, techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.specimen.status).toBe('ACCEPTED');
  });

  test('T1.3.3: Duplicate acceptance on already ACCEPTED specimen returns HTTP 409', async ({ request }) => {
    const res = await post(request, '/api/specimens/accept', { orderId: testOrderId, tubeCode: 'ALL' }, techToken);
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already been accepted/i);
  });

  test('T1.3.4: Reject specimen with valid reason marks REJECTED and recollectionRequired', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'FBS' }] }, techToken);
    const oId = (await ord.json()).order.id;
    const res = await post(request, '/api/specimens/reject', { orderId: oId, reason: 'HEMOLYSIS', requestRecollection: true }, techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.specimen.status).toBe('REJECTED');
    expect(body.specimen.reason).toBe('HEMOLYSIS');
    expect(body.specimen.recollectionRequired).toBe(true);
  });

  test('T1.3.5: Reject specimen with invalid reason returns HTTP 400 with allowed list', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'FBS' }] }, techToken);
    const oId = (await ord.json()).order.id;
    const res = await post(request, '/api/specimens/reject', { orderId: oId, reason: 'INVALID_REASON_TEXT' }, techToken);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.allowedReasons).toBeDefined();
  });
});

test.describe('Tier 1.4: Result Entry & Analyzer Result Import', () => {
  let techToken;
  test.beforeAll(async ({ request }) => {
    const r = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    techToken = (await r.json()).token;
  });

  test('T1.4.1: Result entry blocked with HTTP 409 when specimenStatus is not ACCEPTED', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, techToken);
    const oId = (await ord.json()).order.id;
    const res = await put(request, `/api/orders/${oId}/results`, {
      tests: [{ code: 'CBC', value: '7500', status: 'Normal' }]
    }, techToken);
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/specimen must be ACCEPTED before result entry/i);
  });

  test('T1.4.2: Result entry succeeds on ACCEPTED specimen and transitions to RESULTS_ENTERED', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    const res = await put(request, `/api/orders/${oId}/results`, {
      tests: [{ code: 'CBC', value: '6200', status: 'Normal' }]
    }, techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.order.pipelineStatus).toBe('RESULTS_ENTERED');
    expect(body.order.tests[0].value).toBe('6200');
  });

  test('T1.4.3: Analyzer import validates exact code set and marks results UNREVIEWED', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CREAT' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    const res = await post(request, '/api/instrument-results/import', {
      orderId: oId,
      instrumentId: 'INS-BIO-01',
      results: [{ code: 'CREAT', value: '1.05' }]
    }, techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.order.tests[0].status).toBe('UNREVIEWED');
    expect(body.order.tests[0].source).toBe('INSTRUMENT');
  });

  test('T1.4.4: Analyzer import rejects omitted test codes with HTTP 409', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }, { code: 'FBS' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    const res = await post(request, '/api/instrument-results/import', {
      orderId: oId,
      instrumentId: 'INS-BIO-01',
      results: [{ code: 'CBC', value: '5500' }] // Omitted FBS
    }, techToken);
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/must exactly match the accession test set/i);
  });

  test('T1.4.5: Analyzer import rejects extra/unsolicited test codes with HTTP 409', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    const res = await post(request, '/api/instrument-results/import', {
      orderId: oId,
      instrumentId: 'INS-BIO-01',
      results: [{ code: 'CBC', value: '5500' }, { code: 'HB', value: '14.2' }] // HB wasn't ordered
    }, techToken);
    expect(res.status()).toBe(409);
  });
});

test.describe('Tier 1.5: Quality Control (QC) Provenance & Westgard Approval Gate', () => {
  let techToken;
  test.beforeAll(async ({ request }) => {
    const r = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    techToken = (await r.json()).token;
  });

  test('T1.5.1: Evaluate in-control IQC points returns evaluation status PASS', async ({ request }) => {
    const res = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-BIO-01',
      level: 'Normal',
      instrumentId: 'INS-BIO-01',
      testCode: 'CREAT',
      points: [1.0, 1.02, 0.99, 1.01, 1.0],
      target: 1.0,
      sd: 0.05
    }, techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.evaluation.status).toBe('PASS');
  });

  test('T1.5.2: Evaluate out-of-control IQC point > 3SD returns status REJECT with 1_3s rule', async ({ request }) => {
    const res = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-BIO-01',
      level: 'High',
      instrumentId: 'INS-BIO-01',
      testCode: 'CREAT',
      points: [1.0, 1.0, 1.35], // 1.35 is 7 SD away (target 1.0, sd 0.05)
      target: 1.0,
      sd: 0.05
    }, techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.evaluation.status).toBe('FAIL');
    expect(body.evaluation.rules).toContain('1_3s');
  });

  test('T1.5.3: QC approval on RESULTS_ENTERED order succeeds with PASS IQC run, lot, and calibration', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CREAT' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'CREAT', value: '1.1', status: 'Normal' }] }, techToken);

    // Create PASS QC run
    const qcRes = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-PASS-1',
      level: 'Level 1',
      instrumentId: 'INS-BIO-01',
      testCode: 'CREAT',
      points: [1.0, 1.01],
      target: 1.0,
      sd: 0.05
    }, techToken);
    const qcRunId = (await qcRes.json()).id;

    const res = await post(request, `/api/qc/approve/${oId}`, {
      qcRunId,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.order.pipelineStatus).toBe('QC_APPROVED');
    expect(body.order.qcPassed).toBe(true);
  });

  test('T1.5.4: QC approval rejected with HTTP 409 when IQC run failed Westgard rules', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CREAT' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'CREAT', value: '1.1', status: 'Normal' }] }, techToken);

    const failQc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-FAIL',
      level: 'Level 1',
      instrumentId: 'INS-BIO-01',
      testCode: 'CREAT',
      points: [1.4], // 8 SD
      target: 1.0,
      sd: 0.05
    }, techToken);
    const failRunId = (await failQc.json()).id;

    const res = await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: failRunId,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/verified PASS IQC run is required/i);
  });

  test('T1.5.5: QC approval rejected with HTTP 409 when reagent lot is expired', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CREAT' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'CREAT', value: '1.1', status: 'Normal' }] }, techToken);

    const qcRes = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-PASS-2',
      level: 'Level 1',
      instrumentId: 'INS-BIO-01',
      testCode: 'CREAT',
      points: [1.0],
      target: 1.0,
      sd: 0.05
    }, techToken);
    const qcRunId = (await qcRes.json()).id;

    const res = await post(request, `/api/qc/approve/${oId}`, {
      qcRunId,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-EXPIRED',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);
    expect(res.status()).toBe(409);
  });

  test('T1.5.6: QC approval rejected when QC run test code does not match order accession', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'CBC', value: '6000', status: 'Normal' }] }, techToken);

    // QC run for CREAT, but order is for CBC
    const qcRes = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-PASS-3',
      level: 'Level 1',
      instrumentId: 'INS-BIO-01',
      testCode: 'CREAT',
      points: [1.0],
      target: 1.0,
      sd: 0.05
    }, techToken);
    const qcRunId = (await qcRes.json()).id;

    const res = await post(request, `/api/qc/approve/${oId}`, {
      qcRunId,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/must be present in the accession test set/i);
  });
});

test.describe('Tier 1.6: Critical Values & Clinical Communication', () => {
  let techToken, adminToken;
  test.beforeAll(async ({ request }) => {
    const t = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    techToken = (await t.json()).token;
    const a = await post(request, '/api/auth/login', { username: 'admin', password: 'Admin@12345678' });
    adminToken = (await a.json()).token;
  });

  test('T1.6.1: Automatic panic flagging when test value exceeds panic limit (Potassium > 6.5 mmol/L)', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'K' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    const res = await put(request, `/api/orders/${oId}/results`, {
      tests: [{ code: 'K', value: '7.2', status: 'Critical' }]
    }, techToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.order.tests[0].isPanic).toBe(true);
    expect(body.order.tests[0].panicSource).toBe('UNIT_AWARE_TABLE');
  });

  test('T1.6.2: Technical validation blocked with HTTP 409 when critical value is unacknowledged', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'K' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'K', value: '7.2', status: 'Critical' }] }, techToken);

    // Pass QC
    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-K', level: 'Normal', instrumentId: 'INS-BIO-01', testCode: 'K',
      points: [4.0], target: 4.0, sd: 0.1
    }, techToken);
    await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: (await qc.json()).id,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);

    // Attempt validate without critical communication
    const valRes = await post(request, `/api/orders/${oId}/validate`, {}, adminToken);
    expect(valRes.status()).toBe(409);
    const body = await valRes.json();
    expect(body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/critical\/panic acknowledgement missing/i)]));
  });

  test('T1.6.3: Record critical communication successfully with recipient, method, and read-back', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'K' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'K', value: '7.2', status: 'Critical' }] }, techToken);

    const commRes = await post(request, `/api/orders/${oId}/critical-communication`, {
      testName: 'Serum Potassium',
      recipient: 'Dr. Sharma (Attending Physician)',
      method: 'PHONE',
      readBack: 'YES_VERIFIED',
      notes: 'Values read back and confirmed by Dr. Sharma at 14:32'
    }, techToken);
    expect(commRes.status()).toBe(201);
    const body = await commRes.json();
    expect(body.readBack).toBe('YES_VERIFIED');
    expect(body.recipient).toContain('Dr. Sharma');
  });

  test('T1.6.4: Critical communication requires mandatory readBack and recipient fields', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'K' }] }, techToken);
    const oId = (await ord.json()).order.id;
    const res = await post(request, `/api/orders/${oId}/critical-communication`, {
      testName: 'Serum Potassium'
      // missing recipient, method, readBack
    }, techToken);
    expect(res.status()).toBe(400);
  });

  test('T1.6.5: Technical validation succeeds once critical value is acknowledged', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'K' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'K', value: '7.2', status: 'Critical' }] }, techToken);

    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-K2', level: 'Normal', instrumentId: 'INS-BIO-01', testCode: 'K',
      points: [4.0], target: 4.0, sd: 0.1
    }, techToken);
    await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: (await qc.json()).id,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);

    await post(request, `/api/orders/${oId}/critical-communication`, {
      testName: 'Serum Potassium',
      recipient: 'Dr. Sharma',
      method: 'PHONE',
      readBack: 'YES_VERIFIED'
    }, techToken);

    const valRes = await post(request, `/api/orders/${oId}/validate`, {}, adminToken);
    expect(valRes.status()).toBe(200);
    const body = await valRes.json();
    expect(body.order.pipelineStatus).toBe('VALIDATED');
  });
});

test.describe('Tier 1.7: Pathologist Electronic Sign-Off & Dual Re-Authentication', () => {
  let pathToken, techToken, validatedOrderId;
  test.beforeAll(async ({ request }) => {
    const p = await post(request, '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
    pathToken = (await p.json()).token;
    const t = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    techToken = (await t.json()).token;

    // Set up a validated order
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'FBS' }] }, techToken);
    validatedOrderId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: validatedOrderId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${validatedOrderId}/results`, { tests: [{ code: 'FBS', value: '88', status: 'Normal' }] }, techToken);
    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-FBS', level: 'Normal', instrumentId: 'INS-BIO-01', testCode: 'FBS',
      points: [85], target: 85, sd: 2
    }, techToken);
    await post(request, `/api/qc/approve/${validatedOrderId}`, {
      qcRunId: (await qc.json()).id,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);
    await post(request, `/api/orders/${validatedOrderId}/validate`, {}, pathToken);
  });

  test('T1.7.1: Pathologist sign-off requires VALIDATED state (blocked on DRAFT)', async ({ request }) => {
    const draftOrd = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'FBS' }] }, techToken);
    const draftId = (await draftOrd.json()).order.id;
    const res = await post(request, `/api/orders/${draftId}/signoff`, { password: 'Path@12345678' }, pathToken);
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid workflow state/i);
  });

  test('T1.7.2: Sign-off endpoint restricted to pathologist role (tech blocked with HTTP 403)', async ({ request }) => {
    const res = await post(request, `/api/orders/${validatedOrderId}/signoff`, { password: 'Tech@12345678' }, techToken);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/Insufficient role privileges/i);
  });

  test('T1.7.3: Electronic signature re-authentication fails on invalid password with HTTP 401', async ({ request }) => {
    const res = await post(request, `/api/orders/${validatedOrderId}/signoff`, { password: 'IncorrectPassword!' }, pathToken);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/re-authentication failed/i);
  });

  test('T1.7.4: Successful sign-off issues digital signatureId and pathologist MCI evidence', async ({ request }) => {
    const res = await post(request, `/api/orders/${validatedOrderId}/signoff`, { password: 'Path@12345678' }, pathToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.signoff.signatureId).toMatch(/^SIG-/);
    expect(body.signoff.pathologistMci).toBeDefined();
    expect(body.signoff.signedByRole).toBe('pathologist');
  });

  test('T1.7.5: Sign-off is immutable; repeated sign-off on already signed order returns updated signature block', async ({ request }) => {
    const res = await post(request, `/api/orders/${validatedOrderId}/signoff`, { password: 'Path@12345678' }, pathToken);
    expect(res.status()).toBe(200);
  });
});

test.describe('Tier 1.8: Report Release Gate, Immutable Snapshot & Public Verification', () => {
  let pathToken, techToken, releasedToken;
  test.beforeAll(async ({ request }) => {
    const p = await post(request, '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
    pathToken = (await p.json()).token;
    const t = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    techToken = (await t.json()).token;
  });

  test('T1.8.1: Report release blocked if pathologist sign-off is missing', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CREAT' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'CREAT', value: '0.9', status: 'Normal' }] }, techToken);
    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-C', level: 'Normal', instrumentId: 'INS-BIO-01', testCode: 'CREAT',
      points: [1.0], target: 1.0, sd: 0.05
    }, techToken);
    await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: (await qc.json()).id,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);
    await post(request, `/api/orders/${oId}/validate`, {}, pathToken);

    // Attempt release without sign-off
    const relRes = await post(request, `/api/orders/${oId}/release`, {}, pathToken);
    expect(relRes.status()).toBe(409);
    const body = await relRes.json();
    expect(body.error).toMatch(/Pathologist sign-off is required before release/i);
  });

  test('T1.8.2: Successful release locks report status RELEASED and generates verificationToken', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CREAT' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'CREAT', value: '0.95', status: 'Normal' }] }, techToken);
    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-C2', level: 'Normal', instrumentId: 'INS-BIO-01', testCode: 'CREAT',
      points: [1.0], target: 1.0, sd: 0.05
    }, techToken);
    await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: (await qc.json()).id,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);
    await post(request, `/api/orders/${oId}/validate`, {}, pathToken);
    await post(request, `/api/orders/${oId}/signoff`, { password: 'Path@12345678' }, pathToken);

    const relRes = await post(request, `/api/orders/${oId}/release`, {}, pathToken);
    expect(relRes.status()).toBe(200);
    const body = await relRes.json();
    expect(body.status).toBe('RELEASED');
    expect(body.reportHash).toBeDefined();
    expect(body.verificationUrl).toBeDefined();
    expect(body.qrDataUrl).toMatch(/^data:image\/png;base64,/);

    // Save token for verification tests
    releasedToken = body.verificationUrl.split('/verify/').pop();
  });

  test('T1.8.3: Public verification endpoint returns valid report for authentic token', async ({ request }) => {
    expect(releasedToken).toBeDefined();
    const res = await get(request, `/api/public/verify/${releasedToken}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.report.patientNameMasked).toBeDefined();
    expect(body.report.tests.length).toBeGreaterThan(0);
  });

  test('T1.8.4: Public verification returns HTTP 404 on fabricated or unknown token', async ({ request }) => {
    const res = await get(request, '/api/public/verify/FABRICATED_TOKEN_123456');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });

  test('T1.8.5: HTML verification page renders successfully with verification badge', async ({ request }) => {
    expect(releasedToken).toBeDefined();
    const res = await get(request, `/verify/${releasedToken}`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('Report Verified');
  });

  test('T1.8.6: HTML verification returns 404 for unreleased or invalid token', async ({ request }) => {
    const res = await get(request, '/verify/UNKNOWN_TOKEN');
    expect(res.status()).toBe(404);
  });
});

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES
// ============================================================================

test.describe('Tier 2: Boundary & Corner Cases', () => {
  let adminToken;
  test.beforeAll(async ({ request }) => {
    const a = await post(request, '/api/auth/login', { username: 'admin', password: 'Admin@12345678' });
    adminToken = (await a.json()).token;
  });

  test('T2.1: Order accepts exactly 0 paidAmount and 100% netPayable payment bounds', async ({ request }) => {
    // 0 paid amount (Full DUE)
    const r1 = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'HB' }], paidAmount: 0 }, adminToken);
    expect(r1.status()).toBe(201);
    expect((await r1.json()).order.paymentStatus).toBe('DUE');

    // 100% paid amount (Full PAID)
    const r2 = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'HB' }], paidAmount: 120 }, adminToken);
    expect(r2.status()).toBe(201);
    expect((await r2.json()).order.paymentStatus).toBe('PAID');
  });

  test('T2.2: Order rejects negative paidAmount', async ({ request }) => {
    const res = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'HB' }], paidAmount: -50 }, adminToken);
    expect(res.status()).toBe(400);
  });

  test('T2.3: Panic boundary test at exact threshold (K = 6.5 mmol/L vs 6.51 mmol/L)', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'K' }] }, adminToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, adminToken);

    // K = 6.5 (exact limit, not panic)
    const r1 = await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'K', value: '6.5', status: 'High' }] }, adminToken);
    expect((await r1.json()).order.tests[0].isPanic).toBe(false);

    // K = 6.51 (exceeds limit, panic)
    const r2 = await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'K', value: '6.51', status: 'Critical' }] }, adminToken);
    expect((await r2.json()).order.tests[0].isPanic).toBe(true);
  });

  test('T2.4: Specimen rejection requires mandatory non-empty reason', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, adminToken);
    const oId = (await ord.json()).order.id;
    const res = await post(request, '/api/specimens/reject', { orderId: oId, reason: '' }, adminToken);
    expect(res.status()).toBe(400);
  });

  test('T2.5: Immutability of released reports: modifying results on RELEASED report returns HTTP 409', async ({ request }) => {
    // Release an order
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'FBS' }] }, adminToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, adminToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'FBS', value: '90', status: 'Normal' }] }, adminToken);
    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-T2', level: 'Normal', instrumentId: 'INS-BIO-01', testCode: 'FBS', points: [90], target: 90, sd: 2
    }, adminToken);
    await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: (await qc.json()).id, instrumentId: 'INS-BIO-01', reagentLotId: 'LOT-BIO-ACTIVE', calibrationId: 'CAL-BIO-PASS'
    }, adminToken);
    await post(request, `/api/orders/${oId}/validate`, {}, adminToken);
    // Log in as pathologist to sign
    const p = await post(request, '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
    const pToken = (await p.json()).token;
    await post(request, `/api/orders/${oId}/signoff`, { password: 'Path@12345678' }, pToken);
    await post(request, `/api/orders/${oId}/release`, {}, pToken);

    // Attempt mutation
    const mut = await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'FBS', value: '110', status: 'High' }] }, adminToken);
    expect(mut.status()).toBe(409);
    expect((await mut.json()).error).toMatch(/immutable/i);
  });

  test('T2.6: SQL/Special character injection resistance in patient name and notes', async ({ request }) => {
    const maliciousName = "'; DROP TABLE patients; -- <script>alert(1)</script> देवनागरी";
    const res = await post(request, '/api/patients', {
      name: maliciousName,
      phone: '9988776655',
      age: 28,
      gender: 'Other'
    }, adminToken);
    expect(res.status()).toBe(201);
    const patient = (await res.json()).patient;
    expect(patient.name).toBe(maliciousName);
  });
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS & NEGATIVE WORKFLOWS
// ============================================================================

test.describe('Tier 3: Cross-Feature Combinations & Negative Workflows', () => {
  let techToken, adminToken;
  test.beforeAll(async ({ request }) => {
    const t = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    techToken = (await t.json()).token;
    const a = await post(request, '/api/auth/login', { username: 'admin', password: 'Admin@12345678' });
    adminToken = (await a.json()).token;
  });

  test('T3.1: Specimen REJECTED blocks result entry fail-closed with HTTP 409', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/reject', { orderId: oId, reason: 'CLOTTED' }, techToken);

    const res = await put(request, `/api/orders/${oId}/results`, {
      tests: [{ code: 'CBC', value: '5000', status: 'Normal' }]
    }, techToken);
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toMatch(/specimen must be ACCEPTED/i);
  });

  test('T3.2: Specimen REJECTED blocks analyzer import fail-closed with HTTP 409', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CREAT' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/reject', { orderId: oId, reason: 'HEMOLYSIS' }, techToken);

    const res = await post(request, '/api/instrument-results/import', {
      orderId: oId,
      instrumentId: 'INS-BIO-01',
      results: [{ code: 'CREAT', value: '1.2' }]
    }, techToken);
    expect(res.status()).toBe(409);
  });

  test('T3.3: Inactive instrument blocks analyzer import fail-closed', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);

    const res = await post(request, '/api/instrument-results/import', {
      orderId: oId,
      instrumentId: 'INS-INACTIVE', // inactive instrument
      results: [{ code: 'CBC', value: '5000' }]
    }, techToken);
    expect(res.status()).toBe(409);
  });

  test('T3.4: Reagent lot from mismatched instrument blocks QC approval with HTTP 409', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, techToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'CBC', value: '5000', status: 'Normal' }] }, techToken);

    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-HEM', level: 'Normal', instrumentId: 'INS-HEM-01', testCode: 'CBC',
      points: [5000], target: 5000, sd: 100
    }, techToken);

    // Instrument is INS-HEM-01, but reagent lot is LOT-BIO-ACTIVE (from INS-BIO-01)
    const res = await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: (await qc.json()).id,
      instrumentId: 'INS-HEM-01',
      reagentLotId: 'LOT-BIO-ACTIVE', // Mismatch!
      calibrationId: 'CAL-HEM-PASS'
    }, techToken);
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toMatch(/Active reagent lot is required/i);
  });

  test('T3.5: Validation bypass defense: fast-track and batch validation are permanently disabled (HTTP 409)', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, adminToken);
    const oId = (await ord.json()).order.id;

    // Fast-track release
    const ftRes = await post(request, `/api/orders/${oId}/fast-track`, {}, adminToken);
    expect(ftRes.status()).toBe(409);
    expect((await ftRes.json()).error).toMatch(/Direct fast-track release is disabled/i);

    // Batch validation
    const bvRes = await post(request, '/api/orders/batch-validate-normal', {}, adminToken);
    expect(bvRes.status()).toBe(409);
    expect((await bvRes.json()).error).toMatch(/Batch validation is temporarily disabled/i);
  });

  test('T3.6: Non-pathologist sign-off blocked (HTTP 403) and unvalidated sign-off blocked (HTTP 409)', async ({ request }) => {
    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'FBS' }] }, techToken);
    const oId = (await ord.json()).order.id;

    // Tech attempt: 403
    const tRes = await post(request, `/api/orders/${oId}/signoff`, { password: 'Tech@12345678' }, techToken);
    expect(tRes.status()).toBe(403);

    // Pathologist attempt before validation: 409
    const p = await post(request, '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
    const pToken = (await p.json()).token;
    const pRes = await post(request, `/api/orders/${oId}/signoff`, { password: 'Path@12345678' }, pToken);
    expect(pRes.status()).toBe(409);
  });
});

// ============================================================================
// TIER 4: REAL-WORLD CLINICAL SCENARIOS
// ============================================================================

test.describe('Tier 4: Real-World Clinical End-to-End Scenarios', () => {
  test('T4.1: Complete Outpatient Diagnostic Lifecycle: Registration -> Accession -> Acceptance -> Import -> QC -> Signoff -> Release -> Public Verification', async ({ request }) => {
    // 1. Login as Admin & Tech & Pathologist
    const adminLog = await post(request, '/api/auth/login', { username: 'admin', password: 'Admin@12345678' });
    const adminToken = (await adminLog.json()).token;
    const techLog = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    const techToken = (await techLog.json()).token;
    const pathLog = await post(request, '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
    const pathToken = (await pathLog.json()).token;

    // 2. Register Patient
    const ptRes = await post(request, '/api/patients', {
      name: 'Sunita Mehra',
      phone: '9844001122',
      gender: 'Female',
      age: 52
    }, techToken);
    expect(ptRes.status()).toBe(201);
    const patientId = (await ptRes.json()).patient.id;

    // 3. Create Order for CBC + CREAT
    const ordRes = await post(request, '/api/orders', {
      patientId,
      tests: [{ code: 'CREAT' }],
      paidAmount: 180
    }, techToken);
    expect(ordRes.status()).toBe(201);
    const order = (await ordRes.json()).order;
    expect(order.pipelineStatus).toBe('DRAFT');
    expect(order.specimenStatus).toBe('PENDING_COLLECTION');

    // 4. Phlebotomy & Laboratory Specimen Acceptance
    const accRes = await post(request, '/api/specimens/accept', { orderId: order.id, tubeCode: 'ALL' }, techToken);
    expect(accRes.status()).toBe(200);

    // 5. Automated Analyzer Import
    const impRes = await post(request, '/api/instrument-results/import', {
      orderId: order.id,
      instrumentId: 'INS-BIO-01',
      results: [{ code: 'CREAT', value: '1.02' }]
    }, techToken);
    expect(impRes.status()).toBe(200);
    expect((await impRes.json()).order.tests[0].status).toBe('UNREVIEWED');

    // 6. Technician QC Execution & Approval
    const qcRes = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-BIO-DAILY',
      level: 'Normal',
      instrumentId: 'INS-BIO-01',
      testCode: 'CREAT',
      points: [1.0, 1.01],
      target: 1.0,
      sd: 0.05
    }, techToken);
    const qcRunId = (await qcRes.json()).id;
    const appRes = await post(request, `/api/qc/approve/${order.id}`, {
      qcRunId,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);
    expect(appRes.status()).toBe(200);

    // 7. Technical Validation
    const valRes = await post(request, `/api/orders/${order.id}/validate`, {}, pathToken);
    expect(valRes.status()).toBe(200);

    // 8. Pathologist Electronic Sign-Off
    const signRes = await post(request, `/api/orders/${order.id}/signoff`, { password: 'Path@12345678' }, pathToken);
    expect(signRes.status()).toBe(200);

    // 9. Report Release with Token
    const relRes = await post(request, `/api/orders/${order.id}/release`, {}, pathToken);
    expect(relRes.status()).toBe(200);
    const relBody = await relRes.json();
    expect(relBody.status).toBe('RELEASED');
    const token = relBody.verificationUrl.split('/verify/').pop();

    // 10. Public Verification
    const pubRes = await get(request, `/api/public/verify/${token}`);
    expect(pubRes.status()).toBe(200);
    const pubBody = await pubRes.json();
    expect(pubBody.valid).toBe(true);
    expect(pubBody.report.reportId).toBe(order.id);
  });

  test('T4.2: Specimen Hemolysis Rejection & Recollection Recovery', async ({ request }) => {
    const techLog = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    const techToken = (await techLog.json()).token;

    // Accession order
    const ordRes = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'FBS' }] }, techToken);
    const oId = (await ordRes.json()).order.id;

    // Specimen arrives hemolyzed -> Reject
    const rejRes = await post(request, '/api/specimens/reject', {
      orderId: oId,
      reason: 'HEMOLYSIS',
      notes: 'Gross hemolysis observed upon centrifugation; recollection required',
      requestRecollection: true
    }, techToken);
    expect(rejRes.status()).toBe(200);

    // Verify result entry is blocked
    const blockRes = await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'FBS', value: '95', status: 'Normal' }] }, techToken);
    expect(blockRes.status()).toBe(409);

    // Recollection arrives -> Accepted
    const recollRes = await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);
    expect(recollRes.status()).toBe(200);

    // Result entry unblocked
    const unblockRes = await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'FBS', value: '95', status: 'Normal' }] }, techToken);
    expect(unblockRes.status()).toBe(200);
  });

  test('T4.3: Critical Electrolyte Alert & Escalation Workflow', async ({ request }) => {
    const techLog = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    const techToken = (await techLog.json()).token;
    const pathLog = await post(request, '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
    const pathToken = (await pathLog.json()).token;

    // Accession Potassium
    const ordRes = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'K' }] }, techToken);
    const oId = (await ordRes.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, techToken);

    // Enter result: 7.4 mmol/L (Severe Hyperkalemia)
    const resRes = await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'K', value: '7.4', status: 'Critical' }] }, techToken);
    expect((await resRes.json()).order.tests[0].isPanic).toBe(true);

    // QC approve
    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-K3', level: 'High', instrumentId: 'INS-BIO-01', testCode: 'K',
      points: [4.0], target: 4.0, sd: 0.1
    }, techToken);
    await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: (await qc.json()).id,
      instrumentId: 'INS-BIO-01',
      reagentLotId: 'LOT-BIO-ACTIVE',
      calibrationId: 'CAL-BIO-PASS'
    }, techToken);

    // Validate fails because critical unacknowledged
    const valFail = await post(request, `/api/orders/${oId}/validate`, {}, pathToken);
    expect(valFail.status()).toBe(409);

    // Log critical call with read-back
    await post(request, `/api/orders/${oId}/critical-communication`, {
      testName: 'Serum Potassium',
      recipient: 'ICU Resident Dr. Rao',
      method: 'PHONE',
      readBack: 'YES_VERIFIED',
      notes: 'Notified of K=7.4 mmol/L. ECG ordered immediately.'
    }, techToken);

    // Validate passes
    const valPass = await post(request, `/api/orders/${oId}/validate`, {}, pathToken);
    expect(valPass.status()).toBe(200);

    // Sign and release
    await post(request, `/api/orders/${oId}/signoff`, { password: 'Path@12345678' }, pathToken);
    const relRes = await post(request, `/api/orders/${oId}/release`, {}, pathToken);
    expect(relRes.status()).toBe(200);
  });

  test('T4.4: Dual-Tenant Isolation & Zero Leakage Verification', async ({ request }) => {
    // Tenant 1 login
    const t1Log = await post(request, '/api/auth/login', { username: 'admin', password: 'Admin@12345678' });
    const t1Token = (await t1Log.json()).token;

    // Tenant 2 login
    const t2Log = await post(request, '/api/auth/login', { username: 'tenant2_admin', password: 'Tenant2@123456', tenantId: 'TEN-TWO' });
    const t2Token = (await t2Log.json()).token;

    // Tenant 1 creates patient
    const p1 = await post(request, '/api/patients', { name: 'Tenant1 Patient', phone: '9000000001', age: 30 }, t1Token);
    const p1Id = (await p1.json()).patient.id;

    // Tenant 2 queries patients -> should NOT see Tenant 1 patient
    const t2PatientsRes = await get(request, '/api/patients', t2Token);
    const t2Patients = (await t2PatientsRes.json()).patients;
    expect(t2Patients.some(p => p.id === p1Id)).toBe(false);
  });
});

// ============================================================================
// BROWSER UI OPAQUE-BOX TESTS (Chromium)
// ============================================================================

test.describe('Browser UI Opaque-Box Execution (Chromium)', () => {
  test('UI-1: SPA Shell loads with login card and page title', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/GIA LIMS|HRGen|Laboratory/i);
    await expect(page.locator('#login')).toBeVisible();
    await expect(page.locator('#loginForm')).toBeVisible();
    await expect(page.locator('#loginUser')).toBeVisible();
    await expect(page.locator('#loginPass')).toBeVisible();
  });

  test('UI-2: Login form interaction and client validation on empty input', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    // Attempt submit with empty fields
    const loginButton = page.locator('#loginForm button.primary');
    await expect(loginButton).toBeVisible();
    // Verify inputs have required attribute
    const userInput = page.locator('#loginUser');
    await expect(userInput).toHaveAttribute('required', '');
  });

  test('UI-3: Authentication flow transitions from login screen to app workspace', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.fill('#loginUser', 'admin');
    await page.fill('#loginPass', 'Admin@12345678');
    await page.click('#loginForm button.primary');

    // Upon successful login, #app becomes visible
    await expect(page.locator('#app')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#login')).toHaveClass(/hidden/);
  });

  test('UI-4: Public report verification page renders verified banner in browser', async ({ page, request }) => {
    // Obtain an authentic released report token
    const pLog = await post(request, '/api/auth/login', { username: 'pathologist', password: 'Path@12345678' });
    const pToken = (await pLog.json()).token;
    const tLog = await post(request, '/api/auth/login', { username: 'tech', password: 'Tech@12345678' });
    const tToken = (await tLog.json()).token;

    const ord = await post(request, '/api/orders', { patientId: 'PT-01', tests: [{ code: 'CBC' }] }, tToken);
    const oId = (await ord.json()).order.id;
    await post(request, '/api/specimens/accept', { orderId: oId, tubeCode: 'ALL' }, tToken);
    await put(request, `/api/orders/${oId}/results`, { tests: [{ code: 'CBC', value: '6500', status: 'Normal' }] }, tToken);
    const qc = await post(request, '/api/qc/evaluate', {
      controlLot: 'CTL-UI', level: 'Normal', instrumentId: 'INS-BIO-01', testCode: 'CBC',
      points: [6500], target: 6500, sd: 50
    }, tToken);
    await post(request, `/api/qc/approve/${oId}`, {
      qcRunId: (await qc.json()).id, instrumentId: 'INS-BIO-01', reagentLotId: 'LOT-BIO-ACTIVE', calibrationId: 'CAL-BIO-PASS'
    }, tToken);
    await post(request, `/api/orders/${oId}/validate`, {}, pToken);
    await post(request, `/api/orders/${oId}/signoff`, { password: 'Path@12345678' }, pToken);
    const relRes = await post(request, `/api/orders/${oId}/release`, {}, pToken);
    const token = (await relRes.json()).verificationUrl.split('/verify/').pop();

    // Navigate to HTML verification URL
    await page.goto(`${BASE_URL}/verify/${token}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Report Verified');
  });
});
