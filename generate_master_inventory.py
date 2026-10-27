import os
import hashlib
from datetime import datetime

desktop = r'C:\Users\pc\Desktop'
master_dir = os.path.join(desktop, 'HRGen_Diagnostic_Ecosystem')

entries = []
for item in sorted(os.listdir(desktop)):
    full = os.path.join(desktop, item)
    is_dir = os.path.isdir(full)
    size = os.path.getsize(full) if not is_dir else 0
    mtime = datetime.fromtimestamp(os.path.getmtime(full)).strftime('%Y-%m-%d %H:%M')
    
    sha256 = '-'
    if not is_dir and size < 50 * 1024 * 1024:
        try:
            h = hashlib.sha256()
            with open(full, 'rb') as f:
                while chunk := f.read(65536):
                    h.update(chunk)
            sha256 = h.hexdigest()[:16] + '...'
        except Exception:
            sha256 = 'ERROR'
            
    cat = 'Folder / Workspace' if is_dir else ('Native Shortcut' if item.endswith('.lnk') else ('Archive' if item.endswith('.zip') else 'File'))
    entries.append({
        'name': item,
        'type': cat,
        'size_kb': round(size / 1024, 1) if not is_dir else '-',
        'modified': mtime,
        'sha256': sha256
    })

ledger_md = os.path.join(master_dir, 'MASTER_INVENTORY_LEDGER.md')
with open(ledger_md, 'w', encoding='utf-8') as f:
    f.write('# HRGen Master Desktop Inventory Ledger\n\n')
    f.write(f'Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC\n')
    f.write('Zero Data Loss Standard: All archives, documentation, and source code preserved.\n\n')
    f.write('| # | Asset Name | Category | Size | Modified Date | SHA-256 Checksum |\n')
    f.write('|---|---|---|---|---|---|\n')
    for i, e in enumerate(entries, 1):
        f.write(f"| {i} | `{e['name']}` | {e['type']} | {e['size_kb']} | {e['modified']} | `{e['sha256']}` |\n")

print(f'Master Inventory written to {ledger_md} with {len(entries)} items.')
