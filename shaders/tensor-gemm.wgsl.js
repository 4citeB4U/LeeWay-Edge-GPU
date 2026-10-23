/*
REGION: LEEWAY.EDGE_GPU.SHADERS
TAG: LEEWAY.EDGE_GPU.TENSOR_GEMM.G2
WHAT: Fixed rectangular matrix multiplication with fused bias and optional ReLU.
WHY: Reuse workgroup tiles and avoid separate global-memory epilogues.
WHO: Creator-authorized Agent Lee. WHERE: Existing WGSL kernel capability.
WHEN: Validated local tensor dispatch. HOW: Uniform barriers, guarded tile edges, output-local accumulation.
ROLES: EXECUTE VERIFY. LICENSE: MIT
*/
export const tensorGemmWGSL=`
struct Params { m:u32, k:u32, n:u32, relu:u32 };
@group(0) @binding(0) var<storage,read> A:array<f32>;
@group(0) @binding(1) var<storage,read> B:array<f32>;
@group(0) @binding(2) var<storage,read_write> Y:array<f32>;
@group(0) @binding(3) var<storage,read> bias:array<f32>;
@group(0) @binding(4) var<uniform> p:Params;
var<workgroup> tileA:array<f32,64>;
var<workgroup> tileB:array<f32,64>;
@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) g:vec3<u32>,@builtin(local_invocation_id) l:vec3<u32>){
 let row=g.y;let col=g.x;let local=l.y*8u+l.x;
 var sum:f32=0.0;
 for(var t:u32=0u;t<p.k;t+=8u){
  var a:f32=0.0;var b:f32=0.0;
  if(row<p.m && t+l.x<p.k){a=A[row*p.k+t+l.x];}
  if(t+l.y<p.k && col<p.n){b=B[(t+l.y)*p.n+col];}
  tileA[local]=a;tileB[local]=b;
  workgroupBarrier();
  for(var i:u32=0u;i<8u;i++){sum+=tileA[l.y*8u+i]*tileB[i*8u+l.x];}
  workgroupBarrier();
 }
 if(row<p.m && col<p.n){
  var value=sum+bias[col];
  if(p.relu==1u){value=max(value,0.0);}
  Y[row*p.n+col]=value;
 }
}
`;
