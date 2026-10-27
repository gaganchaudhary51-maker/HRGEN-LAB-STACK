# Security Validation

Required negative tests:
- no Authorization header -> 401 on protected endpoints
- wrong role -> 403
- invalid/expired session -> 401
- wrong e-signature credential -> 401
- direct release before validation -> 409
- direct release without sign-off -> 409
- release with unacknowledged critical result -> 409
- release with unacknowledged delta REVIEW -> 409
- mutation after validation/release -> 409
- audit tampering -> verification failure
- backup tampering -> restore rejection

Production configuration must fail closed for missing secrets.
