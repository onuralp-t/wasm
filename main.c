#include <stdint.h>

// JS-defined:
void wasm_log(const char *msg);

#define SCREEN_WIDTH 800u
#define SCREEN_HEIGHT 600u

struct {
  const uint32_t WIDTH;
  const uint32_t HEIGHT;
  uint8_t pixels[SCREEN_WIDTH * SCREEN_HEIGHT * 4u];
} screen = {.WIDTH = SCREEN_WIDTH, .HEIGHT = SCREEN_HEIGHT};

uint32_t screen_get_width(void)  { return screen.WIDTH; }
uint32_t screen_get_height(void) { return screen.HEIGHT; }
uint8_t* screen_get_pixels(void) { return screen.pixels; }

void update(uint32_t frame_number) {
    for (uint32_t y = 0u; y < screen.HEIGHT; y++)
    {
        for (uint32_t x = 0u; x < screen.WIDTH; x++)
        {
            uint32_t idx = (y * screen.WIDTH + x) * 4u;
            screen.pixels[idx + 0] = x + frame_number;
            screen.pixels[idx + 1] = y + frame_number;
            screen.pixels[idx + 2] = 150u;
            screen.pixels[idx + 3] = 255u;
        }
    }
    wasm_log("message from WASM update()!");
}
