/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.STATE_STATISTICS_EQUIVALENCE.G2
WHAT: Compare incremental statistics with the real owner-bound canonical Formula source.
WHY: A Golden fixture alone cannot prove sliding-window or duplicate-state correctness.
WHO: Creator-authorized Agent Lee. WHERE: Existing Formula authority, imported read-only.
WHEN: Explicit synthetic-data diagnostic. HOW: Reuse binding checker, verify hashes, compare every transition.
ROLES: VERIFY. LICENSE: MIT
*/
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';
import {StateWindowStatistics} from '../../core/state-window-statistics.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const at=process.argv.indexOf('--evidence');if(at<0||!process.argv[at+1])throw Error('EVIDENCE_DIRECTORY_REQUIRED');
const evidence=path.resolve(process.argv[at+1]);fs.mkdirSync(evidence,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
let report={schema:'leeway.state-statistics-comparison.g2',observedAt:new Date().toISOString(),dataClass:'SYNTHETIC_TEST_FIXTURE',
 formulaRouting:'NOT_EXECUTED',canonicalEngineModified:false,learningLedger:'NOT_UPDATED',c3:'OPEN'};
try{
 const binding=spawnSync(process.execPath,[path.join(root,'tests/virtual-gpu/formula-binding-check.mjs'),'--evidence',evidence],{encoding:'utf8',timeout:20000});
 fs.writeFileSync(path.join(evidence,'binding-check-output.txt'),binding.stdout+'\n'+binding.stderr);
 if(binding.status!==0)throw Error('FORMULA_BINDING_CHECK_FAILED');
 const observed=JSON.parse(fs.readFileSync(path.join(evidence,'formula-binding-observation.json'),'utf8').replace(/^\uFEFF/,''));
 const base=path.join(observed.sourceRoot,'runtime/canonical/leeway-formula/v1');
 const enginePath=path.join(base,'leeway-formula-v1.mjs');
 if(hash(fs.readFileSync(enginePath))!=='6502791bba909d7481db3a204f3cbf67b1dc06a4b76a73c797d709408341d63e')throw Error('CANONICAL_ENGINE_HASH_CHANGED');
 for(const [file,digest]of Object.entries(observed.dependencyHashes))if(hash(fs.readFileSync(path.join(base,file)))!==digest)throw Error('FORMULA_DEPENDENCY_CHANGED');
 const canonical=await import(pathToFileURL(enginePath).href);
 let seed=0x16c069;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%70;};
 const row=index=>index%11===0?Array(6).fill(index%70):index%7===0?[0,69,0,69,35,35]:Array.from({length:6},next);
 let matrix=Array.from({length:16},(_,i)=>row(i));const stats=new StateWindowStatistics(matrix);
 let windows=0,stateComparisons=0,maxPairAdjustments=0;
 const equalRational=(actual,n,d=1)=>assert.equal(actual.n*BigInt(d),BigInt(n)*actual.d);
 const check=()=>{
  assert.deepEqual(stats.snapshot(),matrix);
  const expected=canonical.computeFeatures(matrix),actual=stats.statistics();
  for(let x=0;x<70;x++){
   const f=expected[x],s=actual[x],tau=s.occurrenceRows,n=tau.length;
   equalRational(f.F,s.frequency);equalRational(f.C,s.cooccurringStates);assert.deepEqual(f.tau,tau);
   const cols=Array.from({length:6},(_,j)=>matrix.reduce((count,r)=>count+Number(r[j]===x),0));assert.deepEqual(s.columns,cols);
   if(s.frequency)equalRational(f.P,Math.max(...cols),s.frequency);else equalRational(f.P,0);
   equalRational(f.G,n?16-tau[n-1]:16);equalRational(f.R,n?tau[n-1]:0,16);
   equalRational(f.v,n>=2?tau[n-1]-tau[n-2]:0);
   equalRational(f.a,n>=3?(tau[n-1]-tau[n-2])-(tau[n-2]-tau[n-3]):0);
   stateComparisons++;
  }
  windows++;
 };
 check();
 for(let step=0;step<512;step++){
  const incoming=row(step+16);matrix=matrix.slice(1).concat([incoming.slice()]);
  const descriptor=stats.append(incoming);incoming[0]=99;check();
  assert(descriptor.lastUnorderedPairAdjustments<=30);maxPairAdjustments=Math.max(maxPairAdjustments,descriptor.lastUnorderedPairAdjustments);
 }
 const before=JSON.stringify(stats.snapshot());let negativeCases=0;
 for(const bad of [[],[1,2,3],[0,0,0,0,0,70],[0,0,0,0,0,-1],[0,0,0,0,0,NaN],[0,0,0,0,0,1.5]]){
  assert.throws(()=>stats.append(bad));assert.equal(JSON.stringify(stats.snapshot()),before);negativeCases++;
 }
 const external=stats.snapshot();external[0][0]=88;assert.equal(JSON.stringify(stats.snapshot()),before);
 if(hash(fs.readFileSync(enginePath))!==observed.sourceHashes.engine)throw Error('ENGINE_CHANGED_DURING_TEST');
 report={...report,outcome:'PASS_INCREMENTAL_STATISTICS_EQUIVALENCE',windows,stateComparisons,negativeCases,maxPairAdjustments,
  canonicalSourceCommit:observed.commit,canonicalEngineSha256:observed.sourceHashes.engine,dependencyHashes:observed.dependencyHashes,
  canonicalExecution:'REAL_COMPUTEFEATURES_ON_SYNTHETIC_WINDOWS_PLUS_GOLDEN_FIXTURE',
  compared:'frequency, column counts, occurrence rows, co-occurrence, and source features F/P/C/G/R/v/a',
  noClaim:'Not a replacement Formula evaluator; no optimized ranking or workload-routing advantage is claimed.',
  candidateSha256:hash(fs.readFileSync(path.join(root,'core/state-window-statistics.mjs'))),
  testSha256:hash(fs.readFileSync(fileURLToPath(import.meta.url)))};
}catch(error){report.outcome='FAILED_OR_BLOCKED';report.error=error.stack;process.exitCode=1;}
fs.writeFileSync(path.join(evidence,'state-statistics-results.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
