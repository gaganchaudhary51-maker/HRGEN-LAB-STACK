from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import json, re
from pathlib import Path
from .safeio import atomic_write_bytes, read_file_bytes_secure

ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")

def _id(v: str, label: str) -> str:
    if not isinstance(v, str) or not ID_RE.fullmatch(v): raise ValueError(f"invalid {label}")
    return v

def _text(v: str, label: str, limit=5000) -> str:
    if not isinstance(v, str) or not v.strip() or len(v) > limit: raise ValueError(f"invalid {label}")
    return v

def _load(path: Path) -> dict:
    raw=read_file_bytes_secure(path, max_bytes=2_000_000)
    try: data=json.loads(raw.decode('utf-8'))
    except Exception as e: raise ValueError(f"invalid JSON: {e}")
    if not isinstance(data, dict): raise ValueError("object required")
    return data

def write_authorization(path: str, assessment_id: str, authorized_by: str, target: str, scope: list[str], expires_at: str) -> Path:
    data={"type":"authorization","assessment_id":_id(assessment_id,'assessment_id'),"authorized_by":_text(authorized_by,'authorized_by',200),"target":_text(target,'target',2000),"scope":[_text(x,'scope',2000) for x in scope],"expires_at":_text(expires_at,'expires_at',100),"created_at":datetime.now(timezone.utc).isoformat()}
    p=Path(path); atomic_write_bytes(p.parent,p.name,(json.dumps(data,indent=2)+"\n").encode()); return p

def write_roe(path: str, assessment_id: str, rules: list[str], exclusions: list[str], stop_conditions: list[str]) -> Path:
    data={"type":"rules_of_engagement","assessment_id":_id(assessment_id,'assessment_id'),"rules":[_text(x,'rule') for x in rules],"exclusions":[_text(x,'exclusion') for x in exclusions],"stop_conditions":[_text(x,'stop_condition') for x in stop_conditions],"created_at":datetime.now(timezone.utc).isoformat()}
    p=Path(path); atomic_write_bytes(p.parent,p.name,(json.dumps(data,indent=2)+"\n").encode()); return p

def write_remediation(path: str, finding_id: str, owner: str, action: str, due_at: str) -> Path:
    data={"type":"remediation","finding_id":_id(finding_id,'finding_id'),"owner":_text(owner,'owner',200),"action":_text(action,'action'),"due_at":_text(due_at,'due_at',100),"status":"open","created_at":datetime.now(timezone.utc).isoformat()}
    p=Path(path); atomic_write_bytes(p.parent,p.name,(json.dumps(data,indent=2)+"\n").encode()); return p

def write_retest(path: str, finding_id: str, tester: str, result: str, evidence_id: str) -> Path:
    result=result.lower()
    if result not in {"pass","fail","inconclusive"}: raise ValueError("invalid retest result")
    data={"type":"retest","finding_id":_id(finding_id,'finding_id'),"tester":_text(tester,'tester',200),"result":result,"evidence_id":_id(evidence_id,'evidence_id'),"created_at":datetime.now(timezone.utc).isoformat()}
    p=Path(path); atomic_write_bytes(p.parent,p.name,(json.dumps(data,indent=2)+"\n").encode()); return p
