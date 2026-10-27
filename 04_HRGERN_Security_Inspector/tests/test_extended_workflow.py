from security_audit.authz import authorize
from security_audit.prompt_corpus import get_corpus
from security_audit.chain import append_link, verify_link

def test_authz_requires_approval_for_execute():
    assert not authorize('tester','execute').allowed
    assert authorize('tester','execute',approved=True).allowed
    assert not authorize('viewer','execute',approved=True).allowed

def test_prompt_corpus_is_defensive_and_stable():
    c=get_corpus(); assert len(c)>=5; assert all(x['id'].startswith('PI-') for x in c)

def test_evidence_chain_link_verifies(tmp_path):
    p=tmp_path/'link.json'; b=b'evidence'; append_link(str(p),'L-1','evidence','F-1','E-1',b)
    assert verify_link(str(p),b); assert not verify_link(str(p),b'changed')


def test_api_role_matrix():
    assert authorize('viewer','read').allowed
    assert not authorize('viewer','manage').allowed
    assert authorize('tester','execute',approved=True).allowed
    assert not authorize('tester','verify').allowed
    assert authorize('verifier','verify').allowed
    assert not authorize('verifier','manage').allowed
    assert authorize('manager','manage').allowed
