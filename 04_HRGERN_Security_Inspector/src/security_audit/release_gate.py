from __future__ import annotations
import json, os, subprocess, sys
from pathlib import Path

REQUIRED = ("human_cross_audit", "production_rehearsal", "release_signoff")

def run_gate(root: Path) -> dict:
    root = Path(root).resolve()
    tests = subprocess.run([sys.executable, "-m", "pytest", "-q"], cwd=root, text=True, capture_output=True)
    compile_run = subprocess.run([sys.executable, "-m", "compileall", "-q", "src"], cwd=root, text=True, capture_output=True)
    attest = {k: os.environ.get(k, "").strip().lower() in {"1", "true", "yes", "pass"} for k in REQUIRED}
    result = {
        "automated_tests": tests.returncode == 0,
        "python_compile": compile_run.returncode == 0,
        "external_gates": attest,
        "production_release_authorized": all(attest.values()) and tests.returncode == 0 and compile_run.returncode == 0,
        "vulnerability_free": False,
        "note": "No automated process can establish vulnerability-free status. Human cross-audit, production rehearsal and release sign-off are explicit external gates."
    }
    return result

def main() -> int:
    result = run_gate(Path(__file__).resolve().parents[2])
    print(json.dumps(result, indent=2))
    return 0 if result["production_release_authorized"] else 2

if __name__ == "__main__":
    raise SystemExit(main())
