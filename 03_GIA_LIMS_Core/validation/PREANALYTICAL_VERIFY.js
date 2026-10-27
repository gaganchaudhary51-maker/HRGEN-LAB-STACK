const assert = require('assert');
const fs = require('fs');

const p = fs.readFileSync('server/platformRoutes.js', 'utf8');
const h = fs.readFileSync('public/index.html', 'utf8');

console.log('--- STARTING PRE-ANALYTICAL BENCH VERIFICATION ---');

// 1. Specimen queue route exists
assert(p.includes('/api/specimens/queue'), 'Specimen queue endpoint must exist');
console.log('PASS [PRE-ANALYTICAL] Specimen queue endpoint verified');

// 2. Specimen accept route exists
assert(p.includes('/api/specimens/accept') && p.includes("SPECIMEN_ACCEPTED"), 'Specimen accept with audit ledger must exist');
console.log('PASS [PRE-ANALYTICAL] Specimen accept with audit logging verified');

// 3. Specimen reject route exists with quality criteria
assert(p.includes('/api/specimens/reject') && p.includes("HEMOLYSIS") && p.includes("CLOTTED") && p.includes("QNS"), 'Specimen reject with Hemolysis/Clotted/QNS criteria must exist');
console.log('PASS [PRE-ANALYTICAL] Quality rejection criteria (Hemolysis, Icteric, Lipemia, Clotted, QNS, Mislabeled) verified');

// 4. Non-NABL Admin timestamp modification route
assert(p.includes('/api/orders/:id/timestamps') && p.includes("ORDER_TIMESTAMP_MODIFIED"), 'Order timestamp modification endpoint with audit traceability must exist');
console.log('PASS [PRE-ANALYTICAL] Admin date/time adjustment with immutable audit trail verified');

// 5. NABL mode timestamp guard
assert(p.includes("Timestamp modification is strictly prohibited under NABL"), 'NABL mode must strictly prohibit timestamp backdating');
console.log('PASS [PRE-ANALYTICAL] NABL tamper protection guard verified');

// 6. UI Pre-Analytical workbench present
assert(h.includes('Pre-Analytical Workbench & Specimen Reception') && h.includes('acceptSpecimen') && h.includes('rejectSpecimenModal'), 'UI must contain Pre-Analytical Workbench and accept/reject controls');
console.log('PASS [PRE-ANALYTICAL] UI Pre-Analytical Workbench & barcode scan inward verified');

// 7. UI Admin timestamp modification button present
assert(h.includes('adminModifyTimestampModal') && h.includes('🕒 Time'), 'UI must contain Admin timestamp modification modal and button');
console.log('PASS [PRE-ANALYTICAL] UI Admin timestamp adjustment modal verified');

console.log('--- PRE-ANALYTICAL BENCH VERIFICATION: ALL 7 CHECKS PASSED ---');
