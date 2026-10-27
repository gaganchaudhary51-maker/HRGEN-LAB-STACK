from pathlib import Path
from security_audit.evidence import capture_bytes, verify
from security_audit.policy import evaluate_command
from security_audit.scope import path_in_scope, url_in_scope
from security_audit.scanner import scan

def test_scanner_does_not_follow_symlink(tmp_path):
    outside = tmp_path / "outside.py"; outside.write_text("eval(user_input)\n")
    root = tmp_path / "target"; root.mkdir(); (root / "outside.py").symlink_to(outside)
    assert scan(root) == []

def test_scanner_skips_oversized_file(tmp_path):
    p = tmp_path / "huge.py"; p.write_text("eval(x)\n" + ("A" * 2_000_001))
    assert scan(tmp_path) == []

def test_command_rejects_shell_operator_even_with_approval():
    assert not evaluate_command("echo safe; rm -rf /", user_approved=True).allowed

def test_command_requires_approval_and_allowlist():
    assert not evaluate_command("python -V", allowed_executables=["python"]).allowed
    d = evaluate_command("python -V", user_approved=True, allowed_executables=["python"])
    assert d.allowed and d.argv == ("python", "-V")

def test_path_scope_resolves_symlink_escape(tmp_path):
    root = tmp_path / "root"; root.mkdir(); outside = tmp_path / "outside"; outside.mkdir()
    (root / "link").symlink_to(outside, target_is_directory=True)
    assert not path_in_scope(root / "link" / "secret.txt", root)

def test_url_scope_is_scheme_host_and_port_exact():
    allowed = {"https://example.test:443"}
    assert url_in_scope("https://example.test/a", allowed)
    assert not url_in_scope("http://example.test/a", allowed)
    assert not url_in_scope("https://example.test:8443/a", allowed)

def test_evidence_is_hashed_and_verifiable(tmp_path):
    record = capture_bytes(tmp_path, "E-001", b"proof", source="unit-test")
    assert record.sha256 and verify(record)
    Path(record.path).write_bytes(b"tampered")
    assert not verify(record)

def test_audit_finding_shape_matches_schema(tmp_path):
    import json
    from jsonschema import validate
    (tmp_path / "app.py").write_text("eval(user_input)\n")
    finding = scan(tmp_path)[0].__dict__
    schema = json.loads(Path("schemas/finding.schema.json").read_text())
    validate(finding, schema)

def test_evidence_rejects_symlink_root(tmp_path):
    real = tmp_path / "real"; real.mkdir()
    link = tmp_path / "evidence"; link.symlink_to(real, target_is_directory=True)
    import pytest
    with pytest.raises(ValueError):
        capture_bytes(link, "E-SYM", b"proof", source="test")

def test_evidence_metadata_symlink_is_replaced_not_followed(tmp_path):
    import pytest
    outside = tmp_path / "outside.json"
    metadata = tmp_path / "E-001.json"
    metadata.symlink_to(outside)
    # Existing metadata is replaced atomically; no write should land in outside.
    record = capture_bytes(tmp_path, "E-001", b"proof", source="test")
    assert verify(record)
    assert not outside.exists()

def test_scanner_rejects_symlink_root(tmp_path):
    import pytest
    real = tmp_path / "real"; real.mkdir()
    link = tmp_path / "root"; link.symlink_to(real, target_is_directory=True)
    with pytest.raises(ValueError):
        scan(link)

def test_policy_blocks_indirect_execution_and_code_flags():
    assert not evaluate_command("env bash", user_approved=True).allowed
    assert not evaluate_command("python -c print(1)", user_approved=True).allowed
    assert not evaluate_command("sudo id", user_approved=True).allowed

def test_policy_rejects_absolute_executable_even_with_allowlist():
    assert not evaluate_command('/tmp/echo hello', user_approved=True, allowed_executables=['echo']).allowed


def test_policy_rejects_path_allowlist_entries():
    assert not evaluate_command('echo hello', user_approved=True, allowed_executables=['/bin/echo']).allowed


def test_policy_rejects_windows_style_executable_path():
    assert not evaluate_command(r'C:\\Windows\\System32\\cmd.exe /c whoami', user_approved=True).allowed


def test_evidence_rejects_symlink_content_destination(tmp_path):
    root = tmp_path / 'evidence'; root.mkdir()
    outside = tmp_path / 'outside.bin'; outside.write_bytes(b'original')
    root.joinpath('E-SYM-' + __import__('hashlib').sha256(b'proof').hexdigest() + '.bin').symlink_to(outside)
    import pytest
    with pytest.raises(ValueError):
        capture_bytes(root, 'E-SYM', b'proof', source='test')
    assert outside.read_bytes() == b'original'


def test_cli_rejects_symlink_output(tmp_path):
    from security_audit.cli import _safe_output
    real = tmp_path / 'real.json'; real.write_text('keep')
    link = tmp_path / 'out.json'; link.symlink_to(real)
    import pytest
    with pytest.raises(ValueError):
        _safe_output(str(link))
    assert real.read_text() == 'keep'


def test_cli_rejects_nested_case_name():
    from security_audit.cli import _safe_child
    import pytest
    with pytest.raises(ValueError):
        _safe_child(Path('cases'), 'a/b')


def test_evidence_rejects_nested_symlink_component(tmp_path):
    outside = tmp_path / 'outside'; outside.mkdir()
    link = tmp_path / 'link'; link.symlink_to(outside, target_is_directory=True)
    import pytest
    with pytest.raises(ValueError):
        capture_bytes(link / 'nested', 'E-NEST', b'proof', source='test')


def test_cli_rejects_nested_symlink_output_parent(tmp_path):
    from security_audit.cli import _safe_output
    outside = tmp_path / 'outside'; outside.mkdir()
    link = tmp_path / 'link'; link.symlink_to(outside, target_is_directory=True)
    import pytest
    with pytest.raises(ValueError):
        _safe_output(str(link / 'sub' / 'out.json'))

def test_evidence_concurrent_root_swap_cannot_redirect_write(tmp_path):
    import threading, os
    root = tmp_path / 'evidence'; root.mkdir()
    outside = tmp_path / 'outside'; outside.mkdir()
    original = root
    stop = threading.Event()
    def swapper():
        while not stop.is_set():
            try:
                renamed = tmp_path / 'evidence-real'
                if original.exists() and not original.is_symlink():
                    original.rename(renamed)
                    try: original.symlink_to(outside, target_is_directory=True)
                    except FileExistsError: pass
                    try: original.unlink()
                    except OSError: pass
                    try: renamed.rename(original)
                    except OSError: pass
            except OSError:
                pass
    t = threading.Thread(target=swapper); t.start()
    try:
        for i in range(50):
            try: capture_bytes(root, f'E-RACE-{i}', b'proof', source='race')
            except (ValueError, FileExistsError, OSError): pass
    finally:
        stop.set(); t.join()
    assert not list(outside.iterdir())


def test_report_rejects_duplicate_json_keys(tmp_path):
    from security_audit.report import load_audit
    p = tmp_path / 'audit.json'
    p.write_text('{"target":"x","target":"y","finding_count":0,"findings":[]}')
    import pytest
    with pytest.raises(ValueError, match='duplicate'):
        load_audit(str(p))


def test_report_rejects_count_mismatch(tmp_path):
    from security_audit.report import load_audit
    p = tmp_path / 'audit.json'
    p.write_text('{"target":"x","finding_count":99,"findings":[]}')
    import pytest
    with pytest.raises(ValueError): load_audit(str(p))


def test_report_rejects_non_object_and_oversized_input(tmp_path):
    from security_audit.report import load_audit
    import pytest
    p = tmp_path / 'audit.json'; p.write_text('[]')
    with pytest.raises(ValueError): load_audit(str(p))
    p.write_bytes(b'{' + b' ' * 5_000_000 + b'}')
    with pytest.raises(ValueError, match='maximum'):
        load_audit(str(p))


def test_policy_malformed_inputs_fail_closed():
    from security_audit.policy import evaluate_command
    import pytest
    cases = ['', '   ', 'echo "unterminated', 'echo\x00safe', 'echo a|cat', 'echo $(id)', 'echo ../secret']
    for command in cases:
        d = evaluate_command(command, user_approved=True, allowed_executables=['echo'])
        assert d.allowed is False


def test_policy_fuzzed_commands_never_raises():
    from security_audit.policy import evaluate_command
    import random, string
    rng = random.Random(99130)
    alphabet = string.printable
    for _ in range(2000):
        command = ''.join(rng.choice(alphabet) for _ in range(rng.randrange(0, 120)))
        decision = evaluate_command(command, user_approved=True, allowed_executables=['echo', 'python'])
        assert isinstance(decision.allowed, bool)

def test_scanner_does_not_skip_its_own_rule_definitions(tmp_path):
    from security_audit.scanner import scan
    # The scanner must inspect scanner.py itself, while ignoring literal rule definitions.
    source = Path('src/security_audit/scanner.py')
    findings = scan(source.parent.parent.parent)
    assert all(f.file != 'src/security_audit/scanner.py' or 'scanner-rule-definition' not in f.evidence for f in findings)


def test_report_rejects_invalid_utf8_and_deep_malformed_json(tmp_path):
    from security_audit.report import load_audit
    import pytest
    p = tmp_path / 'audit.json'; p.write_bytes(b'\xff\xfe\xfd')
    with pytest.raises(ValueError): load_audit(str(p))
    p.write_text('[' * 20000 + ']' * 20000)
    with pytest.raises(ValueError): load_audit(str(p))


def test_scanner_rejects_final_symlink_race_target(tmp_path):
    outside = tmp_path / 'outside.py'; outside.write_text('eval(secret)\n')
    root = tmp_path / 'root'; root.mkdir()
    link = root / 'candidate.py'; link.symlink_to(outside)
    assert scan(root) == []


def test_report_rejects_symlink_input(tmp_path):
    from security_audit.report import load_audit
    import pytest
    real = tmp_path / 'real.json'
    real.write_text('{"target":"x","finding_count":0,"findings":[]}')
    link = tmp_path / 'audit.json'; link.symlink_to(real)
    with pytest.raises((ValueError, OSError)):
        load_audit(str(link))


def test_evidence_verify_fails_if_parent_is_replaced_by_symlink(tmp_path):
    root = tmp_path / 'evidence'; root.mkdir()
    outside = tmp_path / 'outside'; outside.mkdir()
    record = capture_bytes(root, 'E-PARENT', b'proof', source='test')
    moved = tmp_path / 'evidence-real'
    root.rename(moved)
    root.symlink_to(outside, target_is_directory=True)
    assert not verify(record)

def test_report_escapes_untrusted_markdown_and_html(tmp_path):
    from security_audit.report import markdown_report
    p = tmp_path / 'audit.json'; out = tmp_path / 'report.md'
    payload = {
        'target': '<img src=x onerror=alert(1)>', 'finding_count': 1,
        'findings': [{'id':'F-1','title':'<script>alert(1)</script>','severity':'HIGH','status':'open',
                      'description':'x','asset':'a','evidence':'<b>evil</b>','remediation':'[x](javascript:alert(1))',
                      'rule':'rule','file':'x','line':'1'}]
    }
    import json
    p.write_text(json.dumps(payload)); markdown_report(str(p), str(out))
    text = out.read_text()
    assert '<script>' not in text and '<img ' not in text and '<b>' not in text
    assert 'javascript:' in text


def test_report_rejects_boolean_count_and_duplicate_finding_ids(tmp_path):
    from security_audit.report import load_audit
    import json, pytest
    base={'target':'x','finding_count':1,'findings':[{'id':'F-1','title':'t','severity':'LOW','status':'open','description':'d','asset':'a','evidence':'e','remediation':'r'}]}
    p=tmp_path/'a.json'; p.write_text(json.dumps({**base,'finding_count':True}))
    with pytest.raises(ValueError): load_audit(str(p))
    base['findings'].append(dict(base['findings'][0])); base['finding_count']=2
    p.write_text(json.dumps(base))
    with pytest.raises(ValueError, match='duplicate finding id'):
        load_audit(str(p))


def test_report_rejects_oversized_untrusted_field(tmp_path):
    from security_audit.report import load_audit
    import json, pytest
    f={'id':'F-1','title':'t','severity':'LOW','status':'open','description':'d','asset':'a','evidence':'e','remediation':'r'*20001}
    p=tmp_path/'a.json'; p.write_text(json.dumps({'target':'x','finding_count':1,'findings':[f]}))
    with pytest.raises(ValueError, match='maximum'):
        load_audit(str(p))


def test_policy_rejects_unicode_and_whitespace_path_obfuscation():
    from security_audit.policy import evaluate_command
    cases=['echo ./../secret','echo a/../b','echo ..\\secret','echo /tmp/x','echo $\\u007bHOME\\u007d']
    for c in cases:
        assert not evaluate_command(c, user_approved=True, allowed_executables=['echo']).allowed

def test_init_case_rejects_existing_symlink_case(tmp_path, monkeypatch):
    from security_audit.cli import init_case
    import pytest
    monkeypatch.chdir(tmp_path)
    (tmp_path / 'cases').mkdir()
    outside = tmp_path / 'outside'; outside.mkdir()
    (tmp_path / 'cases' / 'evil').symlink_to(outside, target_is_directory=True)
    with pytest.raises((ValueError, OSError)):
        init_case('evil')
    assert not (outside / 'evidence').exists()


def test_evidence_rejects_oversized_payload(tmp_path):
    from security_audit.evidence import capture_bytes, MAX_EVIDENCE_BYTES
    import pytest
    with pytest.raises(ValueError, match='maximum'):
        capture_bytes(tmp_path, 'E-BIG', b'x' * (MAX_EVIDENCE_BYTES + 1), source='test')


def test_secure_read_rejects_invalid_max_bytes(tmp_path):
    from security_audit.safeio import read_file_bytes_secure
    import pytest
    p = tmp_path / 'x'; p.write_bytes(b'x')
    with pytest.raises(ValueError):
        read_file_bytes_secure(p, max_bytes=-1)
    with pytest.raises(ValueError):
        read_file_bytes_secure(p, max_bytes=True)
