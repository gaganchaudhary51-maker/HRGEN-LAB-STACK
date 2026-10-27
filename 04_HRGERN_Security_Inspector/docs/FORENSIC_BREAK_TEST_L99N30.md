# L99N30 Deep Forensic Break-Test

## Scope
Fresh code-level adversarial review of the V2.2 hardened artifact. Existing tests were not treated as proof. The cycle targeted filesystem TOCTOU/symlink races, parser abuse, report/evidence tampering, command-policy bypass, malformed input, and scanner self-audit completeness.

## Findings and remediation

### L99N30-001 — Executable allowlist path bypass
**Severity:** HIGH

Command policy previously compared an executable basename with an allowlist and could therefore accept a caller-supplied executable path.

**Fix:** executable argv[0] and allowlist entries must be bare executable names; absolute and separator-containing executable paths are rejected.

### L99N30-002 — Nested symlink escape in evidence/output paths
**Severity:** HIGH

Lexical path checks alone were insufficient against nested symlink components.

**Fix:** descriptor-relative directory traversal with `O_NOFOLLOW`, plus atomic file creation/replacement and rejection of symlink components.

### L99N30-003 — Test dependency declaration gap
**Severity:** MEDIUM

Test-only imports were not declared in project metadata.

**Fix:** declared `pytest` and `jsonschema` under the `test` optional dependency group.

### L99N30-004 — Final-component filesystem race during reads
**Severity:** HIGH

Scanner/report/evidence verification could use path-based reads after a lexical check, leaving a final-component symlink/race window.

**Fix:** added descriptor-relative `read_file_bytes_secure()` using a secure parent descriptor and `O_NOFOLLOW`; scanner, report loader, and evidence verification now use it.

### L99N30-005 — Scanner self-audit exclusion
**Severity:** MEDIUM

The scanner explicitly skipped its own implementation, so a defect in the scanner itself could not be surfaced by self-audit.

**Fix:** scanner implementation is now scanned; only explicitly marked rule-definition literals are ignored. Self-audit was rerun successfully.

## Deep attack classes exercised

- Concurrent evidence-root swapping
- Parent symlink replacement during evidence verification
- Final-component symlink input
- Duplicate JSON keys
- Invalid UTF-8 and non-standard JSON constants
- Deep/malformed JSON
- Oversized audit payloads
- Finding-count mismatch
- Malformed command strings, NUL bytes, shell metacharacters and traversal
- 2,000 randomized command-policy inputs
- Scanner self-inspection

## Verification

- Automated adversarial/regression suite: **36/36 PASS**
- Python compilation: **PASS**
- Scanner self-audit of `src`: **0 findings** under configured rules
- Archive integrity: **PASS**
- Build excludes transient `__pycache__` and `.pytest_cache` artifacts

## Limitations

This is code-level verification, not a production penetration test. No claim of complete security, kernel-level sandboxing, client-target coverage, or vulnerability-free status is made. Human security sign-off and production deployment validation remain external gates.
