import http.server
import socketserver
import os
import sys

PORT = 5173
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

class SPASimpleHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        # Resolve requested file
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not path.endswith('/'):
            # Fallback to index.html for SPA routing
            self.path = '/index.html'
        return super().do_GET()

if __name__ == "__main__":
    os.chdir(WEB_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SPASimpleHTTPRequestHandler) as httpd:
        print(f"============================================================")
        print(f" HRGen PhleboTrack Universal PWA Desktop Server Running")
        print(f" Local URL: http://localhost:{PORT}")
        print(f" Web Root : {WEB_DIR}")
        print(f" AEO/SEO/GEO: Enabled with Schema.org & ISO 15189 Cold Chain")
        print(f"============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            sys.exit(0)
