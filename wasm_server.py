import http.server
import socketserver

PORT = 8000

handler = http.server.SimpleHTTPRequestHandler
handler.extensions_map.update({
    '.wasm': 'application/wasm',
})

class WasmHandler(handler):
    def end_headers(self):
        
        # https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")

        # https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")

        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), WasmHandler) as httpd:
    print(f"Serving WASM at http://127.0.0.1:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass