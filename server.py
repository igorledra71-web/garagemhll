import http.server
import socketserver
import time
import os

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate, private')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT')
        self.send_header('Surrogate-Control', 'no-store')
        self.send_header('Vary', '*')
        super().end_headers()

    def serve_app(self):
        ts = str(int(time.time()))
        with open('index.html', 'r', encoding='utf-8') as f:
            html = f.read()
        html = html.replace('styles.css?v=3', f'styles.css?t={ts}')
        html = html.replace('app.js"', f'app.js?t={ts}"')
        html = html.replace('logo-lavacao-alemao.png"', f'logo-lavacao-alemao.png?t={ts}"')
        content = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        if self.path == '/' or self.path.startswith('/index') or self.path.startswith('/?') or self.path.startswith('/app'):
            self.serve_app()
        else:
            super().do_GET()

socketserver.TCPServer.allow_reuse_address = True
PORT = 5000
with socketserver.TCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
    print(f"Serving Lavacao do Alemao on port {PORT}")
    httpd.serve_forever()
