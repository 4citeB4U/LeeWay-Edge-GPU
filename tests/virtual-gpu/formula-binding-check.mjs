/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.FORMULA_BINDING_CHECK.G0
WHAT: Verify the owner-bound Formula source without cloning/replacing its evaluator.
WHY: Golden self-test is distinct from workload mapping or claimed acceleration.
WHO: Creator-authorized Agent Lee. WHERE: Owner binding + existing Formula source.
WHEN: Explicit local qualification. HOW: Binding hash, source pins, golden test, evidence.
LICENSE: MIT
*/
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2);const index=args.indexOf('--evidence');
if(index<0||!args[index+1])throw Error('EVIDENCE_DIRECTORY_REQUIRED');
const evidence=path.resolve(args[index+1]);fs.mkdirSync(evidence,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const parsed=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
let report={schema:'leeway.gpu.formula-binding-observation.v1',observedAt:new Date().toISOString(),formulaExecution:'NOT_EXECUTED',workloadMapping:'NOT_QUALIFIED',workloadDecision:'NOT_EXECUTED',learningLedger:'NOT_UPDATED'};
try{
 const bindingPath=process.env.LEEWAY_GOVERNED_HOST_READ_BINDING_PATH;
 const ownerPin=process.env.LEEWAY_GOVERNED_HOST_READ_BINDING_SHA256?.toLowerCase();
 if(!bindingPath||!/^[a-f0-9]{64}$/.test(ownerPin||''))throw Error('OWNER_BINDING_NOT_EXPOSED');
 const bindingBytes=fs.readFileSync(bindingPath);if(hash(bindingBytes)!==ownerPin)throw Error('OWNER_BINDING_HASH_MISMATCH');
 const binding=parsed(bindingPath);if(binding.mode!=='ADMISSION_READY'||binding.bodyId!=='pc-primary')throw Error('OWNER_BINDING_NOT_ADMISSION_READY');
 const root=binding.formulaRoot;if(typeof root!=='string')throw Error('FORMULA_ROOT_ABSENT');
 const origin=execFileSync('git',['-C',root,'remote','get-url','origin'],{encoding:'utf8'}).trim();
 if(origin!=='https://github.com/4citeB4U/Leeway-formula-live.git')throw Error('FORMULA_ORIGIN_MISMATCH');
 const authority=parsed(path.join(root,'authority/formula-authority.json'));
 const rel='runtime/canonical/leeway-formula/v1/';
 const entries={engine:'leeway-formula-v1.mjs',canonicalInput:'canonical-input.mjs',rawAdapter:'adapters/raw-base64-v1.mjs',formulaService:'formula-service.mjs'};
 const checked={};
 for(const [key,file]of Object.entries(entries)){
  const actual=hash(fs.readFileSync(path.join(root,rel,file)));const expected=authority.pinnedSha256[key]?.toLowerCase();
  if(actual!==expected)throw Error('FORMULA_SOURCE_HASH_MISMATCH:'+key);checked[key]=actual;
 }
 if(checked.engine!=='6502791bba909d7481db3a204f3cbf67b1dc06a4b76a73c797d709408341d63e')throw Error('FORMULA_INDEPENDENT_PIN_MISMATCH');
 const dependencies={};
 for(const file of ['rational.mjs','base64-codec.mjs','canonical-input.mjs']){
  const target=path.join(root,rel,file);const blob=execFileSync('git',['-C',root,'hash-object','--no-filters',target],{encoding:'utf8'}).trim();
  const tracked=execFileSync('git',['-C',root,'rev-parse','HEAD:'+rel+file],{encoding:'utf8'}).trim();
  if(blob!==tracked)throw Error('FORMULA_DEPENDENCY_DIFFERS_FROM_SOURCE:'+file);dependencies[file]=hash(fs.readFileSync(target));
 }
 const engine=await import(pathToFileURL(path.join(root,rel,entries.engine)).href);
 const before=performance.now();const golden=engine.verifyGolden();const elapsedMs=performance.now()-before;
 report={...report,outcome:golden.pass?'PASS_GOLDEN_FIXTURE_ONLY':'FAIL_GOLDEN_FIXTURE',bindingHash:ownerPin,
  sourceRoot:root,origin,commit:execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  sourceHashes:checked,dependencyHashes:dependencies,formulaId:engine.FORMULA_ID,
  formulaExecution:'EXECUTED_GOLDEN_FIXTURE_ONLY',golden,hostElapsedMs:elapsedMs,
  claimBoundary:'No GPU workload was mapped or optimized by this self-test.'};
 if(!golden.pass)process.exitCode=1;
 try{report.serviceHealth=await fetch(new URL('/runtime/formula/v1/health',binding.formulaBaseUrl),{signal:AbortSignal.timeout(3000)}).then(r=>r.json());}
 catch(error){report.serviceHealth={status:'UNVERIFIED',error:error.message};}
}catch(error){report.outcome='BLOCKED_OR_FAILED';report.error=error.message;process.exitCode=1;}
const output=path.join(evidence,'formula-binding-observation.json');fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,observationSha256:hash(fs.readFileSync(output))},null,2));
