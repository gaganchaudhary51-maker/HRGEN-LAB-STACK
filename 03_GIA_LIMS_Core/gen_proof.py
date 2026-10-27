with open('public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace boot() call to auto-render settings directly in the mock preview
mock_js = """
<script>
// Mock API for visual verification
window.api = async function(path, opt={}, meta={}) {
  if (path.startsWith('/api/admin/policy')) {
    return {
      version: 1, mode: 'STANDARD',
      policy: {
        workflow: { enabled: true, skipAllowed: [] },
        barcode: { enabled: true, required: false, format: 'CODE128', prefix: 'LAB' },
        labels: { enabled: true, widthMm: 50, heightMm: 25, showPatient: true },
        print: { report: 'A4', label: 'THERMAL_50X25', autoPrint: false }
      }
    };
  }
  if (path.startsWith('/api/branding')) {
    return {
      branding: {
        name: 'Apex Diagnostic & Reference Pathology Laboratory',
        address: 'Plot 42, Health City, Sector 12, New Delhi - 110025',
        phone: '+91 98765 43210',
        email: 'reports@apexdiagnostics.in',
        nablReg: 'MC-2491 (ISO 15189:2022 Validated)',
        domain: 'https://apexdiagnostics.in',
        pathologistName: 'Dr. Vikram Malhotra',
        pathologistQualification: 'MD, DNB (Pathology), Senior Consultant',
        pathologistRegistration: 'DMC / MCI-64821',
        signatureName: 'Dr. V. Malhotra',
        printMode: 'FULL_LETTERHEAD',
        headerMarginMm: 0,
        footerMarginMm: 0,
        primary: '#4f46e5',
        accent: '#e11d48'
      }
    };
  }
  if (path.startsWith('/api/entitlements')) {
    return { plan: 'ENTERPRISE', features: [], limits: { seats: 100, branches: 10, reports: 10000 } };
  }
  return {};
};

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  S.token = 'mock-token';
  S.role = 'admin';
  S.user = { displayName: 'Dr. V. Malhotra', username: 'admin' };
  setNav();
  show('settings');
});
</script>
"""

updated = text.replace('</head>', mock_js + '</head>')
with open('public/letterhead_studio_proof.html', 'w', encoding='utf-8') as f:
    f.write(updated)
print("LETTERHEAD_STUDIO_PROOF_HTML_CREATED")
