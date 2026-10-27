import os
import hashlib
import zipfile
import json
from datetime import datetime

desktop = r'C:\Users\pc\Desktop'
master_audit_dir = os.path.join(desktop, 'HRGen_Diagnostic_Ecosystem', '06_ZIP_Vault_Audit')
os.makedirs(master_audit_dir, exist_ok=True)

zip_records = []
for root, dirs, files in os.walk(desktop):
    for f in files:
        if f.lower().endswith('.zip'):
            full_path = os.path.join(root, f)
            size = os.path.getsize(full_path)
            
            h = hashlib.sha256()
            with open(full_path, 'rb') as fp:
                while chunk := fp.read(65536):
                    h.update(chunk)
            sha256_val = h.hexdigest()
            
            try:
                with zipfile.ZipFile(full_path, 'r') as z:
                    count = len(z.namelist())
                    crc_ok = (z.testzip() is None)
            except Exception:
                count = 0
                crc_ok = False
                
            zip_records.append({
                'filename': f,
                'path': full_path,
                'size_bytes': size,
                'size_mb': round(size / (1024 * 1024), 2),
                'sha256': sha256_val,
                'file_count': count,
                'crc32_valid': crc_ok,
                'modified': datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
            })

# Save JSON ledger
json_path = os.path.join(master_audit_dir, 'ZIP_FORENSIC_AUDIT_LEDGER.json')
with open(json_path, 'w', encoding='utf-8') as jf:
    json.dump(zip_records, jf, indent=2)

# Save Markdown ledger
md_path = os.path.join(master_audit_dir, 'ZIP_FORENSIC_AUDIT_LEDGER.md')
with open(md_path, 'w', encoding='utf-8') as mf:
    mf.write('# HRGen Master Cryptographic ZIP Audit Ledger\n\n')
    mf.write(f'Generated: {datetime.utcnow().isoformat()} UTC\n\n')
    mf.write(f'Total ZIP Archives Audited: {len(zip_records)}\n\n')
    mf.write('Integrity Standard: SHA-256 Non-Repudiation + CRC32 Archive Validation\n\n')
    mf.write('| # | Archive File | Size (MB) | Files Count | CRC32 Integrity | SHA-256 Checksum |\n')
    mf.write('| :--- | :--- | :--- | :--- | :--- | :--- |\n')
    for idx, r in enumerate(zip_records, 1):
        status = 'PASS (CRC32 OK)' if r['crc32_valid'] else 'FAIL'
        mf.write(f"| {idx} | `{r['filename']}` | {r['size_mb']} MB | {r['file_count']} | {status} | `{r['sha256'][:24]}...` |\n")

print(f"ZIP Audit Ledger written: {len(zip_records)} records audited.")
