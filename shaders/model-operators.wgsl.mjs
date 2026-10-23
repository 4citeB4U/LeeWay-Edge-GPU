/*
REGION: LEEWAY.EDGE_GPU.SHADERS
TAG: LEEWAY.EDGE_GPU.MODEL_OPERATORS.G7
WHAT: Fixed transformer math kernels owned by LeeWay Edge GPU.
WHY: Model inference must execute real normalization, rotary attention and feed-forward math here.
WHO: Creator-authorized Agent Lee. ROLES: EXECUTE VERIFY. WHERE: Existing shader capability.
WHEN: Validated bounded model graph. HOW: GPU-resident buffers and workgroup reductions.
LICENSE: MIT. Mathematical references: Qwen2/Gemma4 model specifications; no external inference call.
*/
export const rmsWGSL=`
struct P{n:u32,groups:u32,weighted:u32,offset:u32,epsilon:f32,inputScale:f32,pad0:u32,pad1:u32};
@group(0) @binding(0) var<storage,read> x:array<f32>;
@group(0) @binding(1) var<storage,read> weight:array<f32>;
@group(0) @binding(2) var<storage,read_write> y:array<f32>;
@group(0) @binding(3) var<uniform> p:P;
var<workgroup> sums:array<f32,128>;
@compute @workgroup_size(128) fn main(@builtin(workgroup_id) g:vec3<u32>,@builtin(local_invocation_id) l:vec3<u32>){
 let base=g.x*p.n;var sum=0.0;
 for(var i=l.x;i<p.n;i+=128u){let value=x[p.offset+base+i]*p.inputScale;sum+=value*value;}
 sums[l.x]=sum;workgroupBarrier();
 for(var s=64u;s>0u;s/=2u){if(l.x<s){sums[l.x]+=sums[l.x+s];}workgroupBarrier();}
 let inv=inverseSqrt(sums[0]/f32(p.n)+p.epsilon);
 for(var i=l.x;i<p.n;i+=128u){var factor=1.0;if(p.weighted==1u){factor=weight[i];}y[base+i]=x[p.offset+base+i]*p.inputScale*inv*factor;}
}
`;
export const elementWGSL=`
struct P{n:u32,op:u32,aOffset:u32,bOffset:u32,scale:f32,broadcast:u32,pad0:u32,pad1:u32};
@group(0) @binding(0) var<storage,read> a:array<f32>;
@group(0) @binding(1) var<storage,read> b:array<f32>;
@group(0) @binding(2) var<storage,read_write> y:array<f32>;
@group(0) @binding(3) var<uniform> p:P;
fn gelu(v:f32)->f32{return 0.5*v*(1.0+tanh(0.7978845608028654*(v+0.044715*v*v*v)));}
@compute @workgroup_size(128) fn main(@builtin(global_invocation_id) g:vec3<u32>){
 let i=g.x;if(i>=p.n){return;}let av=a[p.aOffset+i];let bi=select(i,0u,p.broadcast==1u);let bv=b[p.bOffset+bi];var v=av;
 switch(p.op){
  case 0u:{v=av+bv;}
  case 1u:{v=av*bv;}
  case 2u:{v=(av/(1.0+exp(-av)))*bv;}
  case 3u:{v=gelu(av)*bv;}
  case 4u:{v=av*p.scale;}
  case 5u:{v=tanh(av/p.scale)*p.scale;}
  default:{v=av;}
 }
 y[i]=v;
}
`;
export const ropeWGSL=`
struct P{dim:u32,heads:u32,position:u32,rotary:u32,base:f32,useFactors:u32,pad0:u32,pad1:u32};
@group(0) @binding(0) var<storage,read> x:array<f32>;
@group(0) @binding(1) var<storage,read> factors:array<f32>;
@group(0) @binding(2) var<storage,read_write> y:array<f32>;
@group(0) @binding(3) var<uniform> p:P;
@compute @workgroup_size(128) fn main(@builtin(global_invocation_id) g:vec3<u32>){
 let i=g.x;if(i>=p.dim*p.heads){return;}let local=i%p.dim;let head=i/p.dim;
 if(local>=p.rotary){y[i]=x[i];return;}
 let half=p.rotary/2u;let part=local%half;var theta=f32(p.position)/pow(p.base,2.0*f32(part)/f32(p.rotary));
 if(p.useFactors==1u){theta/=factors[part];}
 let av=x[head*p.dim+part];let bv=x[head*p.dim+part+half];
 y[i]=select(av*cos(theta)-bv*sin(theta),bv*cos(theta)+av*sin(theta),local>=half);
}
`;
export const kvWriteWGSL=`
struct P{width:u32,position:u32,pad0:u32,pad1:u32};
@group(0) @binding(0) var<storage,read> k:array<f32>;
@group(0) @binding(1) var<storage,read> v:array<f32>;
@group(0) @binding(2) var<storage,read_write> keys:array<f32>;
@group(0) @binding(3) var<storage,read_write> values:array<f32>;
@group(0) @binding(4) var<uniform> p:P;
@compute @workgroup_size(128) fn main(@builtin(global_invocation_id) g:vec3<u32>){if(g.x<p.width){let slot=p.position*p.width+g.x;keys[slot]=k[g.x];values[slot]=v[g.x];}}
`;
export const attentionWGSL=`
struct P{dim:u32,heads:u32,kvHeads:u32,tokens:u32,start:u32,pad0:u32,scale:f32,pad1:u32};
@group(0) @binding(0) var<storage,read> q:array<f32>;
@group(0) @binding(1) var<storage,read> keys:array<f32>;
@group(0) @binding(2) var<storage,read> values:array<f32>;
@group(0) @binding(3) var<storage,read_write> y:array<f32>;
@group(0) @binding(4) var<uniform> p:P;
var<workgroup> scores:array<f32,256>;
@compute @workgroup_size(128) fn main(@builtin(workgroup_id) g:vec3<u32>,@builtin(local_invocation_id) l:vec3<u32>){
 let head=g.x;let kv=head/(p.heads/p.kvHeads);
 for(var t=l.x;t<p.tokens;t+=128u){
  var sum=0.0;
  if(t>=p.start){for(var c=0u;c<p.dim;c++){sum+=q[head*p.dim+c]*keys[t*p.kvHeads*p.dim+kv*p.dim+c];}scores[t]=sum*p.scale;}
  else{scores[t]=-3.402823466e+38;}
 }
 workgroupBarrier();
 if(l.x==0u){var largest=-3.402823466e+38;for(var t=p.start;t<p.tokens;t++){largest=max(largest,scores[t]);}
  var denominator=0.0;for(var t=p.start;t<p.tokens;t++){scores[t]=exp(scores[t]-largest);denominator+=scores[t];}
  for(var t=p.start;t<p.tokens;t++){scores[t]/=denominator;}
 }
 workgroupBarrier();
 for(var c=l.x;c<p.dim;c+=128u){var sum=0.0;for(var t=p.start;t<p.tokens;t++){sum+=scores[t]*values[t*p.kvHeads*p.dim+kv*p.dim+c];}y[head*p.dim+c]=sum;}
}
`;
export const argmaxWGSL=`
struct P{n:u32,pad0:u32,pad1:u32,pad2:u32};
@group(0) @binding(0) var<storage,read> values:array<f32>;
@group(0) @binding(1) var<storage,read_write> output:array<u32>;
@group(0) @binding(2) var<uniform> p:P;
var<workgroup> bestValue:array<f32,128>;
var<workgroup> bestIndex:array<u32,128>;
@compute @workgroup_size(128) fn main(@builtin(local_invocation_id) l:vec3<u32>){
 var value=-3.402823466e+38;var index=0xffffffffu;
 for(var i=l.x;i<p.n;i+=128u){let v=values[i];if(v>value||(v==value&&i<index)){value=v;index=i;}}
 bestValue[l.x]=value;bestIndex[l.x]=index;workgroupBarrier();
 for(var s=64u;s>0u;s/=2u){if(l.x<s){let j=l.x+s;if(bestValue[j]>bestValue[l.x]||(bestValue[j]==bestValue[l.x]&&bestIndex[j]<bestIndex[l.x])){bestValue[l.x]=bestValue[j];bestIndex[l.x]=bestIndex[j];}}workgroupBarrier();}
 if(l.x==0u){output[0]=bestIndex[0];output[1]=bitcast<u32>(bestValue[0]);}
}
`;
