import json, threading, urllib.request
from security_audit.store import Store

def test_store_authorization_partition(tmp_path):
    s=Store(tmp_path/'lab.sqlite')
    a=s.create_assessment('AUTH-A','https://a.test','alice')
    assert s.get_assessment(a['id'],'AUTH-A')['target']=='https://a.test'
    try:
        s.get_assessment(a['id'],'AUTH-B')
        assert False
    except KeyError: pass
    s.close()

def test_candidate_requires_human_verification(tmp_path):
    s=Store(tmp_path/'lab.sqlite'); a=s.create_assessment('AUTH','target','alice')
    f=s.add_candidate(a['id'],'AUTH','scanner',{'id':'F-1','severity':'HIGH','title':'t','description':'d'})
    assert f['status']=='candidate'
    assert s.verify_finding('F-1','AUTH','bob',True)['status']=='confirmed'
    s.close()

def test_duplicate_finding_is_atomic(tmp_path):
    s=Store(tmp_path/'lab.sqlite'); a=s.create_assessment('AUTH','target','alice')
    s.add_candidate(a['id'],'AUTH','scanner',{'id':'F-1','severity':'HIGH','title':'t','description':'d'})
    try: s.add_candidate(a['id'],'AUTH','scanner',{'id':'F-1','severity':'HIGH','title':'x','description':'y'}); assert False
    except Exception: pass
    assert s.get_assessment(a['id'],'AUTH')['finding_count']==1
    s.close()


def test_api_rbac_and_workflow(tmp_path):
    from security_audit.webapp import serve
    import socket, time
    def free_port():
        s=socket.socket(); s.bind(('127.0.0.1',0)); p=s.getsockname()[1]; s.close(); return p
    port=free_port(); token='test-token'
    t=threading.Thread(target=serve,args=('127.0.0.1',port,str(tmp_path/'api.sqlite')),kwargs={'role':'manager','token':token,'actor':'alice','authorization_ref':'TENANT-A'},daemon=True); t.start(); time.sleep(0.05)
    def req(method,path,body=None,role='manager'):
        data=None if body is None else json.dumps(body).encode(); r=urllib.request.Request(f'http://127.0.0.1:{port}{path}',data=data,method=method,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'}); return urllib.request.urlopen(r,timeout=2)
    a=json.load(req('POST','/api/assessments',{'target':'https://example.test'})); assert a['status']=='draft'
    f=json.load(req('POST',f"/api/assessments/{a['id']}/findings",{'finding':{'id':'F-API','severity':'HIGH','title':'t','description':'d'}})); assert f['status']=='candidate'
    v=json.load(req('POST','/api/findings/F-API/verify',{'confirmed':True})); assert v['status']=='confirmed'


def test_api_binds_actor_and_authorization_ref(tmp_path):
    from security_audit.webapp import serve
    import socket, time
    def free_port():
        s=socket.socket(); s.bind(('127.0.0.1',0)); p=s.getsockname()[1]; s.close(); return p
    port=free_port(); token='bound-token'
    t=threading.Thread(target=serve,args=('127.0.0.1',port,str(tmp_path/'bound.sqlite')),kwargs={'role':'manager','token':token,'actor':'server-actor','authorization_ref':'TENANT-BOUND'},daemon=True); t.start(); time.sleep(0.05)
    req=urllib.request.Request(f'http://127.0.0.1:{port}/api/assessments',data=json.dumps({'target':'target'}).encode(),method='POST',headers={'Authorization':'Bearer '+token,'X-Authorization-Ref':'ATTACKER','X-Actor':'attacker','Content-Type':'application/json'})
    a=json.load(urllib.request.urlopen(req,timeout=2)); assert a['authorization_ref']=='TENANT-BOUND'
    s=Store(tmp_path/'bound.sqlite'); events=s.conn.execute("SELECT actor FROM audit_events WHERE assessment_id=?",(a['id'],)).fetchall(); assert [r[0] for r in events]==['server-actor']; s.close()


def test_api_role_denies_unauthorized_mutation(tmp_path):
    from security_audit.webapp import serve
    import socket, time, urllib.error
    def free_port():
        s=socket.socket(); s.bind(('127.0.0.1',0)); p=s.getsockname()[1]; s.close(); return p
    port=free_port(); token='viewer-token'
    t=threading.Thread(target=serve,args=('127.0.0.1',port,str(tmp_path/'viewer.sqlite')),kwargs={'role':'viewer','token':token,'actor':'viewer','authorization_ref':'TENANT-V'},daemon=True); t.start(); time.sleep(0.05)
    req=urllib.request.Request(f'http://127.0.0.1:{port}/api/assessments',data=b'{"target":"x"}',method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
    try: urllib.request.urlopen(req,timeout=2); assert False
    except urllib.error.HTTPError as e: assert e.code==403

def test_token_registry_is_hashed_and_tenant_bound(tmp_path):
    from security_audit.store import Store
    import hashlib
    s=Store(tmp_path/'lab.sqlite')
    t1=s.create_tenant('Client A'); t2=s.create_tenant('Client B')
    p=s.create_principal(t1['id'],'alice','manager'); raw,_=s.issue_token(p['id'])
    assert hashlib.sha256(raw.encode()).hexdigest() == s.conn.execute('SELECT token_hash FROM api_tokens').fetchone()[0]
    session=s.authenticate_token(raw)
    assert session['tenant_id']==t1['id'] and session['role']=='manager'
    assert raw not in str(s.conn.execute('SELECT token_hash FROM api_tokens').fetchone()[0])
    s.close()

def test_capability_catalog_has_35_authorized_entries():
    from security_audit.capabilities import catalog
    caps=catalog()
    assert len(caps)==35
    assert caps[0].id=='UNI-001' and caps[-1].id=='UNI-035'
    assert all(c.requires_authorization for c in caps)

def test_cross_tenant_assessment_isolation(tmp_path):
    from security_audit.store import Store
    s=Store(tmp_path/'lab.sqlite')
    a=s.create_tenant('A'); b=s.create_tenant('B')
    x=s.create_assessment('AUTH-A','target-a','alice',a['id'])
    assert s.get_assessment(x['id'],'AUTH-A',a['id'])['target']=='target-a'
    import pytest
    with pytest.raises(KeyError): s.get_assessment(x['id'],'AUTH-A',b['id'])
    assert s.list_assessments('AUTH-A',b['id'])==[]
    s.close()

def test_api_identity_and_capability_catalog(tmp_path):
    from security_audit.webapp import serve
    import socket,time,urllib.request,json
    s=socket.socket(); s.bind(('127.0.0.1',0)); port=s.getsockname()[1]; s.close()
    token='identity-token'
    threading.Thread(target=serve,args=('127.0.0.1',port,str(tmp_path/'api.sqlite')),kwargs={'role':'tester','token':token,'actor':'tester-a','authorization_ref':'CLIENT-A'},daemon=True).start(); time.sleep(.1)
    def get(path):
        r=urllib.request.Request(f'http://127.0.0.1:{port}{path}',headers={'Authorization':'Bearer '+token}); return json.load(urllib.request.urlopen(r,timeout=2))
    me=get('/api/me'); assert me['actor']=='tester-a' and me['role']=='tester'
    caps=get('/api/capabilities'); assert len(caps)==35 and all(c['requires_authorization'] for c in caps)
