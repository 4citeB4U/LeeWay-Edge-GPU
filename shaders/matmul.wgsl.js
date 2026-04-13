export const matmulWGSL = `
struct Params {
  size: u32
};

@group(0) @binding(0) var<storage, read> A: array<f32>;
@group(0) @binding(1) var<storage, read> B: array<f32>;
@group(0) @binding(2) var<storage, read_write> C: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;

// TILE SIZE (adjustable)
const TILE: u32 = 8u;

var<workgroup> tileA: array<f32, 64>;
var<workgroup> tileB: array<f32, 64>;

@compute @workgroup_size(8, 8)
fn main(
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(local_invocation_id) lid: vec3<u32>
) {
  let size = params.size;

  let row = gid.y;
  let col = gid.x;

  if (row >= size || col >= size) {
    return;
  }

  var sum: f32 = 0.0;

  // Loop over tiles
  for (var t: u32 = 0u; t < size; t += TILE) {

    let indexA = row * size + (t + lid.x);
    let safeA = select(0.0, A[indexA], (t + lid.x) < size);

    let indexB = (t + lid.y) * size + col;
    let safeB = select(0.0, B[indexB], (t + lid.y) < size);

    tileA[lid.y * TILE + lid.x] = safeA;
    tileB[lid.y * TILE + lid.x] = safeB;

    workgroupBarrier();

    for (var k: u32 = 0u; k < TILE; k++) {
      let a = tileA[lid.y * TILE + k];
      let b = tileB[k * TILE + lid.x];
      sum += a * b;
    }

    workgroupBarrier();
  }

  C[row * size + col] = sum;
}
`;

