import os
import sys
import threading
import time
import http.server
import socketserver
import webview

PORT = 5174
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

class SPASimpleHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not path.endswith('/'):
            self.path = '/index.html'
        return super().do_GET()

def start_server():
    os.chdir(WEB_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), SPASimpleHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except Exception:
        pass

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    try:
        window = webview.create_window(
            title="Dr. Shastri Diagnostics (DSD Care) • Patient Booking & Health Packages",
            url=f"http://localhost:{PORT}",
            width=1366,
            height=880,
            resizable=True,
            min_size=(1024, 700),
            background_color="#031A33"
        )
        webview.start(gui="edgechromium", debug=False)
    except Exception:
        import subprocess
        edge_paths = [
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
        ]
        edge_exe = next((p for p in edge_paths if os.path.exists(p)), None)
        if edge_exe:
            subprocess.run([edge_exe, f"--app=http://localhost:{PORT}", "--window-size=1366,880", "--app-id=dsd-care-portal"])
        else:
            import webbrowser
            webbrowser.open(f"http://localhost:{PORT}")
