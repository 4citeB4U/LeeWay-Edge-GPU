/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.GGUF_INSPECTION.G7
WHAT: Inspect actual local model files with the new bounded reader.
WHY: Derive operator/format requirements without starting another inference runtime.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS VERIFY.
WHERE: Explicit local model root. WHEN: Saved authority-script invocation.
HOW: Manifest hash verification, bounded metadata parsing, exact tensor inventory. LICENSE: MIT
*/
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {GgufReader} from '../../sdk/gguf-reader.mjs';
const [modelRoot,evidence]=process.argv.slice(2);if(!modelRoot||!evidence)throw Error('MODEL_ROOT_AND_EVIDENCE_REQUIRED');
fs.mkdirSync(evidence,{recursive:true});
const hashFile=async p=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(p,{highWaterMark:4*1024*1024}))h.update(b);return h.digest('hex');};
const reports=[];
for(const [label,rel]of [['qwen2.5:0.5b','qwen2.5/0.5b'],['gemma4:e4b','gemma4/e4b']]){
 const manifestFile=path.join(modelRoot,'manifests/registry.ollama.ai/library',rel);
 const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));const layer=manifest.layers.find(l=>l.mediaType==='application/vnd.ollama.image.model');
 if(!layer||!/^sha256:[0-9a-f]{64}$/.test(layer.digest))throw Error('MODEL_MANIFEST_INVALID');
 const file=path.join(modelRoot,'blobs',layer.digest.replace(':','-'));if(fs.statSync(file).size!==layer.size)throw Error('MODEL_SIZE_MISMATCH');
 console.log('HASH_EXISTING_MODEL '+label);const hash=await hashFile(file);if(hash!==layer.digest.slice(7))throw Error('MODEL_HASH_MISMATCH');
 const r=new GgufReader(file,{retainTokenizer:false});
 try{
  const summary={label,file,bytes:r.fileSize,sha256:hash,architecture:r.metadata['general.architecture'],headerBytes:r.headerBytes,dataOffset:r.dataOffset,
   metadata:r.metadata,arrayLengths:r.arrayLengths,tensors:r.tensors,
   formats:r.tensors.reduce((o,t)=>{o[t.typeName]=(o[t.typeName]||0)+1;return o;},{}),
   largestTensors:r.tensors.slice().sort((a,b)=>(b.bytes||0)-(a.bytes||0)).slice(0,8)};
  reports.push(summary);fs.writeFileSync(path.join(evidence,rel.replace('/','-')+'-inventory.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify({label,bytes:r.fileSize,sha256:hash,metadata:Object.fromEntries(Object.entries(r.metadata).filter(([k,v])=>!k.startsWith('tokenizer.')||k==='tokenizer.ggml.model'||k==='tokenizer.ggml.pre')),tokenizerArraySizes:r.arrayLengths,formats:summary.formats,largestTensors:summary.largestTensors,firstLayer:r.tensors.filter(t=>/^blk\.0\./.test(t.name))},null,2));
 }finally{r.close();}
}
fs.writeFileSync(path.join(evidence,'model-inventory.json'),JSON.stringify({observedAt:new Date().toISOString(),models:reports,externalInferenceRuntimeStarted:false},null,2));
