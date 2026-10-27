# Security Audit Checklist V1

## 00 Authorization
- [ ] Written authorization exists
- [ ] Target/scope documented
- [ ] Out-of-scope assets documented
- [ ] Testing window documented
- [ ] Emergency contact documented

## 01 Asset & Attack Surface
- [ ] Domains/subdomains
- [ ] APIs/endpoints
- [ ] Authentication surfaces
- [ ] Admin surfaces
- [ ] File upload/download
- [ ] Third-party integrations
- [ ] AI/agent/tool interfaces

## 02 Authentication & Authorization
- [ ] Login controls
- [ ] Session handling
- [ ] Password/reset flows
- [ ] MFA
- [ ] RBAC/ABAC
- [ ] IDOR/BOLA checks
- [ ] Privilege boundaries

## 03 Input & Application Security
- [ ] Injection classes
- [ ] XSS
- [ ] CSRF where applicable
- [ ] SSRF
- [ ] Path traversal
- [ ] File upload handling
- [ ] Deserialization
- [ ] Business logic

## 04 Secrets & Data
- [ ] Secrets in source
- [ ] Environment configuration
- [ ] Logs
- [ ] Sensitive data exposure
- [ ] Backup/export paths

## 05 AI Security
- [ ] Prompt injection resistance
- [ ] System instruction isolation
- [ ] Tool authorization
- [ ] Untrusted-content handling
- [ ] Sensitive-data leakage
- [ ] Excessive agency
- [ ] Output/tool-call validation
- [ ] Human approval gates

## 06 Deployment
- [ ] Dependency inventory
- [ ] Security headers/configuration
- [ ] TLS
- [ ] Debug mode
- [ ] Cloud permissions
- [ ] Container isolation
- [ ] Logging/monitoring

## 07 Evidence & Reporting
- [ ] Reproduction steps
- [ ] Impact
- [ ] Severity
- [ ] Evidence reference
- [ ] Remediation
- [ ] Retest result
