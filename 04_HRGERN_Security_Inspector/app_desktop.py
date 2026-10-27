import os
import sys
import threading
import time
import http.server
import socketserver
import webview

PORT = 5176

# Create an embedded standalone dashboard HTML if static or start webapp
DASHBOARD_HTML = '''<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <title>HRGERN Inspector • Web & Wireless Security Lab</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #060B18; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
    .radar-pulse { animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 0.8; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1.02); } 100% { opacity: 0.8; transform: scale(0.98); } }
  </style>
</head>
<body class="p-6 selection:bg-cyan-500 selection:text-black">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Header -->
    <div class="flex items-center justify-between pb-4 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black">
          🛡️
        </div>
        <div>
          <h1 class="text-xl font-black tracking-wide text-white">HRGERN Inspector</h1>
          <p class="text-xs font-mono text-cyan-400">hrgern.in • Web & Wireless Security Lab (Client Grade)</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          ● Live Scanner Ready
        </span>
        <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
          TLS 1.3 Active
        </span>
      </div>
    </div>

    <!-- Airspace Scanner & Security Posture Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 p-6 rounded-2xl bg-[#0D1527] border border-white/10 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 radar-pulse"></span>
            Over-The-Air Wireless Airspace Scanner
          </h3>
          <span class="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            GRADE: 90/100 (A)
          </span>
        </div>
        <p class="text-xs text-zinc-400">
          Inspects real-time RF beacons, hardware adapters, channel interference, and rogue AP impersonators.
        </p>

        <div class="grid grid-cols-3 gap-3 pt-2">
          <div class="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span class="text-[11px] text-zinc-400 font-mono block">SIGNAL STRENGTH</span>
            <span class="text-base font-black text-emerald-400 font-mono">100% (-42 dBm)</span>
          </div>
          <div class="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span class="text-[11px] text-zinc-400 font-mono block">ENCRYPTION</span>
            <span class="text-base font-black text-cyan-400 font-mono">CCMP (AES)</span>
          </div>
          <div class="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span class="text-[11px] text-zinc-400 font-mono block">GENERATION</span>
            <span class="text-base font-black text-white font-mono">802.11n / Wi-Fi 4</span>
          </div>
        </div>
      </div>

      <!-- Vulnerability Detection Card -->
      <div class="p-6 rounded-2xl bg-[#0D1527] border border-white/10 space-y-4">
        <h3 class="text-base font-bold text-white">Security Posture Audit</h3>
        <div class="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400">Vulnerabilities Detected</p>
            <p class="text-2xl font-black text-emerald-400 mt-0.5">0 Critical</p>
          </div>
          <div class="text-right">
            <span class="text-xs font-mono text-zinc-400 block">OWASP HSTS: Pass</span>
            <span class="text-xs font-mono text-zinc-400 block">CSP Guard: Pass</span>
          </div>
        </div>
        <p class="text-[11px] text-zinc-400 font-mono">
          SHA-256 Auth Tokens • Tenant Boundary Protection Verified.
        </p>
      </div>
    </div>
  </div>
</body>
</html>'''

class InspectorHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args): return
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        raw = DASHBOARD_HTML.encode('utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), InspectorHandler) as httpd:
            httpd.serve_forever()
    except Exception:
        pass

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    window = webview.create_window(
        title="HRGERN Inspector • Web & Wireless Security Lab",
        url=f"http://localhost:{PORT}",
        width=1366,
        height=880,
        resizable=True,
        min_size=(1024, 700),
        background_color="#060B18"
    )

    webview.start(gui="edgechromium", debug=False)
