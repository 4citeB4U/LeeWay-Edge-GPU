/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.OWNED_INFERENCE_RUNNER.G7
WHAT: Run real model operators and LeeWay inference in an isolated hardware-backed browser.
WHY: No Ollama, llama.cpp, Transformers or other inference executor may stand in for LeeWay execution.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS EXECUTE VERIFY.
WHERE: Exact existing model and canonical source, ephemeral authenticated loopback asset service.
WHEN: Explicit local test. HOW: Read-only bounded tensor ranges, own WGSL dispatch, captured result and cleanup.
LICENSE: MIT. No external inference endpoint, downloads, system-driver or production changes.
*/
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import crypto from 'node:crypto';
import {createRequire} from 'node:module';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
import {GgufReader,GGUF_TYPES} from '../../sdk/gguf-reader.mjs';
import {decodeReference,referenceMatVec} from './quantized-reference.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evidence=path.resolve(arg('--evidence'));fs.mkdirSync(evidence,{recursive:true});
const stage=arg('--stage','operators'),label=arg('--model','qwen2.5:0.5b');if(!['operators','infer'].includes(stage))throw Error('INVALID_STAGE');
const inventory=JSON.parse(fs.readFileSync(arg('--inventory'),'utf8').replace(/^\uFEFF/,''));
const model=inventory.models.find(m=>m.label===label);if(!model||!['qwen2','gemma4'].includes(model.architecture))throw Error('MODEL_NOT_IN_VERIFIED_INVENTORY');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const stat=fs.statSync(model.file);if(stat.size!==model.bytes)throw Error('MODEL_SIZE_CHANGED');
const manifestName=label==='qwen2.5:0.5b'?'qwen2.5/0.5b':'gemma4/e4b';
const manifest=JSON.parse(fs.readFileSync(path.join(path.dirname(path.dirname(model.file)),'manifests/registry.ollama.ai/library',manifestName),'utf8'));
if(!manifest.layers.some(l=>l.mediaType==='application/vnd.ollama.image.model'&&l.digest==='sha256:'+model.sha256))throw Error('MODEL_MANIFEST_CHANGED');
const actualHash=crypto.createHash('sha256');for await(const b of fs.createReadStream(model.file,{highWaterMark:4*1024*1024}))actualHash.update(b);if(actualHash.digest('hex')!==model.sha256)throw Error('MODEL_CONTENT_CHANGED');
const reader=new GgufReader(model.file,{retainTokenizer:stage==='infer'});
const nonce=crypto.randomBytes(24).toString('hex');const prefix='/'+nonce+'/';
const sourceReads=new Map();const rangeLog=[];let totalReadBytes=0,maxReadBytes=0,server,browser,page,expectedHost;
const report={schema:'leeway.owned-model-execution.g7',stage,model:label,modelSha256:model.sha256,modelBytes:model.bytes,architecture:model.architecture,
 startedAt:new Date().toISOString(),neuralComputeImplementation:'LEEWAY_WGSL',externalInferenceEngineStarted:false,cpuNeuralFallback:false,formulaExecution:'NOT_EXECUTED',productionLdWmdBinding:false,canonicalC3Acceptance:false,learningLedger:'NOT_UPDATED'};
const samples=[];
for(const type of [...new Set(reader.tensors.map(t=>t.type))]){
 if(![0,1,2,6,8,12,14,30].includes(type))continue;
 const candidates=reader.tensors.filter(t=>t.type===type&&t.shape[0]<=32768);
 const tensor=candidates.find(t=>t.name==='per_layer_token_embd.weight')||candidates.find(t=>/^blk\.0\./.test(t.name)&&t.shape.length===2)||candidates.find(t=>/^blk\.0\./.test(t.name))||candidates[0];
 const allRows=tensor.elements/tensor.shape[0],rows=Math.min(4,allRows),start=tensor.name==='per_layer_token_embd.weight'?100000:Math.min(17,allRows-rows);
 const range=reader.readTensorRows(tensor.name,start,rows),count=tensor.shape[0]*rows;
 const expected=decodeReference(range.data,type,count),input=Float32Array.from({length:tensor.shape[0]},(_,i)=>(i%19-9)/32);
 samples.push({index:samples.length,name:tensor.name,type,typeName:tensor.typeName,rows,columns:tensor.shape[0],count,sha256:range.sha256,fileOffset:tensor.fileOffset+start*range.stride,
  expected:Array.from(expected),input:Array.from(input),matvec:Array.from(referenceMatVec(expected,input,rows)),bytes:range.data});
}
let tokenizer,plan;
if(stage==='infer'){
 const {GgufTokenizer}=await import('../../sdk/gguf-tokenizer.mjs');tokenizer=new GgufTokenizer(reader.metadata);
 const userText=arg('--prompt','What is 2 + 2? Reply with one number.');
 const prompt=tokenizer.chatPrompt(userText);const tokens=tokenizer.encode(prompt,{special:true});
 if(tokens.length<2||tokens.length>192)throw Error('PROMPT_TOKEN_BUDGET');
 plan={metadata:Object.fromEntries(Object.entries(reader.metadata).filter(([k])=>!/^tokenizer\.ggml\.(tokens|merges|scores|token_type)$/.test(k))),
  tensors:reader.tensors,modelSha256:model.sha256,inputTokens:tokens,prompt,promptText:userText,maxNewTokens:Math.min(64,Number(arg('--max-tokens','24'))),contextLimit:256};
 report.tokenization={prompt,promptText:userText,inputIds:tokens,roundtrip:tokenizer.decode(tokens,{special:true}),backend:'LEEWAY_JAVASCRIPT_TOKENIZER'};
}
const dependencies=path.join(process.env.USERPROFILE,'workspaces/Leeway-Maps/package.json');
const requireInstalled=createRequire(pathToFileURL(dependencies));const puppetModule=await import(pathToFileURL(requireInstalled.resolve('puppeteer')).href);const puppeteer=puppetModule.default||puppetModule;
function json(res,value){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));}
try{
 server=http.createServer((req,res)=>{
  try{
   if(req.method!=='GET'||req.headers.host!==expectedHost||(req.headers.origin&&req.headers.origin!=='http://'+expectedHost)){res.writeHead(403);return res.end();}
   const url=new URL(req.url,'http://'+expectedHost);if(!url.pathname.startsWith(prefix)){res.writeHead(403);return res.end();}
   res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
   res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'");
   const p=decodeURIComponent(url.pathname.slice(prefix.length));
   if(p===''){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>LeeWay-owned model qualification</title><h1>Local LeeWay GPU model test</h1><pre id="status">Running bounded numerical checks...</pre>');}
   if(p==='samples')return json(res,samples.map(({bytes,...s})=>s));
   if(p==='sample-bytes'){const index=Number(url.searchParams.get('index'));if(!Number.isInteger(index)||!samples[index])throw Error('SAMPLE_INDEX');res.setHeader('Content-Type','application/octet-stream');return res.end(samples[index].bytes);}
   if(p==='plan'){if(!plan)throw Error('INFERENCE_NOT_REQUESTED');return json(res,plan);}
   if(p==='tensor'){
    if(stage!=='infer')throw Error('INFERENCE_NOT_REQUESTED');const name=url.searchParams.get('name'),start=Number(url.searchParams.get('start')),rows=Number(url.searchParams.get('rows'));
    if(!name||!reader.byName.has(name)||(!/^blk\./.test(name)&&!['token_embd.weight','output.weight','output_norm.weight','per_layer_token_embd.weight','per_layer_model_proj.weight','per_layer_proj_norm.weight','rope_freqs.weight'].includes(name)))throw Error('TENSOR_NOT_IN_TEXT_SCOPE');
    const range=reader.readTensorRows(name,start,rows);totalReadBytes+=range.data.byteLength;maxReadBytes=Math.max(maxReadBytes,range.data.byteLength);
    if(rangeLog.length<6000)rangeLog.push({name,start,rows,bytes:range.data.byteLength,sha256:range.sha256});
    res.setHeader('Content-Type','application/octet-stream');res.setHeader('X-Content-SHA256',range.sha256);return res.end(range.data);
   }
   if(p.startsWith('code/')){
    const rel=p.slice(5);if(!/^(sdk|core|dispatch|buffers|pipeline|shaders|control|tests\/virtual-gpu)\/[A-Za-z0-9_.-]+\.(?:mjs|js)$/.test(rel))throw Error('SOURCE_PATH_DENIED');
    const file=path.join(root,rel),bytes=fs.readFileSync(file);if(bytes.length>512*1024)throw Error('SOURCE_SIZE_DENIED');sourceReads.set(rel,hash(bytes));res.setHeader('Content-Type','text/javascript');return res.end(bytes);
   }
   res.writeHead(404);res.end();
  }catch(error){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}
 });
 await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});expectedHost='127.0.0.1:'+server.address().port;const base='http://'+expectedHost+prefix;
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,protocolTimeout:600000,
  userDataDir:path.join(evidence,'browser-profile'),args:['--force-high-performance-gpu','--no-first-run','--no-default-browser-check','--mute-audio']});
 page=await browser.newPage();await page.setRequestInterception(true);page.on('request',r=>{if(new URL(r.url()).origin!=='http://'+expectedHost)r.abort();else r.continue();});
 page.on('console',m=>{if(m.type()==='log')console.log('GPU_PROGRESS '+m.text());});page.on('pageerror',e=>console.error('BROWSER_ERROR '+e.message));
 await page.goto(base,{waitUntil:'load'});
 const result=await page.evaluate(async({base,stage})=>{
  const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});if(!adapter)throw Error('WEBGPU_REQUIRED_NO_CPU_FALLBACK');
  const info={vendor:adapter.info.vendor,architecture:adapter.info.architecture,isFallbackAdapter:adapter.info.isFallbackAdapter};
  if(info.vendor!=='nvidia'||info.isFallbackAdapter)throw Error('REQUESTED_HARDWARE_NOT_CONFIRMED');
  const device=await adapter.requestDevice();const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
  try{
   const {runOperatorTests}=await import(base+'code/tests/virtual-gpu/model-browser-tests.mjs');
   const operators=await runOperatorTests({device,base});console.log('OPERATORS '+operators.passed+'/'+operators.total);
   if(operators.passed!==operators.total)return {adapter:info,operators,outcome:'FAIL_OPERATOR_GATE',uncaptured:errors};
   if(stage==='operators')return {adapter:info,operators,outcome:'PASS_REAL_WEIGHT_OPERATOR_GATE',uncaptured:errors};
   const {runModel}=await import(base+'code/core/transformer-inference.mjs');
   const plan=await fetch(base+'plan').then(r=>r.json());const inference=await runModel({device,base,plan});
   return {adapter:info,operators,inference,outcome:'INFERENCE_EXECUTED_SEE_OUTPUT_AND_SCOPE',uncaptured:errors};
  }finally{device.destroy();}
 },{base,stage});
 Object.assign(report,result);
 if(result.inference){report.outputText=tokenizer.decode(result.inference.outputIds);report.inputText=plan.promptText;console.log('MODEL_GENERATED '+JSON.stringify(report.outputText));}
 if(result.operators.passed!==result.operators.total||result.uncaptured.length)process.exitCode=1;
 await page.screenshot({path:path.join(evidence,'operator-test.png')});
}catch(error){report.outcome='FAILED_OR_BLOCKED';report.error=error.stack;process.exitCode=1;}
finally{
 try{await browser?.close();}catch{}if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}reader.close();
 report.finishedAt=new Date().toISOString();report.sourceHashes=Object.fromEntries(sourceReads);report.tensorIo={totalReadBytes,maxReadBytes,requests:rangeLog.length};
 report.modelSizeUnchanged=fs.statSync(model.file).size===stat.size;report.modelMtimeUnchanged=fs.statSync(model.file).mtimeMs===stat.mtimeMs;
 report.ownedBrowserClosed=true;report.ownedReadOnlyServerClosed=true;
 fs.writeFileSync(path.join(evidence,'tensor-range-evidence.json'),JSON.stringify(rangeLog,null,2));
 const file=path.join(evidence,'lee-only-inference-results.json');fs.writeFileSync(file,JSON.stringify(report,null,2));
 console.log(JSON.stringify({outcome:report.outcome,model:label,adapter:report.adapter,operators:report.operators,inference:report.inference,outputText:report.outputText,error:report.error,tensorIo:report.tensorIo,evidence,sha256:hash(fs.readFileSync(file))},null,2));
}
