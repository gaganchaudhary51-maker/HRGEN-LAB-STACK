import os
import sys
import threading
import time
import http.server
import socketserver
import webview

PORT = 5173
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

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
    # Start internal server in daemon thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    # Launch 100% Native Desktop Window (Zero Browser UI, Pure Win32/WPF App)
    window = webview.create_window(
        title="HRGen PhleboTrack • Universal Diagnostic Workforce Platform",
        url=f"http://localhost:{PORT}",
        width=1366,
        height=880,
        resizable=True,
        min_size=(1024, 700),
        background_color="#080B11"
    )

    webview.start(gui="edgechromium", debug=False)
