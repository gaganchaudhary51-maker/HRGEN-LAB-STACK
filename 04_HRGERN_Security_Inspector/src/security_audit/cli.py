from __future__ import annotations
import argparse, json, os
from pathlib import Path
from .scanner import scan
from .safeio import atomic_write_bytes, open_dir_secure
from .release_gate import run_gate
from .dependency import inventory
from .risk import summarize
from .workflow import write_authorization, write_roe, write_remediation, write_retest
from .dashboard import generate
from .authz import authorize
from .prompt_corpus import get_corpus
from .chain import append_link
from .pdf_report import generate_pdf


def _safe_child(root: Path, name: str) -> Path:
    if not name or name in {".", ".."} or Path(name).is_absolute() or ".." in Path(name).parts or "/" in name or "\\" in name:
        raise ValueError("name must be a simple relative name")
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    if root.is_symlink():
        raise ValueError("case root must not be a symlink")
    return root / name


def init_case(name: str):
    cases_fd = open_dir_secure(Path("cases"), create=True)
    try:
        if not name or name in {".", ".."} or Path(name).is_absolute() or ".." in Path(name).parts or "/" in name or "\\" in name:
            raise ValueError("name must be a simple relative name")
        try:
            os.mkdir(name, 0o700, dir_fd=cases_fd)
        except FileExistsError:
            pass
        case_fd = open_dir_secure(Path("cases") / name)
        try:
            for child in ("evidence", "findings"):
                try:
                    os.mkdir(child, 0o700, dir_fd=case_fd)
                except FileExistsError:
                    child_fd = os.open(child, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=case_fd)
                    os.close(child_fd)
            scope = b"Authorized target and explicit testing scope required before active testing.\n"
            # Write relative to the already-open case descriptor, not a path that
            # can be swapped underneath us.
            fd = os.open("scope.txt", os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600, dir_fd=case_fd)
            try:
                os.write(fd, scope)
                os.fsync(fd)
            finally:
                os.close(fd)
        finally:
            os.close(case_fd)
    finally:
        os.close(cases_fd)
    print(f"Case initialized: {Path('cases') / name}")

def _reject_symlink_components(path: Path) -> None:
    absolute = Path(os.path.abspath(path))
    current = Path(absolute.anchor)
    for part in absolute.parts[1:]:
        current = current / part
        if current.exists() and current.is_symlink():
            raise ValueError(f"path component must not be a symlink: {current}")


def _safe_output(path: str) -> Path:
    out = Path(path)
    _reject_symlink_components(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    _reject_symlink_components(out)
    return out


def audit(path: str, out: str):
    target = Path(path).resolve()
    findings=scan(target)
    destination = _safe_output(out)
    payload={'target':str(target),'finding_count':len(findings),'findings':[f.__dict__ for f in findings]}
    atomic_write_bytes(destination.parent, destination.name, json.dumps(payload, indent=2).encode('utf-8'))
    print(f'Audit complete: {len(findings)} findings → {destination}')
    for f in findings: print(f'{f.id} [{f.severity}] {f.file}:{f.line} {f.rule}')


def main():
    ap=argparse.ArgumentParser(prog='security-audit')
    sub=ap.add_subparsers(dest='cmd',required=True)
    i=sub.add_parser('init'); i.add_argument('name')
    s=sub.add_parser('scan'); s.add_argument('path',default='.',nargs='?'); s.add_argument('-o','--output',default='audit.json')
    a=sub.add_parser('audit'); a.add_argument('path',default='.',nargs='?'); a.add_argument('-o','--output',default='audit.json')
    r=sub.add_parser('release-gate')
    d=sub.add_parser('dependencies'); d.add_argument('path',default='.',nargs='?')
    k=sub.add_parser('risk'); k.add_argument('audit_json')
    h=sub.add_parser('dashboard'); h.add_argument('audit_json'); h.add_argument('-o','--output',default='dashboard.html')
    au=sub.add_parser('authorization'); au.add_argument('output'); au.add_argument('assessment_id'); au.add_argument('authorized_by'); au.add_argument('target'); au.add_argument('--scope',action='append',default=[]); au.add_argument('--expires-at',required=True)
    roe=sub.add_parser('roe'); roe.add_argument('output'); roe.add_argument('assessment_id'); roe.add_argument('--rule',action='append',default=[]); roe.add_argument('--exclude',action='append',default=[]); roe.add_argument('--stop',action='append',default=[])
    rm=sub.add_parser('remediation'); rm.add_argument('output'); rm.add_argument('finding_id'); rm.add_argument('owner'); rm.add_argument('action'); rm.add_argument('--due-at',required=True)
    rt=sub.add_parser('retest'); rt.add_argument('output'); rt.add_argument('finding_id'); rt.add_argument('tester'); rt.add_argument('result',choices=['pass','fail','inconclusive']); rt.add_argument('evidence_id')
    az=sub.add_parser('authz'); az.add_argument('role'); az.add_argument('action'); az.add_argument('--approved',action='store_true')
    pc=sub.add_parser('prompt-corpus')
    ch=sub.add_parser('chain-link'); ch.add_argument('output'); ch.add_argument('link_id'); ch.add_argument('kind'); ch.add_argument('parent_id'); ch.add_argument('artifact_id'); ch.add_argument('artifact_file')
    pdf=sub.add_parser('pdf-report'); pdf.add_argument('audit_json'); pdf.add_argument('-o','--output',default='report.pdf')
    web=sub.add_parser('web'); web.add_argument('--host',default='127.0.0.1'); web.add_argument('--port',type=int,default=8787); web.add_argument('--db',default='data/lab.sqlite'); web.add_argument('--role',choices=['viewer','tester','verifier','manager']); web.add_argument('--actor'); web.add_argument('--authorization-ref'); web.add_argument('--token')
    args=ap.parse_args()
    if args.cmd=='init': init_case(args.name)
    elif args.cmd=='dependencies': print(json.dumps(inventory(Path(args.path).resolve()), indent=2))
    elif args.cmd=='risk':
        from .report import load_audit; print(json.dumps(summarize(load_audit(args.audit_json)['findings']), indent=2))
    elif args.cmd=='dashboard': print(f'Dashboard: {generate(args.audit_json,args.output)}')
    elif args.cmd=='authorization': print(f'Authorization: {write_authorization(args.output,args.assessment_id,args.authorized_by,args.target,args.scope,args.expires_at)}')
    elif args.cmd=='roe': print(f'ROE: {write_roe(args.output,args.assessment_id,args.rule,args.exclude,args.stop)}')
    elif args.cmd=='remediation': print(f'Remediation: {write_remediation(args.output,args.finding_id,args.owner,args.action,args.due_at)}')
    elif args.cmd=='retest': print(f'Retest: {write_retest(args.output,args.finding_id,args.tester,args.result,args.evidence_id)}')
    elif args.cmd=='authz': print(json.dumps(authorize(args.role,args.action,approved=args.approved).__dict__, indent=2))
    elif args.cmd=='prompt-corpus': print(json.dumps(get_corpus(), indent=2))
    elif args.cmd=='chain-link': print(append_link(args.output,args.link_id,args.kind,args.parent_id,args.artifact_id,Path(args.artifact_file).read_bytes()))
    elif args.cmd=='pdf-report': print(f'PDF: {generate_pdf(args.audit_json,args.output)}')
    elif args.cmd=='web':
        from .webapp import serve; serve(args.host,args.port,args.db,role=args.role,actor=args.actor,authorization_ref=args.authorization_ref,token=args.token)
    elif args.cmd=='release-gate':
        result=run_gate(Path('.')); print(json.dumps(result, indent=2)); raise SystemExit(0 if result['production_release_authorized'] else 2)
    else: audit(args.path,args.output)
if __name__=='__main__': main()
