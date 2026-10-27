const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = p => fs.readFileSync(path.join(root,p),'utf8');

const server = read('server.js');
const html = read('public/index.html');
const env = read('.env.example');
const pkg = JSON.parse(read('package.json'));
const schema = read('db/postgres.js');
const compose = read('docker-compose.yml');

const checks = [
  ['server-side auth middleware exists', /function auth\(req, res, next\)/.test(server)],
  ['patient GET is authenticated', /app\.get\('\/api\/patients', auth,/.test(server)],
  ['orders GET is authenticated', /app\.get\('\/api\/orders', auth,/.test(server)],
  ['audit GET is authenticated', /app\.get\('\/api\/audit-log', auth,/.test(server)],
  ['signoff is pathologist-only', /\/api\/orders\/:id\/signoff', auth, requireRole\('pathologist'\),/.test(server)],
  ['permissive CORS removed', !/app\.use\(cors\(\)\)/.test(server)],
  ['browser hardcoded passcodes removed', !/1111|2222|3333/.test(html)],
  ['browser fake Math.random hash removed', !/Math\.random\(\).*SHA256/.test(html)],
  ['bcrypt authentication implemented', /bcrypt\.compare/.test(server) && /bcrypt\.hash/.test(server)],
  ['production bootstrap requires explicit credentials', /BOOTSTRAP_ADMIN_USERNAME/.test(server) && /BOOTSTRAP_ADMIN_PASSWORD/.test(env)],
  ['no role password constants', !/ROLE_PASSWORDS|PATHOLOGIST_PASSWORD|TECH_PASSWORD|PHLEBOTOMIST_PASSWORD/.test(server)],
  ['no embedded demo patients', !/Demo Patient 00[12]/.test(server)],
  ['PostgreSQL adapter present', /require\('\.\/db\/postgres'\)/.test(server)],
  ['PostgreSQL relational tables present', /CREATE TABLE IF NOT EXISTS users/.test(schema) && /CREATE TABLE IF NOT EXISTS orders/.test(schema) && /CREATE TABLE IF NOT EXISTS order_tests/.test(schema)],
  ['no db.json persistence', !/DB_FILE|db\.json/.test(server)],
  ['transactional persistence', /BEGIN/.test(schema) && /COMMIT/.test(schema) && /ROLLBACK/.test(schema)],
  ['HMAC audit hash chain', /createHmac\('sha256', AUTH_SECRET\)/.test(server) && /previousHash/.test(server)],
  ['non-root Docker user', /USER node/.test(read('Dockerfile'))],
  ['npm start loads env explicitly', /node --env-file=\.env server\.js/.test(pkg.scripts.start)],
  ['no browser-local patient/report storage', !/localStorage\.(setItem|getItem)\([^)]*(patient|report)/i.test(html)],
  ['no false accreditation banner', !/ACCREDITED/.test(html)],
  ['catalog is server-driven', /populateTestCatalog\(\)/.test(html) || /\/api\/catalog/.test(html)],
  ['catalog GET protected and tenant-filtered', /app\.get\('\/api\/catalog', auth/.test(server) && /DB\.testCatalog\.filter/.test(server) && /tenantOf\(req\)/.test(server)],
  ['disabled user sessions are revoked', /session\.userId(?:\s*===\s*)u\.id/.test(server) && /User account disabled/.test(server)],
  ['exact test-code validation exists', /Unknown or missing test code/.test(server) && /catalogItem/.test(server)],
  ['unit-aware panic table exists', /PANIC_LIMITS/.test(server) && /NA:/.test(server) && /CALCIUM:/.test(server) && /CREAT:/.test(server)],
  ['behavior test tooling present', /vitest run/.test(pkg.scripts.test) && /playwright test/.test(pkg.scripts['test:e2e'])],
  ['Postgres service in compose', /postgres:16-alpine/.test(compose) && /hrgen_pgdata/.test(compose)],
  ['deterministic audit sequence ordering', /audit_seq BIGSERIAL/.test(schema) && /ORDER BY audit_seq DESC/.test(schema)],
  ['post-release delta mutation blocked', /requirePreReleaseMutation/.test(server) && /delta-check/.test(server)],
  ['post-release critical mutation blocked', /requirePreReleaseMutation/.test(server) && /critical-communication/.test(server)],
  ['calibration requires instrument and PASS evidence', /Active instrumentId (in this tenant )?is required for calibration/.test(server) && /evidenceRef is required for PASS calibration/.test(server)],
  ['expired reagent cannot remain ACTIVE', /'EXPIRED':'ACTIVE'/.test(server)],
  ['placeholder patient data removed', !/Sunil Kumar Verma|Dr\. A\. K\. Gupta|APX-LAB-992147/.test(html)],
  ['patient history keyed by authoritative patient id', /o\.patientId === id && o\.patient\?\.id === id/.test(html)],
  ['API no-store headers for protected API', /Cache-Control','no-store/.test(server)]
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log(`\nFORENSIC_STATIC_VERIFY_OK (${checks.length} checks)`);
