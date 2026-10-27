from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import hashlib, json, os
from pathlib import Path
from .safeio import open_dir_secure, read_file_bytes_secure

MAX_EVIDENCE_BYTES = 10_000_000
MAX_SOURCE_LEN = 2_000
MAX_EVIDENCE_ID_LEN = 128


@dataclass(frozen=True)
class EvidenceRecord:
    evidence_id: str
    created_at: str
    source: str
    sha256: str
    bytes: int
    path: str


def _reject_symlink_components(path: Path) -> None:
    absolute = Path(os.path.abspath(path))
    current = Path(absolute.anchor)
    for part in absolute.parts[1:]:
        current = current / part
        if current.exists() and current.is_symlink():
            raise ValueError(f"path component must not be a symlink: {current}")


def _safe_root(root: Path) -> Path:
    root = Path(root)
    _reject_symlink_components(root)
    root.mkdir(parents=True, exist_ok=True)
    _reject_symlink_components(root)
    return Path(os.path.abspath(root))


def capture_bytes(root: Path, evidence_id: str, data: bytes, *, source: str) -> EvidenceRecord:
    if not isinstance(evidence_id, str) or not evidence_id or len(evidence_id) > MAX_EVIDENCE_ID_LEN or "/" in evidence_id or "\\" in evidence_id or evidence_id in {".", ".."}:
        raise ValueError("invalid evidence id")
    if not isinstance(source, str) or len(source) > MAX_SOURCE_LEN:
        raise ValueError("invalid evidence source")
    if not isinstance(data, bytes):
        raise TypeError("evidence data must be bytes")
    if len(data) > MAX_EVIDENCE_BYTES:
        raise ValueError("evidence exceeds maximum size")
    root = _safe_root(root)
    digest = hashlib.sha256(data).hexdigest()
    filename = f"{evidence_id}-{digest}.bin"

    if os.name == "nt":
        target = root / filename
        if target.exists() and target.is_symlink():
            raise ValueError("evidence destination must not be a symlink")
        if target.exists():
            if not verify(EvidenceRecord(evidence_id, "", source, digest, len(data), str(target))):
                raise ValueError("evidence destination already exists with different content")
        else:
            with open(target, "wb") as fh:
                fh.write(data)
                fh.flush()
                os.fsync(fh.fileno())

        record = EvidenceRecord(evidence_id, datetime.now(timezone.utc).isoformat(), source, digest, len(data), str(target))
        metadata = root / f"{evidence_id}.json"
        if metadata.exists() and metadata.is_symlink():
            raise ValueError("evidence metadata must not be a symlink")
        payload = (json.dumps(asdict(record), indent=2) + "\n").encode("utf-8")
        tmp = root / f".{evidence_id}.json.tmp-{os.getpid()}"
        with open(tmp, "wb") as fh:
            fh.write(payload)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, metadata)
        return record

    root_fd = open_dir_secure(root)
    try:
        try:
            fd = os.open(filename, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0), 0o600, dir_fd=root_fd)
        except FileExistsError:
            fd = None
            existing = root / filename
            if existing.is_symlink():
                raise ValueError("evidence destination must not be a symlink")
            if not verify(EvidenceRecord(evidence_id, "", source, digest, len(data), str(existing))):
                raise ValueError("evidence destination already exists with different content")
        if fd is not None:
            with os.fdopen(fd, "wb") as fh:
                fh.write(data); fh.flush(); os.fsync(fh.fileno())
        record = EvidenceRecord(evidence_id, datetime.now(timezone.utc).isoformat(), source, digest, len(data), str(root / filename))
        metadata = f"{evidence_id}.json"
        payload = (json.dumps(asdict(record), indent=2) + "\n").encode("utf-8")
        tmp = f".{metadata}.tmp-{os.getpid()}"
        try:
            mfd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0), 0o600, dir_fd=root_fd)
            with os.fdopen(mfd, "wb") as fh:
                fh.write(payload); fh.flush(); os.fsync(fh.fileno())
            os.replace(tmp, metadata, src_dir_fd=root_fd, dst_dir_fd=root_fd)
        finally:
            try: os.unlink(tmp, dir_fd=root_fd)
            except OSError: pass
        os.fsync(root_fd)
        return record
    finally:
        os.close(root_fd)


def verify(record: EvidenceRecord) -> bool:
    try:
        if not isinstance(record, EvidenceRecord):
            return False
        if not isinstance(record.bytes, int) or isinstance(record.bytes, bool) or record.bytes < 0 or record.bytes > MAX_EVIDENCE_BYTES:
            return False
        if not isinstance(record.sha256, str) or len(record.sha256) != 64 or any(c not in "0123456789abcdef" for c in record.sha256.lower()):
            return False
        path = Path(record.path)
        _reject_symlink_components(path.parent)
        data = read_file_bytes_secure(path, max_bytes=record.bytes)
        if len(data) != record.bytes:
            return False
        return hashlib.sha256(data).hexdigest() == record.sha256
    except (OSError, ValueError):
        return False
