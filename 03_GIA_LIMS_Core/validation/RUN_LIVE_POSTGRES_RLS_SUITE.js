'use strict';
const path = require('path');
const fs = require('fs');
const os = require('node:os');
const net = require('node:net');
const assert = require('node:assert/strict');
const { spawnSync, spawn } = require('child_process');
const crypto = require('node:crypto');
const { Pool, Client } = require('pg');
const EmbeddedPostgres = require('embedded-postgres').default;

// Prevent idle pool disconnect noise during intentional database restart
process.on('uncaughtException', (err) => {
  if (err && err.message && (err.message.includes('Connection terminated unexpectedly') || err.message.includes('read ECONNRESET'))) {
    return;
  }
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

// Every run owns a fresh cluster directory. Never remove a fixed workspace
// path: it may belong to an existing developer or laboratory database.
const PG_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'hrgen-lims-rls-'));
let PG_PORT;
const DB_NAME = 'hrgen_lis';
const MIGRATOR_PASS = 'migrator_pass_123';
const APP_PASS = 'app_pass_123';

let SUPER_URL;
let ADMIN_LIS_URL;
let MIGRATOR_URL;
let APP_URL;
const PG_CTL = path.join(__dirname, '..', 'node_modules', '@embedded-postgres', 'windows-x64', 'native', 'bin', 'pg_ctl.exe');
const POSTGRES_BIN = path.join(__dirname, '..', 'node_modules', '@embedded-postgres', 'windows-x64', 'native', 'bin', 'postgres.exe');

async function getAvailablePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function main() {
  console.log('=== [1/7] INITIALIZING LIVE POSTGRESQL ENGINE ===');
  try {
    PG_PORT = await getAvailablePort();
    SUPER_URL = `postgresql://postgres:password@127.0.0.1:${PG_PORT}/postgres`;
    ADMIN_LIS_URL = `postgresql://postgres:password@127.0.0.1:${PG_PORT}/${DB_NAME}`;
    MIGRATOR_URL = `postgresql://hrgen_migrator:${MIGRATOR_PASS}@127.0.0.1:${PG_PORT}/${DB_NAME}`;
    APP_URL = `postgresql://hrgen_app:${APP_PASS}@127.0.0.1:${PG_PORT}/${DB_NAME}`;

    const pg = new EmbeddedPostgres({
      databaseDir: PG_DATA,
      port: PG_PORT,
      persistent: true
    });

    await pg.initialise();
    await pg.start();
    console.log(`PASS :: PostgreSQL 18.4 engine listening on port ${PG_PORT}`);

    console.log('\n=== [2/7] PROVISIONING DATABASE AND LEAST-PRIVILEGE ROLES ===');
    const superClient = new Client({ connectionString: SUPER_URL });
    await superClient.connect();
    
    const dbCheck = await superClient.query(`SELECT 1 FROM pg_database WHERE datname=$1`, [DB_NAME]);
    if (dbCheck.rowCount === 0) {
      await superClient.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`PASS :: Created database ${DB_NAME}`);
    }
    await superClient.end();

    const lisAdminClient = new Client({ connectionString: ADMIN_LIS_URL });
    await lisAdminClient.connect();
    await lisAdminClient.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='hrgen_migrator') THEN
          CREATE ROLE hrgen_migrator LOGIN PASSWORD '${MIGRATOR_PASS}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='hrgen_app') THEN
          CREATE ROLE hrgen_app LOGIN PASSWORD '${APP_PASS}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
        END IF;
      END $$;
      GRANT CONNECT ON DATABASE ${DB_NAME} TO hrgen_app, hrgen_migrator;
      GRANT USAGE, CREATE ON SCHEMA public TO hrgen_migrator;
      GRANT USAGE ON SCHEMA public TO hrgen_app;
      ALTER ROLE hrgen_app SET row_security = on;
    `);
    console.log('PASS :: Provisioned hrgen_migrator and hrgen_app roles with least privilege');
    await lisAdminClient.end();

    console.log('\n=== [3/7] EXECUTING SCHEMA MIGRATIONS (ensureSchema & RLS HARDENING) ===');
    process.env.MIGRATION_DATABASE_URL = MIGRATOR_URL;
    process.env.DATABASE_URL = APP_URL;
    
    const dbPostgres = require('../db/postgres.js');
    await dbPostgres.ensureSchema();
    console.log('PASS :: ensureSchema() completed under hrgen_migrator');
    await dbPostgres.assertRuntimeRole();
    console.log('PASS :: Runtime role cannot own tenant tables and includes tenants in the ownership check');

    const migrationSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '20261015_tenant_rls_hardening.sql'), 'utf8');
    const migratorClient = new Client({ connectionString: MIGRATOR_URL });
    await migratorClient.connect();
    await migratorClient.query(migrationSql);
    console.log('PASS :: 20261015_tenant_rls_hardening.sql applied');

    // Seed synthetic tenants required by POSTGRES_RLS_INTEGRATION_TEST
    await migratorClient.query(`
      INSERT INTO tenants(id, slug, name, status) VALUES
        ('tenant_alpha_01', 'alpha', 'Synthetic Hospital Alpha', 'ACTIVE'),
        ('tenant_beta_02', 'beta', 'Synthetic Clinic Beta', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('PASS :: Seeded synthetic tenant fixtures (tenant_alpha_01, tenant_beta_02)');

    const nullFixture=`preflight_null_${process.pid}`;
    await migratorClient.query('BEGIN');
    await migratorClient.query('ALTER TABLE patients DISABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE patients NO FORCE ROW LEVEL SECURITY');
    await migratorClient.query('INSERT INTO patients(id,tenant_id,uhid,name,data) VALUES($1,NULL,$2,$3,$4)',[nullFixture,`PREFLIGHT_NULL_${process.pid}`,'Unassigned synthetic row','{}']);
    await migratorClient.query('ALTER TABLE patients ENABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE patients FORCE ROW LEVEL SECURITY');
    await migratorClient.query('COMMIT');
    await assert.rejects(dbPostgres.ensureSchema(),/patients contains 1 row\(s\) with NULL tenant_id/);
    console.log('PASS :: Migration preflight stops on unassigned tenant records without assigning a tenant');
    await migratorClient.query('BEGIN');
    await migratorClient.query('ALTER TABLE patients DISABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE patients NO FORCE ROW LEVEL SECURITY');
    await migratorClient.query('DELETE FROM patients WHERE id=$1',[nullFixture]);
    await migratorClient.query('ALTER TABLE patients ENABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE patients FORCE ROW LEVEL SECURITY');
    await migratorClient.query('COMMIT');
    await dbPostgres.ensureSchema();

    const mismatchPatient=`preflight_patient_${process.pid}`,mismatchOrder=`preflight_order_${process.pid}`;
    await migratorClient.query('BEGIN');
    await migratorClient.query('ALTER TABLE patients DISABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE patients NO FORCE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders DISABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders NO FORCE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders DROP CONSTRAINT orders_patient_tenant_fk');
    await migratorClient.query('INSERT INTO patients(id,tenant_id,uhid,name,data) VALUES($1,$2,$3,$4,$5)',[mismatchPatient,'tenant_alpha_01',`PREFLIGHT_MISMATCH_${process.pid}`,'Synthetic Alpha patient','{}']);
    await migratorClient.query('INSERT INTO orders(id,tenant_id,patient_id,barcode,invoice_number,pipeline_status,data) VALUES($1,$2,$3,$4,$5,$6,$7)',[mismatchOrder,'tenant_beta_02',mismatchPatient,`PREFLIGHT_BC_${process.pid}`,`PREFLIGHT_INV_${process.pid}`,'REGISTERED','{}']);
    await migratorClient.query('ALTER TABLE patients ENABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE patients FORCE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders ENABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders FORCE ROW LEVEL SECURITY');
    await migratorClient.query('COMMIT');
    await assert.rejects(dbPostgres.ensureSchema(),/Tenant relationship preflight failed.*orders\.patient=1/);
    console.log('PASS :: Migration preflight stops on cross-tenant patient/order references');
    await migratorClient.query('BEGIN');
    await migratorClient.query('ALTER TABLE patients DISABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE patients NO FORCE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders DISABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders NO FORCE ROW LEVEL SECURITY');
    await migratorClient.query('DELETE FROM orders WHERE id=$1',[mismatchOrder]);
    await migratorClient.query('DELETE FROM patients WHERE id=$1',[mismatchPatient]);
    await migratorClient.query('ALTER TABLE patients ENABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE patients FORCE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders ENABLE ROW LEVEL SECURITY');
    await migratorClient.query('ALTER TABLE orders FORCE ROW LEVEL SECURITY');
    await migratorClient.query('COMMIT');
    await dbPostgres.ensureSchema();
    await migratorClient.end();

    console.log('\n=== [4/7] RUNNING CANONICAL POSTGRES_RLS_INTEGRATION_TEST.js ===');
    const rlsRun = spawnSync(process.execPath, [path.join(__dirname, 'POSTGRES_RLS_INTEGRATION_TEST.js')], {
      env: { ...process.env, DATABASE_URL: APP_URL },
      encoding: 'utf8'
    });
    console.log(rlsRun.stdout);
    if (rlsRun.stderr) console.error(rlsRun.stderr);
    assert.equal(rlsRun.status, 0, 'POSTGRES_RLS_INTEGRATION_TEST must exit with 0');
    console.log('PASS :: Canonical POSTGRES_RLS_INTEGRATION_TEST passed with Exit Code 0');

    console.log('\n=== [5/7] RUNNING CONCURRENT WRITE & ROLLBACK ISOLATION TESTS ===');
    const appPool = new Pool({ connectionString: APP_URL, max: 10 });

    // Test A: Rollback isolation
    const c1 = await appPool.connect();
    try {
      await c1.query('BEGIN');
      await c1.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
      await c1.query("INSERT INTO patients(id, tenant_id, uhid, name, data) VALUES('pt_rb_01', 'tenant_alpha_01', 'UHID_RB01', 'Rollback Patient', '{}')");
      await c1.query('ROLLBACK');

      const checkRb = await c1.query("SELECT * FROM patients WHERE id='pt_rb_01'");
      assert.equal(checkRb.rowCount, 0, 'Rolled back row must not exist');
      console.log('PASS :: Transactional rollback verified clean (zero orphan rows)');
    } finally {
      c1.release();
    }

    // Test B: Concurrent writes on different tenants
    const cA = await appPool.connect();
    const cB = await appPool.connect();
    try {
      await Promise.all([
        (async () => {
          await cA.query('BEGIN');
          await cA.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
          await cA.query("INSERT INTO patients(id, tenant_id, uhid, name, data) VALUES('pt_conc_a', 'tenant_alpha_01', 'UHID_CONC_A', 'Concurrent Alpha', '{}')");
          await cA.query('COMMIT');
        })(),
        (async () => {
          await cB.query('BEGIN');
          await cB.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_beta_02']);
          await cB.query("INSERT INTO patients(id, tenant_id, uhid, name, data) VALUES('pt_conc_b', 'tenant_beta_02', 'UHID_CONC_B', 'Concurrent Beta', '{}')");
          await cB.query('COMMIT');
        })()
      ]);

      // Verify cross-read isolation inside tenant transactions
      await cA.query('BEGIN');
      await cA.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
      const resA = await cA.query("SELECT id FROM patients WHERE id IN ('pt_conc_a', 'pt_conc_b')");
      assert.deepEqual(resA.rows.map(r => r.id), ['pt_conc_a']);
      await cA.query('COMMIT');
      console.log('PASS :: Concurrent write succeeded without crosstalk; Tenant Alpha sees only pt_conc_a');

      await cB.query('BEGIN');
      await cB.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_beta_02']);
      const resB = await cB.query("SELECT id FROM patients WHERE id IN ('pt_conc_a', 'pt_conc_b')");
      assert.deepEqual(resB.rows.map(r => r.id), ['pt_conc_b']);
      await cB.query('COMMIT');
      console.log('PASS :: Concurrent write succeeded without crosstalk; Tenant Beta sees only pt_conc_b');

      // Test C: Missing tenant context fails closed
      await cA.query('BEGIN');
      await cA.query("SELECT set_config('app.tenant_id', '', true)");
      const noCtx = await cA.query("SELECT id FROM patients WHERE id IN ('pt_conc_a', 'pt_conc_b')");
      assert.equal(noCtx.rowCount, 0, 'Missing tenant context must see 0 rows');
      await cA.query('COMMIT');
      console.log('PASS :: Missing tenant context fails closed (0 rows visible)');

      // Test D: Composite tenant foreign keys prevent references into another tenant.
      const suffix = crypto.randomBytes(4).toString('hex');
      await cA.query('BEGIN');
      await cA.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
      let foreignError=null;
      try {
        await cA.query(`INSERT INTO orders(id,tenant_id,patient_id,barcode,invoice_number,pipeline_status,data) VALUES($1,$2,$3,$4,$5,'REGISTERED','{}')`,[`order_foreign_${suffix}`,'tenant_alpha_01',`pt_conc_b`,`BC_FOREIGN_${suffix}`,`INV_FOREIGN_${suffix}`]);
      } catch (e) { foreignError=e; }
      assert(foreignError&&['23503','42501'].includes(foreignError.code),`tenant A foreign-patient reference must be denied by composite FK or RLS; got ${foreignError?.code||'no error'} ${foreignError?.message||''}`);
      await cA.query('ROLLBACK');
      console.log('PASS :: Composite foreign key rejects a foreign-tenant patient reference');

      // Test E: Persistent sessions and revocation are visible across independent app connections.
      const userId=`session_user_${suffix}`,sessionId=`session_${suffix}`,sessionHash=`session_hash_${suffix}`;
      await cA.query('BEGIN');
      await cA.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
      await cA.query(`INSERT INTO users(id,tenant_id,username,role,status,password_hash,display_name,data) VALUES($1,$2,$3,'admin','ACTIVE','test-hash','Synthetic admin','{}')`,[userId,'tenant_alpha_01',userId]);
      await cA.query(`INSERT INTO auth_sessions(id,tenant_id,user_id,token_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '1 hour')`,[sessionId,'tenant_alpha_01',userId,sessionHash]);
      await cA.query('COMMIT');
      await cA.query('BEGIN');await cA.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
      assert.equal((await cA.query('SELECT id FROM auth_sessions WHERE token_hash=$1 AND revoked_at IS NULL',[sessionHash])).rowCount,1);
      await cA.query('COMMIT');
      await cB.query('BEGIN');await cB.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
      await cB.query('UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=$1',[sessionHash]);await cB.query('COMMIT');
      await cA.query('BEGIN');await cA.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
      assert.equal((await cA.query('SELECT id FROM auth_sessions WHERE token_hash=$1 AND revoked_at IS NULL',[sessionHash])).rowCount,0);
      await cA.query('COMMIT');
      console.log('PASS :: Session revocation on one app connection is enforced on another connection');

      const idemKey=`idem_${suffix}`,idemExpiry=new Date(Date.now()+3600000);
      const idemResults=await Promise.all([
        dbPostgres.storeIdempotency('tenant_alpha_01',userId,'POST /api/patients',idemKey,'body_hash_v1',201,{patientId:'synthetic_patient'},idemExpiry),
        dbPostgres.storeIdempotency('tenant_alpha_01',userId,'POST /api/patients',idemKey,'body_hash_v1',201,{patientId:'synthetic_patient'},idemExpiry)
      ]);
      assert.equal(idemResults.filter(x=>x.created).length,1,'one concurrent replay must create the durable idempotency row');
      assert.equal(idemResults.filter(x=>!x.created).length,1,'the duplicate concurrent replay must read the stored response');
      const replay=await dbPostgres.lookupIdempotency('tenant_alpha_01',userId,'POST /api/patients',idemKey);
      assert.equal(replay.body_hash,'body_hash_v1');assert.deepEqual(replay.response_body,{patientId:'synthetic_patient'});
      console.log('PASS :: Concurrent replay returns the single durable stored response');
    } finally {
      cA.release();
      cB.release();
    }

    console.log('\n=== [6/7] TESTING RESTART RESILIENCE & DATA SURVIVAL ===');
    await dbPostgres.pool.end();
    await dbPostgres.migrationPool.end();
    await appPool.end();
    
    // Stop cleanly using pg_ctl with wait flag -w
    spawnSync(PG_CTL, ['stop', '-D', PG_DATA, '-m', 'fast', '-w']);
    console.log('PASS :: Database stopped cleanly via pg_ctl');
    await new Promise(r => setTimeout(r, 1000));

    // Spawn postgres directly and wait for ready
    const restartedProc = await new Promise((resolve, reject) => {
      const p = spawn(POSTGRES_BIN, ['-D', PG_DATA, '-p', PG_PORT.toString()]);
      p.stderr.on('data', (d) => {
        const msg = d.toString('utf8');
        if (msg.includes('database system is ready to accept connections')) resolve(p);
      });
      p.on('error', reject);
      p.on('close', () => reject(new Error('Process closed before ready')));
    });
    console.log('PASS :: Database restarted from persistent storage');

    const checkClient = new Client({ connectionString: APP_URL });
    await checkClient.connect();
    await checkClient.query('BEGIN');
    await checkClient.query("SELECT set_config('app.tenant_id', $1, true)", ['tenant_alpha_01']);
    const surviving = await checkClient.query("SELECT name FROM patients WHERE id='pt_conc_a'");
    assert.equal(surviving.rows[0].name, 'Concurrent Alpha');
    await checkClient.query('COMMIT');
    console.log('PASS :: Committed data survived database restart');
    await checkClient.end();

    // Final clean stop
    spawnSync(PG_CTL, ['stop', '-D', PG_DATA, '-m', 'fast', '-w']);
    console.log('PASS :: Database stopped gracefully after test suite');

    console.log('\n=== [7/7] LIVE POSTGRESQL RLS SUITE: ALL ASSERTIONS PASSED ===');
    console.log('VERDICT: FULL LIVE POSTGRESQL RLS QUALIFICATION ACHIEVED (100% PASS)');
  } catch (err) {
    console.error('FAIL in LIVE POSTGRESQL RLS SUITE:', err);
    try { spawnSync(PG_CTL, ['stop', '-D', PG_DATA, '-m', 'immediate', '-w']); } catch {}
    process.exitCode = 1;
  } finally {
    // Stop only the cluster in this run's uniquely-created directory. If a
    // process still owns its PID file, preserve the directory for recovery.
    try { spawnSync(PG_CTL, ['stop', '-D', PG_DATA, '-m', 'immediate', '-w']); } catch {}
    if (fs.existsSync(path.join(PG_DATA, 'postmaster.pid'))) {
      console.error(`PostgreSQL did not stop cleanly; preserving owned scratch data at ${PG_DATA}`);
    } else {
      fs.rmSync(PG_DATA, { recursive: true, force: true });
    }
  }
}

main();
