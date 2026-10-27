# API and UI Workflow V3

The local web application exposes a small authenticated assessment API and a dashboard.

## Authentication
- API requests require `Authorization: Bearer <ephemeral token>`.
- Assessment reads and writes require `X-Authorization-Ref`.
- Actor identity is required for assessment creation.
- The dashboard itself contains no privileged data; it loads data through the authenticated API.

## Lifecycle
`assessment -> candidate finding -> human verification -> remediation -> retest`

The server never treats a scanner candidate as a confirmed finding.

## Run
```bash
PYTHONPATH=src python -m security_audit.cli web --host 127.0.0.1 --port 8787 --db data/lab.sqlite
```

The default bind is loopback. Exposing the service beyond localhost requires an external TLS/reverse-proxy deployment and production rehearsal.
