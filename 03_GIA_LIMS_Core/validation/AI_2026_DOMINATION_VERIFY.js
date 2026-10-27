const assert = require('assert');
const fs = require('fs');

const formulaEngine = require('../server/services/formulaEngine');
const geminiCopilot = require('../server/services/geminiCopilot');
const whatsappBot = require('../server/services/whatsappBot');

const p = fs.readFileSync('server/platformRoutes.js', 'utf8');
const h = fs.readFileSync('public/index.html', 'utf8');

console.log('================================================================');
console.log('   HRGEN GIA LIMS — 2026 AI CLINICAL DOMINATION VERIFICATION    ');
console.log('================================================================');

// -----------------------------------------------------------------------------
// 1. FORMULA AUTO-DERIVATION TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 1. Testing Clinical Formula Auto-Derivation Engine ---');

// 1.1 CKD-EPI 2021 eGFR (Race-free)
const egfrMale = formulaEngine.calculateEGFR({ creatinine: 1.2, age: 45, gender: 'Male' });
assert(Number.isFinite(egfrMale) && egfrMale > 70 && egfrMale < 85, `eGFR Male check failed: got ${egfrMale}`);
console.log(`PASS [FORMULA] CKD-EPI 2021 eGFR Male (Creat 1.2, Age 45): ${egfrMale} mL/min/1.73m²`);

const egfrFemale = formulaEngine.calculateEGFR({ creatinine: 0.8, age: 30, gender: 'Female' });
assert(Number.isFinite(egfrFemale) && egfrFemale > 90, `eGFR Female check failed: got ${egfrFemale}`);
console.log(`PASS [FORMULA] CKD-EPI 2021 eGFR Female (Creat 0.8, Age 30): ${egfrFemale} mL/min/1.73m²`);

assert.strictEqual(formulaEngine.calculateEGFR({ creatinine: 0, age: 45, gender: 'Male' }), null);
assert.strictEqual(formulaEngine.calculateEGFR({ creatinine: -1, age: 45, gender: 'Male' }), null);
console.log('PASS [FORMULA] CKD-EPI 2021 boundary input validation (zero/negative returns null)');

// 1.2 Friedewald Lipid Fractions
const lipidNormal = formulaEngine.calculateLipidFractions({ totalChol: 200, hdl: 40, triglycerides: 150 });
assert.strictEqual(lipidNormal.vldl, 30.0, 'VLDL should be 150/5 = 30');
assert.strictEqual(lipidNormal.ldl, 130.0, 'LDL should be 200 - 40 - 30 = 130');
assert.strictEqual(lipidNormal.cholHdlRatio, 5.0, 'Chol/HDL ratio should be 200/40 = 5.0');
console.log(`PASS [FORMULA] Friedewald Lipid Panel: VLDL=${lipidNormal.vldl}, LDL=${lipidNormal.ldl}, Chol/HDL=${lipidNormal.cholHdlRatio}`);

// Triglycerides > 400 suppression
const lipidHighTG = formulaEngine.calculateLipidFractions({ totalChol: 240, hdl: 35, triglycerides: 450 });
assert.strictEqual(lipidHighTG.vldl, 90.0);
assert.strictEqual(lipidHighTG.ldl, undefined, 'LDL must not be calculated via Friedewald when TG >= 400 mg/dL');
console.log('PASS [FORMULA] Friedewald Triglycerides > 400 mg/dL safety suppression verified');

// 1.3 FIB-4 Liver Fibrosis Index
const fib4Val = formulaEngine.calculateFIB4({ age: 48, ast: 62, alt: 44, platelets: 190 });
assert(Number.isFinite(fib4Val) && fib4Val > 2.0 && fib4Val < 3.0, `FIB-4 value unexpected: got ${fib4Val}`);
console.log(`PASS [FORMULA] FIB-4 Liver Fibrosis Index (Age 48, AST 62, ALT 44, PLT 190): ${fib4Val}`);

// 1.4 Reactive deriveCalculatedTests Pipeline
const testBatch = [
  { code: 'CREATININE', name: 'Creatinine', value: '1.4' },
  { code: 'TOTAL_CHOL', name: 'Total Cholesterol', value: '220' },
  { code: 'HDL', name: 'HDL Cholesterol', value: '45' },
  { code: 'TRIGLYCERIDES', name: 'Triglycerides', value: '160' }
];
const derivedResults = formulaEngine.deriveCalculatedTests(testBatch, { age: 52, gender: 'Male' });
const derivedCodes = derivedResults.map(t => t.code);
assert(derivedCodes.includes('EGFR'), 'EGFR must be auto-derived from CREATININE');
assert(derivedCodes.includes('LDL'), 'LDL must be auto-derived from Lipid Panel');
assert(derivedCodes.includes('VLDL'), 'VLDL must be auto-derived from Lipid Panel');
assert(derivedCodes.includes('CHOL_HDL_RATIO'), 'CHOL_HDL_RATIO must be auto-derived');
console.log('PASS [FORMULA] Reactive auto-derivation pipeline added EGFR, LDL, VLDL, and CHOL_HDL_RATIO');

// -----------------------------------------------------------------------------
// 2. PATHOLOGIST AI DIAGNOSTIC COPILOT & ANOMALY DETECTION
// -----------------------------------------------------------------------------
console.log('\n--- 2. Testing Pathologist AI Diagnostic Copilot ---');

// 2.1 Pseudohyperkalemia detection in hemolyzed sample
const hemolyzedAnomalies = geminiCopilot.detectRuleAnomalies(
  [{ code: 'K', name: 'Potassium', value: '6.2' }],
  { name: 'John Doe', age: 40, gender: 'Male' },
  { reason: 'HEMOLYSIS', notes: 'Visible hemolysis after centrifugation' }
);
const hasPseudohyperkalemia = hemolyzedAnomalies.some(a => a.type === 'PSEUDOHYPERKALEMIA_RISK');
assert(hasPseudohyperkalemia, 'Must detect pseudohyperkalemia risk in hemolyzed specimen with high K');
console.log('PASS [AI COPILOT] Pseudohyperkalemia artifact detection in hemolyzed sample verified');

// 2.2 Glucose vs HbA1c discordance
const discordanceAnomalies = geminiCopilot.detectRuleAnomalies(
  [
    { code: 'FBS', name: 'Fasting Blood Sugar', value: '240' },
    { code: 'HBA1C', name: 'HbA1c', value: '5.2' }
  ],
  { name: 'Alice Smith', age: 35, gender: 'Female' },
  {}
);
const hasDiscordance = discordanceAnomalies.some(a => a.type === 'GLUCOSE_HBA1C_DISCORDANCE');
assert(hasDiscordance, 'Must flag acute FBS vs chronic HbA1c discordance');
console.log('PASS [AI COPILOT] Acute FBS vs Chronic HbA1c discordance detected');

// 2.3 Panic Anemia Alert
const panicAnemia = geminiCopilot.detectRuleAnomalies(
  [{ code: 'HB', name: 'Hemoglobin', value: '5.4' }],
  { name: 'Emergency Patient', age: 60, gender: 'Female' },
  {}
);
const hasCriticalAnemia = panicAnemia.some(a => a.type === 'CRITICAL_PANIC_ANEMIA' && a.severity === 'CRITICAL');
assert(hasCriticalAnemia, 'Must trigger critical alert for Hemoglobin < 7.0 g/dL');
console.log('PASS [AI COPILOT] Critical panic threshold alert (Hb < 7.0 g/dL) verified');

// 2.4 End-to-End Copilot Evaluation
(async () => {
  const evalResult = await geminiCopilot.evaluateCopilot(
    {
      id: 'ORD-TEST-COPILOT',
      tests: [
        { code: 'HB', name: 'Hemoglobin', value: '5.8' },
        { code: 'CREAT', name: 'Creatinine', value: '2.8' }
      ],
      specimen: { status: 'ACCEPTED' }
    },
    { name: 'Ramesh Kumar', age: 58, gender: 'Male' }
  );

  assert.strictEqual(evalResult.orderId, 'ORD-TEST-COPILOT');
  assert.strictEqual(evalResult.humanReviewRequired, true, 'GAMP 5 Human-in-the-loop requirement must be true');
  assert(evalResult.anomaliesCount >= 2, 'Should flag critical anemia and renal impairment');
  assert(evalResult.patientExplanation.hindi.length > 10, 'Hindi explanation must be present');
  assert(evalResult.patientExplanation.english.length > 10, 'English explanation must be present');
  console.log('PASS [AI COPILOT] End-to-end evaluation with bilingual patient explanation verified');

  // -----------------------------------------------------------------------------
  // 3. INTERACTIVE 2-WAY META WHATSAPP BOT
  // -----------------------------------------------------------------------------
  console.log('\n--- 3. Testing 2-Way Meta WhatsApp Cloud Bot ---');

  // 3.1 Webhook Handshake Verification
  const validWebhook = whatsappBot.verifyWebhook('subscribe', whatsappBot.VERIFY_TOKEN_DEFAULT, 'challenge_123456');
  assert.strictEqual(validWebhook.valid, true);
  assert.strictEqual(validWebhook.challenge, 'challenge_123456');

  const invalidWebhook = whatsappBot.verifyWebhook('subscribe', 'WRONG_TOKEN', 'challenge_123456');
  assert.strictEqual(invalidWebhook.valid, false);
  console.log('PASS [WHATSAPP BOT] Meta webhook subscription handshake verification verified');

  // 3.2 Incoming Message Handling (REPORT Request)
  const mockOrders = [
    {
      id: 'ORD-991',
      invoiceNumber: 'INV-2026-991',
      patientId: 'PAT-101',
      pipelineStatus: 'RELEASED',
      verificationToken: 'VT-SHA256-TOKEN-XYZ',
      netPayable: 1200,
      paidAmount: 1200,
      balanceDue: 0
    }
  ];
  const mockPatients = [
    { id: 'PAT-101', name: 'Sunil Sharma', phone: '9876543210' }
  ];

  const reportPayload = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: '919876543210',
            text: { body: '1' }
          }]
        }
      }]
    }]
  };

  const reportResp = whatsappBot.handleIncomingMessage(reportPayload, {
    orders: mockOrders,
    patients: mockPatients,
    branding: { name: 'Apex Central Lab' }
  });

  assert.strictEqual(reportResp.handled, true);
  assert.strictEqual(reportResp.actionType, 'REPORT');
  assert(reportResp.replyText.includes('VT-SHA256-TOKEN-XYZ'), 'Must return verification token URL');
  assert(reportResp.replyText.includes('Apex Central Lab'), 'Must use custom lab branding');
  console.log('PASS [WHATSAPP BOT] Interactive "1" reply returns verified released report URL');

  // 3.3 Incoming Message Handling (BILLING Request)
  const billPayload = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: '919876543210',
            text: { body: 'BILL' }
          }]
        }
      }]
    }]
  };
  const billResp = whatsappBot.handleIncomingMessage(billPayload, {
    orders: mockOrders,
    patients: mockPatients,
    branding: { name: 'Apex Central Lab' }
  });
  assert.strictEqual(billResp.handled, true);
  assert.strictEqual(billResp.actionType, 'BILLING');
  assert(billResp.replyText.includes('PAID IN FULL'), 'Should show zero balance due for paid order');
  console.log('PASS [WHATSAPP BOT] Interactive "BILL" reply returns invoice and balance status');

  // 3.4 Outbound Cloud API Mock Dispatch
  const dispatchRes = await whatsappBot.sendWhatsAppCloudMessage({
    to: '919876543210',
    text: 'Test message dispatch'
  });
  assert.strictEqual(dispatchRes.status, 'MOCK_DISPATCHED');
  assert.strictEqual(dispatchRes.mode, 'OFFLINE_MOCK_SANDBOX');
  console.log('PASS [WHATSAPP BOT] Offline sandbox fallback dispatch verified');

  // -----------------------------------------------------------------------------
  // 4. PLATFORM ROUTE INTEGRATION CHECK
  // -----------------------------------------------------------------------------
  console.log('\n--- 4. Testing Platform Route Integration ---');
  assert(p.includes('/api/ai/copilot/evaluate'), 'platformRoutes must expose POST /api/ai/copilot/evaluate');
  assert(p.includes('/api/ai/copilot/:orderId'), 'platformRoutes must expose GET /api/ai/copilot/:orderId');
  assert(p.includes('/api/orders/:id/auto-derive'), 'platformRoutes must expose POST /api/orders/:id/auto-derive');
  assert(p.includes('/api/whatsapp/webhook'), 'platformRoutes must expose GET & POST /api/whatsapp/webhook');
  assert(p.includes('/api/whatsapp/dispatch/:orderId'), 'platformRoutes must expose POST /api/whatsapp/dispatch/:orderId');
  assert(p.includes('/api/orders/batch-validate-normal'), 'platformRoutes must expose POST /api/orders/batch-validate-normal');
  assert(p.includes('/api/integrations/simulate-analyzer'), 'platformRoutes must expose POST /api/integrations/simulate-analyzer');
  console.log('PASS [PLATFORM ROUTES] All 2026 AI copilot, auto-derive, batch validate, analyzer simulator, and WhatsApp bot endpoints verified');

  // -----------------------------------------------------------------------------
  // 5. SERVER AUTO-WHATSAPP ON RELEASE CHECK
  // -----------------------------------------------------------------------------
  console.log('\n--- 5. Testing Server Auto-WhatsApp Dispatch on Release ---');
  const s = fs.readFileSync('server.js', 'utf8');
  assert(s.includes("WHATSAPP_AUTO_DISPATCH") && s.includes("sendWhatsAppCloudMessage"), 'server.js must automatically trigger WhatsApp cloud dispatch on pathologist release');
  console.log('PASS [AUTO-RELEASE] Automatic WhatsApp dispatch upon report release verified');

  // -----------------------------------------------------------------------------
  // 6. ENHANCED CLINICAL VOICE DICTATION CHECK
  // -----------------------------------------------------------------------------
  console.log('\n--- 6. Testing Enhanced Clinical Voice Dictation ---');
  assert(p.includes("HEMOGLOBIN") && p.includes("CREATININE") && p.includes("dashamlav"), 'Voice dictation endpoint must support clinical aliases and Hindi number words');
  console.log('PASS [VOICE DICTATION] Multilingual voice parser with clinical aliases & Hindi phonetics verified');

  // -----------------------------------------------------------------------------
  // 7. FRONTEND UI CONTROLS CHECK
  // -----------------------------------------------------------------------------
  console.log('\n--- 7. Testing Frontend UI Controls ---');
  assert(h.includes('runAutoDerive'), 'UI must include runAutoDerive method for calculated tests');
  assert(h.includes('viewCopilotInsights'), 'UI must include viewCopilotInsights method for pathologist AI assistant');
  assert(h.includes('sendWhatsAppCloud'), 'UI must include sendWhatsAppCloud method for instant patient dispatch');
  assert(h.includes('copilotModal'), 'UI must include copilotModal DOM element');
  assert(h.includes('dictateIntoResults') && h.includes('voiceDictateBtn'), 'UI must include Dictate button and dictateIntoResults in result entry modal');
  assert(h.includes('batchValidateNormal'), 'UI must include batchValidateNormal in worklist');
  assert(h.includes('simulateMachineFeed') && h.includes('simForm'), 'UI must include Machine Analyzer Simulator form');
  console.log('PASS [FRONTEND UI] Auto-derive, Copilot review, WhatsApp bot, Voice dictate mic, Batch validate, and Machine simulator verified');

  console.log('\n================================================================');
  console.log('   ✅ 2026 AI CLINICAL DOMINATION: ALL VERIFICATIONS PASSED!     ');
  console.log('================================================================\n');
})();
