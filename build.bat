clang --target=wasm32 ^
  -O2 ^
  -ffreestanding -nostdlib ^
  -Wl,--no-entry ^
  -Wl,--export-all ^
  -Wl,--allow-undefined ^
  -o main.wasm main.c
@echo off
