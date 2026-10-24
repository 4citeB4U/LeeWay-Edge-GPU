/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.MODEL_OPERATOR_TESTS.G7
WHAT: Execute real-weight decode/matvec and transformer primitives on the actual browser GPU.
WHY: Gate inference on numerical evidence, not source generation.
WHO: Agent Lee. ROLES: VERIFY. WHERE: Isolated authenticated loopback model session.
WHEN: Explicit operator tests. HOW: Compare actual GPU bytes with independent scalar fixtures.
LICENSE: MIT. Fixture calculations are not the inference backend.
*/
import {ModelOperatorEncoder} from '../../dispatch/model-ops.mjs';
const assert=(x,s)=>{if(!x)throw Error(s);};
const compare=(actual,expected,atol=2e-5,rtol=2e-4)=>{assert(actual.length===expected.length,'LENGTH_MISMATCH');let maxError=0,bad=0;for(let i=0;i<actual.length;i++){const e=Math.abs(actual[i]-expected[i]);maxError=Math.max(maxError,e);if(!Number.isFinite(actual[i])||e>atol+rtol*Math.abs(expected[i]))bad++;}assert(!bad,'NUMERICAL_MISMATCH count='+bad+' max='+maxError);return {values:actual.length,maxAbsoluteError:maxError,atol,rtol};};
export async function runOperatorTests({device,base}){
 const ops=new ModelOperatorEncoder(device,{memoryBudgetBytes:64*1024*1024});const tests=[];
 async function test(name,fn){try{const result=await fn();tests.push({name,status:'PASS',...result});}catch(error){tests.push({name,status:'FAIL',error:error.message});}}
 const samples=await fetch(base+'samples').then(r=>{if(!r.ok)throw Error('SAMPLES_UNAVAILABLE');return r.json();});
 try{
  for(const sample of samples){
   await test('REAL_WEIGHT_DECODE_'+sample.typeName,async()=>{
    const bytes=await fetch(base+'sample-bytes?index='+sample.index).then(r=>r.arrayBuffer());const packed=ops.upload(bytes),out=ops.allocate(sample.count*4),batch=ops.begin();
    try{ops.decode(batch,packed,sample.type,out,sample.count);const result=new Float32Array((await ops.finish(batch,out,sample.count*4)).buffer);return {...compare(result,sample.expected),tensor:sample.name,rangeSha256:sample.sha256};}finally{ops.free(packed);ops.free(out);}
   });
   if(sample.rows>=2)await test('REAL_WEIGHT_MATVEC_'+sample.typeName,async()=>{
    const bytes=await fetch(base+'sample-bytes?index='+sample.index).then(r=>r.arrayBuffer());const packed=ops.upload(bytes),x=ops.upload(Float32Array.from(sample.input)),out=ops.allocate(sample.rows*4),batch=ops.begin();
    try{ops.matvec(batch,packed,sample.type,x,out,sample.columns,sample.rows);const result=new Float32Array((await ops.finish(batch,out,sample.rows*4)).buffer);return {...compare(result,sample.matvec,1e-4,5e-4),rows:sample.rows,columns:sample.columns};}finally{ops.free(packed);ops.free(x);ops.free(out);}
   });
  }
  await test('WEIGHTED_RMS_GROUPS',async()=>{
   const n=256,groups=3,x=Float32Array.from({length:n*groups},(_,i)=>(i%23-11)/9),w=Float32Array.from({length:n},(_,i)=>0.7+(i%7)/10),expected=[];
   for(let g=0;g<groups;g++){let s=0;for(let i=0;i<n;i++)s+=x[g*n+i]**2;const inv=1/Math.sqrt(s/n+1e-6);for(let i=0;i<n;i++)expected.push(x[g*n+i]*inv*w[i]);}
   const a=ops.upload(x),b=ops.upload(w),out=ops.allocate(x.byteLength),batch=ops.begin();
   try{ops.norm(batch,a,b,out,n,{groups});return compare(new Float32Array((await ops.finish(batch,out,x.byteLength)).buffer),expected);}finally{ops.free(a);ops.free(b);ops.free(out);}
  });
  for(const op of [0,1,2,3,4,5])await test('ELEMENT_OPERATOR_'+op,async()=>{
   const a=Float32Array.from({length:257},(_,i)=>(i-128)/32),b=Float32Array.from({length:257},(_,i)=>(i%13-6)/10);const scale=30;
   const expected=Array.from(a,(v,i)=>[v+b[i],v*b[i],v/(1+Math.exp(-v))*b[i],0.5*v*(1+Math.tanh(Math.sqrt(2/Math.PI)*(v+.044715*v**3)))*b[i],v*scale,Math.tanh(v/scale)*scale][op]);
   const x=ops.upload(a),y=ops.upload(b),out=ops.allocate(a.byteLength),batch=ops.begin();
   try{ops.element(batch,x,y,out,a.length,op,{scale});return compare(new Float32Array((await ops.finish(batch,out,a.byteLength)).buffer),expected);}finally{ops.free(x);ops.free(y);ops.free(out);}
  });
  await test('ROPE_NONZERO_POSITION',async()=>{
   const dim=64,heads=2,pos=7,baseValue=10000,x=Float32Array.from({length:dim*heads},(_,i)=>(i%11-5)/4),expected=[];
   for(let i=0;i<x.length;i++){const head=Math.floor(i/dim),j=i%dim,p=j%(dim/2),angle=pos/baseValue**(2*p/dim),a=x[head*dim+p],b=x[head*dim+p+dim/2];expected.push(j<dim/2?a*Math.cos(angle)-b*Math.sin(angle):b*Math.cos(angle)+a*Math.sin(angle));}
   const a=ops.upload(x),out=ops.allocate(x.byteLength),batch=ops.begin();try{ops.rope(batch,a,out,dim,heads,pos,baseValue);return compare(new Float32Array((await ops.finish(batch,out,x.byteLength)).buffer),expected);}finally{ops.free(a);ops.free(out);}
  });
  await test('GROUPED_QUERY_CAUSAL_ATTENTION',async()=>{
   const dim=32,heads=4,kvHeads=2,tokens=5,start=1,scale=.25;
   const q=Float32Array.from({length:heads*dim},(_,i)=>(i%11-5)/7),k=Float32Array.from({length:tokens*kvHeads*dim},(_,i)=>(i%17-8)/9),v=Float32Array.from({length:k.length},(_,i)=>(i%7-3)/5),expected=[];
   for(let h=0;h<heads;h++){const kv=Math.floor(h/(heads/kvHeads)),scores=[];for(let t=start;t<tokens;t++){let s=0;for(let c=0;c<dim;c++)s+=q[h*dim+c]*k[t*kvHeads*dim+kv*dim+c];scores.push(s*scale);}const max=Math.max(...scores),p=scores.map(s=>Math.exp(s-max)),total=p.reduce((a,b)=>a+b,0);for(let c=0;c<dim;c++){let y=0;for(let t=start;t<tokens;t++)y+=p[t-start]/total*v[t*kvHeads*dim+kv*dim+c];expected.push(y);}}
   const a=ops.upload(q),b=ops.upload(k),c=ops.upload(v),out=ops.allocate(q.byteLength),batch=ops.begin();try{ops.attention(batch,a,b,c,out,{dim,heads,kvHeads,tokens,start,scale});return compare(new Float32Array((await ops.finish(batch,out,q.byteLength)).buffer),expected);}finally{ops.free(a);ops.free(b);ops.free(c);ops.free(out);}
  });
  await test('KV_WRITE_EXACT_POSITION_AND_UNTOUCHED_ROWS',async()=>{
   const n=64,pos=3,k=Float32Array.from({length:n},(_,i)=>i/8),v=Float32Array.from({length:n},(_,i)=>-i/16);
   const kb=ops.upload(k),vb=ops.upload(v),kc=ops.allocate(n*5*4),vc=ops.allocate(n*5*4),batch=ops.begin();
   try{ops.storeKV(batch,kb,vb,kc,vc,n,pos);const data=new Float32Array((await ops.finish(batch,kc,n*5*4)).buffer);const expected=new Float32Array(n*5);expected.set(k,pos*n);const match=compare(data,expected,0,0);const b=ops.begin();const values=new Float32Array((await ops.finish(b,vc,n*5*4)).buffer);expected.fill(0);expected.set(v,pos*n);compare(values,expected,0,0);return match;}finally{for(const b of [kb,vb,kc,vc])ops.free(b);}
  });
  await test('GPU_GREEDY_SELECTION_TIE_BREAK',async()=>{const x=new Float32Array(300);x.fill(-2);x[137]=8;x[270]=8;const a=ops.upload(x),out=ops.allocate(8),batch=ops.begin();try{ops.argmax(batch,a,out,x.length);const raw=await ops.finish(batch,out,8);const ids=new Uint32Array(raw.buffer);assert(ids[0]===137,'ARGMAX_TIE_BREAK');return {selected:ids[0],score:new Float32Array(raw.buffer)[1]};}finally{ops.free(a);ops.free(out);}});
  return {outcome:tests.every(t=>t.status==='PASS')?'PASS_REAL_MODEL_OPERATORS':'FAIL_MODEL_OPERATORS',passed:tests.filter(t=>t.status==='PASS').length,total:tests.length,tests,resources:ops.describe()};
 }finally{ops.close();}
}
