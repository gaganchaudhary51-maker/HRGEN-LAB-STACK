from security_audit.scanner import scan

def test_detects_shell_true(tmp_path):
    (tmp_path/'app.py').write_text("import subprocess\nsubprocess.run(user_cmd, shell=True)\n")
    fs=scan(tmp_path)
    assert any(f.rule=='shell execution' and f.severity=='HIGH' for f in fs)

def test_detects_secret(tmp_path):
    (tmp_path/'config.py').write_text("API_KEY = 'THIS_IS_A_FAKE_SECRET_12345'\n")
    fs=scan(tmp_path)
    assert any(f.rule=='hard-coded secret-like value' for f in fs)

def test_clean_code(tmp_path):
    (tmp_path/'safe.py').write_text("print('hello')\n")
    assert scan(tmp_path)==[]


def test_execution_requires_explicit_approval():
    from security_audit.policy import evaluate_command
    assert evaluate_command("echo hello").allowed is False
    assert evaluate_command("echo hello", user_approved=True).allowed is True

def test_dangerous_command_blocked_without_approval():
    from security_audit.policy import evaluate_command
    decision = evaluate_command("rm -rf ./test")
    assert decision.allowed is False
    assert "approval" in decision.reason
