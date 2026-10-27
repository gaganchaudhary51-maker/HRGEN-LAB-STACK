from __future__ import annotations
import html, json
from pathlib import Path
from .safeio import atomic_write_bytes, read_file_bytes_secure

def generate(audit_json: str, output: str) -> Path:
    raw=read_file_bytes_secure(Path(audit_json),max_bytes=5_000_000)
    data=json.loads(raw.decode('utf-8'))
    findings=data.get('findings',[])
    rows=''.join('<tr><td>'+html.escape(str(f.get('id','')) )+'</td><td>'+html.escape(str(f.get('severity','')) )+'</td><td>'+html.escape(str(f.get('status','')) )+'</td><td>'+html.escape(str(f.get('title','')) )+'</td></tr>' for f in findings)
    doc='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Security Audit Lab</title><style>body{font:14px system-ui;margin:0;background:#f5f7fb;color:#172033}header{padding:24px;background:#172033;color:white}main{max-width:1100px;margin:24px auto;padding:0 16px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{background:white;border:1px solid #dde3ee;border-radius:12px;padding:18px}table{width:100%;border-collapse:collapse;background:white;margin-top:18px}th,td{padding:10px;border-bottom:1px solid #e5e9f0;text-align:left}@media(max-width:700px){.cards{grid-template-columns:1fr}}</style></head><body><header><h1>Security Audit Lab</h1><div>Evidence-first assessment dashboard</div></header><main><section class="cards"><div class="card"><b>Target</b><div>'''+html.escape(str(data.get('target',''))) +'''</div></div><div class="card"><b>Findings</b><div>'''+html.escape(str(data.get('finding_count',len(findings))))+'''</div></div><div class="card"><b>Decision</b><div>Human verification required</div></div></section><table><thead><tr><th>ID</th><th>Severity</th><th>Status</th><th>Title</th></tr></thead><tbody>'''+rows+'''</tbody></table></main></body></html>'''
    p=Path(output); atomic_write_bytes(p.parent,p.name,doc.encode()); return p
