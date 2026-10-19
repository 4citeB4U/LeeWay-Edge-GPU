#include <metal_stdlib>
using namespace metal;
kernel void leeway_probe(device uint *output [[buffer(0)]], uint id [[thread_position_in_grid]]) {
    if (id < 256) { output[id] = id * 3u + 7u; }
}