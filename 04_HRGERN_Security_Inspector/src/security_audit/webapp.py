from __future__ import annotations
import hashlib, json, os, secrets
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from .store import Store
from .authz import authorize
from .capabilities import catalog

MAX_BODY=100_000
INDEX='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Security Audit Lab</title><style>body{font:14px system-ui;margin:0;background:#f5f7fb;color:#172033}header{padding:22px 28px;background:#172033;color:#fff}main{max-width:1100px;margin:24px auto;padding:0 16px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.card,section{background:#fff;border:1px solid #dfe5ef;border-radius:12px;padding:16px}section{margin-top:16px}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #e8ecf2;text-align:left}.pill{display:inline-block;padding:3px 8px;border-radius:999px;background:#eef2f7}.muted{color:#667085}@media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.grid{grid-template-columns:1fr}td,th{padding:7px;font-size:12px}}</style></head><body><header><b>Security Audit Lab</b><div class="muted" style="color:#d7deea">Assessment, evidence & human verification console</div></header><main><div class="grid"><div class="card"><b>Assessments</b><div id="a">0</div></div><div class="card"><b>Candidate</b><div id="c">0</div></div><div class="card"><b>Confirmed</b><div id="v">0</div></div><div class="card"><b>Release</b><div>Human gates</div></div><div class="card"><b>Capabilities</b><div id="cap">35</div></div></div><section><h2>Assessments</h2><table><thead><tr><th>ID</th><th>Target</th><th>Status</th><th>Findings</th></tr></thead><tbody id="rows"></tbody></table></section></main><script>function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}async function load(){let [r,c]=await Promise.all([fetch('/api/assessments'),fetch('/api/capabilities')]);if(!r.ok)return;let x=await r.json();let caps=c.ok?await c.json():[];document.querySelector('#a').textContent=x.length;let cand=0,ver=0;x.forEach(a=>{cand+=a.candidate_count||0;ver+=a.confirmed_count||0});document.querySelector('#c').textContent=cand;document.querySelector('#v').textContent=ver;document.querySelector('#cap').textContent=caps.length;document.querySelector('#rows').innerHTML=x.map(a=>`<tr><td>${esc(a.id)}</td><td>${esc(a.target)}</td><td><span class="pill">${esc(a.status)}</span></td><td>${Number(a.finding_count)||0}</td></tr>`).join('')}load()</script></body></html>'''

def serve(host='127.0.0.1', port=8787, db='data/lab.sqlite', *, role: str | None=None, token: str | None=None, actor: str | None=None, authorization_ref: str | None=None):
    store=Store(db)
    api_role=(role or os.environ.get('LAB_API_ROLE','manager')).strip().lower()
    if api_role not in {'viewer','tester','verifier','manager'}: store.close(); raise ValueError('invalid LAB_API_ROLE')
    api_actor=(actor or os.environ.get('LAB_API_ACTOR','api-user')).strip()
    api_ref=(authorization_ref or os.environ.get('LAB_AUTHORIZATION_REF','')).strip()
    if not api_actor or len(api_actor)>200 or not api_ref or len(api_ref)>2000: store.close(); raise ValueError('LAB_API_ACTOR and LAB_AUTHORIZATION_REF are required')
    tenant_row=store.conn.execute('SELECT * FROM tenants WHERE name=?',(api_ref,)).fetchone()
    tenant=dict(tenant_row) if tenant_row else store.create_tenant(api_ref)
    tenant_id=tenant['id']
    principal_row=store.conn.execute('SELECT * FROM principals WHERE tenant_id=? AND actor=?',(tenant_id,api_actor)).fetchone()
    if principal_row and principal_row['role'] != api_role: store.close(); raise ValueError('existing principal role conflicts with LAB_API_ROLE')
    principal_id=principal_row['id'] if principal_row else store.create_principal(tenant_id,api_actor,api_role)['id']
    if token is None: token,_=store.issue_token(principal_id)
    else:
        h=hashlib.sha256(token.encode()).hexdigest()
        if not store.conn.execute('SELECT 1 FROM api_tokens WHERE token_hash=?',(h,)).fetchone(): store.register_token(principal_id,token)

    class H(BaseHTTPRequestHandler):
        def log_message(self, *_): return
        def _json(self,code,obj):
            raw=json.dumps(obj,separators=(',',':')).encode(); self.send_response(code); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(raw))); self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff'); self.end_headers(); self.wfile.write(raw)
        def _auth(self, action='read', approved=False):
            got=self.headers.get('Authorization','')
            if not got.startswith('Bearer '): self._json(401,{'error':'authentication required'}); return False
            try: session=store.authenticate_token(got[7:])
            except KeyError: self._json(401,{'error':'authentication required'}); return False
            if session['tenant_id'] != tenant_id: self._json(403,{'error':'tenant boundary violation'}); return False
            decision=authorize(session['role'],action,approved=approved)
            if not decision.allowed: self._json(403,{'error':decision.reason}); return False
            self.session=session; return True
        def _body(self):
            try: n=int(self.headers.get('Content-Length','-1'))
            except ValueError: raise ValueError('invalid body size')
            if n<0 or n>MAX_BODY: raise ValueError('invalid body size')
            raw=self.rfile.read(n)
            try: data=json.loads(raw.decode('utf-8'))
            except (UnicodeDecodeError,json.JSONDecodeError) as e: raise ValueError(f'invalid JSON: {e}')
            if not isinstance(data,dict): raise ValueError('object required')
            return data
        def do_GET(self):
            path=urlparse(self.path).path
            if path=='/':
                raw=INDEX.encode(); self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"); self.send_header('X-Content-Type-Options','nosniff'); self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw); return
            if not self._auth('read'): return
            if path=='/api/me': return self._json(200,{'principal_id':self.session['principal_id'],'tenant_id':self.session['tenant_id'],'actor':self.session['actor'],'role':self.session['role']})
            if path=='/api/capabilities': return self._json(200,[c.__dict__ for c in catalog()])
            if path=='/api/assessments':
                rows=store.list_assessments(api_ref,tenant_id)
                for r in rows:
                    r['candidate_count']=store.conn.execute("SELECT count(*) FROM findings WHERE assessment_id=? AND status='candidate'",(r['id'],)).fetchone()[0]
                    r['confirmed_count']=store.conn.execute("SELECT count(*) FROM findings WHERE assessment_id=? AND status='confirmed'",(r['id'],)).fetchone()[0]
                return self._json(200,rows)
            if path.startswith('/api/assessments/'):
                aid=path.rsplit('/',1)[-1]
                try: return self._json(200,store.get_assessment(aid,api_ref,tenant_id))
                except KeyError: return self._json(404,{'error':'assessment not found'})
            return self._json(404,{'error':'not found'})
        def do_POST(self):
            path=urlparse(self.path).path
            action='manage' if path=='/api/assessments' else ('submit' if path.startswith('/api/assessments/') and path.endswith('/findings') else ('verify' if path.startswith('/api/findings/') and path.endswith('/verify') else 'manage'))
            if not self._auth(action): return
            try:
                data=self._body(); actor=self.session['actor']
                if path=='/api/assessments': return self._json(201,store.create_assessment(api_ref,str(data.get('target','')),actor,tenant_id))
                if path.startswith('/api/assessments/') and path.endswith('/findings'):
                    finding=data.get('finding');
                    if not isinstance(finding,dict): raise ValueError('finding object required')
                    return self._json(201,store.add_candidate(path.split('/')[3],api_ref,actor,finding,tenant_id))
                if path.startswith('/api/findings/') and path.endswith('/verify'):
                    return self._json(200,store.verify_finding(path.split('/')[3],api_ref,actor,data.get('confirmed'),tenant_id))
                return self._json(404,{'error':'not found'})
            except KeyError as e: return self._json(404,{'error':str(e).strip("'")})
            except (ValueError,TypeError,IndexError) as e: return self._json(400,{'error':str(e)})
    httpd=ThreadingHTTPServer((host,port),H)
    print(f'UI: http://{host}:{port}')
    try: httpd.serve_forever()
    finally: store.close(); httpd.server_close()
