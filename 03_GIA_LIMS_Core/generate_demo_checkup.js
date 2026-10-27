const fs = require('fs');
const crypto = require('crypto');
const opdService = require('./server/services/opdService');

const AUTH_SECRET = 'PRODUCTION_GRADE_HMAC_KEY_2026';

const patient = {
  uhid: 'APX-2026-FB97184',
  title: 'Mr.',
  name: 'Rahul Sharma',
  phone: '9718401811',
  age: 42,
  ageExact: { years: 42, months: 4, days: 12, display: '42Y 4M 12D' },
  gender: 'Male',
  referredBy: 'Dr. A. K. Verma, MD (Consultant Physician)'
};

const catalog = [
  { code: 'CBC', name: 'Complete Blood Count (CBC)', department: 'Hematology', price: 350 },
  { code: 'FBS', name: 'Fasting Blood Glucose', department: 'Biochemistry', price: 100 },
  { code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c - HPLC)', department: 'Biochemistry', price: 500 },
  { code: 'CHOL', name: 'Total Cholesterol', department: 'Biochemistry', price: 200 },
  { code: 'TRIG', name: 'Serum Triglycerides', department: 'Biochemistry', price: 250 },
  { code: 'HDL', name: 'HDL Cholesterol (Direct)', department: 'Biochemistry', price: 250 },
  { code: 'CREAT', name: 'Serum Creatinine', department: 'Biochemistry', price: 200 },
  { code: 'UREA', name: 'Blood Urea Nitrogen / Urea', department: 'Biochemistry', price: 200 },
  { code: 'URIC_ACID', name: 'Serum Uric Acid', department: 'Biochemistry', price: 200 },
  { code: 'BILI_TOTAL', name: 'Total Bilirubin', department: 'Biochemistry', price: 150 },
  { code: 'SGOT', name: 'SGOT / AST (Aspartate Aminotransferase)', department: 'Biochemistry', price: 200 },
  { code: 'SGPT', name: 'SGPT / ALT (Alanine Aminotransferase)', department: 'Biochemistry', price: 200 },
  { code: 'ALP', name: 'Alkaline Phosphatase (ALP)', department: 'Biochemistry', price: 200 },
  { code: 'TSH', name: 'TSH (Thyroid Stimulating Hormone CLIA)', department: 'Immunology', price: 350 },
  { code: 'VIT-D', name: 'Vitamin D 25-Hydroxy Total', department: 'Vitamins', price: 1200 },
  { code: 'VIT-B12', name: 'Vitamin B12 (Cyanocobalamin ECLIA)', department: 'Vitamins', price: 900 }
];

const pricing = opdService.calculatePricing(catalog, 'PERCENTAGE', 15);
const payment = opdService.calculateDue(pricing.net, 4000);

const testsWithResults = [
  { code: 'CBC', name: 'Complete Blood Count (CBC)', value: '14.6 g/dL (Hb)', unit: 'g/dL', reference: '13.0 - 17.0', status: 'Normal', method: 'Sysmex XN-550 Automated' },
  { code: 'FBS', name: 'Fasting Blood Glucose', value: '94', unit: 'mg/dL', reference: '70 - 99', status: 'Normal', method: 'Hexokinase' },
  { code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c - HPLC)', value: '5.4', unit: '%', reference: '< 5.7', status: 'Normal', method: 'Bio-Rad D-10 HPLC' },
  { code: 'CHOL', name: 'Total Cholesterol', value: '182', unit: 'mg/dL', reference: '< 200', status: 'Normal', method: 'Cholesterol Oxidase' },
  { code: 'TRIG', name: 'Serum Triglycerides', value: '138', unit: 'mg/dL', reference: '< 150', status: 'Normal', method: 'GPO-PAP' },
  { code: 'HDL', name: 'HDL Cholesterol (Direct)', value: '52', unit: 'mg/dL', reference: '> 40', status: 'Normal', method: 'Direct Accelerator Detergent' },
  { code: 'VLDL', name: 'VLDL Cholesterol (Auto-Derived)', value: '27.6', unit: 'mg/dL', reference: '< 30.0', status: 'Normal', method: 'Friedewald Formula (TG / 5)' },
  { code: 'LDL', name: 'LDL Cholesterol (Auto-Derived)', value: '102.4', unit: 'mg/dL', reference: '< 100.0', status: 'Normal', method: 'Friedewald Formula' },
  { code: 'CREAT', name: 'Serum Creatinine', value: '0.92', unit: 'mg/dL', reference: '0.70 - 1.30', status: 'Normal', method: 'Jaffe Alkaline Picrate' },
  { code: 'EGFR', name: 'eGFR (Estimated GFR - Auto-Derived)', value: '98.4', unit: 'mL/min/1.73m²', reference: '≥ 90.0', status: 'Normal', method: 'CKD-EPI 2021 Equation' },
  { code: 'UREA', name: 'Blood Urea Nitrogen / Urea', value: '26.4', unit: 'mg/dL', reference: '15.0 - 45.0', status: 'Normal', method: 'GLDH Kinetic' },
  { code: 'URIC_ACID', name: 'Serum Uric Acid', value: '5.1', unit: 'mg/dL', reference: '3.5 - 7.2', status: 'Normal', method: 'Uricase PAP' },
  { code: 'BILI_TOTAL', name: 'Total Bilirubin', value: '0.74', unit: 'mg/dL', reference: '0.2 - 1.2', status: 'Normal', method: 'Diazo Method' },
  { code: 'SGOT', name: 'SGOT / AST', value: '24', unit: 'U/L', reference: '< 40', status: 'Normal', method: 'IFCC UV without P5P' },
  { code: 'SGPT', name: 'SGPT / ALT', value: '28', unit: 'U/L', reference: '< 41', status: 'Normal', method: 'IFCC UV without P5P' },
  { code: 'FIB-4', name: 'FIB-4 Liver Fibrosis Index (Auto-Derived)', value: '1.02', unit: 'Score', reference: '< 1.45 (Low Risk)', status: 'Normal', method: 'Sterling Formula' },
  { code: 'ALP', name: 'Alkaline Phosphatase (ALP)', value: '78', unit: 'U/L', reference: '40 - 129', status: 'Normal', method: 'p-NPP Kinetic' },
  { code: 'TSH', name: 'TSH (Thyroid Stimulating Hormone)', value: '2.18', unit: 'uIU/mL', reference: '0.35 - 4.94', status: 'Normal', method: 'CLIA Chemiluminescence' },
  { code: 'VIT-D', name: 'Vitamin D 25-Hydroxy Total', value: '38.6', unit: 'ng/mL', reference: '30.0 - 100.0 (Sufficient)', status: 'Normal', method: 'CLIA Chemiluminescence' },
  { code: 'VIT-B12', name: 'Vitamin B12 (Cyanocobalamin)', value: '465', unit: 'pg/mL', reference: '211 - 911', status: 'Normal', method: 'ECLIA Electro-Chemiluminescence' }
];

const accessionNumber = 'ACC-2026-971841';
const invoiceNumber = 'INV-2026-971841';
const barcode = 'APX-LAB-FB97184';
const verificationToken = 'vtok_' + crypto.randomBytes(18).toString('base64url');
const releasedAt = new Date().toISOString();

const reportSnapshot = {
  schemaVersion: 2,
  reportId: 'ORD-FB97184',
  barcode,
  accessionNumber,
  invoiceNumber,
  reportVersion: 1,
  patient,
  tests: testsWithResults,
  qc: {
    westgardStatus: 'PASS',
    controlLot: 'BIO-RAD-LIQ-L1',
    instrumentId: 'BENCH-MULTI-ANALYZER',
    calibrationId: 'CAL-2026-PASS',
    reviewedBy: 'Authorized Pathologist'
  },
  validation: {
    validatedBy: 'pathologist',
    validatedAt: releasedAt,
    ruleset: 'CLINICAL_AUTO_DERIVED_WESTGARD_v1'
  },
  signoff: {
    pathologist: 'Dr. Sameer Saxena',
    pathologistQualification: 'MD (Pathology), DNB',
    pathologistMci: 'DMC/R/18492',
    signatureMethod: 'REAUTHENTICATED_SERVER_CREDENTIAL',
    signatureId: 'SIG-' + crypto.randomBytes(6).toString('hex').toUpperCase()
  },
  releasedAt,
  lab: {
    name: 'HRGen Apex Diagnostic Center & Reference Laboratory',
    address: 'Plot 42, Health City, Sector 18, Gurugram, NCR - 122001',
    phone: '+91-124-4982100 / +91-9718401811',
    email: 'reports@apexdiagnostic.in',
    nablReg: 'NABL MC-2984 / ISO 15189:2022'
  }
};

const reportHash = crypto.createHmac('sha256', AUTH_SECRET).update(JSON.stringify(reportSnapshot)).digest('hex');
const verifyUrl = 'https://lims.hrgen.in/verify/' + verificationToken;

const waMessage = [
  '*HRGEN APEX DIAGNOSTIC CENTER*',
  '----------------------------------------',
  '*Patient Name:* Mr. Rahul Sharma (42Y / M)',
  '*Contact:* +91-9718401811',
  `*Accession No:* ${accessionNumber}`,
  `*Invoice No:* ${invoiceNumber}`,
  '*Package:* Comprehensive Full Body Checkup (20 Parameters)',
  '*Status:* ✅ Digitally Signed & Released',
  '',
  '*Test Summary Highlights:*',
  '• Complete Blood Count (CBC): Normal (Hb: 14.6 g/dL)',
  '• Fasting Blood Sugar: 94 mg/dL (Normal)',
  '• HbA1c Glycated Hemoglobin: 5.4 % (Normal Glycemic Control)',
  '• Lipid Profile: Chol 182, TG 138, HDL 52, LDL 102.4',
  '• Kidney Function (KFT): Creatinine 0.92 mg/dL | eGFR 98.4 (Normal)',
  '• Liver Function (LFT): Normal Enzymes | FIB-4 1.02 (Low Risk)',
  '• Thyroid (TSH): 2.18 uIU/mL (Euthyroid)',
  '• Vitamin D (25-OH): 38.6 ng/mL (Sufficient)',
  '• Vitamin B12: 465 pg/mL (Normal)',
  '',
  '*Billing Summary:*',
  `• Gross Amount: ₹${pricing.gross.toFixed(2)}`,
  `• Discount (15%): ₹${pricing.discount.toFixed(2)}`,
  `• Net Payable: ₹${pricing.net.toFixed(2)}`,
  `• Paid Amount: ₹${payment.paid.toFixed(2)} (Via UPI)`,
  `• Balance Due: ₹${payment.balanceDue.toFixed(2)}`,
  '----------------------------------------',
  '📄 *DOWNLOAD AUTHENTICATED PDF REPORT:*',
  verifyUrl,
  '',
  '🔒 *21 CFR Part 11 Digital Fingerprint (HMAC-SHA256):*',
  reportHash.slice(0, 32) + '...'
].join('\n');

const tubeLabels = opdService.makeLabelData({ id: 'ORD-FB97184', barcode, tests: catalog }, patient, catalog);

const demoData = {
  patient,
  accessionNumber,
  invoiceNumber,
  barcode,
  pricing,
  payment,
  tubeLabels,
  reportSnapshot,
  reportHash,
  verificationToken,
  verifyUrl,
  waMessage
};

fs.writeFileSync('validation/FULL_BODY_CHECKUP_DEMO_MASTER.json', JSON.stringify(demoData, null, 2));
console.log('MASTER DEMO FULL BODY CHECKUP GENERATED!');
console.log('Report Hash:', reportHash);
console.log('Tubes:', tubeLabels.length);
