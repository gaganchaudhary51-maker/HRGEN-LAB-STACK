from __future__ import annotations
import re
from pathlib import Path
from .safeio import read_file_bytes_secure

REQ_RE=re.compile(r'^\s*([A-Za-z0-9_.-]+)\s*(==|===|>=|<=|~=|!=)?\s*([^\s#;]+)?')

def inventory(root: Path) -> list[dict]:
    root=Path(root).resolve()
    out=[]
    for name in ('requirements.txt','requirements-dev.txt','pyproject.toml','package.json','package-lock.json','poetry.lock'):
        p=root/name
        if not p.is_file() or p.is_symlink(): continue
        try: raw=read_file_bytes_secure(p,max_bytes=2_000_000).decode('utf-8',errors='strict')
        except Exception: continue
        if p.name.endswith('.txt'):
            for line in raw.splitlines():
                line=line.split('#',1)[0].strip()
                m=REQ_RE.match(line)
                if m and m.group(1): out.append({'source':str(p.relative_to(root)),'name':m.group(1),'constraint':(m.group(2) or '')+(m.group(3) or '')})
        elif p.name=='package.json':
            try:
                import json; d=json.loads(raw)
                for section in ('dependencies','devDependencies'):
                    for n,v in (d.get(section) or {}).items(): out.append({'source':str(p.relative_to(root)),'name':n,'constraint':str(v)})
            except Exception: pass
    return out
