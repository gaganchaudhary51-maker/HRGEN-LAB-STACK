const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined
});
// Schema changes run under a separate migration principal. The runtime pool must
// never use the table owner or a PostgreSQL superuser.
const migrationPool = new Pool({
  connectionString: process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL,
  max: 2,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined
});

const CORE_TABLES = ['tenants','users','patients','orders','order_tests','test_catalog','qc_runs','instruments','reagent_lots','calibrations','delta_checks','critical_communications','report_versions','backup_manifest','validation_evidence','audit_ledger','platform_records','sequence_counters','api_keys','refresh_tokens'];
let writerLeaseClient = null;

async function ensureSchema() {
  const client = await migrationPool.connect();
  try {
    const migrationIdentity = await client.query(`SELECT current_user AS role, r.rolsuper, r.rolbypassrls FROM pg_roles r WHERE r.rolname=current_user`);
    if (!migrationIdentity.rows[0] || migrationIdentity.rows[0].rolsuper || migrationIdentity.rows[0].rolbypassrls) throw new Error('Unsafe migration role: MIGRATION_DATABASE_URL must use a non-superuser, non-BYPASSRLS schema owner (expected hrgen_migrator).');
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'STANDARD', status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), username TEXT NOT NULL, role TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', password_hash TEXT NOT NULL, display_name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), status_changed_at TIMESTAMPTZ, data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_users_tenant_username ON users(tenant_id,username)`);
    await client.query(`CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), uhid TEXT, phone TEXT, name TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_patients_tenant_uhid ON patients(tenant_id,uhid)`);
    await client.query(`CREATE TABLE IF NOT EXISTS test_catalog (catalog_id BIGSERIAL, code TEXT NOT NULL, tenant_id TEXT REFERENCES tenants(id), name TEXT NOT NULL, department TEXT, unit TEXT, reference TEXT, price NUMERIC(12,2) NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE, data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`ALTER TABLE test_catalog ADD COLUMN IF NOT EXISTS catalog_id BIGSERIAL`);
    await client.query(`UPDATE test_catalog SET code=UPPER(TRIM(code)) WHERE code IS NOT NULL`);
    await client.query(`DO $$ DECLARE pk_name text; BEGIN SELECT conname INTO pk_name FROM pg_constraint WHERE conrelid='test_catalog'::regclass AND contype='p'; IF pk_name IS NOT NULL THEN EXECUTE format('ALTER TABLE test_catalog DROP CONSTRAINT %I',pk_name); END IF; END $$`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_test_catalog_tenant_code ON test_catalog(tenant_id,code)`);
    await client.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='test_catalog'::regclass AND contype='p') THEN ALTER TABLE test_catalog ADD CONSTRAINT test_catalog_pk PRIMARY KEY (catalog_id); END IF; END $$`);

    await client.query(`ALTER TABLE test_catalog ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id)`);
    await client.query(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), patient_id TEXT NOT NULL REFERENCES patients(id), barcode TEXT UNIQUE NOT NULL, invoice_number TEXT UNIQUE NOT NULL, pipeline_status TEXT NOT NULL, net_payable NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), released_at TIMESTAMPTZ, report_hash TEXT, verification_token TEXT UNIQUE, data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id)`);
    await client.query(`CREATE TABLE IF NOT EXISTS order_tests (id BIGSERIAL PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, test_index INTEGER NOT NULL, code TEXT, name TEXT NOT NULL, value TEXT, unit TEXT, reference TEXT, status TEXT, method TEXT, is_panic BOOLEAN NOT NULL DEFAULT FALSE, data JSONB NOT NULL DEFAULT '{}'::jsonb, UNIQUE(order_id,test_index))`);
    await client.query(`ALTER TABLE order_tests ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id)`);
    await client.query(`CREATE TABLE IF NOT EXISTS qc_runs (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), order_id TEXT REFERENCES orders(id), data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS instruments (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), active BOOLEAN NOT NULL DEFAULT TRUE, data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS reagent_lots (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), status TEXT NOT NULL, data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS calibrations (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), status TEXT NOT NULL, data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS delta_checks (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), order_id TEXT REFERENCES orders(id), data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS critical_communications (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), order_id TEXT REFERENCES orders(id), data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS report_versions (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), order_id TEXT REFERENCES orders(id), version INTEGER NOT NULL, amended_order_id TEXT, data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS backup_manifest (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS validation_evidence (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE TABLE IF NOT EXISTS audit_ledger (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), audit_seq BIGSERIAL UNIQUE, order_id TEXT, action TEXT NOT NULL, actor TEXT NOT NULL, actor_role TEXT NOT NULL, timestamp TIMESTAMPTZ NOT NULL, previous_hash TEXT NOT NULL, block_hash TEXT NOT NULL, details TEXT NOT NULL, data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`ALTER TABLE audit_ledger ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id)`);
    await client.query(`CREATE TABLE IF NOT EXISTS platform_records (id TEXT NOT NULL, tenant_id TEXT REFERENCES tenants(id), entity_type TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), data JSONB NOT NULL DEFAULT '{}'::jsonb)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_entity ON platform_records(tenant_id,entity_type,id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_platform_entity_type ON platform_records(tenant_id,entity_type,status)`);
    await client.query(`CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), name TEXT NOT NULL, key_hash TEXT NOT NULL UNIQUE, last_used_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await client.query(`CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL REFERENCES users(id), token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await client.query(`CREATE TABLE IF NOT EXISTS sequence_counters (tenant_id TEXT NOT NULL REFERENCES tenants(id), counter_key TEXT NOT NULL, next_value BIGINT NOT NULL DEFAULT 1, PRIMARY KEY(tenant_id,counter_key))`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_patient ON orders(tenant_id,patient_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id,pipeline_status)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_report_versions_order_version ON report_versions(order_id, version)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_ledger_seq ON audit_ledger(audit_seq)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_ledger(tenant_id,timestamp)`);
    await client.query(`CREATE OR REPLACE FUNCTION prevent_audit_ledger_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'audit_ledger is append-only'; END; $$ LANGUAGE plpgsql`);
    await client.query(`DROP TRIGGER IF EXISTS trg_audit_ledger_immutable ON audit_ledger`);
    await client.query(`CREATE TRIGGER trg_audit_ledger_immutable BEFORE UPDATE OR DELETE ON audit_ledger FOR EACH ROW EXECUTE FUNCTION prevent_audit_ledger_mutation()`);
    await client.query(`CREATE OR REPLACE FUNCTION sync_platform_updated_at() RETURNS trigger AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$ LANGUAGE plpgsql`);
    await client.query(`DROP TRIGGER IF EXISTS trg_platform_updated_at ON platform_records`);
    await client.query(`CREATE TRIGGER trg_platform_updated_at BEFORE UPDATE ON platform_records FOR EACH ROW EXECUTE FUNCTION sync_platform_updated_at()`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_slug ON tenants(slug)`);
    const tenantTables = ['users','patients','orders','order_tests','test_catalog','qc_runs','instruments','reagent_lots','calibrations','delta_checks','critical_communications','report_versions','backup_manifest','validation_evidence','audit_ledger','platform_records','sequence_counters','api_keys','refresh_tokens'];
    // Never silently orphan legacy rows. The operator must map NULL tenant rows to
    // the correct lab before strict tenant policies are enabled.
    for (const table of tenantTables) {
      const nullRows = await client.query(`SELECT count(*)::bigint AS n FROM ${table} WHERE tenant_id IS NULL`);
      if (Number(nullRows.rows[0].n) > 0) throw new Error(`Tenant isolation migration blocked: ${table} contains ${nullRows.rows[0].n} row(s) with NULL tenant_id. Map them to a verified tenant before startup.`);
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
      const policy=`tenant_isolation_${table}`;
      // PostgreSQL permissive policies combine with OR. Remove every pre-existing
      // policy so a stale permissive policy cannot weaken the canonical tenant gate.
      const oldPolicies = await client.query('SELECT policyname FROM pg_policies WHERE schemaname=$1 AND tablename=$2', ['public', table]);
      for (const old of oldPolicies.rows) {
        const quoted = String(old.policyname).replace(/"/g, '""');
        await client.query(`DROP POLICY IF EXISTS "${quoted}" ON ${table}`);
      }
      await client.query(`CREATE POLICY ${policy} ON ${table} USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')) WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))`);
    }
    // Runtime role receives DML only. The migration role remains the owner.
    const runtimeRole = await client.query(`SELECT 1 FROM pg_roles WHERE rolname='hrgen_app'`);
    if (runtimeRole.rowCount) {
      await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hrgen_app');
      await client.query('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO hrgen_app');
      await client.query('ALTER DEFAULT PRIVILEGES FOR ROLE hrgen_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hrgen_app');
      await client.query('ALTER DEFAULT PRIVILEGES FOR ROLE hrgen_migrator IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO hrgen_app');
    }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

async function assertRuntimeRole(){
  const r = await pool.query(`SELECT current_user AS role, r.rolsuper, r.rolbypassrls, has_schema_privilege(current_user,'public','CREATE') AS schema_create FROM pg_roles r WHERE r.rolname=current_user`);
  if (!r.rows[0] || r.rows[0].rolsuper || r.rows[0].rolbypassrls) {
    throw new Error('Unsafe PostgreSQL runtime role: DATABASE_URL must use a non-superuser, non-BYPASSRLS role (expected hrgen_app).');
  }
  if (r.rows[0].schema_create) throw new Error('Unsafe PostgreSQL runtime role: hrgen_app must not have CREATE privilege on schema public.');
  const ownership = await pool.query(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname = ANY($1::text[]) AND c.relowner = (SELECT oid FROM pg_roles WHERE rolname=current_user)`, [ ['users','patients','orders','order_tests','test_catalog','qc_runs','instruments','reagent_lots','calibrations','delta_checks','critical_communications','report_versions','backup_manifest','validation_evidence','audit_ledger','platform_records','sequence_counters','api_keys','refresh_tokens'] ]);
  if (ownership.rowCount) throw new Error(`Unsafe PostgreSQL runtime role owns tenant tables: ${ownership.rows.map(x=>x.relname).join(', ')}. Tables must be owned by hrgen_migrator.`);
  const truncate = await pool.query(`SELECT has_table_privilege(current_user,'public.patients','TRUNCATE') AS allowed`);
  if (truncate.rows[0]?.allowed) throw new Error('Unsafe PostgreSQL runtime role: hrgen_app must not have TRUNCATE privilege on clinical tables.');
  if (process.env.NODE_ENV === 'production' && process.env.MIGRATION_DATABASE_URL && process.env.DATABASE_URL === process.env.MIGRATION_DATABASE_URL) {
    throw new Error('Unsafe PostgreSQL configuration: runtime and migration URLs must be different.');
  }
  return { role: r.rows[0].role, superuser: false, bypassRls: false, ownsTenantTables: false, canTruncate: false };
}

function rowToData(row){return row.data && typeof row.data==='object'?row.data:{};}
function withTenant(data,row){return {...rowToData(row),...data,tenantId:row.tenant_id||rowToData(row).tenantId||'default'};}

async function acquireSingleWriterLease(){
  if (writerLeaseClient) return true;
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT pg_try_advisory_lock(hashtext('hrgen_gia_lims_single_writer_v1')) AS acquired");
    if (!result.rows[0]?.acquired) throw new Error('Another HRGen GIA LIMS application instance holds the database writer lease. Multi-writer mode is blocked until tenant-scoped repositories replace shared in-memory state.');
    writerLeaseClient = client;
    return true;
  } catch (e) {
    if (writerLeaseClient !== client) client.release();
    throw e;
  }
}
async function releaseSingleWriterLease(){
  if (!writerLeaseClient) return;
  const client = writerLeaseClient; writerLeaseClient = null;
  try { await client.query("SELECT pg_advisory_unlock(hashtext('hrgen_gia_lims_single_writer_v1'))"); }
  finally { client.release(); }
}

async function setTenantContext(client, tenantId){
  const id=String(tenantId||'').trim();
  if (!id || id.length > 200) throw new Error('Tenant context is required and must be valid.');
  await client.query("SELECT set_config('app.tenant_id',$1,true)",[id]);
}

async function loadState(){
  const c=await pool.connect();
  try{
    await c.query('BEGIN READ ONLY');
    const tenantRows=(await c.query('SELECT * FROM tenants ORDER BY created_at')).rows;
    const collected={users:[],patients:[],testCatalog:[],orders:[],orderTests:[],qcRuns:[],instruments:[],reagentLots:[],calibrations:[],deltaChecks:[],criticalCommunications:[],reportVersions:[],backupManifest:[],validationEvidence:[],auditLedger:[],platformRecords:[],sequenceCounters:[]};
    for(const tenant of tenantRows){
      await setTenantContext(c,tenant.id);
      const tid=tenant.id;
      const [users,patients,catalog,orders,tests,qc,instruments,lots,cals,deltas,crit,versions,backups,validation,audit,platform,sequences]=await Promise.all([
        c.query('SELECT * FROM users WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM patients WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM test_catalog WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM orders WHERE tenant_id=$1 ORDER BY created_at DESC',[tid]),
        c.query('SELECT * FROM order_tests WHERE tenant_id=$1 ORDER BY order_id,test_index',[tid]),
        c.query('SELECT * FROM qc_runs WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM instruments WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM reagent_lots WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM calibrations WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM delta_checks WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM critical_communications WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM report_versions WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM backup_manifest WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM validation_evidence WHERE tenant_id=$1',[tid]),
        c.query('SELECT * FROM audit_ledger WHERE tenant_id=$1 ORDER BY audit_seq DESC',[tid]),
        c.query('SELECT id,tenant_id,entity_type,version,status,created_at,updated_at,data FROM platform_records WHERE tenant_id=$1 ORDER BY updated_at DESC',[tid]),
        c.query('SELECT tenant_id,counter_key,next_value FROM sequence_counters WHERE tenant_id=$1',[tid])
      ]);
      collected.users.push(...users.rows);collected.patients.push(...patients.rows);collected.testCatalog.push(...catalog.rows);collected.orders.push(...orders.rows);collected.orderTests.push(...tests.rows);collected.qcRuns.push(...qc.rows);collected.instruments.push(...instruments.rows);collected.reagentLots.push(...lots.rows);collected.calibrations.push(...cals.rows);collected.deltaChecks.push(...deltas.rows);collected.criticalCommunications.push(...crit.rows);collected.reportVersions.push(...versions.rows);collected.backupManifest.push(...backups.rows);collected.validationEvidence.push(...validation.rows);collected.auditLedger.push(...audit.rows);collected.platformRecords.push(...platform.rows);collected.sequenceCounters.push(...sequences.rows);
    }
    const testMap=new Map();
    for(const r of collected.orderTests){const a=testMap.get(r.order_id)||[];a.push({...rowToData(r),code:r.code||null,name:r.name,value:r.value,unit:r.unit,reference:r.reference,status:r.status,method:r.method,isPanic:r.is_panic});testMap.set(r.order_id,a);}
    const ordersOut=collected.orders.map(r=>({...withTenant({id:r.id,patientId:r.patient_id,barcode:r.barcode,invoiceNumber:r.invoice_number,pipelineStatus:r.pipeline_status,netPayable:Number(r.net_payable),createdAt:r.created_at.toISOString(),releasedAt:r.released_at?.toISOString()||null,reportHash:r.report_hash,verificationToken:r.verification_token,tests:testMap.get(r.id)||[]},r)}));
    const output={
      tenants:tenantRows.map(r=>({...rowToData(r),id:r.id,slug:r.slug,name:r.name,mode:r.mode,status:r.status,createdAt:r.created_at.toISOString()})),
      users:collected.users.map(r=>withTenant({id:r.id,username:r.username,role:r.role,status:r.status,passwordHash:r.password_hash,displayName:r.display_name,createdAt:r.created_at.toISOString(),statusChangedAt:r.status_changed_at?.toISOString()||null},r)),
      patients:collected.patients.map(r=>withTenant({id:r.id,uhid:r.uhid,phone:r.phone,name:r.name,active:r.active,createdAt:r.created_at.toISOString()},r)),
      testCatalog:collected.testCatalog.map(r=>withTenant({code:r.code,name:r.name,department:r.department,unit:r.unit,reference:r.reference,price:Number(r.price),active:r.active},r)),
      orders:ordersOut,
      qcRuns:collected.qcRuns.map(r=>withTenant({id:r.id,orderId:r.order_id},r)),
      instruments:collected.instruments.map(r=>withTenant({id:r.id,active:r.active},r)),
      reagentLots:collected.reagentLots.map(r=>withTenant({id:r.id,status:r.status},r)),
      calibrations:collected.calibrations.map(r=>withTenant({id:r.id,status:r.status},r)),
      deltaChecks:collected.deltaChecks.map(r=>withTenant({id:r.id,orderId:r.order_id},r)),
      criticalCommunications:collected.criticalCommunications.map(r=>withTenant({id:r.id,orderId:r.order_id},r)),
      reportVersions:collected.reportVersions.map(r=>withTenant({id:r.id,orderId:r.order_id,version:r.version,amendedOrderId:r.amended_order_id},r)),
      backupManifest:collected.backupManifest.map(r=>withTenant({id:r.id},r)),
      validationEvidence:collected.validationEvidence.map(r=>withTenant({id:r.id},r)),
      auditLedger:collected.auditLedger.map(r=>withTenant({id:r.id,orderId:r.order_id,action:r.action,actor:r.actor,actorRole:r.actor_role,timestamp:r.timestamp.toISOString(),previousHash:r.previous_hash,blockHash:r.block_hash,details:r.details,auditSeq:Number(r.audit_seq)},r)),
      platformRecords:collected.platformRecords.map(r=>({id:r.id,tenantId:r.tenant_id,entityType:r.entity_type,version:r.version,status:r.status,createdAt:r.created_at.toISOString(),updatedAt:r.updated_at.toISOString(),data:r.data||{}})),
      sequenceCounters:collected.sequenceCounters.map(r=>({tenantId:r.tenant_id,counterKey:r.counter_key,nextValue:Number(r.next_value)}))
    };
    await c.query('COMMIT');
    return output;
  }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}finally{c.release();}
}

async function upsertPlatformRecord(tenantId,entityType,id,data,status='ACTIVE'){
  const c=await pool.connect();
  try{await c.query('BEGIN');await setTenantContext(c,tenantId);const r=await c.query(`INSERT INTO platform_records(id,tenant_id,entity_type,version,status,data) VALUES($1,$2,$3,1,$4,$5) ON CONFLICT(tenant_id,entity_type,id) DO UPDATE SET version=platform_records.version+1,status=EXCLUDED.status,data=EXCLUDED.data RETURNING id,tenant_id,entity_type,version,status,created_at,updated_at,data`,[id,tenantId,entityType,status,JSON.stringify(data||{})]);await c.query('COMMIT');const x=r.rows[0];return {...x,data:x.data};}
  catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}finally{c.release();}
}
async function listPlatformRecords(tenantId,entityType,status){
  const c=await pool.connect();try{await c.query('BEGIN READ ONLY');await setTenantContext(c,tenantId);const args=[tenantId,entityType];let q='SELECT * FROM platform_records WHERE tenant_id=$1 AND entity_type=$2';if(status){args.push(status);q+=' AND status=$3';}q+=' ORDER BY updated_at DESC';const r=await c.query(q,args);await c.query('COMMIT');return r.rows.map(x=>({...x,data:x.data||{}}));}
  catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}finally{c.release();}
}
async function getPlatformRecord(tenantId,entityType,id){
  const c=await pool.connect();try{await c.query('BEGIN READ ONLY');await setTenantContext(c,tenantId);const r=await c.query('SELECT * FROM platform_records WHERE tenant_id=$1 AND entity_type=$2 AND id=$3',[tenantId,entityType,id]);await c.query('COMMIT');return r.rows[0]?{...r.rows[0],data:r.rows[0].data||{}}:null;}
  catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}finally{c.release();}
}
async function nextSequence(tenantId,key,prefix){const c=await pool.connect();try{await c.query('BEGIN');await setTenantContext(c,tenantId);const r=await c.query(`INSERT INTO sequence_counters(tenant_id,counter_key,next_value) VALUES($1,$2,2) ON CONFLICT(tenant_id,counter_key) DO UPDATE SET next_value=sequence_counters.next_value+1 RETURNING next_value-1 AS allocated`,[tenantId,key]);await c.query('COMMIT');return `${prefix}-${new Date().getFullYear()}-${String(r.rows[0].allocated).padStart(7,'0')}`;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
async function createTenant({id,slug,name,mode='STANDARD'}){await pool.query('INSERT INTO tenants(id,slug,name,mode,status) VALUES($1,$2,$3,$4,\'ACTIVE\') ON CONFLICT(id) DO NOTHING',[id,slug,name,mode]);return id;}

async function persistState(DB, options = {}){
  // Full restore is a privileged administrative operation; normal writes always
  // use the least-privilege runtime connection.
  const c=await (options.replace === true ? migrationPool : pool).connect();
  try{
    await c.query('BEGIN');
    await c.query("SELECT pg_advisory_xact_lock(hashtext('hrgen_lis_persist_v4'))");
    if (options.replace === true) {
      await c.query('TRUNCATE TABLE tenants CASCADE');
    }
    for(const t of DB.tenants||[]) await c.query(`INSERT INTO tenants(id,slug,name,mode,status,data) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,mode=EXCLUDED.mode,status=EXCLUDED.status,data=EXCLUDED.data`,[t.id,t.slug,t.name,t.mode||'STANDARD',t.status||'ACTIVE',JSON.stringify(t.data||{})]);
    for(const u of DB.users||[]){await setTenantContext(c,u.tenantId||'TEN-DEFAULT');await c.query(`INSERT INTO users(id,tenant_id,username,role,status,password_hash,display_name,created_at,status_changed_at,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,username=EXCLUDED.username,role=EXCLUDED.role,status=EXCLUDED.status,password_hash=EXCLUDED.password_hash,display_name=EXCLUDED.display_name,status_changed_at=EXCLUDED.status_changed_at,data=EXCLUDED.data`,[u.id,u.tenantId||'TEN-DEFAULT',u.username,u.role,u.status||'ACTIVE',u.passwordHash||'',u.displayName||u.username,u.createdAt||new Date(),u.statusChangedAt||null,JSON.stringify(strip(u,['id','tenantId','username','role','status','passwordHash','displayName','createdAt','statusChangedAt']))]);}
    for(const p of DB.patients||[]){await setTenantContext(c,p.tenantId||'TEN-DEFAULT');await c.query(`INSERT INTO patients(id,tenant_id,uhid,phone,name,active,created_at,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,uhid=EXCLUDED.uhid,phone=EXCLUDED.phone,name=EXCLUDED.name,active=EXCLUDED.active,data=EXCLUDED.data`,[p.id,p.tenantId||'TEN-DEFAULT',p.uhid,p.phone,p.name,p.active!==false,p.createdAt||new Date(),JSON.stringify(strip(p,['id','tenantId','uhid','phone','name','active','createdAt']))]);}
    for(const t of DB.testCatalog||[]){await setTenantContext(c,t.tenantId||'TEN-DEFAULT');await c.query(`INSERT INTO test_catalog(code,tenant_id,name,department,unit,reference,price,active,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(tenant_id,code) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,name=EXCLUDED.name,department=EXCLUDED.department,unit=EXCLUDED.unit,reference=EXCLUDED.reference,price=EXCLUDED.price,active=EXCLUDED.active,data=EXCLUDED.data`,[t.code,t.tenantId||'TEN-DEFAULT',t.name,t.department||null,t.unit||null,t.reference||null,Number(t.price)||0,t.active!==false,JSON.stringify(strip(t,['code','tenantId','name','department','unit','reference','price','active']))]);}
    for(const o of DB.orders||[]) {
      await setTenantContext(c,o.tenantId||'TEN-DEFAULT');
      await c.query(`INSERT INTO orders(id,tenant_id,patient_id,barcode,invoice_number,pipeline_status,net_payable,created_at,released_at,report_hash,verification_token,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,patient_id=EXCLUDED.patient_id,barcode=EXCLUDED.barcode,invoice_number=EXCLUDED.invoice_number,pipeline_status=EXCLUDED.pipeline_status,net_payable=EXCLUDED.net_payable,released_at=EXCLUDED.released_at,report_hash=EXCLUDED.report_hash,verification_token=EXCLUDED.verification_token,data=EXCLUDED.data`,[o.id,o.tenantId||'TEN-DEFAULT',o.patientId,o.barcode,o.invoiceNumber,o.pipelineStatus,Number(o.netPayable)||0,o.createdAt||new Date(),o.releasedAt||null,o.reportHash||null,o.verificationToken||null,JSON.stringify(strip(o,['id','tenantId','patientId','barcode','invoiceNumber','pipelineStatus','netPayable','createdAt','releasedAt','reportHash','verificationToken','tests']))]);
      await c.query('DELETE FROM order_tests WHERE order_id=$1',[o.id]);
      for(let i=0;i<(o.tests||[]).length;i++){const t=o.tests[i];await c.query(`INSERT INTO order_tests(tenant_id,order_id,test_index,code,name,value,unit,reference,status,method,is_panic,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[o.tenantId||'TEN-DEFAULT',o.id,i,t.code||null,t.name||'',t.value??null,t.unit||null,t.reference||null,t.status||null,t.method||null,Boolean(t.isPanic),JSON.stringify(strip(t,['code','name','value','unit','reference','status','method','isPanic']))]);}
    }
    const groups={qcRuns:'qc_runs',instruments:'instruments',reagentLots:'reagent_lots',calibrations:'calibrations',deltaChecks:'delta_checks',criticalCommunications:'critical_communications',reportVersions:'report_versions',backupManifest:'backup_manifest',validationEvidence:'validation_evidence'};
    for(const [name,table] of Object.entries(groups)){for(const x of DB[name]||[]){await setTenantContext(c,x.tenantId||'TEN-DEFAULT');if(name==='qcRuns') await c.query(`INSERT INTO qc_runs(id,tenant_id,order_id,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,order_id=EXCLUDED.order_id,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',x.orderId||null,JSON.stringify(strip(x,['id','tenantId','orderId']))]);
      else if(name==='instruments') await c.query(`INSERT INTO instruments(id,tenant_id,active,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,active=EXCLUDED.active,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',x.active!==false,JSON.stringify(strip(x,['id','tenantId','active']))]);
      else if(name==='reagentLots') await c.query(`INSERT INTO reagent_lots(id,tenant_id,status,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,status=EXCLUDED.status,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',x.status||'ACTIVE',JSON.stringify(strip(x,['id','tenantId','status']))]);
      else if(name==='calibrations') await c.query(`INSERT INTO calibrations(id,tenant_id,status,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,status=EXCLUDED.status,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',x.status||'PASS',JSON.stringify(strip(x,['id','tenantId','status']))]);
      else if(name==='deltaChecks') await c.query(`INSERT INTO delta_checks(id,tenant_id,order_id,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,order_id=EXCLUDED.order_id,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',x.orderId||null,JSON.stringify(strip(x,['id','tenantId','orderId']))]);
      else if(name==='criticalCommunications') await c.query(`INSERT INTO critical_communications(id,tenant_id,order_id,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,order_id=EXCLUDED.order_id,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',x.orderId||null,JSON.stringify(strip(x,['id','tenantId','orderId']))]);
      else if(name==='reportVersions') await c.query(`INSERT INTO report_versions(id,tenant_id,order_id,version,amended_order_id,data) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,order_id=EXCLUDED.order_id,version=EXCLUDED.version,amended_order_id=EXCLUDED.amended_order_id,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',x.orderId||null,x.version||1,x.amendedOrderId||null,JSON.stringify(strip(x,['id','tenantId','orderId','version','amendedOrderId']))]);
      else await c.query(`INSERT INTO ${table}(id,tenant_id,data) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',JSON.stringify(strip(x,['id','tenantId']))]);
    }}
    for(const x of DB.platformRecords||[]){await setTenantContext(c,x.tenantId||'TEN-DEFAULT');await c.query(`INSERT INTO platform_records(id,tenant_id,entity_type,version,status,created_at,updated_at,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(tenant_id,entity_type,id) DO UPDATE SET version=EXCLUDED.version,status=EXCLUDED.status,updated_at=EXCLUDED.updated_at,data=EXCLUDED.data`,[x.id,x.tenantId||'TEN-DEFAULT',x.entityType,x.version||1,x.status||'ACTIVE',x.createdAt||new Date(),x.updatedAt||new Date(),JSON.stringify(x.data||{})]);}
    for(const x of DB.sequenceCounters||[]){await setTenantContext(c,x.tenantId);await c.query(`INSERT INTO sequence_counters(tenant_id,counter_key,next_value) VALUES($1,$2,$3) ON CONFLICT(tenant_id,counter_key) DO UPDATE SET next_value=EXCLUDED.next_value`,[x.tenantId,x.counterKey,Number(x.nextValue)||1]);}
    for(const e of DB.auditLedger||[]){await setTenantContext(c,e.tenantId||'TEN-DEFAULT');await c.query(`INSERT INTO audit_ledger(id,tenant_id,order_id,action,actor,actor_role,timestamp,previous_hash,block_hash,details,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO NOTHING`,[e.id,e.tenantId||'TEN-DEFAULT',e.orderId||null,e.action,e.actor,e.actorRole,e.timestamp,e.previousHash,e.blockHash,e.details,JSON.stringify(strip(e,['id','tenantId','orderId','action','actor','actorRole','timestamp','previousHash','blockHash','details']))]);}
    await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
function strip(obj,keys){const x={...obj};for(const k of keys)delete x[k];return x;}
module.exports={pool,migrationPool,ensureSchema,assertRuntimeRole,acquireSingleWriterLease,releaseSingleWriterLease,loadState,persistState,upsertPlatformRecord,listPlatformRecords,getPlatformRecord,nextSequence,createTenant};
