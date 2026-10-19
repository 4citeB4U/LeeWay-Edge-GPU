#include <metal_stdlib>
using namespace metal;
kernel void leeway_probe(device uint *output [[buffer(0)]], uint id [[thread_position_in_grid]]) {
    if (id < 256) { output[id] = id * 3u + 7u; }
}kernel void leeway_tiny_model(device const float *input [[buffer(0)]],
                              device const float *weights [[buffer(1)]],
                              device float *output [[buffer(2)]],
                              uint id [[thread_position_in_grid]]) {
    if (id >= 8) return;
    float acc = 0.0f;
    for (uint i = 0; i < 16; ++i) { acc += input[i] * weights[id * 16 + i]; }
    output[id] = max(0.0f, acc);
}
