# Security Boundaries V2

- Commands are proposals until explicit human approval; this policy module never executes commands.
- Shell operators/interpolation, shell interpreters, absolute argument paths and parent traversal are rejected by default.
- Scanner roots are resolved and symlinked files are skipped; oversized files are bounded.
- Evidence is content-addressed with SHA-256 and verified before trust is asserted.
- URL scope is exact on scheme, hostname and effective port. Any redirect-following client must revalidate each redirect destination before following it.
- AI output is untrusted input. Findings remain candidate observations until human verification.
