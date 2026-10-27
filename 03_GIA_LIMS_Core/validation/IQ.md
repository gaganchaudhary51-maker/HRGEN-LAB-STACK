# Installation Qualification (IQ)

## Environment
- Application: HRGen LabReport v5.0.2 L99N30 Lab-Control Hardened
- Required runtime: Node.js compatible with package lock/runtime environment
- Required production secrets: AUTH_SECRET and role credentials
- Data directory: application-managed persistent storage

## IQ checks
1. Package checksum recorded.
2. Source archive extracts without corruption.
3. Required files present: server.js, package.json, public/, Dockerfile, docker-compose.yml.
4. Production startup fails closed when AUTH_SECRET is missing.
5. Production startup rejects AUTH_SECRET shorter than 32 characters.
6. Production requires all role passwords.
7. Container is configured for non-root execution.
8. Persistent data/backup directories are available and writable by service account.

**IQ acceptance:** all checks PASS.
