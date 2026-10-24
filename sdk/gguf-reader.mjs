/*
REGION: LEEWAY.EDGE_GPU.MODEL_IO
TAG: LEEWAY.EDGE_GPU.GGUF_READER.G7
WHAT: Bounded read-only access to an explicitly supplied GGUF model.
WHY: Inspect real model requirements and stream ranges without loading a multi-GB file wholesale.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS EXECUTE VERIFY.
WHERE: Existing Edge GPU SDK, not a separate runtime or memory authority.
WHEN: Explicit local model admission. HOW: GGUF v2/v3 metadata, validated offsets, bounded tensor reads.
LICENSE: MIT. Format reference: ggml-org/ggml docs/gguf.md; no upstream executor is called.
*/
import fs from 'node:fs';
import crypto from 'node:crypto';
export const GGUF_TYPES=Object.freeze({
 0:{name:'F32',block:1,bytes:4},1:{name:'F16',block:1,bytes:2},
 2:{name:'Q4_0',block:32,bytes:18},3:{name:'Q4_1',block:32,bytes:20},
 6:{name:'Q5_0',block:32,bytes:22},7:{name:'Q5_1',block:32,bytes:24},
 8:{name:'Q8_0',block:32,bytes:34},10:{name:'Q2_K',block:256,bytes:84},
 11:{name:'Q3_K',block:256,bytes:110},12:{name:'Q4_K',block:256,bytes:144},
 13:{name:'Q5_K',block:256,bytes:176},14:{name:'Q6_K',block:256,bytes:210},
 30:{name:'BF16',block:1,bytes:2}
});
const validInt=(v,min,max,label)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('GGUF_INVALID_'+label);return v;};
export class GgufReader{
 #fd;#fileSize;#position=0;#cache=Buffer.alloc(0);#cacheStart=0;#closed=false;#headerBudget;
 constructor(file,{headerBudget=64*1024*1024,maxReadBytes=64*1024*1024,retainTokenizer=true}={}){
  this.file=file;this.maxReadBytes=validInt(maxReadBytes,4,128*1024*1024,'READ_BUDGET');
  this.#headerBudget=validInt(headerBudget,1024,256*1024*1024,'HEADER_BUDGET');
  this.#fd=fs.openSync(file,'r');this.#fileSize=fs.fstatSync(this.#fd).size;
  try{
   if(this.#take(4).toString('ascii')!=='GGUF')throw Error('GGUF_MAGIC_MISMATCH');
   this.version=this.#u32();if(![2,3].includes(this.version))throw Error('GGUF_VERSION_UNSUPPORTED');
   const nTensor=validInt(this.#u64(),1,100000,'TENSOR_COUNT'),nMetadata=validInt(this.#u64(),1,100000,'METADATA_COUNT');
   this.metadata=Object.create(null);this.arrayLengths=Object.create(null);
   for(let i=0;i<nMetadata;i++){
    const key=this.#string(65536),type=this.#u32();if(Object.hasOwn(this.metadata,key))throw Error('GGUF_DUPLICATE_METADATA_KEY');
    const keep=retainTokenizer||!/^tokenizer\.ggml\.(tokens|merges|scores|token_type)$/.test(key);
    this.metadata[key]=this.#value(type,keep,0,key);
   }
   this.tensors=[];this.byName=new Map();
   for(let i=0;i<nTensor;i++){
    const name=this.#string(4096);if(this.byName.has(name))throw Error('GGUF_DUPLICATE_TENSOR_NAME');
    const dimensions=validInt(this.#u32(),1,4,'DIMENSION_COUNT');
    const shape=Array.from({length:dimensions},()=>validInt(this.#u64(),1,2**32,'DIMENSION'));
    const type=this.#u32(),offset=this.#u64();const format=GGUF_TYPES[type];
    const elements=shape.reduce((a,b)=>validInt(a*b,1,Number.MAX_SAFE_INTEGER,'ELEMENTS'),1);
    const bytes=format?elements/format.block*format.bytes:null;
    if(format&&(!Number.isSafeInteger(bytes)||shape[0]%format.block))throw Error('GGUF_QUANTIZATION_BLOCK_ALIGNMENT');
    const tensor={name,shape,type,typeName:format?.name||'UNSUPPORTED_'+type,offset,elements,bytes};
    this.tensors.push(tensor);this.byName.set(name,tensor);
   }
   const alignment=this.metadata['general.alignment']??32;
   validInt(alignment,1,4096,'ALIGNMENT');if((alignment&(alignment-1))!==0)throw Error('GGUF_ALIGNMENT_NOT_POWER_OF_TWO');
   this.dataOffset=Math.ceil(this.#position/alignment)*alignment;this.headerBytes=this.#position;
   const ordered=this.tensors.slice().sort((a,b)=>a.offset-b.offset);
   for(let i=0;i<ordered.length;i++){
    const t=ordered[i],end=i+1<ordered.length?ordered[i+1].offset:this.#fileSize-this.dataOffset;
    if(t.offset%alignment||t.offset>=end||this.dataOffset+end>this.#fileSize)throw Error('GGUF_INVALID_TENSOR_RANGE');
    if(t.bytes!==null&&t.offset+t.bytes>end)throw Error('GGUF_TENSOR_OVERLAP_OR_TRUNCATION');
    t.fileOffset=this.dataOffset+t.offset;
   }
   this.fileSize=this.#fileSize;this.#cache=Buffer.alloc(0);
  }catch(error){this.close();throw error;}
 }
 #take(n){
  if(this.#closed)throw Error('GGUF_CLOSED');validInt(n,0,this.#headerBudget,'HEADER_READ');
  if(this.#position+n>Math.min(this.#fileSize,this.#headerBudget))throw Error('GGUF_HEADER_TRUNCATED_OR_BUDGET');
  if(this.#position<this.#cacheStart||this.#position+n>this.#cacheStart+this.#cache.length){
   this.#cacheStart=this.#position;const size=Math.min(Math.max(1024*1024,n),this.#fileSize-this.#position,this.#headerBudget-this.#position);
   this.#cache=Buffer.alloc(size);let got=0;
   while(got<size){const count=fs.readSync(this.#fd,this.#cache,got,size-got,this.#position+got);if(!count)throw Error('GGUF_UNEXPECTED_EOF');got+=count;}
  }
  const result=this.#cache.subarray(this.#position-this.#cacheStart,this.#position-this.#cacheStart+n);this.#position+=n;return result;
 }
 #u32(){return this.#take(4).readUInt32LE();}
 #u64(){const v=this.#take(8).readBigUInt64LE();if(v>BigInt(Number.MAX_SAFE_INTEGER))throw Error('GGUF_INTEGER_RANGE');return Number(v);}
 #string(max=16*1024*1024){const n=validInt(this.#u64(),0,max,'STRING_LENGTH');return new TextDecoder('utf-8',{fatal:true}).decode(this.#take(n));}
 #value(type,keep,depth,key){
  if(depth>1)throw Error('GGUF_NESTED_ARRAY_UNSUPPORTED');
  if(type===8){const v=this.#string();return keep?v:null;}
  if(type===9){const item=this.#u32(),count=validInt(this.#u64(),0,2000000,'ARRAY_LENGTH');this.arrayLengths[key]=count;const values=keep?new Array(count):null;for(let i=0;i<count;i++){const v=this.#value(item,keep,depth+1,key);if(keep)values[i]=v;}return values;}
  const widths={0:1,1:1,2:2,3:2,4:4,5:4,6:4,7:1,10:8,11:8,12:8};const width=widths[type];if(!width)throw Error('GGUF_METADATA_TYPE_UNSUPPORTED');const b=this.#take(width);let v;
  switch(type){case 0:v=b.readUInt8();break;case 1:v=b.readInt8();break;case 2:v=b.readUInt16LE();break;case 3:v=b.readInt16LE();break;case 4:v=b.readUInt32LE();break;case 5:v=b.readInt32LE();break;case 6:v=b.readFloatLE();break;case 7:if(b[0]>1)throw Error('GGUF_INVALID_BOOL');v=!!b[0];break;case 10:{const x=b.readBigUInt64LE();v=x<=BigInt(Number.MAX_SAFE_INTEGER)?Number(x):x.toString();break;}case 11:{const x=b.readBigInt64LE();v=x>=BigInt(Number.MIN_SAFE_INTEGER)&&x<=BigInt(Number.MAX_SAFE_INTEGER)?Number(x):x.toString();break;}case 12:v=b.readDoubleLE();}
  return keep?v:null;
 }
 readTensorRows(name,rowStart=0,rowCount=1){
  if(this.#closed)throw Error('GGUF_CLOSED');const t=this.byName.get(name);if(!t)throw Error('GGUF_TENSOR_ABSENT:'+name);
  const f=GGUF_TYPES[t.type];if(!f)throw Error('GGUF_TENSOR_TYPE_UNSUPPORTED:'+t.type);
  const rows=t.elements/t.shape[0],stride=t.shape[0]/f.block*f.bytes;
  validInt(rowStart,0,rows-1,'ROW_START');validInt(rowCount,1,rows-rowStart,'ROW_COUNT');const bytes=rowCount*stride;
  validInt(bytes,1,this.maxReadBytes,'RANGE_BUDGET');const out=Buffer.alloc(bytes);let got=0;
  while(got<bytes){const n=fs.readSync(this.#fd,out,got,bytes-got,t.fileOffset+rowStart*stride+got);if(!n)throw Error('GGUF_TENSOR_TRUNCATED');got+=n;}
  return {data:out,tensor:{...t},rowStart,rowCount,stride,sha256:crypto.createHash('sha256').update(out).digest('hex')};
 }
 close(){if(!this.#closed){this.#closed=true;if(this.#fd!==undefined)fs.closeSync(this.#fd);this.#cache=Buffer.alloc(0);}}
}
