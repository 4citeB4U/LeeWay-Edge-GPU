/* LEEWAY HEADER
TAG: LEEWAY.GPU.DENSE_NVIDIA_CHALLENGE.G22
REGION: GPU.QUALIFICATION
Runs existing LeeWay CPU arithmetic, isolated NVIDIA cuBLAS reference, independent
full-output oracle, and the existing AuditAgent. No replacement authority. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const option = (key, fallback) => argv.includes(key) ? argv[argv.indexOf(key)+1] : fallback;
const here = path.dirname(fileURLToPath(import.meta.url));
const gpuRoot = path.resolve(option('--gpu-root', path.join(here, '../..')));
const evidence = option('--evidence');
const dllDirectory = option('--dll-dir');
const auditAgent = option('--audit-agent');
if (!evidence || !dllDirectory || !auditAgent) throw Error('EVIDENCE_DLL_DIRECTORY_AND_EXISTING_AUDIT_AGENT_REQUIRED');
const root = path.resolve(evidence);
if (fs.existsSync(root)) throw Error('NEW_EVIDENCE_DIRECTORY_REQUIRED');
fs.mkdirSync(root, { recursive:true });
const python = option('--python', 'python');
const sizes = option('--sizes', '256,512,1024,2048').split(',').map(Number);
if (!sizes.length || sizes.length>6 || new Set(sizes).size!==sizes.length || sizes.some(n=>!Number.isInteger(n)||n<1||n>2048)) throw Error('INVALID_BOUNDED_DENSE_SIZES');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const write = (name, value) => fs.writeFileSync(path.join(root, name), JSON.stringify(value,null,2)+'\n', {flag:'wx'});
const progress = value => process.stdout.write(JSON.stringify({...value, observedAt:new Date().toISOString()})+'\n');
const relativeToRoot = file => path.relative(root, file).replaceAll(path.sep,'/');
const sourcePaths = [
  path.join(gpuRoot,'fallback/node-cpu.engine.mjs'), path.join(gpuRoot,'fallback/node-cpu.worker.mjs'),
  path.join(gpuRoot,'fallback/cpu.worker.js'), path.join(gpuRoot,'fallback/tensor-reference.mjs'),
  path.join(gpuRoot,'dispatch/tensor-contract.mjs'), path.join(gpuRoot,'control/gpu.controller.bridge.js'),
  path.join(here,'dense-challenge-fixtures.py'), path.join(here,'nvidia-cublas-baseline.py'),
  path.join(here,'audit-nvidia-challenge.mjs'), fileURLToPath(import.meta.url)
];
const sourceManifest = {schema:'leeway.challenge.source-manifest.v1', pinType:'LOCAL_WORKING_BYTES_NOT_GITHUB_RELEASE',
  scope:'Selected LeeWay and harness source bytes; Python/NumPy versions and baseline DLL hashes are recorded separately, not a complete OS/runtime attestation.',
  observedAt:new Date().toISOString(), files:sourcePaths.map(file=>({path:file,sha256:hash(fs.readFileSync(file))}))};
write('source-manifest.json', sourceManifest);
const specification = {
  schema:'leeway.dense-nvidia-challenge.specification.v1', writtenBeforeExecution:new Date().toISOString(),
  sizes, repetitions:3, warmups:1, caseTimeoutMs:120000,
  operation:'DENSE_ROW_MAJOR_SQUARE_C_EQUALS_A_TIMES_B',dtype:'FLOAT32_INPUT_OUTPUT',
  inputs:'DENSE_NONZERO_SIGNED_SMALL_INTEGERS_EXACTLY_REPRESENTABLE_RESULTS',
  matching:'Identical raw input bytes for both lanes; every output compared to separate NumPy CPU float64 oracle.',
  candidate:'EXISTING_LEEWAY_SQUARE_CPU_WORKER_WITH_NO_GPU_OR_REMOTE_PROVIDER',
  baseline:'NVIDIA_CUBLAS_SGEMM_PEDANTIC_ON_EXACT_RTX_5060_DEVICE',
  timing:'Host dispatch-to-readback roundtrip; candidate includes per-call worker startup/copy/termination; baseline includes per-call CUDA buffer malloc/upload/compute/sync/readback/free. Baseline context/handle initialization excluded; verification/file IO excluded from both.',
  lifecycleDifference:'CPU transient worker versus CUDA context initialized before each baseline sample; initialization is excluded from baseline sample time. Results apply to these real APIs; no kernel-only or full governed-pipeline claim.',
  order:'Per case, pairs alternate NVIDIA-first, LeeWay-first, NVIDIA-first; each backend is warmed before measurement, no concurrent CPU/GPU execution.',
  claimRule:'A raw workload win requires all full-output checks, three measured samples, and worst LeeWay sample below best NVIDIA sample. This never qualifies a broad NVIDIA or full-product superiority claim.',
  requestedBeyondCurrentBounds:[{size:4096,state:'NOT_RUN_EXISTING_SQUARE_WORKER_LIMIT_2048'}, {size:8192,state:'NOT_RUN_EXISTING_SQUARE_WORKER_LIMIT_2048'}],
  safety:'Serial finite work; no driver change, external GPU service, production grant, or background endurance test.'
};
write('specification.json', specification);
const campaign = {schema:'leeway.dense-nvidia-challenge.result.v1', startedAt:new Date().toISOString(),
  status:'RUNNING', host:{platform:process.platform,architecture:process.arch,node:process.version,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length},
  executionIndependence:{softwareLane:'NODE_CPU_WORKERS_ONLY',baseline:'SEPARATE_PYTHON_CUDA_PROCESS',huggingFaceUsed:false,cloudGpuUsed:false},
  cases:[], missingCanonicalGates:['RUNTIME_FABRIC_TASK_GRANT','APPROVED_FORMULA_WORKLOAD_DECISION','VERITAS_PRE',
    'LDWMD_PRODUCTION_LEASE','OWNER_CONTINUUM_RETENTION','CANONICAL_VERITAS_POST_RECEIPT','RECEIPT_LEDGER','LEARNING_LEDGER'],
  canonicalPipelineVerified:false, osNativeDeviceVerified:false, productionAccepted:false, broaderNvidiaSuperiorityProven:false};
let failure;
function subprocess(executable, args, name, timeout=120000) {
  const result=spawnSync(executable,args,{encoding:'utf8',windowsHide:true,timeout,maxBuffer:4*1024*1024});
  fs.writeFileSync(path.join(root,name+'.stdout.log'),result.stdout??'');
  fs.writeFileSync(path.join(root,name+'.stderr.log'),result.stderr??'');
  if(result.error)throw result.error;
  if(result.status!==0)throw Error(name+'_FAILED_'+result.status);
}
function floats(file) {
  const bytes=fs.readFileSync(file);if(bytes.length%4)throw Error('FLOAT32_FILE_LENGTH');
  return new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length));
}
function confinedFile(file) {
  const real=fs.realpathSync(file);
  if(real!==root&&!real.startsWith(root+path.sep))throw Error('ARTIFACT_OUTSIDE_EVIDENCE_ROOT');
  return real;
}
function verify(actual, expected) {
  if(actual.length!==expected.length)throw Error('OUTPUT_LENGTH_MISMATCH');
  let mismatches=0;for(let i=0;i<actual.length;i++)if(!Number.isFinite(actual[i])||actual[i]!==expected[i])mismatches++;
  if(mismatches)throw Error('INDEPENDENT_OUTPUT_MISMATCH_'+mismatches);
  return {values:actual.length,mismatches,method:'SEPARATE_NUMPY_CPU_FLOAT64_ORACLE_EXACT_SMALL_INTEGER_FIXTURE'};
}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
try {
  progress({phase:'GENERATING_IDENTICAL_INPUTS_AND_INDEPENDENT_REFERENCE'});
  subprocess(python,[path.join(here,'dense-challenge-fixtures.py'),'--output-dir',path.join(root,'fixtures'),'--sizes',sizes.join(',')],'fixtures');
  const fixtures=JSON.parse(fs.readFileSync(path.join(root,'fixtures/fixtures.json'),'utf8'));
  const {cpuMatMulNode}=await import(pathToFileURL(path.join(gpuRoot,'fallback/node-cpu.engine.mjs')));
  const {executeGPU}=await import(pathToFileURL(path.join(gpuRoot,'control/gpu.controller.bridge.js')));
  if(!Array.isArray(fixtures.cases)||fixtures.cases.length!==sizes.length||new Set(fixtures.cases.map(value=>value.id)).size!==sizes.length||fixtures.cases.some((value,index)=>value.size!==sizes[index]||value.id!==`dense-${value.size}`))throw Error('FIXTURE_CASE_MISMATCH');
  for(const fixture of fixtures.cases){
    for(const key of ['aPath','bPath','referencePath'])fixture[key]=confinedFile(fixture[key]);
    const A=floats(fixture.aPath), B=floats(fixture.bPath), expected=floats(fixture.referencePath);
    if(hash(Buffer.from(A.buffer))!==fixture.aSha256||hash(Buffer.from(B.buffer))!==fixture.bSha256||hash(Buffer.from(expected.buffer))!==fixture.referenceSha256)throw Error('FIXTURE_HASH_CHANGED');
    const row={id:fixture.id,size:fixture.size,seed:fixture.seed,nominalFlops:fixture.nominalFlops,referenceSha256:fixture.referenceSha256,
      nvidiaSamples:[],leewaySamples:[],precision:'EXACT_FLOAT32_EQUALITY_FOR_SELECTED_INTEGER_INPUTS'};
    campaign.cases.push(row);
    async function cpuTrial(trial) {
      progress({phase:'LEEWAY_CPU_ONLY',size:fixture.size,trial:trial===0?'WARMUP':trial});
      const started=performance.now();
      const actual=await executeGPU({TAG:'LEEWAY.COMPUTE.MATMUL.EXEC',metadata:{size:fixture.size,backend:'CPU'},
        run:()=>cpuMatMulNode(A,B,fixture.size,{timeoutMs:120000,denyExternalProviders:true})},
        {approve:async task=>task.TAG==='LEEWAY.COMPUTE.MATMUL.EXEC'&&task.metadata.backend==='CPU'&&task.metadata.size<=2048});
      const hostElapsedMs=performance.now()-started;
      const verification=verify(actual,expected);
      if(hash(Buffer.from(A.buffer))!==fixture.aSha256||hash(Buffer.from(B.buffer))!==fixture.bSha256)throw Error('CANDIDATE_INPUT_MUTATION');
      if(trial>0){
        const file=`${fixture.id}-leeway-trial-${trial}.f32`;const bytes=Buffer.from(actual.buffer,actual.byteOffset,actual.byteLength);
        fs.writeFileSync(path.join(root,file),bytes,{flag:'wx'});
        row.leewaySamples.push({file,sha256:hash(bytes),hostElapsedMs,verification});
      }
    }
    function gpuTrial(trial) {
      progress({phase:'NVIDIA_BASELINE_ONLY',size:fixture.size,trial});
      const folder=path.join('nvidia',`${fixture.id}-pair-${trial}`);
      const requestName=`${fixture.id}-baseline-request-${trial}.json`;
      write(requestName,{...fixtures,cases:[fixture],repetitions:1,warmups:1});
      subprocess(python,[path.join(here,'nvidia-cublas-baseline.py'),'--request',path.join(root,requestName),
        '--output-dir',path.join(root,folder),'--dll-dir',path.resolve(dllDirectory)],`${fixture.id}-nvidia-pair-${trial}`,120000);
      const baseline=JSON.parse(fs.readFileSync(confinedFile(path.join(root,folder,'nvidia-cublas-baseline.json')),'utf8'));
      if(baseline.status!=='EXECUTED_CORRECTNESS_PENDING'||baseline.device?.name!=='NVIDIA GeForce RTX 5060 Laptop GPU'||baseline.cases.length!==1)throw Error('NVIDIA_BASELINE_NOT_QUALIFIED');
      campaign.nvidia={device:baseline.device,cublasVersion:baseline.cublasVersion,mathMode:baseline.cublasMathMode};
      const hardware=baseline.cases[0];
      if(hardware.id!==fixture.id||hardware.trials.length!==1||hardware.inputSha256[0]!==fixture.aSha256||hardware.inputSha256[1]!==fixture.bSha256)throw Error('BASELINE_INPUT_OR_SAMPLE_MISMATCH');
      const sample=hardware.trials[0];
      const file=confinedFile(path.join(root,folder,sample.file));const raw=fs.readFileSync(file);
      if(hash(raw)!==sample.sha256||!Number.isFinite(sample.hostElapsedMs)||sample.hostElapsedMs<=0)throw Error('BASELINE_OUTPUT_OR_TIMING_INVALID');
      row.nvidiaSamples.push({...sample,file:relativeToRoot(file),verification:verify(floats(file),expected)});
    }
    await cpuTrial(0);
    for(let trial=1;trial<=3;trial++){
      if(trial%2){gpuTrial(trial);await cpuTrial(trial);}else{await cpuTrial(trial);gpuTrial(trial);}
    }
    const cpu=row.leewaySamples.map(value=>value.hostElapsedMs), gpu=row.nvidiaSamples.map(value=>value.hostElapsedMs);
    row.comparison={leewayMedianMs:median(cpu),nvidiaMedianMs:median(gpu),
      nvidiaToLeewayMedianTimeRatio:median(gpu)/median(cpu),
      leewayNominalGflops:fixture.nominalFlops/(median(cpu)*1e6),nvidiaNominalGflops:fixture.nominalFlops/(median(gpu)*1e6),
      observedWinner:Math.max(...cpu)<Math.min(...gpu)?'LEEWAY_SOFTWARE_FOR_THIS_WORKLOAD_AND_LIFECYCLE':Math.max(...gpu)<Math.min(...cpu)?'NVIDIA_FOR_THIS_WORKLOAD_AND_LIFECYCLE':'INCONCLUSIVE_OVERLAPPING_SAMPLES'};
    progress({phase:'CASE_COMPLETE',size:fixture.size,...row.comparison});
  }
  for(const item of sourceManifest.files)if(hash(fs.readFileSync(item.path))!==item.sha256)throw Error('SOURCE_CHANGED_DURING_CAMPAIGN');
  campaign.status='COMPONENT_COMPARISON_COMPLETE_CANONICAL_PRODUCT_QUALIFICATION_OPEN';
}catch(error){failure=error;campaign.status='FAILED_OR_BLOCKED';campaign.error={name:error.name,message:error.message};}
finally{
  campaign.finishedAt=new Date().toISOString();write('campaign.json',campaign);
  const artifacts=[];
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('SYMLINK_ARTIFACT_DENIED');if(entry.isDirectory())walk(file);else artifacts.push({path:relativeToRoot(file),sha256:hash(fs.readFileSync(confinedFile(file)))});}}
  walk(root);write('artifact-manifest.json',{schema:'leeway.challenge.artifacts.v1',hashProvenance:'SELF_RECORDED_CONTENT_BINDING',evidence:artifacts});
  try{subprocess(process.execPath,[path.join(here,'audit-nvidia-challenge.mjs'),'--evidence',root,'--audit-agent',path.resolve(auditAgent)],'existing-auditor');}
  catch(error){write('audit-invocation-failure.json',{error:error.message,productionAccepted:false});failure??=error;}
}
progress({phase:'FINISHED',status:campaign.status,cases:campaign.cases.map(row=>({size:row.size,...row.comparison})),evidence:root});
if(failure){process.stderr.write(failure.stack+'\n');process.exitCode=1;}
