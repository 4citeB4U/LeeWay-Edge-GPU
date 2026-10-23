/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.NATIVE_MODEL_CONTROL.G6
WHAT: Run the already-installed Ollama runtime as an explicitly separate native GPU control.
WHY: Distinguish local model/hardware viability from LeeWay's unbound WebGPU inference provider.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS EXECUTE VERIFY.
WHERE: Installed runtime and verified local model, isolated loopback listener.
WHEN: Explicit comparison only. HOW: No-cloud child environment, streaming chat, runtime allocation/log evidence, unload/stop.
LICENSE: MIT. No claimed LeeWay tensor execution, production provider binding, download, voice or driver change.
*/
import fs from 'node:fs';import path from 'node:path';import net from 'node:net';import crypto from 'node:crypto';
import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const argv=process.argv.slice(2),arg=k=>argv[argv.indexOf(k)+1];
for(const k of ['--evidence','--cpu-report','--ollama'])assert(argv.includes(k),'Missing '+k);
const evidence=path.resolve(arg('--evidence'));fs.mkdirSync(evidence,{recursive:true});
const cpuFile=path.resolve(arg('--cpu-report')),cpu=JSON.parse(fs.readFileSync(cpuFile,'utf8'));
assert.equal(cpu.outcome,'PASS_LOCAL_CPU_MODEL_CONVERSATION_GPU_BINDING_BLOCKED');
const hashFile=async p=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(p))h.update(b);return h.digest('hex');};
assert.equal(await hashFile(cpu.model.path),cpu.model.sha256);
const executable=path.resolve(arg('--ollama'));assert(fs.existsSync(executable));
const probe=net.createServer();await new Promise((r,j)=>{probe.once('error',j);probe.listen(0,'127.0.0.1',r);});
const port=probe.address().port;await new Promise(r=>probe.close(r));
const host='http://127.0.0.1:'+port;
const env={...process.env,OLLAMA_HOST:'127.0.0.1:'+port,OLLAMA_MODELS:path.dirname(path.dirname(cpu.model.path)),OLLAMA_NO_CLOUD:'1',OLLAMA_NUM_PARALLEL:'1',OLLAMA_MAX_LOADED_MODELS:'1',OLLAMA_CONTEXT_LENGTH:'1024',OLLAMA_KEEP_ALIVE:'30s',OLLAMA_LOAD_TIMEOUT:'30s'};
for(const k of ['OLLAMA_API_KEY','HF_TOKEN','HUGGING_FACE_HUB_TOKEN','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY'])delete env[k];
const processHandle=spawn(executable,['serve'],{env,stdio:['ignore','pipe','pipe'],windowsHide:true});
let log='',spawnError=null;processHandle.stdout.on('data',b=>{log+=b;});processHandle.stderr.on('data',b=>{log+=b;});processHandle.on('error',e=>{spawnError=e;});
const report={schema:'leeway.native-model-control.g6',startedUtc:new Date().toISOString(),scope:'NATIVE_OLLAMA_CONTROL_NOT_LEEWAY_GPU_ACCELERATION',
 model:cpu.model.label,modelSha256:cpu.model.sha256,executable,executableSha256:await hashFile(executable),cpuReportSha256:await hashFile(cpuFile),port,pid:processHandle.pid,
 cloudDisabledRequested:true,modelDownloaded:false,leewayTensorKernelsUsed:false,formulaExecution:'NOT_EXECUTED',ldwmdBinding:'NOT_EXERCISED',turns:[],audioGenerated:false,learningLedger:'NOT_UPDATED'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const call=async(route,body,timeout=30000)=>{const r=await fetch(host+route,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(timeout),redirect:'error'});if(!r.ok)throw Error('OLLAMA_HTTP_'+r.status+':'+(await r.text()).slice(0,500));return r;};
const controller=new AbortController();const deadline=setTimeout(()=>controller.abort(),90000);
try{
 let ready=false;
 for(let i=0;i<60;i++){
  if(spawnError)throw spawnError;if(processHandle.exitCode!==null)throw Error('OWN_OLLAMA_EXITED');
  try{report.version=await (await call('/api/version',undefined,1000)).json();ready=true;break;}catch{await sleep(200);}
 }
 assert(ready,'Native runtime did not start');
 const tags=await (await call('/api/tags')).json();assert(tags.models.some(x=>x.name===cpu.model.label),'Existing local tag not available; no pull attempted');
 report.loadedBefore=await (await call('/api/ps')).json();assert.equal(report.loadedBefore.models.length,0,'Fresh native test server has unexpected loaded models');
 const messages=[{role:'system',content:'You are a local assistant in a diagnostic conversation. Respond in one short English sentence. Do not claim hardware access or tool execution.'}];
 for(const [index,prompt]of [
  'A delivery van has 12 packages and delivers 5. How many remain? Answer in one short sentence.',
  'For this conversation the delivery destination is Milwaukee. Reply with a short acknowledgement that includes the city name.',
  'What delivery destination did I give you? Answer only with the city name.'
 ].entries()){
  messages.push({role:'user',content:prompt});
  const started=performance.now(),request={model:cpu.model.label,messages,stream:true,keep_alive:'30s',options:{num_ctx:1024,num_predict:80,num_thread:4,temperature:0,seed:69}};
  const response=await fetch(host+'/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)]),redirect:'error'});
  assert(response.ok,'Native model HTTP failure '+response.status);
  let buffer='',text='',firstTokenMs=null,last,events=[];const decoder=new TextDecoder();
  for await(const bytes of response.body){buffer+=decoder.decode(bytes,{stream:true});let split;while((split=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,split).trim();buffer=buffer.slice(split+1);if(!line)continue;const item=JSON.parse(line);if(item.error)throw Error(item.error);events.push(item);if(item.message?.content){firstTokenMs??=performance.now()-started;text+=item.message.content;}if(item.done)last=item;}}
  assert(last?.done&&text.trim()&&last.eval_count>0,'No completed model response');
  messages.push({role:'assistant',content:text});
  const observation={index,prompt,response:text,firstTokenMs,hostElapsedMs:performance.now()-started,generatedTokens:last.eval_count,
   tokenGenerationMs:last.eval_duration/1e6,serverReportedTokensPerSecond:last.eval_count/(last.eval_duration/1e9),loadMs:last.load_duration/1e6,
   contentCheck:(index===0?/\b(7|seven)\b/i:/Milwaukee/i).test(text)?'PASS':'FAIL',doneReason:last.done_reason};
  report.turns.push(observation);console.log(JSON.stringify(observation,null,2));
  fs.writeFileSync(path.join(evidence,'native-chat-'+index+'.json'),JSON.stringify({request,events},null,2));
 }
 report.loadedDuring=await (await call('/api/ps')).json();
 report.processorDisplay=execFileSync(executable,['ps'],{env,encoding:'utf8',timeout:5000});
 report.nativeGpuEvidence=log.split(/\r?\n/).filter(l=>/CUDA|NVIDIA|Blackwell|offload|layers|inference compute|cloud disabled/i.test(l)).slice(-35);
 const loaded=report.loadedDuring.models.find(m=>m.name===cpu.model.label);
 report.nvidiaOffloadObserved=Boolean(loaded?.size_vram>0&&/NVIDIA.*RTX 5060|RTX 5060.*NVIDIA|name="?NVIDIA GeForce RTX 5060/i.test(log)&&/CUDA|library=cuda/.test(log));
 report.cloudDisabledConfirmed=/cloud disabled:\s*true/i.test(log);
 assert(report.cloudDisabledConfirmed,'Runtime did not confirm local-only mode');
 report.outcome=report.nvidiaOffloadObserved?'NATIVE_NVIDIA_INFERENCE_EXECUTED_NOT_LEEWAY_TENSOR':'NATIVE_INFERENCE_EXECUTED_GPU_ATTRIBUTION_UNVERIFIED';
 assert.equal(await hashFile(cpu.model.path),cpu.model.sha256);report.modelUnchanged=true;
}catch(error){report.outcome='FAILED_OR_BLOCKED';report.error=error.stack;process.exitCode=1;}
finally{
 clearTimeout(deadline);
 try{report.unload=await (await call('/api/generate',{model:cpu.model.label,keep_alive:0,stream:false},10000)).json();report.loadedAfter=await (await call('/api/ps')).json();}catch(error){report.unloadError=error.message;}
 if(processHandle.pid&&processHandle.exitCode===null){try{execFileSync('taskkill.exe',['/PID',String(processHandle.pid),'/T','/F'],{stdio:'pipe',timeout:10000});report.ownedProcessTreeStopRequested=true;}catch(error){report.stopError=error.message;}}
 for(let i=0;i<30&&processHandle.exitCode===null&&processHandle.signalCode===null;i++)await sleep(100);
 report.processStopped=processHandle.exitCode!==null||processHandle.signalCode!==null;
 report.endedUtc=new Date().toISOString();report.testScriptSha256=await hashFile(fileURLToPath(import.meta.url));
 fs.writeFileSync(path.join(evidence,'ollama-native-log.txt'),log);
 const file=path.join(evidence,'native-model-results.json');fs.writeFileSync(file,JSON.stringify(report,null,2));
 console.log(JSON.stringify({outcome:report.outcome,error:report.error,nvidiaOffloadObserved:report.nvidiaOffloadObserved,cloudDisabledConfirmed:report.cloudDisabledConfirmed,
  loadedDuring:report.loadedDuring,processorDisplay:report.processorDisplay,loadedAfter:report.loadedAfter,processStopped:report.processStopped,evidence,sha256:await hashFile(file)},null,2));
}
