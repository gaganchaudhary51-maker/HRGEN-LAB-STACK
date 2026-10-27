# Antigravity Desktop Guardrails for HRGen Diagnostic Ecosystem

## 1. Core Directives
- **Zero Breakage Policy**: Never modify or overwrite working clinical routes (`/api/orders`, `/api/specimens`, `/api/qc`) without executing automated test verification.
- **No Mock Hallucinations**: Do not replace backend logic with hardcoded client-side mocks when real endpoints exist.
- **NABL ISO-15189 Strictness**: Enforce the 6-stage clinical validation gate (Specimen Accept -> IQC Pass -> Results -> Panic Ack -> Pathologist Signoff -> Release).

## 2. UI/UX Standard
- Follow Linear, Stripe, and Apple healthcare design standards.
- Use `src/components/ui/` (shadcn + Radix + Tailwind + Lucide).
- Every interactive element must have hover, active, focus, disabled, and loading states.
- Dark mode primary (#041220 / #090d16) with subtle emerald (#10b981) and cyan (#0ea5e9) accents.

## 3. Engineering Hygiene
- Strict TypeScript: Zero `any` types on clinical models.
- Verification First: Always run `npm run build` and test scripts before reporting completion.
