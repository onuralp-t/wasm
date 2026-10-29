#include <stdint.h>

// JS-defined:
void wasm_log(const char *msg);

constexpr uint32_t SCREEN_WIDTH = 800u;
constexpr uint32_t SCREEN_HEIGHT = 600u;

struct {
  uint8_t pixels[SCREEN_WIDTH * SCREEN_HEIGHT * 4u];
} screen;

__attribute__((pure))
uint32_t screen_get_width(void)  { return SCREEN_WIDTH; }

__attribute__((pure))
uint32_t screen_get_height(void) { return SCREEN_HEIGHT; }

__attribute__((pure))
uint8_t* screen_get_pixels(void) { return screen.pixels; }

__attribute__((pure))
uint32_t screen_get_pixels_size(void) { return SCREEN_WIDTH * SCREEN_HEIGHT * 4u; }

void update(uint32_t frame_number) {
    for (uint32_t y = 0u; y < SCREEN_HEIGHT; y++)
    {
        for (uint32_t x = 0u; x < SCREEN_WIDTH; x++)
        {
            uint32_t idx = (y * SCREEN_WIDTH + x) * 4u;
            screen.pixels[idx + 0] = x + frame_number;
            screen.pixels[idx + 1] = y + frame_number;
            screen.pixels[idx + 2] = 150u;
            screen.pixels[idx + 3] = 255u;
        }
    }
    wasm_log("message from WASM update()!");
}
