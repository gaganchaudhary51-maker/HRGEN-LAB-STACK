from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True)
class Capability:
    id: str
    domain: str
    mode: str
    requires_authorization: bool = True

DOMAINS = [
"Web application","API security","GraphQL","Mobile application","Desktop application","AI/LLM","Agent/MCP/tool","Webhook/event/message","Authentication/session/identity","Authorization/IDOR/multitenant","Network/Wi-Fi","Cloud","Container/Kubernetes","Infrastructure/host","Configuration","Dependency/supply chain","Secrets/credentials","Cryptography/TLS","File/storage/object access","SSRF/network boundary","Input/injection","Business logic","Rate/resource exhaustion","Browser/security headers","Data leakage/privacy","Source code","CI/CD/DevSecOps","Package/artifact/release","Serverless/function","Database/cache/queue","DNS/domain/certificate","Observability/logging/audit","Backup/restore/DR","Update/patch/version","Security resilience/failure injection"]

def catalog() -> list[Capability]:
    return [Capability(f"UNI-{i:03d}", d, "fixture-backed" if i not in {1,2,9,10,15,17,18,21,24,25,26,27,32} else "native-foundation") for i,d in enumerate(DOMAINS,1)]
