/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.LOCAL_MODEL_SMOKE.G6
WHAT: Execute an existing C-drive GGUF with the existing real LeeWay inference bridge and dispatcher.
WHY: Separate actual generated conversation from simulated clients and unbound WebGPU ML routes.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS EXECUTE VERIFY.
WHERE: Existing GPU candidate, existing installed llama-server, explicit local model, loopback only.
WHEN: Explicit diagnostic. HOW: Hash source/model, bounded prompts, preserve responses, stop owned process.
LICENSE: MIT. No model download, new inference implementation, GPU-driver or voice-selection change.
*/
import fs from 'node:fs';import path from 'node:path';import net from 'node:net';import crypto from 'node:crypto';
import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
for(const k of ['--evidence','--manifest','--server'])if(!args.includes(k))throw Error('MISSING_ARGUMENT:'+k);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evidence=path.resolve(arg('--evidence'));fs.mkdirSync(evidence,{recursive:true});
const manifestPath=path.resolve(arg('--manifest')),binary=path.resolve(arg('--server'));
const hashFile=async file=>{const hash=crypto.createHash('sha256');for await(const part of fs.createReadStream(file))hash.update(part);return hash.digest('hex');};
const digest=text=>crypto.createHash('sha256').update(text).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const origin=execFileSync('git',['-C',root,'remote','get-url','origin'],{encoding:'utf8'}).trim();
assert.equal(origin,'https://github.com/4citeB4U/LeeWay-Edge-GPU.git');
const report={schema:'leeway.local-model-smoke.g6',startedUtc:new Date().toISOString(),sourceOrigin:origin,
 sourceCommit:execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 scope:'LOCAL_MODEL_BRIDGE_COMPONENT_TEST_NOT_GPU_ACCELERATION_OR_C3',turns:[],
 formulaExecution:'NOT_EXECUTED',ldwmdBinding:'NOT_EXERCISED',nativeModelRuntime:'LLAMA_CPP',
 leewayTensorKernelsUsed:false,cloudInference:false,modelDownloaded:false,voiceSelectionChanged:false,
 learningLedger:'NOT_UPDATED',canonicalVeritasReceipt:'NOT_CREATED'};
let client,owned,serverOutput='',serverError='',deadline,sourceHashes={};
const safeGet=async url=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(3000),redirect:'error'});return {httpStatus:r.status,body:await r.json()};}catch(error){return {state:'UNAVAILABLE',error:error.message};}};
try{
 const selected=JSON.parse(fs.readFileSync(manifestPath,'utf8').replace(/^\uFEFF/,''));
 const model=selected.layers.find(x=>x.mediaType==='application/vnd.ollama.image.model');
 assert(model&&/^sha256:[a-f0-9]{64}$/.test(model.digest));assert(model.size<=1024*1024*1024,'Bounded test model exceeds 1 GiB');
 const modelRoot=process.env.LEEWAY_TEST_OLLAMA_MODEL_ROOT;assert(modelRoot,'Explicit existing model root required');
 const modelPath=path.join(modelRoot,'blobs',model.digest.replace(':','-'));
 assert.equal(fs.statSync(modelPath).size,model.size);
 console.log('VERIFY_EXISTING_MODEL '+modelPath);
 const modelHash=await hashFile(modelPath);assert.equal(modelHash,model.digest.slice(7));
 const bridgePath=path.join(root,'LeeWay-Standards/src/core/inference-client.js');
 const paths=['core/hybrid.dispatcher.js','control/gpu.controller.bridge.js','dispatch/tensor.dispatch.mjs','shaders/tensor-gemm.wgsl.js','LeeWay-Standards/src/core/inference-client.js','leeway-agents/src/core/LeewayInferenceClient.ts'];
 for(const relative of paths)sourceHashes[relative]=await hashFile(path.join(root,relative));
 report.model={manifestPath,manifestSha256:await hashFile(manifestPath),path:modelPath,sha256:modelHash,bytes:model.size,label:'qwen2.5:0.5b',selectionReason:'Existing smallest discovered conversational model for bounded local test'};
 report.executable={path:binary,sha256:await hashFile(binary)};
 report.sourceHashesBefore=sourceHashes;
 const {HybridDispatcher}=await import(pathToFileURL(path.join(root,'core/hybrid.dispatcher.js')).href);
 const {executeGPU}=await import(pathToFileURL(path.join(root,'control/gpu.controller.bridge.js')).href);
 const {LeewayInferenceClient}=await import(pathToFileURL(bridgePath).href);
 const probe=net.createServer();await new Promise((r,j)=>{probe.once('error',j);probe.listen(0,'127.0.0.1',r);});const port=probe.address().port;await new Promise(r=>probe.close(r));
 // Configuration of the existing instance only; no source mutation or server lifecycle replacement.
 client=new LeewayInferenceClient({modelPath,host:'127.0.0.1',port,
  systemPrompt:'You are a local assistant participating in a diagnostic conversation. Reply in English in one short sentence, fewer than forty words. Do not claim hardware access or tool execution. Use only the conversation supplied.'});
 client.serverBinary=binary;
 let lastExchange=null;
 const originalPost=client._httpPost.bind(client);
 client._httpPost=async (route,body)=>{const raw=await originalPost(route,body);lastExchange={route,request:body,response:JSON.parse(raw)};return raw;};
 const started=performance.now();const boot=client.startServer();owned=client.serverProcess;
 assert(owned?.pid,'Existing bridge did not create a model process');
 owned.stdout.on('data',b=>{serverOutput+=b;});owned.stderr.on('data',b=>{serverError+=b;});
 owned.once('error',error=>{serverError+='\nSPAWN_ERROR '+error.message;});
 let stopForDeadline;
 const deadlineFailure=new Promise((_,reject)=>{stopForDeadline=reject;});
 deadline=setTimeout(()=>{client.shutdown();stopForDeadline(Error('MODEL_TEST_90_SECOND_DEADLINE'));},90000);
 await Promise.race([boot,deadlineFailure]);
 const health=await safeGet('http://127.0.0.1:'+port+'/health');assert.equal(health.httpStatus,200);assert.equal(health.body.status,'ok');
 report.startup={hostMs:performance.now()-started,pid:owned.pid,port,health,spawnArgs:owned.spawnargs};
 assert(owned.spawnargs.includes('--n-gpu-layers'));assert.equal(owned.spawnargs[owned.spawnargs.indexOf('--n-gpu-layers')+1],'0');
 report.backend='CPU_EXPLICIT_IN_EXISTING_BRIDGE';
 let providerCalls=0;
 const dispatcher=new HybridDispatcher({cpu:{run:async task=>{providerCalls++;return client.generate(task.prompt,task.context||[]);}}});
 const prompts=[
  {id:'arithmetic',prompt:'A delivery van has 12 packages and delivers 5. How many remain? Answer in one short sentence.',context:[],check:text=>/\b(7|seven)\b/i.test(text)},
  {id:'context-write',prompt:'For this conversation the delivery destination is Milwaukee. Remember that destination. Reply with one short acknowledgement that includes the city name.',context:[],check:text=>/Milwaukee/i.test(text)},
  {id:'context-followup',prompt:'What delivery destination did I give you? Answer only with the city name.',context:null,check:text=>/Milwaukee/i.test(text)}
 ];
 for(const item of prompts){
  if(item.id==='context-followup'){const before=report.turns.find(x=>x.id==='context-write');item.context=[{role:'user',content:before.prompt},{role:'assistant',content:before.response}];}
  lastExchange=null;const ctx={capability:'CPU'};const before=performance.now();
  const result=await Promise.race([executeGPU({TAG:'LEEWAY.TEST.LOCAL_MODEL_CONVERSATION',metadata:{modelSha256:modelHash,promptId:item.id,backend:'CPU'},run:()=>dispatcher.dispatch({type:'AI_INFERENCE',prompt:item.prompt,context:item.context},ctx)},{approve:async task=>task.metadata.modelSha256===modelHash&&task.TAG==='LEEWAY.TEST.LOCAL_MODEL_CONVERSATION'}),deadlineFailure]);
  assert(lastExchange?.response?.choices?.[0]?.message?.content,'No actual server-generated choice; reject canned fallback');
  assert.equal(result,lastExchange.response.choices[0].message.content.trim());
  assert(lastExchange.response.usage?.completion_tokens>0,'No generated-token evidence');
  assert.notEqual(result,'The pathways are forming, maestro. I am here.');
  const usage=lastExchange.response.usage,timings=lastExchange.response.timings||null;
  const turn={id:item.id,prompt:item.prompt,response:result,hostElapsedMs:performance.now()-before,
   contextMessages:item.context,route:ctx.executionPath,usage,timings,contentCheck:item.check(result)?'PASS':'FAIL',
   rawResponseSha256:digest(JSON.stringify(lastExchange.response)),generatedByModel:true};
  report.turns.push(turn);fs.writeFileSync(path.join(evidence,item.id+'-exchange.json'),JSON.stringify(lastExchange,null,2));
  console.log(JSON.stringify(turn,null,2));
 }
 // Negative contract probe: requesting a slot is NOT evidence that WebGPU executed.
 const prior=providerCalls;const ctx={capability:'WEBGPU'};
 try{await dispatcher.dispatch({type:'AI_INFERENCE',prompt:'Do not execute: provider-binding probe'},ctx);throw Error('Unexpected ML provider execution');}
 catch(error){assert.equal(ctx.executionPath,'ML');assert(error instanceof TypeError && /run/.test(error.message),'Unexpected ML probe error');report.gpuInferenceGate={state:'BLOCKED_UNBOUND_ML_PROVIDER',selectedPath:ctx.executionPath,error:error.message,providerCallsDuringProbe:providerCalls-prior,actualWebGpuExecution:false};}
 assert.equal(providerCalls-prior,0);
 report.voice={binding:await safeGet('http://127.0.0.1:8890/voice/binding'),providerHealth:await safeGet('http://127.0.0.1:8878/health'),audioGenerated:false,audioPlayed:false,substituteVoiceUsed:false};
 report.outcome=report.turns.every(t=>t.contentCheck==='PASS')?'PASS_LOCAL_CPU_MODEL_CONVERSATION_GPU_BINDING_BLOCKED':'MODEL_EXECUTED_WITH_CONTENT_CHECK_FAILURE';
 if(report.turns.some(t=>t.contentCheck!=='PASS'))process.exitCode=1;
 report.providerCalls=providerCalls;
 for(const [rel,h]of Object.entries(sourceHashes))assert.equal(await hashFile(path.join(root,rel)),h,'Source changed during test');
 assert.equal(await hashFile(modelPath),modelHash,'Model changed during test');
 report.modelAndSourceUnchanged=true;
}catch(error){report.outcome='FAILED_OR_BLOCKED';report.error=error.stack;process.exitCode=1;}
finally{
 clearTimeout(deadline);if(client)client.shutdown();
 if(owned){for(let i=0;i<50&&owned.exitCode===null&&owned.signalCode===null;i++)await sleep(100);report.ownedProcess={pid:owned.pid,exitCode:owned.exitCode,signalCode:owned.signalCode,stopped:owned.exitCode!==null||owned.signalCode!==null};}
 fs.writeFileSync(path.join(evidence,'model-server-stdout.txt'),serverOutput);fs.writeFileSync(path.join(evidence,'model-server-stderr.txt'),serverError);
 report.backendLogEvidence=serverError.split(/\r?\n/).filter(l=>/CPU|CUDA|Vulkan|offload|model size|model type|n_threads|n_ctx|Qwen|file type|architecture|buffer size/i.test(l)).slice(0,50);
 report.endedUtc=new Date().toISOString();report.testScriptSha256=await hashFile(fileURLToPath(import.meta.url));
 const output=path.join(evidence,'local-model-results.json');fs.writeFileSync(output,JSON.stringify(report,null,2));
 console.log(JSON.stringify({outcome:report.outcome,error:report.error,backend:report.backend,model:report.model?.label,turns:report.turns.length,
  gpuInferenceGate:report.gpuInferenceGate,voice:report.voice,cleanup:report.ownedProcess,evidence,reportSha256:await hashFile(output)},null,2));
}
