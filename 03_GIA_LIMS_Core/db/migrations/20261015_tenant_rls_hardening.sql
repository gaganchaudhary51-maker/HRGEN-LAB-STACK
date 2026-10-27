-- Existing-database migration. Run as PostgreSQL administrator after creating
-- hrgen_migrator and hrgen_app with distinct strong passwords.
-- Do NOT guess the tenant for NULL tenant_id rows; map them after data-owner review.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','patients','orders','order_tests','test_catalog','qc_runs','instruments','reagent_lots','calibrations','delta_checks','critical_communications','report_versions','backup_manifest','validation_evidence','audit_ledger','platform_records','sequence_counters','api_keys','refresh_tokens'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I OWNER TO hrgen_migrator', t);
    END IF;
  END LOOP;
  IF to_regclass('public.tenants') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tenants OWNER TO hrgen_migrator';
  END IF;
END $$;
GRANT CONNECT ON DATABASE hrgen_lis TO hrgen_app, hrgen_migrator;
GRANT USAGE ON SCHEMA public TO hrgen_app;
GRANT USAGE, CREATE ON SCHEMA public TO hrgen_migrator;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hrgen_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO hrgen_app;
ALTER DEFAULT PRIVILEGES FOR ROLE hrgen_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hrgen_app;
ALTER DEFAULT PRIVILEGES FOR ROLE hrgen_migrator IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO hrgen_app;
-- ensureSchema() applies FORCE RLS and fails closed if any tenant-owned row has NULL tenant_id.
