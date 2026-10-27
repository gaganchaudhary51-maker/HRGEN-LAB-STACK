from __future__ import annotations
from pathlib import Path
from urllib.parse import urlparse

def path_in_scope(candidate: Path, root: Path) -> bool:
    root = root.resolve()
    candidate = candidate.resolve(strict=False)
    try:
        candidate.relative_to(root)
        return True
    except ValueError:
        return False

def url_in_scope(url: str, allowed: set[str]) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            return False
        host = parsed.hostname.lower().rstrip(".")
        effective_port = parsed.port or (443 if parsed.scheme == "https" else 80)
        return f"{parsed.scheme}://{host}:{effective_port}" in allowed
    except ValueError:
        return False
