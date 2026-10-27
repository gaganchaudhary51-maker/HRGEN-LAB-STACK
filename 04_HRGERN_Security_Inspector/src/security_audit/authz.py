from __future__ import annotations
from dataclasses import dataclass

ROLES={"viewer":{"read"},"tester":{"read","execute","submit"},"verifier":{"read","verify"},"manager":{"read","execute","submit","verify","manage"}}

@dataclass(frozen=True)
class AuthorizationDecision:
    allowed: bool
    reason: str

def authorize(role: str, action: str, *, approved: bool=False) -> AuthorizationDecision:
    role=str(role).lower(); action=str(action).lower()
    if role not in ROLES: return AuthorizationDecision(False,"unknown role")
    if action not in ROLES[role]: return AuthorizationDecision(False,"role does not permit action")
    if action == "execute" and not approved: return AuthorizationDecision(False,"explicit human approval required")
    return AuthorizationDecision(True,"authorized")
