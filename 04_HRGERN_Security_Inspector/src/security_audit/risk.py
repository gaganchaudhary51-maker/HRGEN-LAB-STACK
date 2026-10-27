from __future__ import annotations
from dataclasses import dataclass
from typing import Mapping

WEIGHTS = {"INFO": 0, "LOW": 1, "MEDIUM": 3, "HIGH": 7, "CRITICAL": 10}

@dataclass(frozen=True)
class RiskScore:
    severity: str
    likelihood: int
    impact: int
    score: int
    band: str

def score_finding(severity: str, *, likelihood: int = 3, impact: int = 3) -> RiskScore:
    severity = str(severity).upper()
    if severity not in WEIGHTS:
        raise ValueError("invalid severity")
    if not isinstance(likelihood, int) or isinstance(likelihood, bool) or likelihood not in range(1, 6):
        raise ValueError("likelihood must be 1..5")
    if not isinstance(impact, int) or isinstance(impact, bool) or impact not in range(1, 6):
        raise ValueError("impact must be 1..5")
    raw = WEIGHTS[severity] * likelihood * impact
    band = "Informational" if raw == 0 else "Low" if raw <= 5 else "Moderate" if raw <= 20 else "High" if raw <= 70 else "Critical"
    return RiskScore(severity, likelihood, impact, raw, band)

def summarize(findings: list[Mapping]) -> dict:
    total = 0
    bands = {"Informational":0,"Low":0,"Moderate":0,"High":0,"Critical":0}
    for f in findings:
        r = score_finding(f.get("severity", "INFO"), likelihood=int(f.get("likelihood", 3)), impact=int(f.get("impact", 3)))
        total += r.score; bands[r.band] += 1
    return {"total_score": total, "bands": bands, "finding_count": len(findings)}
