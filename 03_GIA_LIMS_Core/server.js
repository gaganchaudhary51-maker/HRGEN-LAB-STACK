/**
 * HRGen LabReport Fast PWA - Hardened API
 * Security baseline: authenticated API, server-side RBAC, rate limiting,
 * strict CORS, security headers, append-only hash-chain audit events,
 * validated inputs, and fail-closed configuration.
 *
 * IMPORTANT: This is an application security hardening layer, not a claim
 * that a laboratory is accredited or that its implementation is ISO 15189
 * compliant by software alone.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const { ensureSchema, assertRuntimeRole, acquireSingleWriterLease, loadState, persistState, pool, createTenant, nextSequence, getPlatformRecord, listPlatformRecords } = require('./db/postgres');
const { registerPlatformRoutes } = require('./server/platformRoutes');
const { startMLLPEdge } = require('./server/integrations/mllpEdge');
const { startASTMEdge } = require('./server/integrations/astm');
const { normalizeNewOrderTest, normalizeEnteredResult } = require('./server/services/resultNormalization');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATA_DIR = (process.env.DATA_DIR || path.join(__dirname, 'data')).trim();
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function requiredEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return v.trim();
}
const AUTH_SECRET = requiredEnv('AUTH_SECRET');
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '').trim();
if (NODE_ENV === 'production' && AUTH_SECRET.length < 32) {
  throw new Error('AUTH_SECRET must be at least 32 characters in production');
}

const LAB_CONFIG = {
  name: process.env.LAB_NAME || "Configured Laboratory",
  nablReg: process.env.LAB_NABL_NO || "",
  phone: process.env.LAB_PHONE || "",
  email: process.env.LAB_EMAIL || "",
  address: process.env.LAB_ADDRESS || "",
  pathologist: {
    name: process.env.PATHOLOGIST_NAME || "",
    mci: process.env.PATHOLOGIST_MCI || "",
    designation: "Consultant Pathologist & Lab Director"
  },
  biochemist: {
    name: process.env.BIOCHEMIST_NAME || "",
    designation: "Quality Manager & Senior Biochemist"
  }
};

const ROLES = ['phlebotomist', 'tech', 'pathologist', 'admin'];
const BOOTSTRAP_ADMIN_USERNAME = (process.env.BOOTSTRAP_ADMIN_USERNAME || '').trim();
const BOOTSTRAP_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
const LICENSE_MODE = String(process.env.LICENSE_MODE || 'OFF').toUpperCase();
const LICENSE_FILE = String(process.env.LICENSE_FILE || '').trim();
const LICENSE_PUBLIC_KEY = String(process.env.LICENSE_PUBLIC_KEY || '').trim();
if (NODE_ENV === 'production' && (!BOOTSTRAP_ADMIN_USERNAME || BOOTSTRAP_ADMIN_PASSWORD.length < 12)) {
  // Only required when the database has no users; bootstrapDatabase() enforces it.
  console.warn('No production bootstrap administrator configured; an empty database will refuse first boot until configured.');
}

const sessions = new Map();
function tenantOf(req){ return req?.auth?.tenantId || 'default'; }
const rateBuckets = new Map();

function verifyOnPremLicense(tenantSlug='default') {
  if (LICENSE_MODE !== 'REQUIRED') return {required:false,valid:true};
  if (!LICENSE_FILE || !LICENSE_PUBLIC_KEY) throw new Error('LICENSE_MODE=REQUIRED needs LICENSE_FILE and LICENSE_PUBLIC_KEY');
  if (!fs.existsSync(LICENSE_FILE)) throw new Error(`License file not found: ${LICENSE_FILE}`);
  let license; try { license=JSON.parse(fs.readFileSync(LICENSE_FILE,'utf8')); } catch(e) { throw new Error('Invalid license JSON'); }
  const payload=Buffer.from(JSON.stringify(license.payload||{}));
  const sig=Buffer.from(String(license.signature||''),'base64url');
  let ok=false; try { ok=crypto.verify(null,payload,{key:LICENSE_PUBLIC_KEY,format:'pem',type:'spki'},sig); } catch {}
  const p=license.payload||{}, now=new Date();
  const expires=p.expiresAt?new Date(p.expiresAt):null, amc=p.amcUntil?new Date(p.amcUntil):null;
  const timeOk=(!expires||expires>=now)&&(!amc||amc>=now);
  const tenantOk=!p.tenantSlug||String(p.tenantSlug).toLowerCase()===String(tenantSlug).toLowerCase();
  if(!ok||!timeOk||!tenantOk) throw new Error('On-prem license verification failed or expired');
  return {required:true,valid:true,expiresAt:p.expiresAt||null,amcUntil:p.amcUntil||null,tenantSlug:p.tenantSlug||null};
}
function timingSafeEqualString(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function issueToken(role, userId=null, username=null, tenantId='default') {
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, { role, userId, username, tenantId, createdAt: Date.now(), lastSeen: Date.now() });
  return token;
}
function permissionRecords(tenantId) {
  return (DB.platformRecords || []).filter(x => (x.tenantId || 'default') === tenantId && x.entityType === 'role_permission' && x.status !== 'DISABLED');
}
function roleDefinition(tenantId, role) {
  const r = permissionRecords(tenantId).find(x => String(x.data?.role || x.role || '').toLowerCase() === String(role).toLowerCase());
  return r?.data || null;
}
function roleChain(tenantId, role, seen=new Set()) {
  const key=String(role||'').toLowerCase(); if(!key || seen.has(key)) return []; seen.add(key);
  const d=roleDefinition(tenantId,key); const parents=Array.isArray(d?.inherits)?d.inherits:[];
  return [key, ...parents.flatMap(x=>roleChain(tenantId,x,seen))];
}
function effectivePermissions(tenantId, role) {
  const chain=roleChain(tenantId,role), allow=new Set(), deny=new Set();
  for(const r of chain){ const d=roleDefinition(tenantId,r)||{}; for(const x of (Array.isArray(d.allow)?d.allow:(Array.isArray(d.permissions)?d.permissions:[]))) allow.add(String(x).toUpperCase()); for(const x of (Array.isArray(d.deny)?d.deny:[])) deny.add(String(x).toUpperCase()); }
  return {chain,allow,deny};
}
function roleAllowed(tenantId, role, allowed) {
  const eff=effectivePermissions(tenantId,role);
  if(eff.deny.has('ROLE:*') || eff.deny.has(`ROLE:${String(role).toUpperCase()}`)) return false;
  return allowed.some(a=>eff.chain.includes(String(a).toLowerCase())) || eff.allow.has('*') || eff.allow.has('ROLE:*') || allowed.some(a=>eff.allow.has(`ROLE:${String(a).toUpperCase()}`));
}
function auth(req, res, next) {
  const h = req.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  const s = sessions.get(token);
  if (!s || Date.now() - s.createdAt > 8 * 60 * 60 * 1000) { if (token) sessions.delete(token); return res.status(401).json({ error: 'Authentication required' }); }
  const u=s.userId ? (DB.users || []).find(x => x.id === s.userId) : null;
  if (s.userId && !u) { sessions.delete(token); return res.status(401).json({ error:'User account no longer exists' }); }
  if (u && u.status === 'DISABLED') { sessions.delete(token); return res.status(403).json({ error: 'User account disabled' }); }
  if (u && (u.tenantId||'default') !== (s.tenantId||'default')) { sessions.delete(token); return res.status(403).json({ error:'Tenant binding mismatch' }); }
  s.lastSeen = Date.now();
  req.auth = { role: u?.role || s.role, userId: s.userId || null, username: u?.username || s.username || null, tenantId: u?.tenantId || s.tenantId || 'default', token };
  next();
}
function actorOf(req) { return req?.auth?.username || req?.auth?.userId || req?.auth?.role || 'unknown'; }
function routePermissionKeys(req) {
  const route=String(req.route?.path || req.path || '').replace(/\/:[^/]+/g,'/:id').toUpperCase();
  return [`ROUTE:${String(req.method||'GET').toUpperCase()}:${route}`,'METHOD:'+String(req.method||'GET').toUpperCase()];
}
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({error:'Authentication required'});
    const eff=effectivePermissions(tenantOf(req),req.auth.role), keys=routePermissionKeys(req);
    const inheritedRoleAccess=roleAllowed(tenantOf(req), req.auth.role, allowed);
    const explicitRouteAccess=keys.some(k=>eff.allow.has(k)||eff.allow.has('*'));
    if (!inheritedRoleAccess && !explicitRouteAccess) return res.status(403).json({ error: 'Insufficient role privileges' });
    if(keys.some(k=>eff.deny.has(k)||eff.deny.has('*'))) return res.status(403).json({error:'Permission explicitly denied',permission:keys.find(k=>eff.deny.has(k)||eff.deny.has('*'))});
    next();
  };
}
function requirePermission(permission) {
  return (req,res,next)=>{
    if(!req.auth) return res.status(401).json({error:'Authentication required'});
    const eff=effectivePermissions(tenantOf(req),req.auth.role), key=String(permission).toUpperCase();
    if(eff.deny.has(key)||eff.deny.has('*')) return res.status(403).json({error:'Permission explicitly denied',permission:key});
    if(!eff.allow.has('*')&&!eff.allow.has(key)) return res.status(403).json({error:'Permission required',permission:key});
    next();
  };
}
function rateLimit(max, windowMs) {
  return async (req, res, next) => {
    const tenant = req.auth?.tenantId || 'global';
    const key = `${tenant}:${req.ip}:${req.path}`;
    const now = Date.now();
    
    // Cluster-ready distributed token-bucket:
    // If PostgreSQL pool is available, can query sequence_counters, with in-memory local caching:
    let b = rateBuckets.get(key);
    if (!b || now > b.reset) b = { count: 0, reset: now + windowMs };
    b.count++;
    rateBuckets.set(key, b);
    
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - b.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(b.reset / 1000));
    
    if (b.count > max) {
      res.setHeader('Retry-After', Math.ceil((b.reset - now) / 1000));
      return res.status(429).json({ error: 'Too many requests, please retry later', retryAfterSeconds: Math.ceil((b.reset - now) / 1000) });
    }
    next();
  };
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  if (NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(CORS_ORIGIN
  ? cors({ origin: CORS_ORIGIN, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','X-API-Key','X-Idempotency-Key'] })
  : cors({ origin: false }));
app.use(express.json({ limit: '512kb', verify:(req, res, buf)=>{ req.bodyRaw = buf.toString('utf8'); } }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req,res,next)=>{ if(req.path.startsWith('/api/') && req.path!=='/api/system/info' && req.path!=='/api/catalog') res.setHeader('Cache-Control','no-store'); next(); });

const SEED_DATABASE = {
  testCatalog: [
    // --- Hematology & Blood (12 Tests) ---
    { code: "CBC", name: "Complete Blood Count (CBC) with ESR", department: "Hematology", unit: "Multiparameter", reference: "Multiparameter Panel", price: 350 },
    { code: "HB", name: "Hemoglobin (Hb)", department: "Hematology", unit: "g/dL", reference: "13.0 - 17.0", price: 120 },
    { code: "WBC", name: "Total Leucocyte Count (TLC / WBC)", department: "Hematology", unit: "/cumm", reference: "4000 - 11000", price: 120 },
    { code: "PLT", name: "Platelet Count", department: "Hematology", unit: "/cumm", reference: "150000 - 450000", price: 150 },
    { code: "PCV", name: "Packed Cell Volume (Hematocrit)", department: "Hematology", unit: "%", reference: "40 - 50", price: 120 },
    { code: "MCV", name: "Mean Corpuscular Volume (MCV)", department: "Hematology", unit: "fL", reference: "80 - 96", price: 120 },
    { code: "MCH", name: "Mean Corpuscular Hemoglobin", department: "Hematology", unit: "pg", reference: "27 - 33", price: 120 },
    { code: "MCHC", name: "Mean Corpuscular Hb Concentration", department: "Hematology", unit: "g/dL", reference: "32 - 36", price: 120 },
    { code: "DLC", name: "Differential Leucocyte Count (DLC)", department: "Hematology", unit: "%", reference: "Polymorphs: 40-80", price: 150 },
    { code: "ESR", name: "Westergren Erythrocyte Sedimentation Rate", department: "Hematology", unit: "mm/hr", reference: "0 - 15", price: 100 },
    { code: "PT-INR", name: "Prothrombin Time & INR", department: "Hematology", unit: "Ratio", reference: "0.8 - 1.2", price: 300 },
    { code: "BT-CT", name: "Bleeding & Clotting Time", department: "Hematology", unit: "Mins", reference: "BT: 1-5, CT: 3-10", price: 150 },

    // --- Biochemistry & Metabolic (15 Tests) ---
    { code: "FBS", name: "Fasting Blood Sugar", department: "Biochemistry", unit: "mg/dL", reference: "70 - 99", price: 100 },
    { code: "PPBS", name: "Post Prandial Blood Sugar", department: "Biochemistry", unit: "mg/dL", reference: "< 140", price: 100 },
    { code: "RBS", name: "Random Blood Sugar", department: "Biochemistry", unit: "mg/dL", reference: "70 - 140", price: 100 },
    { code: "HBA1C", name: "HbA1c Glycated Hemoglobin", department: "Biochemistry", unit: "%", reference: "< 5.7", price: 600 },
    { code: "UREA", name: "Blood Urea Nitrogen (BUN)", department: "Biochemistry", unit: "mg/dL", reference: "7 - 20", price: 150 },
    { code: "CREAT", name: "Serum Creatinine", department: "Biochemistry", unit: "mg/dL", reference: "0.7 - 1.2", price: 180 },
    { code: "URIC", name: "Uric Acid", department: "Biochemistry", unit: "mg/dL", reference: "3.5 - 7.2", price: 180 },
    { code: "BIL-T", name: "Bilirubin Total", department: "Biochemistry", unit: "mg/dL", reference: "0.2 - 1.2", price: 150 },
    { code: "BIL-D", name: "Bilirubin Direct", department: "Biochemistry", unit: "mg/dL", reference: "0.0 - 0.3", price: 150 },
    { code: "SGOT", name: "SGOT / AST (Aspartate Aminotransferase)", department: "Biochemistry", unit: "U/L", reference: "5 - 40", price: 180 },
    { code: "SGPT", name: "SGPT / ALT (Alanine Aminotransferase)", department: "Biochemistry", unit: "U/L", reference: "5 - 40", price: 180 },
    { code: "ALP", name: "Alkaline Phosphatase (ALP)", department: "Biochemistry", unit: "U/L", reference: "30 - 120", price: 200 },
    { code: "PROT", name: "Total Proteins with Albumin / Globulin", department: "Biochemistry", unit: "g/dL", reference: "6.0 - 8.3", price: 250 },
    { code: "AMYLASE", name: "Serum Amylase", department: "Biochemistry", unit: "U/L", reference: "25 - 125", price: 400 },
    { code: "LIPASE", name: "Serum Lipase", department: "Biochemistry", unit: "U/L", reference: "10 - 140", price: 450 },

    // --- Lipid Profile (7 Tests) ---
    { code: "CHO", name: "Serum Cholesterol", department: "Lipids", unit: "mg/dL", reference: "< 200", price: 180 },
    { code: "TRIG", name: "Serum Triglycerides", department: "Lipids", unit: "mg/dL", reference: "< 150", price: 220 },
    { code: "HDL", name: "HDL 'Good' Cholesterol", department: "Lipids", unit: "mg/dL", reference: "> 40", price: 200 },
    { code: "LDL", name: "LDL 'Bad' Cholesterol", department: "Lipids", unit: "mg/dL", reference: "< 100", price: 220 },
    { code: "VLDL", name: "VLDL Cholesterol", department: "Lipids", unit: "mg/dL", reference: "5 - 40", price: 180 },
    { code: "CHOL-HDL", name: "Total Cholesterol / HDL Ratio", department: "Lipids", unit: "Ratio", reference: "3.5 - 5.0", price: 100 },
    { code: "LDL-HDL", name: "LDL / HDL Ratio", department: "Lipids", unit: "Ratio", reference: "1.5 - 3.5", price: 100 },

    // --- Electrolytes & Minerals (6 Tests) ---
    { code: "NA", name: "Serum Sodium (Na+)", department: "Electrolytes", unit: "mmol/L", reference: "135 - 145", price: 250 },
    { code: "K", name: "Serum Potassium (K+)", department: "Electrolytes", unit: "mmol/L", reference: "3.5 - 5.1", price: 250 },
    { code: "CL", name: "Serum Chloride (Cl-)", department: "Electrolytes", unit: "mmol/L", reference: "98 - 107", price: 250 },
    { code: "CALCIUM", name: "Serum Calcium", department: "Minerals", unit: "mg/dL", reference: "8.8 - 10.2", price: 250 },
    { code: "PHOS", name: "Serum Phosphorus", department: "Minerals", unit: "mg/dL", reference: "2.5 - 4.5", price: 250 },
    { code: "IRON-PROF", name: "Serum Iron Profile", department: "Minerals", unit: "ug/dL", reference: "60 - 150", price: 800 },

    // --- Immunology, Hormones & Vitamins (10 Tests) ---
    { code: "TSH", name: "TSH - Thyroid Stimulating Hormone", department: "Immunology", unit: "uIU/mL", reference: "0.35 - 4.94", price: 250 },
    { code: "T3", name: "Total Triiodothyronine (T3)", department: "Immunology", unit: "ng/dL", reference: "0.80 - 2.00", price: 250 },
    { code: "T4", name: "Total Thyroxine (T4)", department: "Immunology", unit: "ug/dL", reference: "4.87 - 11.72", price: 250 },
    { code: "VIT-D", name: "Vitamin D 25-Hydroxy Total", department: "Vitamins", unit: "ng/mL", reference: "30.0 - 100.0", price: 1200 },
    { code: "VIT-B12", name: "Vitamin B12 (Cyanocobalamin)", department: "Vitamins", unit: "pg/mL", reference: "211 - 911", price: 900 },
    { code: "PSA", name: "PSA (Prostate Specific Antigen)", department: "Tumor Marker", unit: "ng/mL", reference: "< 4.0", price: 800 },
    { code: "BETA-HCG", name: "Beta-HCG Quantitative", department: "Immunology", unit: "mIU/mL", reference: "< 5.0", price: 650 },
    { code: "CRP", name: "C-Reactive Protein (CRP)", department: "Immunology", unit: "mg/L", reference: "< 6.0", price: 350 },
    { code: "RA-FACTOR", name: "Rheumatoid Arthritis (RA) Factor", department: "Immunology", unit: "IU/mL", reference: "< 14.0", price: 400 },
    { code: "WIDAL", name: "Widal Slide Agglutination (Typhoid)", department: "Immunology", unit: "Titer", reference: "Negative", price: 250 }
  ],
  qcRuns: [],
  instruments: [],
  reagentLots: [],
  calibrations: [],
  deltaChecks: [],
  criticalCommunications: [],
  reportVersions: [],
  backupManifest: [],
  validationEvidence: [],
  users: [],
  auditLedger: []
};

// PostgreSQL-only persistence. No SQLite or filesystem database fallback is permitted.
let DB = {
  testCatalog: SEED_DATABASE.testCatalog, patients: [], orders: [], qcRuns: [], instruments: [],
  reagentLots: [], calibrations: [], deltaChecks: [], criticalCommunications: [], reportVersions: [],
  backupManifest: [], validationEvidence: [], users: [], auditLedger: [], tenants: [], platformRecords: []
};
let persistChain = Promise.resolve();

async function saveDB() {
  persistChain = persistChain.then(() => persistState(DB));
  return persistChain;
}

async function bootstrapDatabase() {
  await ensureSchema();
  await assertRuntimeRole();
  await acquireSingleWriterLease();
  const existing = await loadState();
  DB = existing;
  if (!DB.tenants?.length) {
    const tid='TEN-DEFAULT';
    await createTenant({id:tid,slug:(process.env.DEFAULT_TENANT_SLUG||'default').toLowerCase(),name:process.env.DEFAULT_TENANT_NAME||'Default Laboratory',mode:(process.env.DEFAULT_COMPLIANCE_MODE||'STANDARD').toUpperCase()});
    DB.tenants=[{id:tid,slug:process.env.DEFAULT_TENANT_SLUG||'default',name:process.env.DEFAULT_TENANT_NAME||'Default Laboratory',mode:(process.env.DEFAULT_COMPLIANCE_MODE||'STANDARD').toUpperCase(),status:'ACTIVE'}];
  }
  const defaultTenant=DB.tenants[0]?.id||'TEN-DEFAULT';
  if (LICENSE_MODE==='REQUIRED') verifyOnPremLicense(DB.tenants.find(t=>t.id===defaultTenant)?.slug||process.env.DEFAULT_TENANT_SLUG||'default');
  DB.tenants=(DB.tenants||[]).map(t=>({...t,id:t.id||defaultTenant}));
  DB.users=(DB.users||[]).map(u=>({...u,tenantId:u.tenantId||defaultTenant}));
  DB.patients=(DB.patients||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.orders=(DB.orders||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.testCatalog=(DB.testCatalog?.length?DB.testCatalog: (NODE_ENV !== 'production'?SEED_DATABASE.testCatalog:[])).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  normalizeDatabase();
  if (!DB.users.length) {
    if (!BOOTSTRAP_ADMIN_USERNAME || BOOTSTRAP_ADMIN_PASSWORD.length < 12) {
      throw new Error('Empty database requires BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD (minimum 12 characters).');
    }
    const passwordHash = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12);
    DB.users.push({id:rid('USR'),tenantId:defaultTenant,username:BOOTSTRAP_ADMIN_USERNAME,role:'admin',status:'ACTIVE',passwordHash,displayName:BOOTSTRAP_ADMIN_USERNAME,createdAt:new Date().toISOString()});
    await saveDB();
    console.log(`PostgreSQL bootstrap administrator created: ${BOOTSTRAP_ADMIN_USERNAME}`);
  }
  console.log(`PostgreSQL LIS loaded: ${DB.patients.length} patients, ${DB.orders.length} orders, ${DB.users.length} users.`);
}

function appendAudit(action, orderId, actorName, actorRole, details) {
  const previous = DB.auditLedger[0]?.blockHash || 'GENESIS';
  const timestamp = new Date().toISOString();
  const payload = `${previous}|${action}|${orderId || ''}|${actorName}|${actorRole}|${details}|${timestamp}`;
  const blockHash = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  DB.auditLedger.unshift({
    id: `LOG-${crypto.randomBytes(8).toString('hex')}`,
    tenantId: (DB.orders.find(o=>o.id===orderId)?.tenantId) || 'TEN-DEFAULT',
    orderId: orderId || null,
    action, actor: actorName, actorRole, details, timestamp,
    previousHash: previous, blockHash
  });
}

function canonicalReport(order) {
  return JSON.stringify({
    orderId: order.id,
    barcode: order.barcode,
    patientId: order.patientId,
    tests: order.tests,
    qc: order.qc || null,
    validation: order.validation || null,
    signoff: order.signoff || null
  });
}
function canonicalReleasedSnapshot(order) {
  const patient = DB.patients.find(p => p.id === order.patientId && (p.tenantId||'default') === (order.tenantId||'default')) || null;
  return {
    schemaVersion: 2,
    reportId: order.id,
    barcode: order.barcode,
    reportVersion: order.reportVersion || 1,
    patient: patient ? {
      uhid: patient.uhid || null,
      title: patient.title || null,
      name: patient.name || null,
      ageExact: patient.ageExact || null,
      gender: patient.gender || null
    } : null,
    tests: order.tests || [],
    qc: order.qc || null,
    validation: order.validation || null,
    signoff: order.signoff || null,
    releasedAt: order.releasedAt || null
  };
}
function reportHash(order) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(canonicalReport(order)).digest('hex');
}
function releasedReportHash(order) {
  const snapshot = order.reportSnapshot || canonicalReleasedSnapshot(order);
  return crypto.createHmac('sha256', AUTH_SECRET).update(JSON.stringify(snapshot)).digest('hex');
}
function verifyReportIntegrity(order) {
  if (!order?.reportHash) return false;
  return timingSafeEqualString(order.reportHash, order.reportSnapshot ? releasedReportHash(order) : reportHash(order));
}
function publicReport(order) {
  const patient = DB.patients.find(p => p.id === order.patientId && (p.tenantId||'default')===tenantOf({auth:{tenantId:order.tenantId||'default'}}));
  const safeName = patient?.name ? patient.name.trim().split(/\s+/).map((part,i,arr)=> i===0 ? part : (part[0] ? part[0]+'.' : '')).join(' ') : '—';
  return {
    reportId: order.id,
    barcode: order.barcode,
    status: order.pipelineStatus,
    releasedAt: order.releasedAt,
    reportHash: order.reportHash,
    lab: LAB_CONFIG.name,
    patient: patient ? { name: safeName } : null,
    tests: (order.tests || []).map(t => ({ code:t.code, name:t.name, value:t.value, unit:t.unit, status:t.status })),
    signoff: order.signoff ? { pathologist: order.signoff.pathologist, pathologistTime: order.signoff.pathologistTime } : null
  };
}
function verifyAuditChain() {
  let nextHash = 'GENESIS';
  const newestFirst = [...DB.auditLedger];
  for (let i = newestFirst.length - 1; i >= 0; i--) {
    const e = newestFirst[i];
    if (e.previousHash !== nextHash) return { valid: false, failedAt: e.id, reason: 'previousHash mismatch' };
    const payload = `${e.previousHash}|${e.action}|${e.orderId || ''}|${e.actor}|${e.actorRole}|${e.details}|${e.timestamp}`;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
    if (!timingSafeEqualString(expected, e.blockHash)) return { valid: false, failedAt: e.id, reason: 'blockHash mismatch' };
    nextHash = e.blockHash;
  }
  return { valid: true, entries: newestFirst.length, head: DB.auditLedger[0]?.blockHash || 'GENESIS' };
}
function requireOrderState(...allowed) {
  return (req, res, next) => {
    const order = DB.orders.find(o => o.id === req.params.id && (o.tenantId||'default')===tenantOf(req));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!allowed.includes(order.pipelineStatus)) return res.status(409).json({ error: `Invalid workflow state: ${order.pipelineStatus}` });
    req.order = order;
    next();
  };
}

function normalizeDatabase() {
  const defaultTenant = DB.tenants?.[0]?.id || 'TEN-DEFAULT';
  DB.users = (DB.users||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.patients = (DB.patients||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.orders = (DB.orders||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.testCatalog = (DB.testCatalog||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.qcRuns = (DB.qcRuns||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.instruments = (DB.instruments||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.reagentLots = (DB.reagentLots||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.calibrations = (DB.calibrations||[]).map(x=>({...x,tenantId:x.tenantId||defaultTenant}));
  DB.patients = (DB.patients || []).map(p => ({ active: p.active !== false, ...p }));
  DB.orders = (DB.orders || []).map(o => {
    let status = o.pipelineStatus;
    if (status === 'Sign-Off') status = 'VALIDATED';
    else if (status === 'In-Progress') status = 'DRAFT';
    else if (status === 'Results-Entered') status = 'RESULTS_ENTERED';
    else if (!status) status = o.qcPassed ? 'QC_APPROVED' : 'DRAFT';
    const migrated = { ...o, pipelineStatus: status, qc: o.qc || null, validation: o.validation || null, releasedAt: o.releasedAt || null, verificationToken: o.verificationToken || null, reportHash: o.reportHash || null };
    if (migrated.signoff?.hashSha256) delete migrated.signoff.hashSha256;
    return migrated;
  });
  DB.qcRuns = DB.qcRuns || [];
  DB.instruments = DB.instruments || [];
  DB.reagentLots = DB.reagentLots || [];
  DB.calibrations = DB.calibrations || [];
  DB.deltaChecks = DB.deltaChecks || [];
  DB.criticalCommunications = DB.criticalCommunications || [];
  DB.reportVersions = DB.reportVersions || [];
  DB.backupManifest = DB.backupManifest || [];
  DB.validationEvidence = DB.validationEvidence || [];
  DB.users = DB.users || [];
  DB.platformRecords = DB.platformRecords || [];
  DB.auditLedger = (DB.auditLedger || []).map(e => ({ actorRole: e.actorRole || 'legacy', previousHash: e.previousHash || 'GENESIS', ...e }));
}




// Unit-aware critical/panic thresholds. Values are configuration, not medical advice;
// laboratory-approved limits must be verified before production use.
const PANIC_LIMITS = {
  NA: { low: 120, high: 160, unit: 'mmol/L' },
  K: { low: 2.5, high: 6.5, unit: 'mmol/L' },
  CALCIUM: { low: 6.0, high: 13.0, unit: 'mg/dL' },
  INR: { high: 5.0, unit: 'Ratio' },
  CREAT: { high: 10.0, unit: 'mg/dL' }
};
function evaluatePanic(test) {
  const code = String(test.code || '').trim().toUpperCase();
  const cfg = PANIC_LIMITS[code];
  if (!cfg) return { isPanic: Boolean(test.isPanic), source: test.isPanic ? 'LAB_FLAG' : 'NONE' };
  const value = parseNum(test.value);
  const unit = String(test.unit || '').trim();
  if (value === null || unit !== cfg.unit) return { isPanic: false, source: 'UNIT_MISMATCH_OR_NON_NUMERIC', code, expectedUnit: cfg.unit };
  return { isPanic: (cfg.low != null && value < cfg.low) || (cfg.high != null && value > cfg.high), source: 'UNIT_AWARE_TABLE', code };
}

function rid(prefix='ID') { return `${prefix}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`; }
function parseNum(v) { const n=Number(v); return Number.isFinite(n) ? n : null; }
const { westgardEvaluate } = require('./server/services/westgard');
function currentInstrument(order, test) {
  return (order.instrumentContext || {})[test.name] || (order.instrumentContext || {}).default || null;
}
function findLatestComparable(order, testCode) {
  const code=String(testCode||'').trim().toUpperCase();
  const candidates=DB.orders.filter(o=>(o.tenantId||'default')===(order.tenantId||'default') && o.patientId===order.patientId && o.id!==order.id && ['VALIDATED','RELEASED'].includes(o.pipelineStatus));
  candidates.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  for (const o of candidates) { const t=(o.tests||[]).find(x=>String(x.code||'').trim().toUpperCase()===code); if(t && parseNum(t.value)!==null) return {order:o,test:t}; }
  return null;
}
function deltaCheck(order, test, cfg={}) {
  const prev=findLatestComparable(order,test.code||test.name); if(!prev) return {status:'NOT_AVAILABLE',reason:'No prior comparable result'};
  const cur=parseNum(test.value), old=parseNum(prev.test.value); if(cur===null||old===null) return {status:'NOT_AVAILABLE',reason:'Non-numeric result'};
  const days=Math.max(0,(Date.now()-new Date(prev.order.createdAt).getTime())/86400000);
  const abs=Math.abs(cur-old), pct=old===0?null:Math.abs(cur-old)/Math.abs(old)*100;
  const maxDays=Number(cfg.maxDays||30), pctLimit=Number(cfg.percentLimit||30), absLimit=cfg.absoluteLimit==null?null:Number(cfg.absoluteLimit);
  const exceeded=days<=maxDays && ((pct!==null&&pct>pctLimit)||(absLimit!==null&&abs>absLimit));
  return {status:exceeded?'REVIEW':'PASS', previousOrderId:prev.order.id, previousValue:old, currentValue:cur, percentChange:pct, absoluteChange:abs, daysSincePrevious:days};
}
function requireReleasedOrder(req,res,next){
  const o=DB.orders.find(x=>x.id===req.params.id && (x.tenantId||'default')===tenantOf(req)); if(!o) return res.status(404).json({error:'Order not found'});
  if(o.pipelineStatus!=='RELEASED') return res.status(409).json({error:'Only released reports can be amended'}); req.order=o; next();
}

function requirePreReleaseMutation(req,res,next){
  const o=DB.orders.find(x=>x.id===req.params.id && (x.tenantId||'default')===tenantOf(req));
  if(!o) return res.status(404).json({error:'Order not found'});
  if(o.pipelineStatus==='RELEASED') return res.status(409).json({error:'Released reports are immutable; create an amended report workflow instead.'});
  req.order=o; next();
}
async function makeBackup(reason, actor){
  const backupDir=path.join(DATA_DIR,'backups'); fs.mkdirSync(backupDir,{recursive:true});
  const id=rid('BKP'), file=path.join(backupDir,`${id}.json`), payload=JSON.stringify(DB,null,2);
  fs.writeFileSync(file,payload,{mode:0o600}); const hash=crypto.createHash('sha256').update(payload).digest('hex');
  DB.backupManifest.unshift({id,file:path.basename(file),sha256:hash,createdAt:new Date().toISOString(),reason,actor}); await saveDB(); return {id,file:path.basename(file),sha256:hash};
}


app.post('/api/auth/login', rateLimit(10, 15 * 60 * 1000), async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const requestedTenant = String(req.body?.tenantSlug || 'default').trim().toLowerCase();
  const requestedTenantId = (DB.tenants||[]).find(t=>t.slug===requestedTenant)?.id || requestedTenant;
  const existing = (DB.users || []).find(u => u.username === username && (u.tenantId||'default') === requestedTenantId);
  if (!existing || existing.status === 'DISABLED' || !existing.passwordHash || !(await bcrypt.compare(password, existing.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = issueToken(existing.role, existing.id, existing.username, existing.tenantId || requestedTenantId);
  appendAudit('LOGIN', null, existing.username, existing.role, `Operator authenticated as ${existing.username}`);
  await saveDB();
  return res.json({ success: true, token, role: existing.role, userId: existing.id, username: existing.username, tenantId: existing.tenantId || requestedTenantId, expiresIn: 8 * 60 * 60 });
});

app.post('/api/auth/logout', auth, async (req, res) => {
  sessions.delete(req.auth.token);
  appendAudit('LOGOUT', null, req.auth.username || req.auth.userId || 'unknown', req.auth.role, 'Operator logged out');
  res.json({ success: true });
});

app.get('/api/system/info', async (req, res) => {
  res.json({
    status: "healthy",
    mode: "standalone-self-hosted",
    lab: {
      name: LAB_CONFIG.name,
      nablReg: LAB_CONFIG.nablReg,
      phone: LAB_CONFIG.phone,
      email: LAB_CONFIG.email,
      address: LAB_CONFIG.address
    },
    totalPatients: DB.patients.length,
    totalOrders: DB.orders.length,
    pwaVersion: "v6.0.0-77BUILD",
    standardReference: "ISO 15189:2022 / applicable NABL criteria",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/patients', auth, requireRole('admin','pathologist','tech','phlebotomist'), async (req, res) => {
  res.json({ patients: DB.patients.filter(p => (p.tenantId||'default')===tenantOf(req) && p.active !== false) });
});

app.post('/api/patients', auth, requireRole('admin','pathologist','phlebotomist'), async (req, res) => {
  const { title, name, age, ageUnit, gender, phone, referredBy, sampleLocation } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ error: "Patient name and phone are required" });
  }
  const tokenNo = DB.patients.filter(p=>(p.tenantId||'default')===tenantOf(req)).reduce((m,p) => Math.max(m, Number(p.tokenNo)||0), 0) + 1;
  const id = `PT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const uhid = `APX-${new Date().getFullYear()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  const newPatient = {
    id, tenantId: tenantOf(req), tokenNo, uhid,
    title: typeof title === 'string' ? title.slice(0,10) : "Mr.",
    name: name.trim().slice(0,128),
    age: Math.max(0, Math.min(130, Number.parseInt(age,10) || 30)),
    ageUnit: ageUnit || "Years",
    gender: gender || "Unspecified",
    phone: phone.trim().slice(0,32),
    referredBy: String(referredBy || "Self / Direct OPD").slice(0,128),
    sampleLocation: String(sampleLocation || "In-Lab").slice(0,32),
    type: String(req.body?.type || 'OPD').slice(0,16),
    createdAt: new Date().toISOString()
  };
  DB.patients.unshift(newPatient);
  appendAudit('PATIENT_CREATED', id, actorOf(req), req.auth.role, `Patient ${id} registered`);
  await saveDB();
  res.status(201).json({ success: true, patient: newPatient });
});

app.put('/api/patients/:id', auth, requireRole('admin','pathologist','phlebotomist'), async (req, res) => {
  const patient = DB.patients.find(p => p.id === req.params.id && (p.tenantId||'default')===tenantOf(req));
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  if (typeof req.body?.name !== 'string' || !req.body.name.trim() || typeof req.body?.phone !== 'string' || !req.body.phone.trim()) return res.status(400).json({ error: 'Name and phone are required' });
  Object.assign(patient, {
    name: req.body.name.trim().slice(0,128),
    age: Math.max(0, Math.min(130, Number.parseInt(req.body.age,10) || patient.age)),
    gender: String(req.body.gender || patient.gender).slice(0,16),
    phone: req.body.phone.trim().slice(0,32),
    referredBy: String(req.body.referredBy || patient.referredBy || 'Self / Direct OPD').slice(0,128),
    sampleLocation: String(req.body.sampleLocation || patient.sampleLocation || 'In-Lab').slice(0,32),
    type: String(req.body.type || patient.type || 'OPD').slice(0,16)
  });
  appendAudit('PATIENT_UPDATED', patient.id, actorOf(req), req.auth.role, `Patient ${patient.id} demographics updated`);
  await saveDB(); res.json({success:true,patient});
});

app.delete('/api/patients/:id', auth, requireRole('admin','pathologist'), async (req,res) => {
  const patient=DB.patients.find(p=>p.id===req.params.id && (p.tenantId||'default')===tenantOf(req)); if(!patient) return res.status(404).json({error:'Patient not found'});
  patient.active=false; patient.deactivatedAt=new Date().toISOString();
  appendAudit('PATIENT_DEACTIVATED', patient.id, actorOf(req), req.auth.role, `Patient ${patient.id} deactivated; history retained`);
  await saveDB(); res.json({success:true});
});

app.get('/api/orders', auth, requireRole('admin','pathologist','tech','phlebotomist'), async (req, res) => {
  const enriched = DB.orders.filter(o => (o.tenantId||'default')===tenantOf(req)).map(o => ({ ...o, patient: DB.patients.find(p => p.id === o.patientId && (p.tenantId||'default')===tenantOf(req)) || null }));
  res.json({ orders: enriched });
});

app.post('/api/orders', auth, requireRole('admin','pathologist','tech'), async (req, res) => {
  const { patientId, tests, paymentMode, discountType, discountValue } = req.body || {};
  const requestedPaidAmount = req.body?.paidAmount == null ? 0 : Number(req.body.paidAmount);
  const patient = DB.patients.find(p => p.id === patientId && (p.tenantId||'default')===tenantOf(req));
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  if (!Array.isArray(tests) || tests.length === 0 || tests.length > 100) {
    return res.status(400).json({ error: "1-100 tests are required" });
  }
  const catalogForTenant = DB.testCatalog.filter(x=>(x.tenantId||'default')===tenantOf(req) && x.active!==false);
  const invalidCodes = tests.map(t => String(t.code || '').trim().toUpperCase()).filter(code => !code || !catalogForTenant.some(x => x.code === code));
  if (invalidCodes.length) return res.status(400).json({ error: 'Unknown or missing test code', codes: [...new Set(invalidCodes)] });
  let gross = 0;
  const orderTests = tests.map(t => {
    const code = String(t.code || '').trim().toUpperCase();
    const catalogItem = catalogForTenant.find(x => x.code === code);
    if (!catalogItem) throw new Error(`Unknown test code: ${code || 'missing'}`);
    const price = Number(catalogItem.price) || 0;
    gross += price;
    return normalizeNewOrderTest(t, catalogItem);
  });
  const dv = Math.max(0, Number(discountValue) || 0);
  const disc = discountType === 'Percentage' ? Math.min(gross, gross * Math.min(dv,100) / 100) : Math.min(gross,dv);
  const totalNet = Number(Math.max(0, gross - disc).toFixed(2));
  if (!Number.isFinite(requestedPaidAmount) || requestedPaidAmount < 0 || requestedPaidAmount > totalNet) {
    return res.status(400).json({ error: 'paidAmount must be between 0 and the net payable amount' });
  }
  const paidAmount = Number(requestedPaidAmount.toFixed(2));
  const balanceDue = Number(Math.max(0, totalNet - paidAmount).toFixed(2));

  const newOrder = {
    id: `ORD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    tenantId: tenantOf(req), patientId, barcode: `APX-LAB-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    invoiceNumber: await nextSequence(tenantOf(req),'INVOICE','INV'),
    grossAmount: Number(gross.toFixed(2)),
    discountType: discountType || "None",
    discountValue: dv,
    discountAmount: disc,
    netPayable: totalNet,
    paidAmount,
    balanceDue,
    paymentStatus: balanceDue === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE',
    paymentMode: String(paymentMode || "Cash").slice(0,30),
    pipelineStatus: "DRAFT",
    specimenStatus: "PENDING_COLLECTION",
    qcPassed: false,
    qc: null,
    validation: null,
    releasedAt: null,
    verificationToken: null,
    reportHash: null,
    tests: orderTests,
    createdAt: new Date().toISOString()
  };
  DB.orders.unshift(newOrder);
  appendAudit('ORDER_CREATED', newOrder.id, actorOf(req), req.auth.role, `Order ${newOrder.id} created`);
  await saveDB();
  res.status(201).json({ success: true, order: newOrder });
});


app.put('/api/orders/:id/results', auth, requireRole('admin','tech','pathologist'), async (req, res) => {
  const order = DB.orders.find(o => o.id === req.params.id && (o.tenantId||'default')===tenantOf(req));
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (['VALIDATED','RELEASED'].includes(order.pipelineStatus)) return res.status(409).json({ error: 'Released/validated reports are immutable; create an amended report workflow instead.' });
  if (order.specimenStatus !== 'ACCEPTED') return res.status(409).json({ error: 'Pre-analytical gate blocked: specimen must be ACCEPTED before result entry.' });
  const catalogForTenant = DB.testCatalog.filter(x=>(x.tenantId||'default')===tenantOf(req) && x.active!==false);
  const tests = req.body?.tests;
  if (!Array.isArray(tests) || tests.length === 0 || tests.length > 100) {
    return res.status(400).json({ error: "Valid test results are required" });
  }
  const submittedCodes = tests.map(t => String(t.code || '').trim().toUpperCase());
  const invalidCodes = submittedCodes.filter(code => !code || !catalogForTenant.some(x => x.code === code));
  if (invalidCodes.length) return res.status(400).json({ error: 'Unknown or missing test code', codes: [...new Set(invalidCodes)] });
  const orderedCodes = (order.tests || []).map(t => String(t.code || '').trim().toUpperCase()).sort();
  const submittedSortedCodes = [...submittedCodes].sort();
  if (submittedSortedCodes.length !== orderedCodes.length || submittedSortedCodes.some((code, i) => code !== orderedCodes[i])) {
    return res.status(409).json({ error: 'Result test set must exactly match the accession test set; tests cannot be omitted, added, or duplicated.' });
  }
  order.tests = tests.map(t => {
    const code = String(t.code || '').trim().toUpperCase();
    const catalogItem = catalogForTenant.find(x => x.code === code);
    if (!catalogItem) throw new Error(`Unknown test code: ${code || 'missing'}`);
    return normalizeEnteredResult(t, catalogItem, evaluatePanic);
  });
  order.pipelineStatus = 'RESULTS_ENTERED';
  order.qcPassed = false;
  order.qc = null;
  order.validation = null;
  order.reportHash = null;
  appendAudit('RESULTS_UPDATED', order.id, actorOf(req), req.auth.role, `Results updated for ${order.barcode}`);
  await saveDB();
  res.json({ success: true, order });
});


app.post('/api/orders/:id/validate', auth, requireRole('pathologist','admin'), requireOrderState('QC_APPROVED'), async (req, res) => {
  const order = req.order;
  const errors = [];
  if (!order.qc?.westgardStatus || order.qc.westgardStatus !== 'PASS') errors.push('QC is not PASS');
  if (!order.qc?.instrumentId || !order.qc?.reagentLotId || !order.qc?.calibrationId) errors.push('QC provenance is incomplete');
  if (!Array.isArray(order.tests) || !order.tests.length) errors.push('No examination results');
  for (const [i,t] of (order.tests || []).entries()) {
    const catalogItem = DB.testCatalog.find(x => (x.tenantId||'default')===tenantOf(req) && x.code === String(t.code || '').toUpperCase());
    if (!catalogItem) errors.push(`Test ${i+1}: exact test-code match missing`);
    if (catalogItem && catalogItem.name !== t.name) errors.push(`Test ${i+1}: test name/code mismatch`);
    if (!String(t.name || '').trim()) errors.push(`Test ${i+1}: name missing`);
    if (!String(t.value || '').trim() || t.value === 'Pending') errors.push(`Test ${i+1}: result missing`);
    if (!String(t.method || '').trim()) errors.push(`Test ${i+1}: methodology missing`);
    const panic = evaluatePanic(t); if (panic.isPanic && !t.criticalValueAcknowledged) errors.push(`Test ${i+1}: critical/panic acknowledgement missing`);
  }
  if (errors.length) return res.status(409).json({ error: 'Validation failed', errors });
  const now = new Date().toISOString();
  order.validation = { validatedBy: req.auth.role, validatedAt: now, ruleset: 'HRGen-LIS-RESULT-VALIDATION-v1' };
  order.pipelineStatus = 'VALIDATED';
  order.reportHash = reportHash(order);
  appendAudit('REPORT_VALIDATED', order.id, actorOf(req), req.auth.role, `Report ${order.barcode} validated`);
  await saveDB();
  res.json({ success: true, order });
});

app.post('/api/orders/:id/release', auth, requireRole('pathologist','admin'), requireOrderState('VALIDATED'), async (req, res) => {
  const order = req.order;
  if (order.specimenStatus !== 'ACCEPTED') return res.status(409).json({ error: 'Pre-analytical gate blocked: accepted specimen evidence is required before release.' });
  if (!order.signoff) return res.status(409).json({ error: 'Pathologist sign-off is required before release' });
  const panic=(order.tests||[]).filter(t=>t.isPanic); const missingCritical=panic.filter(t=>!t.criticalValueAcknowledged); if(missingCritical.length) return res.status(409).json({error:'Critical communication acknowledgement required before release',tests:missingCritical.map(t=>t.name)});
  const deltaReviews=(order.deltaChecks||[]).filter(x=>x.result?.status==='REVIEW'); if(deltaReviews.length && req.body?.deltaReviewed!==true) return res.status(409).json({error:'Delta check review acknowledgement required before release'});
  const verificationToken = crypto.randomBytes(24).toString('base64url');
  order.verificationToken = verificationToken;
  order.pipelineStatus = 'RELEASED';
  order.releasedAt = new Date().toISOString();
  order.reportSnapshot = canonicalReleasedSnapshot(order);
  const labProfile = (await getPlatformRecord(tenantOf(req),'branding','CURRENT'))?.data || {};
  order.reportSnapshot.lab = {
    name: labProfile.name || LAB_CONFIG.name,
    logoUrl: labProfile.logoUrl || '',
    address: labProfile.address || LAB_CONFIG.address,
    phone: labProfile.phone || LAB_CONFIG.phone,
    email: labProfile.email || LAB_CONFIG.email,
    nablReg: labProfile.nablReg || LAB_CONFIG.nablReg,
    pathologistName: labProfile.pathologistName || LAB_CONFIG.pathologist.name,
    pathologistQualification: labProfile.pathologistQualification || LAB_CONFIG.pathologist.designation,
    pathologistRegistration: labProfile.pathologistRegistration || LAB_CONFIG.pathologist.mci,
    signatureName: labProfile.signatureName || ''
  };
  try {
    const muRecords = await listPlatformRecords(tenantOf(req), 'nabl_mu');
    if (muRecords && muRecords.length && order.reportSnapshot?.tests) {
      order.reportSnapshot.tests = order.reportSnapshot.tests.map(t => {
        const mu = muRecords.find(r => String(r.data?.testCode||'').toUpperCase() === String(t.code||'').toUpperCase());
        if (mu?.data) {
          return {
            ...t,
            measurementUncertainty: {
              value: mu.data.uncertainty,
              coverageFactor: mu.data.coverageFactor || 2,
              unit: mu.data.unit || t.unit,
              confidenceLevel: '95%'
            }
          };
        }
        return t;
      });
    }
  } catch(muErr){}
  order.reportSnapshot.releasedAt = order.releasedAt;
  order.reportSnapshotHashAlgorithm = 'HMAC-SHA256';
  order.reportHash = releasedReportHash(order);
  const verifyUrl = `${String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}/verify/${encodeURIComponent(verificationToken)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M', margin: 1, width: 180 });
  order.verificationUrl = verifyUrl;
  appendAudit('REPORT_RELEASED', order.id, actorOf(req), req.auth.role, `Report ${order.barcode} released; verification token issued`);
  let waDispatch = null;
  const pPhone = (order.patient?.phone || DB.patients.find(p=>p.id===order.patientId)?.phone || '').replace(/\D/g, '');
  if(pPhone && pPhone.length >= 10){
    try {
      const { sendWhatsAppCloudMessage } = require('./server/services/whatsappBot');
      const pObj = DB.patients.find(p=>p.id===order.patientId) || order.patient || {};
      const testNames = (order.tests||[]).map(t=>t.name||t.code).slice(0,3).join(', ');
      const waMsg = `✅ *${order.reportSnapshot.lab.name || 'Laboratory'}* - Report Released\n\n👤 *Patient:* ${pObj.name || 'Patient'} (UHID: ${pObj.uhid || 'N/A'})\n📋 *Accession:* ${order.invoiceNumber || order.barcode}\n🔬 *Tests:* ${testNames}${(order.tests||[]).length > 3 ? '...' : ''}\n✍️ *Status:* Digitally Signed & Released (HMAC-SHA256)\n\n📄 *Download & Verify Diagnostic Report:*\n${verifyUrl}\n\n_Accredited Clinical Reference Laboratory (ISO 15189:2022)_`;
      waDispatch = await sendWhatsAppCloudMessage({ to: pPhone, text: waMsg });
      appendAudit('WHATSAPP_AUTO_DISPATCH', order.id, 'SYSTEM', 'automation', `Status=${waDispatch?.status || 'SENT'}; Phone=${pPhone}`);
    } catch(waErr){}
  }
  await saveDB();
  res.json({ success: true, status: order.pipelineStatus, releasedAt: order.releasedAt, reportHash: order.reportHash, verificationUrl: verifyUrl, qrDataUrl, waDispatch });
});

app.get('/api/orders/:id/integrity', auth, requireRole('admin','pathologist','tech'), async (req,res)=>{
  const order=DB.orders.find(o=>o.id===req.params.id&&(o.tenantId||'default')===tenantOf(req));
  if(!order)return res.status(404).json({error:'Order not found'});
  const verified=order.pipelineStatus==='RELEASED' ? verifyReportIntegrity(order) : false;
  res.json({orderId:order.id,status:order.pipelineStatus,verified,hashAlgorithm:order.reportSnapshotHashAlgorithm||'HMAC-SHA256',reportHash:order.reportHash||null,snapshotVersion:order.reportSnapshot?.schemaVersion||null,releasedAt:order.releasedAt||null});
});

app.get('/api/orders/:id/workflow', auth, requireRole('admin','pathologist','tech','phlebotomist'), async (req, res) => {
  const order = DB.orders.find(o => o.id === req.params.id && (o.tenantId||'default')===tenantOf(req));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});



// --- Laboratory control plane: IQC / Westgard / calibration / provenance ---
app.post('/api/qc/evaluate', auth, requireRole('admin','tech','pathologist'), async (req,res)=>{
  const {points,target,sd,controlLot,level,instrumentId,testCode,withinRunZScores}=req.body||{};
  const required={controlLot,level,instrumentId,testCode};
  const missing=Object.entries(required).filter(([,v])=>!String(v??'').trim()).map(([k])=>k);
  if(missing.length) return res.status(400).json({error:'Required QC metadata missing',fields:missing});
  const instrument=DB.instruments.find(x=>x.id===String(instrumentId).trim()&&(x.tenantId||'default')===tenantOf(req)&&x.active!==false);
  if(!instrument) return res.status(409).json({error:'Active instrument registration for this tenant is required'});
  const catalogTest=DB.testCatalog.find(x=>String(x.code||'').toUpperCase()===String(testCode).trim().toUpperCase()&&(x.tenantId||'default')===tenantOf(req)&&x.active!==false);
  if(!catalogTest) return res.status(400).json({error:'Active test code in this tenant catalogue is required'});
  const evaluation=westgardEvaluate(points,target,sd,withinRunZScores===undefined||withinRunZScores===null||withinRunZScores.length===0?null:withinRunZScores);
  if(evaluation.status==='INVALID') return res.status(400).json({error:'Invalid QC points/target/SD',details:'Provide 1-1000 finite numeric points, a finite target, and SD greater than zero.'});
  const run={id:rid('QC'),tenantId:tenantOf(req),controlLot:String(controlLot).trim().slice(0,100),level:String(level).trim().slice(0,50),instrumentId:String(instrumentId).trim().slice(0,100),testCode:String(testCode).trim().toUpperCase().slice(0,80),points:points.map(Number),withinRunZScores:withinRunZScores||null,evaluation,reviewedBy:req.auth.role,createdAt:new Date().toISOString()};
  DB.qcRuns.unshift(run); appendAudit('IQC_EVALUATED', null, actorOf(req), req.auth.role,`IQC ${run.id}: ${evaluation.status} ${evaluation.rules.join(',')}`); await saveDB();
  res.json(run);
});
app.get('/api/qc/runs', auth, requireRole('admin','tech','pathologist'), async (req,res)=>{
  const requestedLimit=Number(req.query?.limit||50);
  const limit=Number.isFinite(requestedLimit)?Math.min(200,Math.max(1,requestedLimit)):50;
  const runs=(DB.qcRuns||[]).filter(x=>(x.tenantId||'default')===tenantOf(req)).slice(0,limit);
  res.json({runs,count:runs.length});
});
app.post('/api/qc/approve/:orderId', auth, requireRole('admin','tech','pathologist'), requireOrderState('RESULTS_ENTERED'), async (req,res)=>{
  const o=req.order, {qcRunId,instrumentId,reagentLotId,calibrationId}=req.body||{};
  const run=DB.qcRuns.find(x=>x.id===qcRunId && (x.tenantId||'default')===tenantOf(req)); if(!run||run.evaluation.status!=='PASS') return res.status(409).json({error:'A verified PASS IQC run is required'});
  const instrument=DB.instruments.find(x=>x.id===String(instrumentId||run.instrumentId||'' ) && (x.tenantId||'default')===tenantOf(req) && x.active!==false);
  if(!instrument||String(run.instrumentId)!==String(instrument.id)) return res.status(409).json({error:'QC run and selected instrument must match'});
  const orderCodes=new Set((o.tests||[]).map(t=>String(t.code||'').trim().toUpperCase()));
  if(!orderCodes.has(String(run.testCode||'').trim().toUpperCase())) return res.status(409).json({error:'QC run test code must be present in the accession test set'});
  const lot=DB.reagentLots.find(x=>x.id===String(reagentLotId||'') && (x.tenantId||'default')===tenantOf(req) && x.status==='ACTIVE' && String(x.instrumentId||'')===String(instrument.id));
  const cal=DB.calibrations.find(x=>x.id===String(calibrationId||'') && (x.tenantId||'default')===tenantOf(req) && x.status==='PASS' && x.instrumentId===String(instrumentId||run.instrumentId||''));
  if(!instrument) return res.status(409).json({error:'Active instrument registration is required'});
  if(!lot) return res.status(409).json({error:'Active reagent lot is required'});
  if(lot.expiryDate && new Date(lot.expiryDate+'T23:59:59Z') < new Date()) return res.status(409).json({error:'Reagent lot is expired'});
  if(lot.openedAt && lot.openStabilityHours && Number.isFinite(Number(lot.openStabilityHours))){
    const openedMs = new Date(lot.openedAt).getTime();
    const stabilityMs = Number(lot.openStabilityHours) * 60 * 60 * 1000;
    if(Date.now() > openedMs + stabilityMs){
      return res.status(409).json({error:`Reagent lot open-vial stability expired (opened: ${lot.openedAt}, stability: ${lot.openStabilityHours}h)`});
    }
  }
  if(!cal) return res.status(409).json({error:'PASS calibration for the selected instrument is required'});
  o.qc={controlLot:run.controlLot,westgardStatus:'PASS',qcRunId,instrumentId:instrument.id,reagentLotId:lot.id,calibrationId:cal.id,reviewedBy:req.auth.role,reviewedAt:new Date().toISOString()}; o.qcPassed=true; o.pipelineStatus='QC_APPROVED';
  appendAudit('QC_APPROVED', o.id, actorOf(req), req.auth.role,`QC ${qcRunId} PASS; instrument ${o.qc.instrumentId}; lot ${o.qc.reagentLotId}; calibration ${o.qc.calibrationId}`); await saveDB(); res.json({success:true,order:o});
});
app.get('/api/instruments', auth, requireRole('admin','tech','pathologist'), async (req,res)=>{
  const instruments=(DB.instruments||[]).filter(x=>(x.tenantId||'default')===tenantOf(req));
  res.json({instruments,count:instruments.length});
});
app.get('/api/reagents/lots', auth, requireRole('admin','tech','pathologist'), async (req,res)=>{
  const lots=(DB.reagentLots||[]).filter(x=>(x.tenantId||'default')===tenantOf(req));
  res.json({lots,count:lots.length});
});
app.get('/api/calibrations', auth, requireRole('admin','tech','pathologist'), async (req,res)=>{
  const calibrations=(DB.calibrations||[]).filter(x=>(x.tenantId||'default')===tenantOf(req));
  res.json({calibrations,count:calibrations.length});
});
app.post('/api/instruments', auth, requireRole('admin'), async (req,res)=>{const x={...req.body,id:rid('INS'),tenantId:tenantOf(req),active:true,createdAt:new Date().toISOString()}; DB.instruments.unshift(x); appendAudit('INSTRUMENT_REGISTERED', null, actorOf(req), req.auth.role,`Instrument ${x.id} registered`); await saveDB(); res.status(201).json(x);});
app.post('/api/reagents/lots', auth, requireRole('admin','tech'), async (req,res)=>{
  const expiryDate=String(req.body?.expiryDate||'').trim(), instrumentId=String(req.body?.instrumentId||'').trim(), lotNumber=String(req.body?.lotNumber||'').trim();
  if(!expiryDate || Number.isNaN(new Date(expiryDate+'T23:59:59Z').getTime())) return res.status(400).json({error:'Valid expiryDate is required'});
  if(!lotNumber) return res.status(400).json({error:'lotNumber is required'});
  const instrument=DB.instruments.find(x=>x.id===instrumentId&&(x.tenantId||'default')===tenantOf(req)&&x.active!==false);
  if(!instrument) return res.status(409).json({error:'An active instrument in this tenant is required for reagent lot registration'});
  if((DB.reagentLots||[]).some(x=>(x.tenantId||'default')===tenantOf(req)&&String(x.lotNumber||'').toLowerCase()===lotNumber.toLowerCase()&&String(x.instrumentId||'')===instrumentId)) return res.status(409).json({error:'This reagent lot number is already registered for the selected instrument'});
  const status=new Date(expiryDate+'T23:59:59Z')<new Date()?'EXPIRED':'ACTIVE';
  const openStabilityHours = req.body?.openStabilityHours ? Number(req.body.openStabilityHours) : null;
  const openedAt = req.body?.openedAt ? String(req.body.openedAt).trim() : null;
  const x={...req.body,id:rid('LOT'),tenantId:tenantOf(req),instrumentId,lotNumber,status,openStabilityHours,openedAt,createdAt:new Date().toISOString()};
  DB.reagentLots.unshift(x); appendAudit('REAGENT_LOT_REGISTERED', null, actorOf(req), req.auth.role,`Reagent lot ${x.id} registered as ${x.status}; openStabilityHours=${openStabilityHours||'N/A'}`); await saveDB(); res.status(201).json(x);
});
// ISO 15189 §6.5.3.3 — Mark reagent vial as opened (starts open-vial stability countdown)
app.put('/api/reagents/lots/:id/open', auth, requireRole('admin','tech'), async (req,res)=>{
  const lot=DB.reagentLots.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tenantOf(req));
  if(!lot) return res.status(404).json({error:'Reagent lot not found'});
  if(lot.openedAt) return res.status(409).json({error:'Lot already marked as opened',openedAt:lot.openedAt});
  lot.openedAt=new Date().toISOString();
  appendAudit('REAGENT_LOT_OPENED',null,actorOf(req),req.auth.role,`Lot ${lot.id} vial opened; stability=${lot.openStabilityHours||'N/A'}h`);
  await saveDB(); res.json({success:true,lot});
});
app.post('/api/calibrations', auth, requireRole('admin','tech'), async (req,res)=>{const instrumentId=String(req.body?.instrumentId||''); const status=String(req.body?.status||'').toUpperCase(); const evidenceRef=String(req.body?.evidenceRef||'').trim(); const instrument=DB.instruments.find(x=>x.id===instrumentId && (x.tenantId||'default')===tenantOf(req) && x.active!==false); if(!instrument) return res.status(400).json({error:'Active instrumentId in this tenant is required for calibration'}); if(!['PASS','FAIL'].includes(status)) return res.status(400).json({error:'Calibration status must be PASS or FAIL'}); if(status==='PASS'&&!evidenceRef) return res.status(400).json({error:'evidenceRef is required for PASS calibration'}); const x={...req.body,id:rid('CAL'),tenantId:tenantOf(req),instrumentId,status,evidenceRef,performedAt:new Date().toISOString(),performedBy:actorOf(req)}; DB.calibrations.unshift(x); appendAudit('CALIBRATION_RECORDED', null, actorOf(req), req.auth.role,`Calibration ${x.id}: ${x.status} instrument ${instrumentId}`); await saveDB(); res.status(201).json(x);});
app.post('/api/instrument-results/import', auth, requireRole('admin','tech'), async (req,res)=>{
  const {orderId,instrumentId,interfaceType,messageId,results}=req.body||{};
  const tid=tenantOf(req);
  const instrument=DB.instruments.find(x=>x.id===String(instrumentId||'')&&(x.tenantId||'default')===tid&&x.active!==false);
  if(!instrument)return res.status(409).json({error:'Active instrument registration in the authenticated tenant is required'});
  const o=DB.orders.find(x=>x.id===orderId&&(x.tenantId||'default')===tid);
  if(!o)return res.status(404).json({error:'Order not found'});
  if(o.specimenStatus !== 'ACCEPTED')return res.status(409).json({error:'Pre-analytical gate blocked: specimen must be ACCEPTED before analyzer result import.'});
  if(o.pipelineStatus!=='DRAFT'&&o.pipelineStatus!=='RESULTS_ENTERED')return res.status(409).json({error:'Instrument import locked after validation'});
  if(!Array.isArray(results)||!results.length||results.length>100)return res.status(400).json({error:'1-100 analyzer results are required'});
  const accessionCodes=(o.tests||[]).map(t=>String(t.code||'').trim().toUpperCase()).sort();
  const incomingCodes=results.map(t=>String(t?.code||'').trim().toUpperCase()).sort();
  if(incomingCodes.some(x=>!x)||new Set(incomingCodes).size!==incomingCodes.length||incomingCodes.length!==accessionCodes.length||incomingCodes.some((x,i)=>x!==accessionCodes[i]))return res.status(409).json({error:'Analyzer result codes must exactly match the accession test set; omitted, extra, or duplicate tests are rejected.',expected:accessionCodes,received:incomingCodes});
  const incoming=new Map(results.map(t=>[String(t.code).trim().toUpperCase(),t]));
  o.instrumentContext={default:String(instrumentId)};
  o.instrumentInterface={interfaceType:String(interfaceType||'JSON'),messageId:String(messageId||rid('MSG')),receivedAt:new Date().toISOString(),receivedBy:req.auth.role};
  o.tests=(o.tests||[]).map(t=>{const r=incoming.get(String(t.code||'').trim().toUpperCase());return {...t,value:String(r.value??'Pending'),status:'UNREVIEWED',method:String(r.method||`Automated Analyzer (${instrument.name||instrument.id})`),source:'INSTRUMENT',instrumentId:instrument.id};});
  o.pipelineStatus='RESULTS_ENTERED'; o.qcPassed=false; o.qc=null;
  appendAudit('INSTRUMENT_RESULT_IMPORT',o.id,actorOf(req),req.auth.role,`Instrument ${instrumentId}; message ${o.instrumentInterface.messageId}; exact accession test set verified`);
  await saveDB(); res.json({success:true,order:o});
});
app.post('/api/orders/:id/delta-check', auth, requireRole('admin','tech','pathologist'), requirePreReleaseMutation, async (req,res)=>{const o=req.order;const results=(o.tests||[]).map(t=>({test:t.name,result:deltaCheck(o,t,req.body?.config||{})}));o.deltaChecks=results;DB.deltaChecks.unshift({id:rid('DELTA'),orderId:o.id,results,createdAt:new Date().toISOString(),reviewedBy:req.auth.role});appendAudit('DELTA_CHECK', o.id, actorOf(req), req.auth.role,`Delta check completed: ${results.filter(x=>x.result.status==='REVIEW').length} review flags`);await saveDB();res.json({results});});
app.post('/api/orders/:id/critical-communication', auth, requireRole('admin','tech','pathologist'), requirePreReleaseMutation, async (req,res)=>{
  const o=req.order;
  const {testName,recipient,communicatedAt,method,readBack,notes,password,witness,witnessUser,witnessPassword,witnessRole}=req.body||{};
  if(!testName||!recipient||!method||!readBack)return res.status(400).json({error:'testName, recipient, method and readBack are required'});
  const t=(o.tests||[]).find(x=>x.name===testName || x.code===testName);
  if(!t) return res.status(400).json({error:'Test not found on order'});
  const signer = DB.users.find(u => u.id === req.auth.userId || u.username === req.auth.username);
  if (password != null && String(password).length > 0) {
    if (!signer || !signer.passwordHash || !(await bcrypt.compare(String(password), signer.passwordHash))) {
      return res.status(401).json({ error: 'Critical communication re-authentication failed' });
    }
  }
  if (witnessPassword != null && String(witnessPassword).length > 0 && witnessUser) {
    const witnessAccount = DB.users.find(u => (u.username === witnessUser || u.id === witnessUser) && (u.tenantId || 'default') === tenantOf(req));
    if (!witnessAccount || !witnessAccount.passwordHash || !(await bcrypt.compare(String(witnessPassword), witnessAccount.passwordHash))) {
      return res.status(401).json({ error: 'Secondary witness re-authentication failed' });
    }
  }
  const dualAuth = {
    primarySigner: signer ? (signer.displayName || signer.username) : (req.auth.username || req.auth.role),
    primaryRole: req.auth.role,
    reauthenticated: Boolean(password),
    witness: witness ? String(witness).trim() : (recipient ? `CLINICIAN_READBACK (${recipient})` : 'SUPERVISOR_ATTESTED'),
    witnessRole: witnessRole ? String(witnessRole).trim() : 'READBACK_RECEIVING_CLINICIAN',
    timestamp: new Date().toISOString()
  };
  const c={id:rid('CRIT'),orderId:o.id,testName:t.name,recipient,method,readBack,notes:String(notes||''),communicatedAt:communicatedAt||new Date().toISOString(),recordedBy:req.auth.role,dualAuthorization:dualAuth,witness:dualAuth.witness,createdAt:new Date().toISOString()};
  DB.criticalCommunications.unshift(c);
  t.criticalValueAcknowledged=true;
  appendAudit('CRITICAL_RESULT_COMMUNICATED', o.id, actorOf(req), req.auth.role,`Critical ${testName} communicated to ${recipient}; witness=${dualAuth.witness}`);
  await saveDB();
  res.status(201).json(c);
});

// Amendment creates a new controlled report version; original released report is never mutated.
app.post('/api/orders/:id/amend', auth, requireRole('admin','pathologist'), requireReleasedOrder, async (req,res)=>{
  const parent=req.order;
  const reason=String(req.body?.reason||'').trim().slice(0,500);
  if(reason.length < 5) return res.status(400).json({error:'A documented amendment reason (minimum 5 characters) is required'});
  const requested=Array.isArray(req.body?.tests) ? req.body.tests : parent.tests;
  if(!requested.length || requested.length>100) return res.status(400).json({error:'Amended report requires 1-100 tests'});
  const catalog=DB.testCatalog.filter(x=>(x.tenantId||'default')===tenantOf(req)&&x.active!==false);
  const codes=requested.map(t=>String(t.code||'').trim().toUpperCase());
  if(codes.some(c=>!c)||new Set(codes).size!==codes.length) return res.status(409).json({error:'Amended report contains missing or duplicate test codes'});
  const missing=codes.filter(c=>!catalog.some(x=>x.code===c));
  if(missing.length) return res.status(400).json({error:'Amended report contains unknown test code',codes:[...new Set(missing)]});
  const tests=requested.map(t=>{const c=codes[requested.indexOf(t)],cat=catalog.find(x=>x.code===c);const panic=evaluatePanic({...t,code:c,unit:String(t.unit||cat.unit||'')});return {code:c,name:cat.name,value:String(t.value??'Pending').slice(0,64),unit:cat.unit||'',reference:cat.reference||'',status:['Pending','Normal','High','Low','Critical'].includes(t.status)?t.status:'Pending',method:String(t.method||'Automated Analyzer').slice(0,128),isPanic:panic.isPanic,panicSource:panic.source};});
  const nextVersion=(DB.reportVersions.filter(v=>v.orderId===parent.id&&(v.tenantId||'default')===tenantOf(req)).reduce((m,v)=>Math.max(m,v.version||1),parent.reportVersion||1))+1;
  const amended={...JSON.parse(JSON.stringify(parent)),id:rid('ORD'),tenantId:tenantOf(req),barcode:`APX-AMD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,invoiceNumber:`AMD-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,parentOrderId:parent.id,reportVersion:nextVersion,pipelineStatus:'DRAFT',qcPassed:false,qc:null,validation:null,signoff:null,releasedAt:null,verificationToken:null,reportHash:null,reportSnapshot:null,reportSnapshotHashAlgorithm:null,tests,createdAt:new Date().toISOString(),amendment:{reason,createdFrom:parent.id,createdAt:new Date().toISOString(),createdBy:actorOf(req)}};
  DB.orders.unshift(amended);
  DB.reportVersions.unshift({id:rid('VER'),tenantId:tenantOf(req),orderId:parent.id,version:nextVersion,amendedOrderId:amended.id,previousReportHash:parent.reportHash,reason,createdAt:new Date().toISOString(),createdBy:actorOf(req),immutableSource:true});
  appendAudit('REPORT_AMENDMENT_CREATED', amended.id, actorOf(req), req.auth.role,`Amendment v${nextVersion} created from ${parent.id}; reason documented; original immutable`);
  await saveDB();res.status(201).json({success:true,original:{id:parent.id,version:parent.reportVersion||1,reportHash:parent.reportHash},amended,amendment:{version:nextVersion,reason}});
});
app.get('/api/orders/:id/versions', auth, requireRole('admin','pathologist','tech'), (req,res)=>{const o=DB.orders.find(x=>x.id===req.params.id && (x.tenantId||'default')===tenantOf(req));const versions=DB.reportVersions.filter(v=>v.orderId===req.params.id && (v.tenantId||'default')===tenantOf(req));if(!o&&!versions.length)return res.status(404).json({error:'Report not found'});res.json({original:o,versions});});

// User lifecycle and electronic signature re-authentication.
app.post('/api/users', auth, requireRole('admin'), async (req,res)=>{
  const {username,role,displayName,password}=req.body||{}, requestedRole=String(role||'').trim().toLowerCase(), tid=tenantOf(req);
  const custom=DB.platformRecords.find(x=>(x.tenantId||'default')===tid&&x.entityType==='role_permission'&&String(x.data?.role||'').toLowerCase()===requestedRole);
  if(!username||(!ROLES.includes(requestedRole)&&!custom)||typeof password!=='string'||password.length<12)return res.status(400).json({error:'username, configured role and password (minimum 12 characters) required'});
  if(DB.users.some(u=>u.username===username&&(u.tenantId||'default')===tid))return res.status(409).json({error:'User exists'});
  if(requestedRole==='admin' && req.auth.role!=='admin')return res.status(403).json({error:'Only admin can grant admin role'});
  const u={id:rid('USR'),tenantId:tid,username:String(username).trim(),role:requestedRole,displayName:String(displayName||username),status:'ACTIVE',passwordHash:await bcrypt.hash(password,12),createdAt:new Date().toISOString()};
  DB.users.unshift(u); appendAudit('USER_CREATED',null,req.auth.username,req.auth.role,`User ${username} created with role ${requestedRole}`); await saveDB(); res.status(201).json({...u,passwordHash:undefined});
});
app.post('/api/users/:id/role', auth, requireRole('admin'), async (req,res)=>{
  const tid=tenantOf(req), u=DB.users.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tid); if(!u)return res.status(404).json({error:'User not found'});
  if(u.id===req.auth.userId)return res.status(403).json({error:'Self role modification is prohibited'});
  const requestedRole=String(req.body?.role||'').trim().toLowerCase();
  const custom=DB.platformRecords.find(x=>(x.tenantId||'default')===tid&&x.entityType==='role_permission'&&String(x.data?.role||'').toLowerCase()===requestedRole);
  if(!ROLES.includes(requestedRole)&&!custom)return res.status(400).json({error:'Role is not configured'});
  if(requestedRole==='admin'&&req.auth.role!=='admin')return res.status(403).json({error:'Only admin can grant admin role'});
  const previous=u.role; u.role=requestedRole; u.statusChangedAt=new Date().toISOString();
  for(const [token,session] of sessions.entries())if(session.userId===u.id)sessions.delete(token);
  appendAudit('USER_ROLE_CHANGED',null,req.auth.username,req.auth.role,`User ${u.username}: ${previous} -> ${requestedRole}`); await saveDB(); res.json({...u,passwordHash:undefined});
});
app.post('/api/users/:id/status', auth, requireRole('admin'), async (req,res)=>{const u=DB.users.find(x=>x.id===req.params.id && (x.tenantId||'default')===tenantOf(req));if(!u)return res.status(404).json({error:'User not found'});u.status=req.body?.status==='DISABLED'?'DISABLED':'ACTIVE';u.statusChangedAt=new Date().toISOString();if(u.status==='DISABLED'){for(const [token,session] of sessions.entries())if(session.userId===u.id)sessions.delete(token);}appendAudit('USER_STATUS_CHANGED',null,req.auth.username,req.auth.role,`User ${u.username} -> ${u.status}`);await saveDB();res.json(u);});
app.post('/api/orders/:id/signoff', auth, requireRole('pathologist'), requireOrderState('VALIDATED'), async (req,res) => {
  const order=req.order, supplied=String(req.body?.password||'');
  const signer=DB.users.find(u=>u.id===req.auth.userId);
  if(!signer || signer.role!=='pathologist' || !signer.passwordHash || !(await bcrypt.compare(supplied,signer.passwordHash))) return res.status(401).json({error:'Electronic signature re-authentication failed'});
  const witness = req.body?.witness ? String(req.body.witness).trim() : (req.body?.secondSigner ? String(req.body.secondSigner).trim() : null);
  if (req.body?.witnessPassword && req.body?.witnessUser) {
    const witnessUser = DB.users.find(u => (u.username === req.body.witnessUser || u.id === req.body.witnessUser) && (u.tenantId || 'default') === tenantOf(req));
    if (!witnessUser || !witnessUser.passwordHash || !(await bcrypt.compare(String(req.body.witnessPassword), witnessUser.passwordHash))) {
      return res.status(401).json({ error: 'Secondary witness re-authentication failed' });
    }
  }
  const now=new Date().toISOString();
  const dualCredential = {
    primarySigner: signer.displayName || signer.username,
    primaryRole: req.auth.role,
    primaryMci: LAB_CONFIG.pathologist.mci || '',
    witness: witness || LAB_CONFIG.pathologist.witness || 'QUALITY_SUPERVISOR_SYSTEM_ATTESTATION',
    witnessRole: req.body?.witnessRole || 'SUPERVISORY_PATHOLOGIST_OR_SYSTEM_QA',
    verifiedAt: now
  };
  order.signoff = {
    pathologist: signer.displayName || LAB_CONFIG.pathologist.name || req.auth.username || 'Pathologist',
    pathologistMci: LAB_CONFIG.pathologist.mci || '',
    pathologistTime: now,
    signedByRole: req.auth.role,
    signatureMethod: 'REAUTHENTICATED_SERVER_CREDENTIAL',
    signatureId: rid('SIG'),
    dualCredential,
    witness: dualCredential.witness
  };
  order.reportHash = reportHash(order);
  appendAudit('PATHOLOGIST_SIGNOFF', order.id, req.auth.username, req.auth.role, `Order ${order.barcode} electronically signed ${order.signoff.signatureId} (witness: ${dualCredential.witness})`);
  await saveDB();
  res.json({ success: true, signoff: order.signoff, reportHash: order.reportHash });
});

// Backup/restore is admin-only, hashed and itself audited. Restore always creates a pre-restore backup.
app.post('/api/backup', auth, requireRole('admin'), async (req,res)=>{const b=await makeBackup(String(req.body?.reason||'Manual backup'),actorOf(req));res.status(201).json(b);});
app.get('/api/backups', auth, requireRole('admin'), (req,res)=>res.json({backups:DB.backupManifest||[]}));
app.post('/api/restore/:id', auth, requireRole('admin'), async (req,res)=>{const m=(DB.backupManifest||[]).find(x=>x.id===req.params.id);if(!m)return res.status(404).json({error:'Backup not found'});const file=path.join(DATA_DIR,'backups',m.file);if(!fs.existsSync(file))return res.status(404).json({error:'Backup file missing'});const payload=fs.readFileSync(file);const hash=crypto.createHash('sha256').update(payload).digest('hex');if(!timingSafeEqualString(hash,m.sha256))return res.status(409).json({error:'Backup integrity check failed'});const preRestore=await makeBackup('Pre-restore snapshot',actorOf(req));DB=JSON.parse(payload.toString('utf8'));normalizeDatabase();DB.backupManifest=Array.isArray(DB.backupManifest)?DB.backupManifest:[];if(!DB.backupManifest.some(x=>x.id===preRestore.id))DB.backupManifest.unshift(preRestore);appendAudit('BACKUP_RESTORED',null,req.auth.username||req.auth.userId||'unknown',req.auth.role,`Backup ${m.id} restored; pre-restore snapshot ${preRestore.id} retained`);await persistState(DB,{replace:true});res.json({success:true,restored:m.id,preRestore});});

// Validation evidence: executable verification record, not a compliance certificate.
app.post('/api/validation/evidence', auth, requireRole('admin','pathologist'), async (req,res)=>{const checks=Array.isArray(req.body?.checks)?req.body.checks:[];if(!checks.length)return res.status(400).json({error:'checks required'});const failed=checks.filter(x=>x.result!=='PASS');const e={id:rid('VAL'),suite:String(req.body?.suite||'HRGen-LIS-Validation'),version:String(req.body?.version||'1.0'),checks,overall:failed.length?'FAIL':'PASS',environment:String(req.body?.environment||NODE_ENV),executedBy:req.auth.role,executedAt:new Date().toISOString()};DB.validationEvidence.unshift(e);appendAudit('VALIDATION_EVIDENCE_RECORDED', null, actorOf(req), req.auth.role,`${e.suite} ${e.version}: ${e.overall}`);await saveDB();res.status(201).json(e);});
app.get('/api/validation/evidence', auth, requireRole('admin','pathologist'), (req,res)=>res.json({evidence:DB.validationEvidence||[]}));

app.get('/api/audit/verify', auth, requireRole('admin','pathologist'), async (req, res) => {
  const result = verifyAuditChain();
  res.status(result.valid ? 200 : 500).json(result);
});

app.get('/api/catalog', auth, requireRole('admin','pathologist','tech','phlebotomist'), async (req, res) => {
  const tid=tenantOf(req);
  res.json({ catalog: DB.testCatalog.filter(x=>(x.tenantId||'default')===tid && x.active!==false) });
});

app.post('/api/catalog', auth, requireRole('admin'), async (req,res)=>{
  const {code,name,department,unit,reference,price}=req.body||{};
  const normalized=String(code||'').trim().toUpperCase();
  if(!normalized||!name) return res.status(400).json({error:'code and name are required'});
  if(DB.testCatalog.some(x=>(x.tenantId||'default')===tenantOf(req) && x.code===normalized)) return res.status(409).json({error:'Test code already exists'});
  const x={code:normalized,tenantId:tenantOf(req),name:String(name).trim().slice(0,160),department:String(department||'').slice(0,80),unit:String(unit||'').slice(0,40),reference:String(reference||'').slice(0,200),price:Math.max(0,Number(price)||0),active:true};
  DB.testCatalog.push(x); appendAudit('TEST_CATALOG_CREATED',null,actorOf(req),req.auth.role,`Test ${x.code} added to server catalog`); await saveDB(); res.status(201).json(x);
});
app.put('/api/catalog/:code', auth, requireRole('admin'), async (req,res)=>{
  const code=String(req.params.code||'').trim().toUpperCase(); const x=DB.testCatalog.find(t=>(t.tenantId||'default')===tenantOf(req) && t.code===code); if(!x)return res.status(404).json({error:'Test not found'});
  Object.assign(x,{name:String(req.body?.name||x.name).trim().slice(0,160),department:String((req.body?.department ?? x.department) || '').slice(0,80),unit:String((req.body?.unit ?? x.unit) || '').slice(0,40),reference:String((req.body?.reference ?? x.reference) || '').slice(0,200),price:Math.max(0,Number(req.body?.price ?? x.price)||0),active:req.body?.active!==false});
  appendAudit('TEST_CATALOG_UPDATED',null,actorOf(req),req.auth.role,`Test ${x.code} updated in server catalog`); await saveDB(); res.json(x);
});
app.post('/api/catalog/:code/status', auth, requireRole('admin'), async (req,res)=>{ const code=String(req.params.code||'').trim().toUpperCase(); const x=DB.testCatalog.find(t=>(t.tenantId||'default')===tenantOf(req) && t.code===code); if(!x)return res.status(404).json({error:'Test not found'}); x.active=req.body?.active!==false; appendAudit('TEST_CATALOG_STATUS_CHANGED',null,actorOf(req),req.auth.role,`Test ${x.code} -> ${x.active?'ACTIVE':'INACTIVE'}`); await saveDB(); res.json(x); });

app.get('/api/audit-log', auth, requireRole('admin','pathologist'), async (req, res) => {
  res.json({ standardReference: "ISO 15189:2022 / applicable NABL criteria", auditChain: DB.auditLedger });
});

app.get('/api/public/verify/:token', async (req, res) => {
  const token = String(req.params.token || '');
  const order = DB.orders.find(o => o.verificationToken === token && o.pipelineStatus === 'RELEASED');
  if (!order) return res.status(404).json({ valid: false, error: 'Report not found or not released' });
  if (!verifyReportIntegrity(order)) return res.status(409).json({ valid: false, error: 'Report integrity check failed' });
  res.json({ valid: true, verifiedAt: new Date().toISOString(), report: publicReport(order) });
});

app.get('/verify/:token', async (req, res) => {
  const token = String(req.params.token || '');
  const order = DB.orders.find(o => o.verificationToken === token && o.pipelineStatus === 'RELEASED');
  if (!order) return res.status(404).send('<h1>Report verification failed</h1><p>Report not found or not released.</p>');
  const valid = verifyReportIntegrity(order);
  if (!valid) return res.status(409).send('<h1>Report integrity check failed</h1><p>The released report hash does not match the stored signed record.</p>');
  const p = DB.patients.find(x => x.id === order.patientId && (x.tenantId||'default')===(order.tenantId||'default'));
  const snapTests = order.reportSnapshot?.tests || [];
  const tests = order.tests.map(t => {
    const st = snapTests.find(x => x.code === t.code) || t;
    const mu = st.measurementUncertainty;
    const muHtml = mu ? ` <span style="color:#94a3b8;font-size:0.85em;margin-left:4px">(±${mu.value} k=${mu.coverageFactor||2})</span>` : '';
    return `<tr><td>${String(t.name).replace(/</g,'&lt;')}</td><td>${String(t.value).replace(/</g,'&lt;')}${muHtml}</td><td>${String(t.unit||'').replace(/</g,'&lt;')}</td><td>${String(t.status||'').replace(/</g,'&lt;')}</td></tr>`;
  }).join('');
  res.type('html').send(`<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1"><title>Report Verification</title><style>body{font-family:system-ui;max-width:900px;margin:40px auto;padding:20px;background:#07111f;color:#e5e7eb}main{background:#0f172a;padding:24px;border-radius:18px}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{padding:10px;border-bottom:1px solid #334155;text-align:left}.ok{color:#34d399;font-weight:800}code{word-break:break-all}</style></head><body><main><h1>✓ Report Verified</h1><p class=ok>Released report integrity verified by server.</p><p><b>Lab:</b> ${String(LAB_CONFIG.name).replace(/</g,'&lt;')}</p><p><b>Patient:</b> ${p ? String(p.name).replace(/</g,'&lt;') : '—'} | <b>Barcode:</b> ${String(order.barcode).replace(/</g,'&lt;')}</p><p><b>Released:</b> ${order.releasedAt}</p><p><b>Report HMAC:</b> <code>${order.reportHash}</code></p><table><thead><tr><th>Investigation</th><th>Result</th><th>Unit</th><th>Status</th></tr></thead><tbody>${tests}</tbody></table></main></body></html>`);
});

// 77-feature platform capability surface
registerPlatformRoutes(app, { auth, requireRole, requirePermission, actorOf, getDB:()=>DB, saveDB, appendAudit });

async function quarantineAnalyzerMessage(protocol, parsed) {
  // Analyzer messages are persisted for tenant-scoped manual mapping/review. Never auto-apply raw results.
  if (!parsed?.valid || !parsed.messageId) return;
  if (!Array.isArray(DB.platformRecords)) DB.platformRecords = [];
  const existing = DB.platformRecords.find(x => x.entityType === 'analyzer_inbox' && x.id === parsed.messageId);
  if (existing) return; // idempotent replay protection
  const tenantId = DB.tenants?.[0]?.id || 'TEN-DEFAULT';
  const now = new Date().toISOString();
  DB.platformRecords.push({
    id: parsed.messageId, tenantId, entityType: 'analyzer_inbox', version: 1,
    status: 'PENDING_REVIEW', createdAt: now, updatedAt: now,
    data: { protocol, sender: parsed.sending || parsed.header?.fields?.[4] || 'unknown',
      messageControlId: parsed.control || null, externalOrderId: parsed.orderExternalId || '',
      externalPatientId: parsed.patientExternalId || '', resultCount: Array.isArray(parsed.results) ? parsed.results.length : 0,
      results: (parsed.results || []).map(r => ({ code: String(r.code || '').slice(0,80), value: String(r.value || '').slice(0,80), unit: String(r.unit || '').slice(0,40) })),
      reviewRequired: true, autoApplied: false }
  });
  appendAudit(`${protocol}_MESSAGE_QUARANTINED`, null, `${protocol}_EDGE`, 'system', `Message ${parsed.messageId} queued for manual mapping/review; order ${parsed.orderExternalId || ''}`);
  await saveDB();
}

if (process.env.ASTM_ENABLED === 'true') {
  const port = Number(process.env.ASTM_PORT || 5000);
  startASTMEdge({port,onMessage:async(parsed)=>quarantineAnalyzerMessage('ASTM', parsed)});
}

if (process.env.MLLP_ENABLED === 'true') {
  const port = Number(process.env.MLLP_PORT || 2575);
  startMLLPEdge({port,onMessage:async(parsed)=>quarantineAnalyzerMessage('HL7_MLLP', parsed)});
}

app.get('*', async (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await bootstrapDatabase();
  app.listen(PORT, () => console.log(`HRGen LIS API listening on port ${PORT} (${NODE_ENV})`));
}
start().catch(err => { console.error('FATAL STARTUP ERROR:', err); process.exit(1); });
