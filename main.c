#include <stdint.h>
#define WIDTH 800u
#define HEIGHT 600u

uint8_t w_RGBA[WIDTH * HEIGHT * 4u];

void wasm_log(const char* msg);

void update(uint64_t frame_number)
{
    for (uint16_t y = 0u; y < HEIGHT; y++)
    {
        for (uint16_t x = 0u; x < WIDTH; x++)
        {
            uint16_t idx = (y * WIDTH + x) * 4u;
            w_RGBA[idx + 0] = x + frame_number;
            w_RGBA[idx + 1] = y + frame_number;
            w_RGBA[idx + 2] = 150u;
            w_RGBA[idx + 3] = 255u;
        }
    }
    wasm_log("message from WASM update()!");
}
