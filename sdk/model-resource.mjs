/*
REGION: LEEWAY.EDGE_GPU.MODEL_IO
TAG: LEEWAY.EDGE_GPU.PORTABLE_MODEL_RESOURCE.V1
WHAT: Bounded read-only access to a device-local model through an injected storage adapter.
WHY: The shared GPU graph must not require Node, a filesystem path or a localhost server.
AUTHORITY: Runtime Fabric admits the resource and independently verifies each read.
SCOPE: Storage and integrity consumer contract; this module issues no production authority.
*/
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const fail=code=>{throw Error(code);};
const integer=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const cancelled=signal=>{if(signal?.aborted)fail('MODEL_RESOURCE_CANCELLED');};
async function withCancellation(operation,signal){
 cancelled(signal);if(!signal)return operation();
 let rejectAbort;const interrupted=new Promise((_,reject)=>{rejectAbort=()=>reject(Error('MODEL_RESOURCE_CANCELLED'));signal.addEventListener('abort',rejectAbort,{once:true});});
 try{cancelled(signal);return await Promise.race([Promise.resolve().then(operation),interrupted]);}
 finally{signal.removeEventListener('abort',rejectAbort);}
}
const copyBytes=value=>{
 if(value instanceof ArrayBuffer)return new Uint8Array(value.slice(0));
 if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength).slice();
 fail('MODEL_RESOURCE_BYTES_INVALID');
};

/** The host adapter owns its file/Blob/native handle. No path or network fallback is discovered here. */
export function createDeviceLocalModelResource({resourceId,byteLength,maxReadBytes=64*1024*1024,read,close=()=>{}}={}){
 if(typeof resourceId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,159}$/.test(resourceId)||
  !integer(byteLength,1,Number.MAX_SAFE_INTEGER)||!integer(maxReadBytes,1,128*1024*1024)||
  typeof read!=='function'||typeof close!=='function')fail('MODEL_RESOURCE_ADAPTER_INVALID');
 let closed=false,closing;const active=new Set();
 return Object.freeze({kind:'LEEWAY_DEVICE_LOCAL_MODEL_RESOURCE_V1',resourceId,byteLength,maxReadBytes,
  async read({offset,byteLength:length,signal}={}){
   if(closed)fail('MODEL_RESOURCE_CLOSED');cancelled(signal);
   if(!integer(offset,0,byteLength-1)||!integer(length,1,maxReadBytes)||length>byteLength-offset)fail('MODEL_RESOURCE_RANGE_INVALID');
   const abort=new AbortController();active.add(abort);
   const propagate=()=>abort.abort();signal?.addEventListener('abort',propagate,{once:true});
   let rejectAbort;
   const interrupted=new Promise((_,reject)=>{rejectAbort=()=>reject(Error('MODEL_RESOURCE_CANCELLED'));abort.signal.addEventListener('abort',rejectAbort,{once:true});});
   try{
    cancelled(signal);
    const value=await Promise.race([Promise.resolve().then(()=>{cancelled(abort.signal);return read({offset,byteLength:length,signal:abort.signal});}),interrupted]);
    cancelled(abort.signal);if(closed)fail('MODEL_RESOURCE_CLOSED');
    const bytes=copyBytes(value);if(bytes.byteLength!==length)fail('MODEL_RESOURCE_READ_SIZE_MISMATCH');return bytes;
   }finally{active.delete(abort);signal?.removeEventListener('abort',propagate);abort.signal.removeEventListener('abort',rejectAbort);}
  },
  close(){
   if(closing)return closing;closed=true;
   for(const pending of active)pending.abort();
   closing=Promise.resolve().then(close).catch(error=>{closing=undefined;throw error;});return closing;
  }
 });
}

/** Portable browser/device-storage adapter. The caller grants access to the Blob explicitly. */
export function createBlobModelResource(blob,{resourceId,maxReadBytes}={}){
 if(!blob||!integer(blob.size,1,Number.MAX_SAFE_INTEGER)||typeof blob.slice!=='function')fail('MODEL_RESOURCE_BLOB_INVALID');
 return createDeviceLocalModelResource({resourceId,byteLength:blob.size,maxReadBytes,
  read:async({offset,byteLength,signal})=>{cancelled(signal);const bytes=await blob.slice(offset,offset+byteLength).arrayBuffer();cancelled(signal);return bytes;}});
}

export async function modelBytesSha256(bytes){
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
}

/**
 * Called only after the dispatcher's request-bound Runtime grant has been checked.
 * A reader's claimed digest is never authority. The Runtime-owned verifier must
 * compare this digest and the tensor/row-to-byte mapping with independently
 * admitted model-range evidence and return
 * a correlated receipt. This is verification consumption, not verifier creation.
 */
export async function readAdmittedModelTensor({grant,resource,tensor,name,start,rows,signal}={}){
 const source=grant?.modelSource;
 if(source?.kind!=='DEVICE_LOCAL_READONLY_GGUF'||source.resource!==resource||typeof source.verifyRead!=='function'||
  source.requestHash!==grant.requestHash||source.modelSha256!==grant.modelSha256||source.resourceId!==resource?.resourceId||
  source.byteLength!==resource?.byteLength||source.maxReadBytes!==resource?.maxReadBytes||!sha(source.readReceiptSha256))fail('MODEL_LOCAL_RESOURCE_NOT_ADMITTED');
 if(!tensor||tensor.name!==name||!Array.isArray(tensor.shape)||!integer(tensor.shape[0],1,Number.MAX_SAFE_INTEGER)||
  !integer(tensor.elements,1,Number.MAX_SAFE_INTEGER)||!integer(tensor.bytes,1,Number.MAX_SAFE_INTEGER)||
  !integer(tensor.fileOffset,0,Number.MAX_SAFE_INTEGER))fail('MODEL_RESOURCE_TENSOR_LAYOUT_INVALID');
 const totalRows=tensor.elements/tensor.shape[0],stride=tensor.bytes/totalRows;
 if(!integer(totalRows,1,Number.MAX_SAFE_INTEGER)||!integer(stride,1,Number.MAX_SAFE_INTEGER)||
  !integer(start,0,totalRows-1)||!integer(rows,1,totalRows-start))fail('MODEL_RESOURCE_TENSOR_RANGE_INVALID');
 const offset=tensor.fileOffset+start*stride,byteLength=rows*stride;
 if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(byteLength)||tensor.bytes>source.byteLength-tensor.fileOffset)fail('MODEL_RESOURCE_TENSOR_LAYOUT_INVALID');
 cancelled(signal);const verify=source.verifyRead;
 if(!integer(byteLength,1,source.maxReadBytes)||offset<0||byteLength>source.byteLength-offset)fail('MODEL_RESOURCE_RANGE_INVALID');
 const bytes=copyBytes(await withCancellation(()=>resource.read({offset,byteLength,signal}),signal));cancelled(signal);
 if(bytes.byteLength!==byteLength)fail('MODEL_RESOURCE_READ_SIZE_MISMATCH');
 const digest=await modelBytesSha256(bytes);cancelled(signal);
 const proof=Object.freeze({requestHash:grant.requestHash,modelSha256:grant.modelSha256,resourceId:source.resourceId,
  sourceReceiptSha256:source.readReceiptSha256,tensor:name,rowStart:start,rowCount:rows,offset,byteLength,sha256:digest});
 const receipt=await withCancellation(()=>verify(proof,{signal}),signal);cancelled(signal);
 if(grant.modelSource!==source||source.resource!==resource||source.verifyRead!==verify)fail('MODEL_RESOURCE_PROVIDER_CHANGED');
 if(receipt?.verified!==true||!sha(receipt.receiptSha256)||Object.entries(proof).some(([key,value])=>receipt[key]!==value))fail('MODEL_RESOURCE_READ_UNVERIFIED');
 return bytes.buffer;
}
