with open('public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Auto-show settings view directly for visual preview screenshot
hook = """
<script>
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  S.token = 'demo-token';
  S.role = 'admin';
  S.tenantId = 'default';
  S.user = {displayName: 'Dr. Pathologist', username: 'admin'};
  setNav();
  show('settings');
});
</script>
"""

updated = text.replace('<head>', '<head>' + hook)
with open('public/index_studio.html', 'w', encoding='utf-8') as f:
    f.write(updated)
print("STUDIO_HTML_CREATED")
