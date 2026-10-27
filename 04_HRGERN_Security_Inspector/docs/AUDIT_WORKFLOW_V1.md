# Security Audit Workflow V1

## Rule
Only test assets you own or have explicit written authorization to assess. Define scope and rules of engagement first.

## Evidence-first workflow
1. Identify assets and entry points.
2. Map trust boundaries.
3. Trace privileged capabilities (shell, filesystem, network, secrets).
4. Run static checks.
5. Perform controlled dynamic tests in a disposable environment.
6. Record exact evidence for every finding.
7. Fix, then retest the same reproduction.
8. Mark PASS only when evidence supports the claim.

## Critical approval test for AI products
Expected flow:
`AI proposes action -> user reviews -> explicit RUN/APPROVE -> tool executes`

A test is a failure if an AI-generated tool action executes without the required approval event.

## Severity guide
- CRITICAL: material compromise, credential exposure, arbitrary execution, or severe authorization bypass.
- HIGH: significant security impact with realistic exploitation path.
- MEDIUM: meaningful weakness with constrained impact or prerequisites.
- LOW: defense-in-depth or limited-impact issue.
- INFO: observation/recommendation without demonstrated security impact.
