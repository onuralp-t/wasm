"use strict";

function canvas_resize(width, height, canvas) {
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.getContext("2d").scale(width, height);
}

async function init() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const wasm_compiled = await WebAssembly.instantiateStreaming(
    fetch("main.wasm"),
    {
      env: { wasm_log }, // this is kinda like a forward declaration
    },
  );
  const wasm = wasm_compiled.instance;
  const wasme = wasm.exports;

  console.log("WASM.EXPORTS: ", wasme);

  // WASM memory is a linearly stored series of raw bytes
  // `wasm.exports.memory.buffer` is an ArrayBuffer, it stores the WASM memory.
  // NOTE: ArrayBuffer's elements CAN'T BE ACCESSED directly, creating a typed view is necessary to access the elements.

  // We need to choose what kind of view to create. Correct analogue to ArrayBuffer's internal representation would be a u8_view.
  // But if we create a i32_view instead:
  // we can directly index i32 values from our WASM binary without needing to do manual i32 integer construction from raw bytes.

  // `Int32Array(wasm.exports.memory.buffer)` creates an i32_view over the underlying ArrayBuffer, treating ArrayBuffer's bytes as i32's.
  const i32_view = new Int32Array(wasm.exports.memory.buffer);
  const u8_view = new Uint8Array(wasm.exports.memory.buffer); // for cstrings

  // `wasm.exports.memory.buffer` is the ArrayBuffer containing WASM objects.
  // `wasm.exports.<exported_object>` is the INDEX to our ArrayBuffer, ArrayBuffer[wasm.exports.<exported_object>] === <exported_object>.

  // FULL EXAMPLE:
  // in WASM binary, we have a global variable `int32_t var = 123;`.
  // In Javascript, from the compiled WASM instance, we get access to `wasm.exports.var`, which is an INDEX to ArrayBuffer.
  // INDEX EXAMPLE: (we divide by 4 to map our ArrayBuffer index, to a i32_view index)
  // ArrayBuffer[4],     ArrayBuffer[5],       ArrayBuffer[6],       ArrayBuffer[7]       corresponds to i32_view[1].
  // ArrayBuffer[INDEX], ArrayBuffer[INDEX+1], ArrayBuffer[INDEX+2], ArrayBuffer[INDEX+3] corresponds to i32_view[INDEX/4].
  // We create an i32_view over the ArrayBuffer and get `i32_view[wasm.exports.var / 4] === 123`.

  // For a WASM object `int32_t obj = 4321;`:
  // This helper implements C-style-ish WASM object access API, using the INDEX `wasm.exports.obj` we get from the compiled WASM instance.
  // `wasm_object(wasm.exports.obj, i)` evaluates to the equivalent of `*(&obj + i)`
  // If obj is an integer, do `wasm_object(wasm.exports.obj, 0)`.
  // If obj is a struct or array, do `wasm_object(wasm.exports.obj, i)` to get ith element.

  function wasm_object(wasm_exports_obj, idx) {
    // @CAPTURES i32_view
    return i32_view[(wasm_exports_obj + idx * 4) >> 2];
  }

  const utf8_decoder = new TextDecoder("utf-8");

  function wasm_log(c_str) {
    // @CAPTURES u8_view
    const str_start = c_str;

    let str_end = str_start;
    while (u8_view[str_end] !== 0) {
      str_end++;
    }
    const message = utf8_decoder.decode(u8_view.slice(str_start, str_end));

    console.log(message);
  }

  console.log("w_WINDOW_size[0]", wasm_object(wasme.w_WINDOW_size, 0));
  const w_WINDOW_size = wasm_object(wasme.w_WINDOW_size, 0);

  for (let i = 0; i < w_WINDOW_size; ++i) {
    console.log(`LOOP: W_WINDOW[${i}]`, wasm_object(wasme.w_WINDOW, i));
  }

  const width = wasm_object(wasme.w_WINDOW, 0);
  const height = wasm_object(wasme.w_WINDOW, 1);
  canvas_resize(width, height, canvas);

  const js_buffer = new Uint8ClampedArray(
    wasme.memory.buffer,
    wasme.w_RGBA,
    width * height * 4,
  );
  const imageData = new ImageData(js_buffer, width, height);

  // https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/requestAnimationFrame#parameters
  // https://github.com/tsoding/snake-c-wasm/blob/master/wasm_main.js#L77
  // https://github.com/tsoding/snake-c-wasm/blob/master/wasm_main.js#L102

  let frame = 0;
  function loop() {
    wasm.exports.update(frame++);

    ctx.putImageData(imageData, 0, 0);

    requestAnimationFrame(loop);
  }
  loop();
}

init();
