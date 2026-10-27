from __future__ import annotations
import json, re
from pathlib import Path
from .safeio import read_file_bytes_secure
from dataclasses import dataclass, asdict

SKIP_DIRS={'.git','node_modules','.venv','venv','dist','build','__pycache__','.next','.pytest_cache','cases','reports','evidence'}
TEXT_EXT={'.py','.js','.ts','.tsx','.jsx','.json','.yaml','.yml','.toml','.ini','.env','.md','.txt','.sh','.ps1','.php','.java','.go','.rs','.rb','.cs','.sql'}
PATTERNS=[
 ('HIGH','shell execution',r'\bsubprocess\.(run|Popen|call|check_call|check_output)\s*\([^\n]*shell\s*=\s*True'),  # security-audit: scanner-rule-definition
 ('HIGH','os.system execution',r'\bos\.system\s*\('),  # security-audit: scanner-rule-definition
 ('HIGH','command execution',r'\bchild_process\.(exec|execSync)\s*\('),  # security-audit: scanner-rule-definition
 ('HIGH','dynamic eval',r'\b(eval|exec)\s*\('),  # security-audit: scanner-rule-definition
 ('MEDIUM','curl pipe shell',r'\bcurl\b[^\n|]*\|\s*(bash|sh)\b'),  # security-audit: scanner-rule-definition
 ('MEDIUM','wget pipe shell',r'\bwget\b[^\n|]*\|\s*(bash|sh)\b'),  # security-audit: scanner-rule-definition
 ('HIGH','hard-coded secret-like value',r'(?i)\b(api[_-]?key|secret|password|token)\s*[:=]\s*["\'][^"\']{8,}["\']'),  # security-audit: scanner-rule-definition
 ('MEDIUM','private key material',r'-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'),  # security-audit: scanner-rule-definition
 ('MEDIUM','approval TODO',r'(?i)(TODO|FIXME).{0,40}(approval|authorize|permission|security)'),  # security-audit: scanner-rule-definition
]
@dataclass
class Finding:
    id:str; severity:str; rule:str; file:str; line:int; evidence:str; recommendation:str
    title:str = ''
    status:str = 'open'
    description:str = ''
    asset:str = ''
    remediation:str = ''

def scan(root:Path, *, max_file_bytes: int = 2_000_000):
    if root.is_symlink():
        raise ValueError(f"scan root must not be a symlink: {root}")
    root = root.resolve()
    if not root.is_dir():
        raise ValueError(f"scan root is not a directory: {root}")
    findings=[]; counter=1
    for p in root.rglob('*'):
        if p.is_symlink():
            continue
        if not p.is_file() or any(part in SKIP_DIRS for part in p.parts): continue
        if p.suffix.lower() not in TEXT_EXT and p.name not in {'.env','Dockerfile','docker-compose.yml'}: continue
        try:
            data = read_file_bytes_secure(p, max_bytes=max_file_bytes)
            text=data.decode('utf-8', errors='ignore')
        except Exception:
            continue
        for sev,rule,pat in PATTERNS:
            rx=re.compile(pat)
            for m in rx.finditer(text):
                line=text.count('\n',0,m.start())+1
                raw=text.splitlines()[line-1].strip()[:240]
                if 'security-audit: scanner-rule-definition' in raw:
                    continue
                if 'security-audit: allow-test-secret' in raw and rule == 'hard-coded secret-like value':
                    continue
                rec={
                  'shell execution':'Review authorization boundary; ensure commands require explicit user approval and have a controlled execution context.',
                  'os.system execution':'Trace caller and approval path; avoid direct execution of untrusted/model-generated strings.',
                  'command execution':'Trace tool-call authorization and ensure model output cannot directly execute arbitrary commands.',
                  'dynamic eval':'Avoid executing untrusted/model-controlled strings; replace with explicit parsing/dispatch.',
                  'curl pipe shell':'Do not execute downloaded content blindly; pin/verify artifacts and require explicit approval.',
                  'wget pipe shell':'Do not execute downloaded content blindly; pin/verify artifacts and require explicit approval.',
                  'hard-coded secret-like value':'Move secrets to a managed secret store/environment and rotate exposed credentials.',
                  'private key material':'Remove from source and rotate the key if real.',
                  'approval TODO':'Verify the approval mechanism exists in executable code and is covered by tests.'}[rule]  # security-audit: scanner-rule-definition
                title = rule.replace('-', ' ').title()
                description = f'Static rule {rule} matched source at {p.relative_to(root)}:{line}.'
                findings.append(Finding(f'F-{counter:04d}',sev,rule,str(p.relative_to(root)),line,raw,rec,title,'open',description,str(p.relative_to(root)),rec)); counter+=1
    return findings

def main():
    import argparse
    ap=argparse.ArgumentParser(description='Safe static security scanner')
    ap.add_argument('path',nargs='?',default='.')
    ap.add_argument('--json',action='store_true')
    args=ap.parse_args(); root=Path(args.path).resolve(); fs=scan(root)
    data=[asdict(x) for x in fs]
    if args.json: print(json.dumps(data,indent=2))
    else:
      print(f'Scanned: {root}\nFindings: {len(fs)}')
      for f in fs: print(f'{f.id} [{f.severity}] {f.file}:{f.line} — {f.rule}')
if __name__=='__main__': main()
