/*
REGION: LEEWAY.EDGE_GPU.SHADERS
TAG: LEEWAY.EDGE_GPU.QUANTIZED_WEIGHTS.G7
WHAT: Decode existing GGUF weight blocks directly in LeeWay WGSL kernels.
WHY: Avoid outsourcing model arithmetic or expanding every model weight into host float32.
WHO: Creator-authorized Agent Lee. ROLES: EXECUTE VERIFY.
WHERE: Existing shader capability. WHEN: Qualified read/decode/matvec stages only.
HOW: Format-specific byte addressing and IEEE half decoding; independent CPU reference is test-only.
LICENSE: MIT. Layout reference: ggml-org/ggml src/ggml-quants.c (MIT); no native executor is called.
*/
export const supportedQuantTypes=Object.freeze([0,1,2,6,8,12,14,30]);
const helper=`
@group(0) @binding(0) var<storage,read> weights:array<u32>;
fn b8(i:u32)->u32{return (weights[i/4u]>>((i%4u)*8u))&255u;}
fn b16(i:u32)->u32{return b8(i)|(b8(i+1u)<<8u);}
fn b32(i:u32)->u32{return b16(i)|(b16(i+2u)<<16u);}
fn h16(i:u32)->f32{return unpack2x16float(b16(i)).x;}
fn signed8(v:u32)->i32{return select(i32(v),i32(v)-256,v>=128u);}
`;
export function quantizedDecoder(type){
 if(!supportedQuantTypes.includes(type))throw Error('LEEWAY_QUANT_TYPE_UNSUPPORTED:'+type);
 const bodies={
  0:'return bitcast<f32>(weights[i]);',
  1:'return h16(i*2u);',
  30:'return bitcast<f32>(b16(i*2u)<<16u);',
  2:`let base=(i/32u)*18u;let j=i%32u;let q=b8(base+2u+j%16u);let value=(q>>((j/16u)*4u))&15u;return h16(base)*f32(i32(value)-8);`,
  6:`let base=(i/32u)*22u;let j=i%32u;let low=(b8(base+6u+j%16u)>>((j/16u)*4u))&15u;let high=(b32(base+2u)>>j)&1u;return h16(base)*f32(i32(low|(high<<4u))-16);`,
  8:`let base=(i/32u)*34u;let j=i%32u;return h16(base)*f32(signed8(b8(base+2u+j)));`,
  12:`let base=(i/256u)*144u;let j=i%256u;let group=j/32u;let part=j%32u;var scale:u32;var minimum:u32;
   if(group<4u){scale=b8(base+4u+group)&63u;minimum=b8(base+8u+group)&63u;}
   else{scale=(b8(base+8u+group)&15u)|((b8(base+group)>>6u)<<4u);minimum=(b8(base+8u+group)>>4u)|((b8(base+4u+group)>>6u)<<4u);}
   let q=(b8(base+16u+(group/2u)*32u+part)>>((group%2u)*4u))&15u;
   return h16(base)*f32(scale)*f32(q)-h16(base+2u)*f32(minimum);`,
  14:`let base=(i/256u)*210u;let j=i%256u;let half=j/128u;let rem=j%128u;let group=rem/32u;let lane=rem%32u;
   let low=(b8(base+half*64u+(group%2u)*32u+lane)>>((group/2u)*4u))&15u;
   let high=(b8(base+128u+half*32u+lane)>>(group*2u))&3u;
   let scale=signed8(b8(base+192u+half*8u+group*2u+lane/16u));
   return h16(base+208u)*f32(scale)*f32(i32(low|(high<<4u))-32);`
 };
 return helper+'\nfn weightAt(i:u32)->f32{'+bodies[type]+'}\n';
}
export function dequantizeWGSL(type){return quantizedDecoder(type)+`
struct Config{count:u32,offset:u32,pad0:u32,pad1:u32};
@group(0) @binding(1) var<storage,read_write> output:array<f32>;
@group(0) @binding(2) var<uniform> cfg:Config;
@compute @workgroup_size(128) fn main(@builtin(global_invocation_id) g:vec3<u32>){if(g.x<cfg.count){output[g.x]=weightAt(cfg.offset+g.x);}}
`;}
export function quantizedMatVecWGSL(type){return quantizedDecoder(type)+`
struct Config{columns:u32,rows:u32,rowOffset:u32,outputOffset:u32};
@group(0) @binding(1) var<storage,read> input:array<f32>;
@group(0) @binding(2) var<storage,read_write> output:array<f32>;
@group(0) @binding(3) var<uniform> cfg:Config;
var<workgroup> sums:array<f32,128>;
@compute @workgroup_size(128) fn main(@builtin(workgroup_id) g:vec3<u32>,@builtin(local_invocation_id) l:vec3<u32>){
 let row=g.x;var sum:f32=0.0;
 if(row<cfg.rows){for(var c=l.x;c<cfg.columns;c+=128u){sum+=weightAt((row+cfg.rowOffset)*cfg.columns+c)*input[c];}}
 sums[l.x]=sum;workgroupBarrier();
 for(var stride=64u;stride>0u;stride/=2u){if(l.x<stride){sums[l.x]+=sums[l.x+stride];}workgroupBarrier();}
 if(l.x==0u&&row<cfg.rows){output[cfg.outputOffset+row]=sums[0];}
}
`;}
