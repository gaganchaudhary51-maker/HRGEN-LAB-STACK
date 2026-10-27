from __future__ import annotations
import json
import html
import re
from pathlib import Path
from .safeio import atomic_write_bytes, read_file_bytes_secure

MAX_AUDIT_BYTES = 5_000_000
REQUIRED_FINDING_KEYS = {"id", "title", "severity", "status", "description", "asset", "evidence", "remediation"}
SEVERITIES = {"INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"}
STATUSES = {"open", "accepted", "fixed", "retested"}
_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")

def _safe_text(value: str, *, max_len: int = 20_000) -> str:
    if not isinstance(value, str):
        raise ValueError("text field must be a string")
    if len(value) > max_len:
        raise ValueError("text field exceeds maximum size")
    return value

def _md(value: str) -> str:
    # Report content is untrusted audit input. Escape HTML so report viewers
    # cannot turn finding text into active markup/script.
    return html.escape(value, quote=False).replace('`', '\\`').replace('[', '\\[').replace(']', '\\]').replace('(', '\\(').replace(')', '\\)').replace('*', '\\*').replace('_', '\\_').replace('#', '\\#').replace('!', '\\!')


def _no_duplicates(pairs):
    out = {}
    for key, value in pairs:
        if key in out:
            raise ValueError(f"duplicate JSON key: {key}")
        out[key] = value
    return out


def _reject_constants(value):
    raise ValueError(f"non-standard JSON constant: {value}")


def load_audit(path: str) -> dict:
    raw = read_file_bytes_secure(Path(path), max_bytes=MAX_AUDIT_BYTES)
    if len(raw) > MAX_AUDIT_BYTES:
        raise ValueError("audit input exceeds maximum size")
    try:
        text = raw.decode("utf-8")
        data = json.loads(text, object_pairs_hook=_no_duplicates, parse_constant=_reject_constants)
    except (UnicodeError, json.JSONDecodeError, RecursionError) as exc:
        raise ValueError(f"invalid audit JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("audit payload must be a JSON object")
    if not isinstance(data.get("target"), str) or not data["target"]:
        raise ValueError("audit target must be a non-empty string")
    findings = data.get("findings")
    if not isinstance(findings, list):
        raise ValueError("findings must be an array")
    if len(findings) > 100_000:
        raise ValueError("too many findings")
    if not isinstance(data.get("finding_count"), int) or isinstance(data.get("finding_count"), bool):
        raise ValueError("finding_count must be an integer")
    if data.get("finding_count") != len(findings):
        raise ValueError("finding_count does not match findings length")
    seen_ids = set()
    for finding in findings:
        if not isinstance(finding, dict) or not REQUIRED_FINDING_KEYS.issubset(finding):
            raise ValueError("finding does not satisfy required fields")
        if finding["severity"] not in SEVERITIES or finding["status"] not in STATUSES:
            raise ValueError("invalid finding severity/status")
        if not all(isinstance(finding[k], str) for k in REQUIRED_FINDING_KEYS):
            raise ValueError("finding fields must be strings")
        for key in REQUIRED_FINDING_KEYS:
            _safe_text(finding[key])
        if not _ID.fullmatch(finding["id"]):
            raise ValueError("invalid finding id")
        if finding["id"] in seen_ids:
            raise ValueError("duplicate finding id")
        seen_ids.add(finding["id"])
        if finding.get("rule") is not None:
            _safe_text(finding.get("rule"), max_len=1000)
    return data


def markdown_report(audit_json: str, output: str):
    data = load_audit(audit_json)
    _safe_text(data['target'], max_len=2000)
    lines = ['# Security Audit Report', '', f"**Target:** `{_md(data['target'])}`", f"**Findings:** {data['finding_count']}", '']
    if not data['findings']:
        lines += ['## Verdict', 'STATIC CHECK PASS — no findings were produced by the configured static rules. This is not a claim of complete security.']
    else:
        lines += ['## Findings', '']
        for f in data['findings']:
            lines += [f"### {_md(f['id'])} — {_md(f['severity'])}", f"- **Rule:** {_md(f.get('rule', ''))}", f"- **Location:** `{_md(f.get('file', ''))}:{_md(str(f.get('line', '')))}`", f"- **Evidence:** `{_md(f['evidence'])}`", f"- **Recommendation:** {_md(f['remediation'])}", '']
        lines += ['## Verdict', 'FAIL — findings require human review and remediation before a security claim is made.']
    atomic_write_bytes(Path(output).parent, Path(output).name, '\n'.join(lines).encode('utf-8'))
