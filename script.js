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
    fetch("./main.wasm"),
    {
      env: { wasm_log }, // this is kinda like a forward declaration
    },
  );
  const wasm = wasm_compiled.instance;
  const we = wasm.exports;

  console.log("wasm.exports: ", we);

  // WASM memory is a linearly stored series of raw bytes
  // `we.memory.buffer` is an ArrayBuffer, it stores the WASM memory.
  // NOTE: ArrayBuffer's elements CAN'T BE ACCESSED directly, creating a typed view is necessary to access the elements.

  // We need to choose what kind of view to create. Correct analogue to ArrayBuffer's internal representation would be a u8_view.
  // But if we create a i32_view instead:
  // we can directly index i32 values from our WASM binary without needing to do manual i32 integer construction from raw bytes.

  // `Int32Array(we.memory.buffer)` creates an i32_view over the underlying ArrayBuffer, treating ArrayBuffer's bytes as i32's.
  const i32_view = new Int32Array(we.memory.buffer);
  const u32_view = new Uint32Array(we.memory.buffer);
  const u8_view = new Uint8Array(we.memory.buffer); // for cstrings

  // `we.memory.buffer` is the ArrayBuffer containing WASM objects.
  // `we.<exported_object>` is the INDEX to our ArrayBuffer, ArrayBuffer[we.<exported_object>] === <exported_object>.

  // FULL EXAMPLE:
  // in WASM binary, we have a global variable `int32_t var = 123;`.
  // In Javascript, from the compiled WASM instance, we get access to `we.var`, which is an INDEX to ArrayBuffer.
  // INDEX EXAMPLE: (we divide by 4 to map our ArrayBuffer index, to a i32_view index)
  // ArrayBuffer[4],     ArrayBuffer[5],       ArrayBuffer[6],       ArrayBuffer[7]       corresponds to i32_view[1].
  // ArrayBuffer[INDEX], ArrayBuffer[INDEX+1], ArrayBuffer[INDEX+2], ArrayBuffer[INDEX+3] corresponds to i32_view[INDEX/4].
  // We create an i32_view over the ArrayBuffer and get `i32_view[we.var / 4] === 123`.

  // in the main.wasm module, the `screen` struct's first element (idx=0) is the screen width
  // second element is screen height
  // and third element is uint8 array of pixels of size width*height*4 (4 for RGBA)

  function read_screen_from_wasm() {
    const screen_width = we.screen_get_width();
    const screen_height = we.screen_get_height();
    const screen_pixels = new Uint8ClampedArray(we.memory.buffer, we.screen_get_pixels(), screen_width * screen_height * 4);
    return { screen_width, screen_height, screen_pixels };
  }
  const { screen_width, screen_height, screen_pixels } = read_screen_from_wasm(we.screen);
  console.log(`screen_width: ${screen_width}, screen_height: ${screen_height}`);

  canvas_resize(screen_width, screen_height, canvas);

  const imageData = new ImageData(screen_pixels, screen_width, screen_height);

  // https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/requestAnimationFrame#parameters
  // https://github.com/tsoding/snake-c-wasm/blob/master/wasm_main.js#L77
  // https://github.com/tsoding/snake-c-wasm/blob/master/wasm_main.js#L102

  const utf8_decoder = new TextDecoder("utf-8");

  function wasm_log(c_str) {
    const str_start = c_str;

    let str_end = str_start;
    while (u8_view[str_end] !== 0) { // checking for C's null terminated string's end
      str_end++;
    }
    const message = utf8_decoder.decode(u8_view.slice(str_start, str_end));

    console.log(message);
  }

  let frame = 0;
  function loop() {
    we.update(frame++); // update the screen_pixels data which lives in we.memory.buffer

    ctx.putImageData(imageData, 0, 0); // imageData is a view on screen_pixels which is in we.memory.buffer

    requestAnimationFrame(loop);
  }
  loop();
}

init();
