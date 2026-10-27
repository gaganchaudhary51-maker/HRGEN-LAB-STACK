from __future__ import annotations
import sqlite3, uuid, json, threading, hashlib, secrets
from pathlib import Path
from datetime import datetime, timezone

SCHEMA = '''
CREATE TABLE IF NOT EXISTS tenants (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS principals (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 actor TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('viewer','tester','verifier','manager')),
 active INTEGER NOT NULL CHECK(active IN (0,1)),
 created_at TEXT NOT NULL,
 UNIQUE(tenant_id, actor)
);
CREATE TABLE IF NOT EXISTS api_tokens (
 id TEXT PRIMARY KEY,
 principal_id TEXT NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,
 active INTEGER NOT NULL CHECK(active IN (0,1)),
 created_at TEXT NOT NULL,
 last_used_at TEXT
);
CREATE TABLE IF NOT EXISTS assessments (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 authorization_ref TEXT NOT NULL,
 target TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('draft','active','verification','closed')),
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS findings (
 id TEXT PRIMARY KEY,
 assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
 severity TEXT NOT NULL CHECK(severity IN ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
 status TEXT NOT NULL CHECK(status IN ('candidate','confirmed','rejected','fixed','retested')),
 title TEXT NOT NULL,
 description TEXT NOT NULL,
 evidence_id TEXT,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_events (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
 actor TEXT NOT NULL,
 action TEXT NOT NULL,
 object_id TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_findings_assessment ON findings(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_tenant ON assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_principals_tenant ON principals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tokens_principal ON api_tokens(principal_id);
CREATE INDEX IF NOT EXISTS idx_events_assessment ON audit_events(assessment_id, seq);
'''

def _id(prefix: str) -> str:
    return f'{prefix}-{uuid.uuid4().hex}'

class Store:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.conn = sqlite3.connect(self.path, isolation_level=None, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute('PRAGMA foreign_keys=ON')
        self.conn.execute('PRAGMA journal_mode=WAL')
        self.conn.executescript(SCHEMA)

    def close(self):
        with self.lock:
            self.conn.close()
    def create_tenant(self, name: str) -> dict:
        if not isinstance(name,str) or not name.strip() or len(name)>200: raise ValueError('invalid tenant name')
        tid=_id('T'); now=datetime.now(timezone.utc).isoformat()
        with self.lock:
            self.conn.execute('INSERT INTO tenants VALUES(?,?,?)',(tid,name.strip(),now))
        return dict(self.conn.execute('SELECT * FROM tenants WHERE id=?',(tid,)).fetchone())

    def create_principal(self, tenant_id: str, actor: str, role: str) -> dict:
        if not isinstance(actor,str) or not actor.strip() or len(actor)>200: raise ValueError('invalid actor')
        if role not in {'viewer','tester','verifier','manager'}: raise ValueError('invalid role')
        with self.lock:
            if not self.conn.execute('SELECT 1 FROM tenants WHERE id=?',(tenant_id,)).fetchone(): raise KeyError('tenant not found')
            pid=_id('P'); now=datetime.now(timezone.utc).isoformat()
            self.conn.execute('INSERT INTO principals VALUES(?,?,?,?,?,?)',(pid,tenant_id,actor.strip(),role,1,now))
        return dict(self.conn.execute('SELECT * FROM principals WHERE id=?',(pid,)).fetchone())

    def issue_token(self, principal_id: str) -> tuple[str,dict]:
        raw=secrets.token_urlsafe(32); h=hashlib.sha256(raw.encode()).hexdigest(); tid=_id('K'); now=datetime.now(timezone.utc).isoformat()
        with self.lock:
            if not self.conn.execute('SELECT 1 FROM principals WHERE id=? AND active=1',(principal_id,)).fetchone(): raise KeyError('principal not found')
            self.conn.execute('INSERT INTO api_tokens VALUES(?,?,?,?,?,?)',(tid,principal_id,h,1,now,None))
            row=self.conn.execute('SELECT * FROM api_tokens WHERE id=?',(tid,)).fetchone()
        return raw,dict(row)

    def register_token(self, principal_id: str, raw_token: str) -> dict:
        if not isinstance(raw_token,str) or not raw_token or len(raw_token)>512: raise ValueError('invalid token')
        h=hashlib.sha256(raw_token.encode()).hexdigest(); tid=_id('K'); now=datetime.now(timezone.utc).isoformat()
        with self.lock:
            if not self.conn.execute('SELECT 1 FROM principals WHERE id=? AND active=1',(principal_id,)).fetchone(): raise KeyError('principal not found')
            self.conn.execute('INSERT INTO api_tokens VALUES(?,?,?,?,?,?)',(tid,principal_id,h,1,now,None))
            return dict(self.conn.execute('SELECT * FROM api_tokens WHERE id=?',(tid,)).fetchone())

    def authenticate_token(self, raw_token: str) -> dict:
        if not isinstance(raw_token,str) or not raw_token or len(raw_token)>512: raise KeyError('invalid token')
        h=hashlib.sha256(raw_token.encode()).hexdigest()
        with self.lock:
            row=self.conn.execute('SELECT p.id principal_id,p.tenant_id,p.actor,p.role,k.id token_id FROM api_tokens k JOIN principals p ON p.id=k.principal_id WHERE k.token_hash=? AND k.active=1 AND p.active=1',(h,)).fetchone()
            if not row: raise KeyError('invalid token')
            now=datetime.now(timezone.utc).isoformat(); self.conn.execute('UPDATE api_tokens SET last_used_at=? WHERE id=?',(now,row['token_id']))
            return dict(row)

    def create_assessment(self, authorization_ref: str, target: str, actor: str, tenant_id: str | None = None) -> dict:
        if not all(isinstance(x,str) and x.strip() and len(x)<=2000 for x in (authorization_ref,target,actor)):
            raise ValueError('invalid assessment fields')
        aid=_id('A'); now=datetime.now(timezone.utc).isoformat()
        tenant_id = tenant_id or authorization_ref
        with self.lock:
            if not self.conn.execute('SELECT 1 FROM tenants WHERE id=?',(tenant_id,)).fetchone():
                self.conn.execute('INSERT INTO tenants VALUES(?,?,?)',(tenant_id,tenant_id,now))
        with self.lock:
            self.conn.execute('BEGIN IMMEDIATE')
            try:
                self.conn.execute('INSERT INTO assessments VALUES(?,?,?,?,?,?)',(aid,tenant_id,authorization_ref,target,'draft',now))
                self.conn.execute('INSERT INTO audit_events(assessment_id,actor,action,object_id,created_at) VALUES(?,?,?,?,?)',(aid,actor,'assessment.created',aid,now))
                self.conn.execute('COMMIT')
            except Exception:
                self.conn.execute('ROLLBACK'); raise
            return self.get_assessment(aid, authorization_ref, tenant_id)

    def get_assessment(self, aid: str, authorization_ref: str, tenant_id: str | None = None) -> dict:
        with self.lock:
            tenant_id = tenant_id or authorization_ref
            row=self.conn.execute('SELECT * FROM assessments WHERE id=? AND authorization_ref=? AND tenant_id=?',(aid,authorization_ref,tenant_id)).fetchone()
            if not row: raise KeyError('assessment not found')
            d=dict(row)
            d['finding_count']=self.conn.execute('SELECT count(*) FROM findings WHERE assessment_id=?',(aid,)).fetchone()[0]
            return d

    def list_assessments(self, authorization_ref: str, tenant_id: str | None = None) -> list[dict]:
        with self.lock:
            tenant_id = tenant_id or authorization_ref
            rows=self.conn.execute('SELECT a.*, count(f.id) finding_count FROM assessments a LEFT JOIN findings f ON f.assessment_id=a.id WHERE a.authorization_ref=? AND a.tenant_id=? GROUP BY a.id ORDER BY a.created_at DESC',(authorization_ref,tenant_id)).fetchall()
            return [dict(r) for r in rows]

    def add_candidate(self, aid: str, authorization_ref: str, actor: str, finding: dict, tenant_id: str | None = None) -> dict:
        self.get_assessment(aid, authorization_ref, tenant_id)
        required=('id','severity','title','description')
        if not all(isinstance(finding.get(k),str) and finding[k].strip() for k in required): raise ValueError('invalid finding')
        if finding['severity'] not in {'INFO','LOW','MEDIUM','HIGH','CRITICAL'}: raise ValueError('invalid severity')
        if len(finding['id'])>128 or len(finding['title'])>1000 or len(finding['description'])>20000: raise ValueError('finding field too large')
        now=datetime.now(timezone.utc).isoformat()
        with self.lock:
            self.conn.execute('BEGIN IMMEDIATE')
            try:
                self.conn.execute('INSERT INTO findings(id,assessment_id,severity,status,title,description,evidence_id,created_at) VALUES(?,?,?,?,?,?,?,?)',(finding['id'],aid,finding['severity'],'candidate',finding['title'],finding['description'],finding.get('evidence_id'),now))
                self.conn.execute('INSERT INTO audit_events(assessment_id,actor,action,object_id,created_at) VALUES(?,?,?,?,?)',(aid,actor,'finding.candidate',finding['id'],now))
                self.conn.execute('COMMIT')
            except Exception:
                self.conn.execute('ROLLBACK'); raise
            return self.get_finding(finding['id'], authorization_ref)

    def get_finding(self, fid: str, authorization_ref: str) -> dict:
        with self.lock:
            row=self.conn.execute('SELECT f.* FROM findings f JOIN assessments a ON a.id=f.assessment_id WHERE f.id=? AND a.authorization_ref=?',(fid,authorization_ref)).fetchone()
            if not row: raise KeyError('finding not found')
            return dict(row)

    def verify_finding(self, fid: str, authorization_ref: str, actor: str, confirmed: bool, tenant_id: str | None = None) -> dict:
        f=self.get_finding(fid,authorization_ref)
        if not isinstance(confirmed,bool): raise ValueError('confirmed must be boolean')
        new='confirmed' if confirmed else 'rejected'; now=datetime.now(timezone.utc).isoformat()
        with self.lock:
            self.conn.execute('BEGIN IMMEDIATE')
            try:
                self.conn.execute('UPDATE findings SET status=? WHERE id=? AND status=?',(new,fid,'candidate'))
                if self.conn.execute('SELECT changes()').fetchone()[0] != 1: raise ValueError('finding is not awaiting verification')
                self.conn.execute('INSERT INTO audit_events(assessment_id,actor,action,object_id,created_at) VALUES(?,?,?,?,?)',(f['assessment_id'],actor,'finding.verified',fid,now))
                self.conn.execute('COMMIT')
            except Exception:
                self.conn.execute('ROLLBACK'); raise
            return self.get_finding(fid,authorization_ref)
