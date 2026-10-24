/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.QUANTIZED_REFERENCE.G7
WHAT: Independent block-oriented scalar oracle for packed model weight tests only.
WHY: A shader matching itself is not numerical verification.
WHO: Agent Lee. ROLES: VERIFY. WHERE: Test-only source. WHEN: Operator qualification.
HOW: Decode byte layouts into Float32Array without calling GPU/model runtimes.
LICENSE: MIT. Layout reference: ggml-org/ggml src/ggml-quants.c (MIT).
*/
export function fp16(bits){const sign=bits&32768?-1:1,e=(bits>>10)&31,m=bits&1023;return e===0?sign*2**-24*m:e===31?(m?NaN:sign*Infinity):sign*2**(e-15)*(1+m/1024);}
export function decodeReference(bytes,type,count){
 const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength),out=new Float32Array(count);
 const half=i=>fp16(v.getUint16(i,true)),signed=i=>v.getInt8(i);
 if(type===0){for(let i=0;i<count;i++)out[i]=v.getFloat32(4*i,true);return out;}
 if(type===1){for(let i=0;i<count;i++)out[i]=half(2*i);return out;}
 if(type===30){const scratch=new DataView(new ArrayBuffer(4));for(let i=0;i<count;i++){scratch.setUint32(0,v.getUint16(i*2,true)*65536,true);out[i]=scratch.getFloat32(0,true);}return out;}
 const layout={2:[32,18],6:[32,22],8:[32,34],12:[256,144],14:[256,210]}[type];if(!layout||count%layout[0])throw Error('REFERENCE_FORMAT_OR_COUNT');
 const [block,size]=layout;if(b.byteLength<count/block*size)throw Error('REFERENCE_TRUNCATED');
 for(let start=0,base=0;start<count;start+=block,base+=size){
  if(type===8){for(let j=0;j<32;j++)out[start+j]=half(base)*signed(base+2+j);continue;}
  if(type===2||type===6){const qh=type===6?v.getUint32(base+2,true):0,offset=type===6?6:2;
   for(let j=0;j<16;j++){const x=b[base+offset+j];out[start+j]=half(base)*((x&15)+(type===6?((qh>>>j)&1)*16:0)-(type===6?16:8));out[start+j+16]=half(base)*((x>>4)+(type===6?((qh>>>(j+16))&1)*16:0)-(type===6?16:8));}continue;}
  if(type===12){const scales=b.subarray(base+4,base+16);const unpack=g=>g<4?[scales[g]&63,scales[g+4]&63]:[(scales[g+4]&15)|((scales[g-4]>>6)<<4),(scales[g+4]>>4)|((scales[g]>>6)<<4)];
   for(let block64=0;block64<4;block64++)for(let half32=0;half32<2;half32++){const [s,m]=unpack(block64*2+half32),d=Math.fround(half(base)*s),minimum=Math.fround(half(base+2)*m);for(let j=0;j<32;j++){const q=(b[base+16+block64*32+j]>>(half32*4))&15;out[start+block64*64+half32*32+j]=Math.fround(Math.fround(d*q)-minimum);}}continue;}
  if(type===14){const d=half(base+208);for(let block128=0;block128<2;block128++)for(let lane=0;lane<32;lane++){
   const low0=b[base+block128*64+lane],low1=b[base+block128*64+32+lane],high=b[base+128+block128*32+lane];
   const values=[(low0&15)|((high&3)<<4),(low1&15)|(((high>>2)&3)<<4),(low0>>4)|(((high>>4)&3)<<4),(low1>>4)|(((high>>6)&3)<<4)];
   for(let group=0;group<4;group++)out[start+block128*128+group*32+lane]=Math.fround(Math.fround(d*signed(base+192+block128*8+group*2+Math.floor(lane/16)))*(values[group]-32));
  }}
 }
 return out;
}
export function referenceMatVec(w,x,rows){const n=x.length,out=new Float32Array(rows);for(let r=0;r<rows;r++){let sum=0;for(let c=0;c<n;c++)sum+=w[r*n+c]*x[c];out[r]=sum;}return out;}
