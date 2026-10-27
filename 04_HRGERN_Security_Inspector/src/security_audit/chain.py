from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import hashlib, json
from pathlib import Path
from .safeio import atomic_write_bytes, read_file_bytes_secure

@dataclass(frozen=True)
class ChainLink:
    link_id:str; kind:str; parent_id:str; artifact_id:str; sha256:str; created_at:str

def append_link(path: str, link_id: str, kind: str, parent_id: str, artifact_id: str, artifact_bytes: bytes) -> ChainLink:
    if not all(isinstance(x,str) and x.strip() and len(x)<=128 and '/' not in x and '\\' not in x for x in (link_id,kind,parent_id,artifact_id)):
        raise ValueError('invalid chain identifier')
    link=ChainLink(link_id,kind,parent_id,artifact_id,hashlib.sha256(artifact_bytes).hexdigest(),datetime.now(timezone.utc).isoformat())
    p=Path(path); atomic_write_bytes(p.parent,p.name,(json.dumps(asdict(link),indent=2)+'\n').encode()); return link

def verify_link(path: str, artifact_bytes: bytes) -> bool:
    try:
        d=json.loads(read_file_bytes_secure(Path(path),max_bytes=100_000).decode('utf-8'))
        return d.get('sha256') == hashlib.sha256(artifact_bytes).hexdigest()
    except Exception: return False
