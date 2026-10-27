from __future__ import annotations
import os
from pathlib import Path


def _secure_flags(*, directory: bool = False) -> int:
    """Return fail-closed POSIX flags required for race-resistant path walking."""
    if os.name == "nt":
        return os.O_RDONLY | getattr(os, "O_BINARY", 0)
    if not hasattr(os, "O_NOFOLLOW") or (directory and not hasattr(os, "O_DIRECTORY")):
        raise OSError("secure descriptor-relative I/O requires POSIX O_NOFOLLOW/O_DIRECTORY")
    flags = os.O_RDONLY | os.O_NOFOLLOW
    if directory:
        flags |= os.O_DIRECTORY
    return flags


def _reject_symlink_components(path: Path) -> None:
    absolute = Path(os.path.abspath(path))
    current = Path(absolute.anchor)
    for part in absolute.parts[1:]:
        current /= part
        if current.exists() and current.is_symlink():
            raise ValueError(f"path component must not be a symlink: {current}")


def open_dir_secure(path: Path, *, create: bool = False) -> int:
    path = Path(path)
    if create:
        path.mkdir(parents=True, exist_ok=True)
    _reject_symlink_components(path)
    absolute = Path(os.path.abspath(path))

    if os.name == "nt":
        if not absolute.is_dir():
            raise NotADirectoryError(f"not a directory: {absolute}")
        return -1

    flags = _secure_flags(directory=True)
    fd = os.open(absolute.anchor, flags)
    try:
        for part in absolute.parts[1:]:
            if part in {"", absolute.anchor}:
                continue
            next_fd = os.open(part, flags, dir_fd=fd)
            os.close(fd)
            fd = next_fd
        return fd
    except Exception:
        os.close(fd)
        raise


def atomic_write_bytes(root: Path, filename: str, data: bytes, *, mode: int = 0o600) -> Path:
    if not filename or filename in {".", ".."} or "/" in filename or "\\" in filename:
        raise ValueError("filename must be a simple name")
    if not isinstance(data, bytes):
        raise TypeError("data must be bytes")
    root = Path(root)
    _reject_symlink_components(root)

    if os.name == "nt":
        root.mkdir(parents=True, exist_ok=True)
        target = root / filename
        if target.exists() and target.is_symlink():
            raise ValueError(f"target must not be a symlink: {target}")
        tmp = root / f".{filename}.tmp-{os.getpid()}"
        with open(tmp, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, target)
        return target

    root_fd = open_dir_secure(root, create=True)
    tmp = f".{filename}.tmp-{os.getpid()}"
    try:
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, mode, dir_fd=root_fd)
        try:
            with os.fdopen(fd, "wb") as fh:
                fh.write(data)
                fh.flush()
                os.fsync(fh.fileno())
        except Exception:
            try:
                os.unlink(tmp, dir_fd=root_fd)
            except OSError:
                pass
            raise
        os.replace(tmp, filename, src_dir_fd=root_fd, dst_dir_fd=root_fd)
        os.fsync(root_fd)
        return Path(root) / filename
    finally:
        os.close(root_fd)


def read_file_bytes_secure(path: Path, *, max_bytes: int | None = None) -> bytes:
    """Read one file with descriptor-relative, no-symlink traversal."""
    path = Path(path)
    if not path.name or path.name in {".", ".."} or "/" in path.name or "\\" in path.name:
        raise ValueError("path must name a single file")
    if max_bytes is not None and (not isinstance(max_bytes, int) or isinstance(max_bytes, bool) or max_bytes < 0):
        raise ValueError("max_bytes must be a non-negative integer")

    _reject_symlink_components(path.parent)
    if path.exists() and path.is_symlink():
        raise ValueError(f"file must not be a symlink: {path}")

    if os.name == "nt":
        st = path.stat()
        if st.st_size < 0 or (max_bytes is not None and st.st_size > max_bytes):
            raise ValueError("file exceeds maximum size")
        with open(path, "rb") as f:
            data = f.read()
        return data

    parent_fd = open_dir_secure(path.parent)
    try:
        fd = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW, dir_fd=parent_fd)
        try:
            st = os.fstat(fd)
            if st.st_size < 0 or (max_bytes is not None and st.st_size > max_bytes):
                raise ValueError("file exceeds maximum size")
            chunks = []
            remaining = st.st_size
            while remaining:
                chunk = os.read(fd, min(1024 * 1024, remaining))
                if not chunk:
                    break
                chunks.append(chunk)
                remaining -= len(chunk)
            data = b"".join(chunks)
            if len(data) != st.st_size:
                raise OSError("file changed during secure read")
            return data
        finally:
            os.close(fd)
    finally:
        os.close(parent_fd)
