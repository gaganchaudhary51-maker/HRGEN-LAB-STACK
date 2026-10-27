with open('public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Add preview helper if ?preview=true
hook = """
<script>
if (location.search.includes('preview')) {
  sessionStorage.setItem('gia_token', 'demo-token');
  sessionStorage.setItem('gia_role', 'admin');
  sessionStorage.setItem('gia_tenant', 'default');
  sessionStorage.setItem('gia_user', JSON.stringify({displayName: 'Dr. Pathologist', username: 'admin'}));
}
</script>
"""

updated = text.replace('<head>', '<head>' + hook)
with open('public/index_preview.html', 'w', encoding='utf-8') as f:
    f.write(updated)
print("INDEX_PREVIEW_READY")
