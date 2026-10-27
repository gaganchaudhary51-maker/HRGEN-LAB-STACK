from __future__ import annotations
from dataclasses import dataclass
import re
import shlex
from pathlib import Path
from typing import Sequence

@dataclass(frozen=True)
class ExecutionDecision:
    allowed: bool
    reason: str
    requires_user_approval: bool = True
    argv: tuple[str, ...] = ()

DANGEROUS = [
    (re.compile(r"(^|\s)rm\s+-rf\b", re.I), "recursive force delete"),
    (re.compile(r"(^|\s)(shutdown|reboot|poweroff)\b", re.I), "system power operation"),
    (re.compile(r"(^|\s)mkfs(?:\.|\s)", re.I), "filesystem formatting"),
    (re.compile(r"curl\b[^\n|]*\|\s*(bash|sh)\b", re.I), "download-and-execute"),
    (re.compile(r"wget\b[^\n|]*\|\s*(bash|sh)\b", re.I), "download-and-execute"),
]
SHELL_META = re.compile(r"[;&|<>`$(){}]|\x00")
INTERPRETERS = {"bash", "sh", "zsh", "fish", "cmd", "powershell", "pwsh"}
INDIRECT_EXECUTORS = {"env", "xargs", "find", "busybox", "sudo", "doas", "pkexec"}
CODE_EXEC_FLAGS = {"-c", "-e", "--eval", "-command", "-encodedcommand", "/c", "/k"}


def evaluate_command(command: str, *, user_approved: bool = False,
                     allowed_executables: Sequence[str] | None = None) -> ExecutionDecision:
    command = command.strip()
    if not command:
        return ExecutionDecision(False, "empty command")
    if SHELL_META.search(command) or "\\" in command:
        return ExecutionDecision(False, "shell operators/interpolation are not allowed")
    try:
        argv = tuple(shlex.split(command, posix=True))
    except ValueError as exc:
        return ExecutionDecision(False, f"invalid command syntax: {exc}")
    if not argv:
        return ExecutionDecision(False, "empty command")

    raw_executable = argv[0]
    # Execution must never accept a caller-supplied executable path. The
    # executor/allowlist should select the binary, not the command string.
    if "/" in raw_executable or "\\" in raw_executable or Path(raw_executable).is_absolute():
        return ExecutionDecision(False, "executable paths are not allowed", argv=argv)
    executable = Path(raw_executable).name.lower()
    if executable in INTERPRETERS:
        return ExecutionDecision(False, "shell/interpreter executables are not allowed", argv=argv)
    if executable in INDIRECT_EXECUTORS:
        return ExecutionDecision(False, "indirect execution/privilege-wrapper executables are not allowed", argv=argv)
    if any(part.lower() in CODE_EXEC_FLAGS for part in argv[1:]):
        return ExecutionDecision(False, "interpreter code-execution flags are not allowed", argv=argv)
    if any(Path(part).is_absolute() or part.startswith("/") or part.startswith("\\") or ".." in Path(part).parts for part in argv[1:]):
        return ExecutionDecision(False, "absolute paths and parent traversal are not allowed in arguments", argv=argv)
    if allowed_executables is not None:
        normalized = set()
        for item in allowed_executables:
            item = str(item)
            if "/" in item or "\\" in item or Path(item).is_absolute():
                return ExecutionDecision(False, "allowlist entries must be executable names", argv=argv)
            normalized.add(Path(item).name.lower())
        if executable not in normalized:
            return ExecutionDecision(False, f"executable not allowlisted: {executable}", argv=argv)
    for pattern, reason in DANGEROUS:
        if pattern.search(command) and not user_approved:
            return ExecutionDecision(False, f"blocked pending explicit user approval: {reason}", argv=argv)
    if not user_approved:
        return ExecutionDecision(False, "execution requires explicit user approval", argv=argv)
    return ExecutionDecision(True, "approved by user", argv=argv)
