'use strict';
const assert = require('node:assert/strict');
const { Pool } = require('pg');

(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must point to the non-superuser hrgen_app role.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const required = ['users','patients','orders','order_tests','test_catalog','qc_runs','instruments','reagent_lots','calibrations','delta_checks','critical_communications','report_versions','backup_manifest','validation_evidence','audit_ledger','platform_records','sequence_counters','api_keys','refresh_tokens','auth_sessions','request_idempotency','sso_artifacts'];
  let checks = 0;
  const pass = (label) => { checks++; console.log(`PASS ${label}`); };
  try {
    const role = (await pool.query(`SELECT current_user AS role, r.rolsuper, r.rolbypassrls, has_schema_privilege(current_user,'public','CREATE') AS schema_create FROM pg_roles r WHERE r.rolname=current_user`)).rows[0];
    assert(role && !role.rolsuper && !role.rolbypassrls && !role.schema_create, 'DATABASE_URL role must be non-superuser, NO BYPASSRLS, and have no schema CREATE privilege'); pass('runtime role is least-privilege / NO BYPASSRLS');
    const owners = await pool.query(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname = ANY($1::text[]) AND c.relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user)`, [[...required,'tenants','schema_migrations']]);
    assert.equal(owners.rowCount, 0, 'runtime role must not own tenant tables'); pass('runtime role does not own tenant tables');
    const truncate = await pool.query(`SELECT has_table_privilege(current_user,'public.patients','TRUNCATE') AS allowed`);
    assert.equal(truncate.rows[0].allowed, false, 'runtime role must not have TRUNCATE privilege'); pass('runtime role cannot TRUNCATE clinical tables');
    const tenants = (await pool.query(`SELECT id FROM tenants WHERE status='ACTIVE' ORDER BY id LIMIT 2`)).rows;
    assert.equal(tenants.length, 2, 'Need two active tenant fixtures to prove isolation');
    const policies = (await pool.query(`SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, p.policyname, p.qual, p.with_check FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_policies p ON p.schemaname=n.nspname AND p.tablename=c.relname WHERE n.nspname='public' AND c.relname = ANY($1::text[])`, [required])).rows;
    for (const table of required) {
      const rows = policies.filter(x => x.relname === table);
      const row = rows[0];
      assert.equal(rows.length, 1, `${table} must have exactly one policy; permissive extras can weaken isolation`);
      assert(row && row.relrowsecurity && row.relforcerowsecurity && row.policyname === `tenant_isolation_${table}`, `${table} must have enabled+forced RLS policy`);
      assert(!/tenant_id\s+IS\s+NULL/i.test(row.qual || '') && !/tenant_id\s+IS\s+NULL/i.test(row.with_check || ''), `${table} policy must not allow NULL tenant rows`);
    }
    pass('all tenant tables have FORCE RLS and strict tenant policy');

    const client = await pool.connect();
    const suffix = `${process.pid}_${Date.now()}`;
    const aId = `rls_a_${suffix}`, bId = `rls_b_${suffix}`;
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id',$1,true)", [tenants[0].id]);
      await client.query('INSERT INTO patients(id,tenant_id,uhid,name,data) VALUES($1,$2,$3,$4,$5)', [aId, tenants[0].id, `RLSA${suffix}`, 'RLS fixture A', '{}']);
      await client.query("SELECT set_config('app.tenant_id',$1,true)", [tenants[1].id]);
      await client.query('INSERT INTO patients(id,tenant_id,uhid,name,data) VALUES($1,$2,$3,$4,$5)', [bId, tenants[1].id, `RLSB${suffix}`, 'RLS fixture B', '{}']);
      await client.query("SELECT set_config('app.tenant_id',$1,true)", [tenants[0].id]);
      const visible = await client.query('SELECT id FROM patients WHERE id = ANY($1::text[]) ORDER BY id', [[aId,bId]]);
      assert.deepEqual(visible.rows.map(x=>x.id), [aId]); pass('tenant A cannot read tenant B patient row');
      await client.query("SELECT set_config('app.tenant_id','',true)");
      const noContextRows = await client.query('SELECT id FROM patients WHERE id = ANY($1::text[])', [[aId,bId]]);
      assert.equal(noContextRows.rowCount, 0, 'empty tenant context must see zero rows while fixture rows exist'); pass('missing tenant context fails closed');
      await client.query('ROLLBACK');
    } catch (e) { try { await client.query('ROLLBACK'); } catch {} throw e; }
    finally { client.release(); }

    const negative = await pool.connect();
    try {
      await negative.query('BEGIN');
      await negative.query("SELECT set_config('app.tenant_id',$1,true)", [tenants[0].id]);
      let denied = false;
      try { await negative.query('INSERT INTO patients(id,tenant_id,uhid,name,data) VALUES($1,$2,$3,$4,$5)', [`rls_bad_${suffix}`, tenants[1].id, `RLSBAD${suffix}`, 'Must be denied', '{}']); }
      catch (e) { denied = e.code === '42501'; }
      assert(denied, 'cross-tenant INSERT must fail with insufficient_privilege'); pass('tenant A cannot insert a tenant B row');
      await negative.query('ROLLBACK');
    } finally { negative.release(); }

    console.log(`POSTGRES_RLS_INTEGRATION_TEST PASS (${checks} assertions)`);
  } finally { await pool.end(); }
})().catch(e => { console.error('POSTGRES_RLS_INTEGRATION_TEST FAIL:', e.message); process.exitCode = 1; });
