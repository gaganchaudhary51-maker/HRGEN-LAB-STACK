const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const EVIDENCE_DIR = __dirname;

const TASKS = [
  {
    cmd: 'npm run qa:all',
    logFile: path.join(EVIDENCE_DIR, 'npm_qa_all.log')
  },
  {
    cmd: 'npm run forensic',
    logFile: path.join(EVIDENCE_DIR, 'npm_forensic.log')
  },
  {
    cmd: 'npm run build77',
    logFile: path.join(EVIDENCE_DIR, 'npm_build77.log')
  },
  {
    cmd: 'npm run verify:final',
    logFile: path.join(EVIDENCE_DIR, 'npm_verify_final.log')
  },
  {
    cmd: 'npm test',
    logFile: path.join(EVIDENCE_DIR, 'npm_test.log')
  },
  {
    cmd: 'npx playwright test',
    logFile: path.join(EVIDENCE_DIR, 'playwright_e2e.log')
  },
  {
    cmd: 'node validation/TENANT_RLS_STATIC_VERIFY.js',
    logFile: path.join(EVIDENCE_DIR, 'tenant_rls_static.log')
  },
  {
    cmd: 'node validation/CLINICAL_GATE_FIX_VERIFY.js',
    logFile: path.join(EVIDENCE_DIR, 'clinical_gate_fix.log')
  },
  {
    cmd: 'node QA_QC_BREAK_IT.js',
    logFile: path.join(EVIDENCE_DIR, 'qa_qc_break_it.log')
  },
  {
    cmd: 'node validation/RUN_LIVE_POSTGRES_RLS_SUITE.js',
    logFile: path.join(EVIDENCE_DIR, 'live_postgres_rls_suite.log')
  },
  {
    cmd: 'node validation/GEMINI_SANDBOX_VERIFY.js',
    logFile: path.join(EVIDENCE_DIR, 'gemini_sandbox_verify.log')
  }
];

function sanitizeAnsi(str) {
  if (!str) return '';
  // Strip ANSI escape sequences
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

console.log('=== HRGen GIA LIMS Live Verification Evidence Capture ===');
console.log(`Working Directory: ${ROOT_DIR}`);
console.log(`Target Evidence Directory: ${EVIDENCE_DIR}\n`);

const results = [];

for (const t of TASKS) {
  console.log(`>>> Executing: ${t.cmd}`);
  const startTime = new Date();
  const startIso = startTime.toISOString();

  const child = spawnSync(t.cmd, {
    cwd: ROOT_DIR,
    shell: true,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024 // 50MB
  });

  const endTime = new Date();
  const endIso = endTime.toISOString();
  const durationMs = endTime.getTime() - startTime.getTime();
  const exitCode = child.status !== null ? child.status : (child.error ? 1 : 0);

  const rawOut = (child.stdout || '') + (child.stderr ? '\n[STDERR]\n' + child.stderr : '');
  const sanitizedOutput = sanitizeAnsi(rawOut).replace(/\r\n/g, '\n');

  const logContent = [
    '================================================================================',
    `COMMAND: ${t.cmd}`,
    `CWD: ${ROOT_DIR}`,
    `START TIME (UTC): ${startIso}`,
    '================================================================================',
    sanitizedOutput.trim(),
    '================================================================================',
    `END TIME (UTC): ${endIso}`,
    `DURATION: ${durationMs} ms`,
    `EXIT CODE: ${exitCode}`,
    `STATUS: ${exitCode === 0 ? 'PASS' : 'FAIL'}`,
    '================================================================================',
    ''
  ].join('\n');

  fs.writeFileSync(t.logFile, logContent, 'utf8');
  console.log(`    Exit Code: ${exitCode} | Duration: ${durationMs}ms | Saved to: ${path.basename(t.logFile)}`);

  results.push({
    cmd: t.cmd,
    logFile: path.basename(t.logFile),
    startIso,
    endIso,
    durationMs,
    exitCode,
    status: exitCode === 0 ? 'PASS' : 'FAIL'
  });
}

const summaryFile = path.join(EVIDENCE_DIR, 'execution_summary.json');
fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2), 'utf8');

console.log('\n=== All tasks completed ===');
console.table(results);
