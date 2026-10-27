# Security Audit Lab V3.1

Evidence-first security testing framework for internal products and authorized client assessments.

## Current capabilities
- Race-resistant descriptor-relative evidence/report writes on supported POSIX systems
- Strict audit JSON validation (size bound, duplicate-key rejection, structural checks)
- Adversarial malformed-input and command-policy fuzz regression tests
- Audit case initialization
- Safe static source scanner
- Findings with severity, location, evidence and remediation
- JSON audit output
- Explicit-approval command policy with shell/operator rejection
- Filesystem and exact URL scope helpers
- SHA-256 content-addressed evidence capture and verification
- Internal and authorized-client workflow documentation
- SQLite assessment/finding workflow with authorization partitioning
- Local web dashboard and authenticated RBAC assessment API
- Server-bound actor and authorization-reference context for API requests

## Run
```bash
PYTHONPATH=src python -m security_audit.cli init demo
PYTHONPATH=src python -m security_audit.cli audit ./target -o audit.json
```

This version is intentionally a **static/evidence foundation**. It does not perform intrusive exploitation automatically.
