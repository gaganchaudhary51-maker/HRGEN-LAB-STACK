# Security Audit Lab V2.5

## Forensic-driven changes
- Hardened static scanning against symlink traversal and oversized-file resource abuse.
- Hardened command policy against shell operators/interpolation, shell interpreters, absolute argument paths and parent traversal.
- Added exact scheme/host/effective-port URL scope helper.
- Added content-addressed SHA-256 evidence capture and verification.
- Aligned finding schema with scanner severity/output and added schema regression coverage.
- Changed report wording so a clean static scan is not presented as a complete security claim.

## Verification
- Unit/adversarial tests: 13 passed.
- Self-audit of `src`: 0 findings under configured static rules.
- Finding schema validation: PASS.
- Evidence capture/verification smoke test: PASS.
- Python compile check: PASS.

## Explicit limitations
This V2 build remains a static/evidence foundation. It does not claim complete web/API/AI/cloud/mobile/network coverage, production deployment validation, human cross-audit, or vulnerability-free status.


## Forensic hardening V2.1
- Reject symlinked scanner roots before resolution.
- Reject symlinked evidence roots before resolution.
- Write evidence metadata through an atomic temporary-file replacement so an existing metadata symlink cannot redirect the write.
- Block indirect execution/privilege-wrapper commands (`env`, `xargs`, `find`, `busybox`, `sudo`, `doas`, `pkexec`).
- Block common interpreter code-execution flags (`-c`, `-e`, `--eval`, `-Command`, `-EncodedCommand`, `/c`, `/k`).
- Reject case names that are absolute or contain parent traversal.
- Added regression tests for all above boundaries.

## Verification V2.1
- Unit/adversarial tests: 17 passed.
- Self-audit of `src`: 0 findings under configured static rules.
- Python compile check: PASS.
- Evidence tamper verification: PASS.
- Archive integrity: PASS.


## V2.5 L99N30 Build
- Descriptor-relative `O_NOFOLLOW` filesystem operations to reduce TOCTOU/symlink redirection risk.
- Audit JSON parser rejects duplicate keys, invalid UTF-8, non-standard constants, oversized payloads and structural mismatches.
- Report writes use the same protected atomic filesystem primitive.
- Scanner now inspects its own implementation while ignoring only explicitly marked rule-definition literals.
- Added malformed-input and 2,000-case command-policy fuzz regression coverage.

- V2.5 build repackaged from the verified V2.4 L99N30 deep-hardened artifact with transient caches removed.

## V2.9 Product Layer
- Dependency inventory CLI
- Risk scoring
- Authorization and ROE artifact generators
- Remediation and retest artifact generators
- Escaped static HTML dashboard
- CLI workflow commands and regression tests
