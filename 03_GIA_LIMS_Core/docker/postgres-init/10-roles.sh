#!/usr/bin/env bash
set -euo pipefail
: "${POSTGRES_APP_PASSWORD:?POSTGRES_APP_PASSWORD is required}"
: "${POSTGRES_MIGRATOR_PASSWORD:?POSTGRES_MIGRATOR_PASSWORD is required}"
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1 \
  --set app_password="$POSTGRES_APP_PASSWORD" \
  --set migrator_password="$POSTGRES_MIGRATOR_PASSWORD" <<'SQL'
CREATE ROLE hrgen_migrator LOGIN PASSWORD :'migrator_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
CREATE ROLE hrgen_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
GRANT CONNECT ON DATABASE hrgen_lis TO hrgen_app, hrgen_migrator;
GRANT USAGE, CREATE ON SCHEMA public TO hrgen_migrator;
GRANT USAGE ON SCHEMA public TO hrgen_app;
ALTER ROLE hrgen_app SET row_security = on;
SQL
