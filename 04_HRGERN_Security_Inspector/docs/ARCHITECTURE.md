# Architecture V1

```text
                SECURITY AUDIT LAB
                        |
        +---------------+---------------+
        |                               |
   INTERNAL QA                    CLIENT AUDIT
        |                               |
        +---------------+---------------+
                        |
                CASE / SCOPE GATE
                        |
        +---------------+---------------+
        |               |               |
    Discovery       Safe Checks      Evidence
        |               |               |
        +---------------+---------------+
                        |
                  Risk Engine
                        |
                Security Report
                        |
                   Remediation
                        |
                      Retest
```

## Trust boundaries
1. Target data is untrusted.
2. LLM output is untrusted until validated.
3. Tool execution requires explicit case scope and policy checks.
4. Evidence is immutable-by-convention and should retain timestamps and source references.

## Human control
V1 assumes the auditor controls execution. No autonomous destructive action is implemented.
