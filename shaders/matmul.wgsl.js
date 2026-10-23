/*
REGION: LEEWAY.EDGE_GPU.SHADERS
TAG: LEEWAY.EDGE_GPU.MATMUL.G0
WHAT: Boundary-safe tiled matrix multiplication. WHY: All invocations must reach barriers.
WHO: Creator-authorized Agent Lee. WHERE: Existing matmul shader. WHEN: Compute dispatch.
HOW: Guard loads/stores, zero-pad tiles, retain uniform barriers. LICENSE: MIT
*/
export const matmulWGSL=`
struct Params { size: u32 };
@group(0) @binding(0) var<storage,read> A: array<f32>;
@group(0) @binding(1) var<storage,read> B: array<f32>;
@group(0) @binding(2) var<storage,read_write> C: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;
const TILE:u32=8u;
var<workgroup> tileA:array<f32,64>;
var<workgroup> tileB:array<f32,64>;
@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) gid:vec3<u32>,@builtin(local_invocation_id) lid:vec3<u32>){
 let size=params.size;
 let row=gid.y;let col=gid.x;let local=lid.y*TILE+lid.x;
 var sum:f32=0.0;
 for(var t:u32=0u;t<size;t+=TILE){
  var a:f32=0.0;var b:f32=0.0;
  if(row<size && t+lid.x<size){a=A[row*size+t+lid.x];}
  if(t+lid.y<size && col<size){b=B[(t+lid.y)*size+col];}
  tileA[local]=a;tileB[local]=b;
  workgroupBarrier();
  for(var k:u32=0u;k<TILE;k++){sum+=tileA[lid.y*TILE+k]*tileB[k*TILE+lid.x];}
  workgroupBarrier();
 }
 if(row<size && col<size){C[row*size+col]=sum;}
}
`;
