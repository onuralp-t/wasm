# wasm
Demonstration of WASM fundamentals through a simple C program compiled to WASM using Clang, and loaded into the website using a simple `script.js` glue code.

# Usage
## Build WASM
You need to have clang in path.
```sh
build.bat
```
## Serve WASM-enabled HTTP server
You need to have `uv` in path. (Replace `uv run` with `python` if that's to your preference.)
```sh
uv run wasm_server.py 
# open http://127.0.0.1:8000/
```
