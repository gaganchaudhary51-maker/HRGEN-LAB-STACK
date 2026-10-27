# Production Validation Harness

Run from the extracted release root:

`node validation/production-gate/run.js`

The harness performs environment preflight and gates live Load, PostgreSQL DR, and Docker Chaos tests. It never converts an unavailable runtime into PASS. When prerequisites are present, the harness marks those stages PENDING for execution by the deployment-specific test runner.
