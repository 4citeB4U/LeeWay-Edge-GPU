/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.INFERENCE_READINESS.G8
WHAT: Inspect actual canonical dependencies and real model headers without starting model execution.
WHY: A passing Formula fixture or local model graph is not a qualified inference-domain binding.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS VERIFY.
WHERE: Existing owner-bound Formula, Runtime Fabric and GPU sources; existing model files read-only.
WHEN: Explicit Governance stage. HOW: Hash bytes, inspect registered capabilities, compile pure metadata plans, retain gaps.
LICENSE: MIT. No native model server, CPU neural operation, cloud route, invented Formula history or driver registration.
*/
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {GgufReader} from '../../sdk/gguf-reader.mjs';
import {inspectTransformerPlan} from '../../core/transformer-inference.mjs';
import {FORMULA_ENGINE_SHA256} from '../../core/inference-contract.mjs';
const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
for(const k of ['--inventory','--evidence','--runtime-root','--memory-root'])assert(args.includes(k),'Argument required '+k);
const out=path.resolve(arg('--evidence'));fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fileHash=async p=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(p,{highWaterMark:4*1024*1024}))h.update(b);return h.digest('hex');};
const parse=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const report={schema:'leeway.exclusive-inference-readiness.g8',startedAt:new Date().toISOString(),models:[],gaps:[],
 inferenceExecuted:false,externalModelExecutorStarted:false,cpuNeuralMath:false,remoteInference:false,osDriverInstalled:false,
 formulaExecution:'NOT_EXECUTED',canonicalVeritasReceipt:'NOT_CREATED',learningLedger:'NOT_UPDATED'};
try{
 const bindFile=process.env.LEEWAY_GOVERNED_HOST_READ_BINDING_PATH,bindHash=process.env.LEEWAY_GOVERNED_HOST_READ_BINDING_SHA256?.toLowerCase();
 assert(bindFile&&/^[a-f0-9]{64}$/.test(bindHash||''),'Existing Formula source binding required');
 assert.equal(await fileHash(bindFile),bindHash);const binding=parse(bindFile),formulaRoot=binding.formulaRoot;
 assert.equal(binding.mode,'ADMISSION_READY');
 assert.equal(execFileSync('git',['-C',formulaRoot,'remote','get-url','origin'],{encoding:'utf8'}).trim(),'https://github.com/4citeB4U/Leeway-formula-live.git');
 const authority=parse(path.join(formulaRoot,'authority/formula-authority.json'));
 const base=path.join(formulaRoot,'runtime/canonical/leeway-formula/v1');
 const pinned={engine:'leeway-formula-v1.mjs',canonicalInput:'canonical-input.mjs',rawAdapter:'adapters/raw-base64-v1.mjs',formulaService:'formula-service.mjs'};
 const sourceHashes={};
 for(const [key,relative]of Object.entries(pinned)){const actual=await fileHash(path.join(base,relative));assert.equal(actual,authority.pinnedSha256[key].toLowerCase());sourceHashes[relative]=actual;}
 assert.equal(sourceHashes['leeway-formula-v1.mjs'],FORMULA_ENGINE_SHA256);
 for(const rel of ['rational.mjs','base64-codec.mjs','adapters/runtime-state-v1.mjs','adapters/adapter-registry.mjs']){
  const file=path.join(base,rel);const actual=execFileSync('git',['-C',formulaRoot,'hash-object','--no-filters',file],{encoding:'utf8'}).trim();
  assert.equal(actual,execFileSync('git',['-C',formulaRoot,'rev-parse','HEAD:runtime/canonical/leeway-formula/v1/'+rel],{encoding:'utf8'}).trim());sourceHashes[rel]=await fileHash(file);
 }
 const engine=await import(pathToFileURL(path.join(base,'leeway-formula-v1.mjs')).href);
 const registry=await import(pathToFileURL(path.join(base,'adapters/adapter-registry.mjs')).href);
 const golden=engine.verifyGolden();assert(golden.goldenVectorPass===true||golden.pass===true,'Actual Formula fixture failed');
 report.formulaExecution='ACTUAL_GOLDEN_SELF_CHECK_ONLY_NOT_INFERENCE_DECISION';
 report.formula={ownerBindingSha256:bindHash,sourceRoot:formulaRoot,sourceHashes,golden,registeredAdapters:registry.listAdapters(),
  inferenceDomainQualified:false,reason:'Registered input encoders are not a request-authorizing inference interpretation.'};
 const runtime=path.resolve(arg('--runtime-root'));
 const registryFile=path.join(runtime,'machine-consciousness/capability-binding-registry.v1.json');const capabilities=parse(registryFile);
 report.liveCarrier={registrySha256:await fileHash(registryFile),matchingInferenceBindings:capabilities.bindings.filter(b=>/inference|llm|transformer/i.test(JSON.stringify(b))),
  scope:'This inspected carrier registry only; not an assertion about every repository.'};
 report.gaps.push('QUALIFIED_INFERENCE_DOMAIN_FORMULA_INTERPRETATION','RUNTIME_INFERENCE_EXECUTION_BINDING','REQUEST_BOUND_LDWMD_BUFFER_LEASE','MODEL_TOKENIZER_SCOPED_CONTINUUM_SESSION','NATIVE_DRIVER_ENUMERATION');
 const memoryRoot=path.resolve(arg('--memory-root'));
 assert.equal(execFileSync('git',['-C',memoryRoot,'remote','get-url','origin'],{encoding:'utf8'}).trim(),'https://github.com/4citeB4U/Leeway-Runtime-Fabric.git');
 const deps=['automation-runtime/src/vtensor/vram-database.mjs','automation-runtime/src/vtensor/vram-governor.mjs','automation-runtime/src/vtensor/vtensor-record.mjs',
  'automation-runtime/src/continuum/continuum-federation.mjs','automation-runtime/src/continuum/continuum-registry.mjs',
  'automation-runtime/src/continuum/continuum-provider-registry.mjs','automation-runtime/src/continuum/providers/jsonl-durable-provider.mjs'];
 report.memoryDependencies={sourceRoot:memoryRoot,sourceHead:execFileSync('git',['-C',memoryRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),files:{},status:'SOURCE_LOCATED_NOT_BOUND_TO_INFERENCE'};
 for(const rel of deps)report.memoryDependencies.files[rel]=await fileHash(path.join(memoryRoot,rel));
 const inventoryFile=path.resolve(arg('--inventory')),inventory=parse(inventoryFile);report.inventorySha256=await fileHash(inventoryFile);
 for(const m of inventory.models){
  const before=fs.statSync(m.file);assert.equal(before.size,m.bytes);
  const current=await fileHash(m.file);assert.equal(current,m.sha256,'Model hash changed');
  const reader=new GgufReader(m.file,{retainTokenizer:false});let metadata;
  try{
   const plan=inspectTransformerPlan({metadata:reader.metadata,tensors:reader.tensors,modelSha256:current,contextLimit:128});
   metadata={label:m.label,modelSha256:current,fileBytes:before.size,architecture:reader.metadata['general.architecture'],
    profile:plan,headerSha256:hash(JSON.stringify({metadata:reader.metadata,tensors:reader.tensors})),
    modelReadOnly:true,neuralExecution:false,modelQualification:'METADATA_PREFLIGHT_ONLY'};
   delete metadata.profile.requiredTensors;
  }catch(error){metadata={label:m.label,modelSha256:current,fileBytes:before.size,error:error.message,neuralExecution:false};}
  finally{reader.close();}
  const after=fs.statSync(m.file);assert.equal(after.size,before.size);assert.equal(after.mtimeMs,before.mtimeMs);
  report.models.push(metadata);
 }
 report.outcome='BLOCKED_AT_CANONICAL_BINDING_BEFORE_INFERENCE';
 for(const [relative,h]of Object.entries(sourceHashes))assert.equal(await fileHash(path.join(base,relative)),h,'Formula source changed during inspection');
 report.formulaSourceUnchanged=true;
}catch(error){report.outcome='FAILED_READINESS_INSPECTION';report.error=error.stack;process.exitCode=1;}
finally{
 report.endedAt=new Date().toISOString();report.scriptSha256=await fileHash(fileURLToPath(import.meta.url));
 const file=path.join(out,'inference-readiness.json');fs.writeFileSync(file,JSON.stringify(report,null,2));
 console.log(JSON.stringify({outcome:report.outcome,error:report.error,models:report.models,gaps:report.gaps,formulaExecution:report.formulaExecution,report:file,sha256:await fileHash(file)},null,2));
}
