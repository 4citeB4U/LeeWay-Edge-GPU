/*
REGION: LEEWAY.EDGE_GPU.PIPELINE
TAG: LEEWAY.EDGE_GPU.QUAD_VERIFICATION.G0
WHAT: Preserve the existing execution pipeline with real local reference verification.
WHY: Random strings and unconditional valid=true are not proof.
WHO: Creator-authorized Agent Lee. WHERE: Existing QuadPipeline. WHEN: Explicit task run.
HOW: Execute, independent supplied reference check, hash actual bytes, report only measured facts.
LICENSE: MIT
*/
export class QuadPipeline{
 constructor(engines){this.engines=engines;this.taskCounter=1;}
 async run(task){
  if(!this.engines?.verifier||typeof this.engines.verifier.verify!=='function')throw new Error('QUAD_REFERENCE_VERIFIER_REQUIRED');
  task.id=`LWA_TX_${String(this.taskCounter++).padStart(4,'0')}`;
  const exec=await this.execution(task);
  const verification=await this.verification(task,exec);
  if(verification.valid!==true)throw new Error('QUAD_PIPELINE_REFERENCE_MISMATCH');
  const optimization=await this.optimization(task,exec);
  const strategy=await this.strategy(task,exec);
  return this.resolve([exec,optimization,verification,strategy]);
 }
 async execution(task){return await this.engines.primary.run(task);}
 async optimization(task,exec){
  const n=Number(task.metadata?.size),ms=Number(exec.time);
  const nominalOperations=Number.isFinite(n)&&n>0?2*n*n*n:null;
  return {note:'No unmeasured speedup claimed; compare against a matched baseline.',nominalOperations,
   hostObservedGFLOPS:nominalOperations!==null&&Number.isFinite(ms)&&ms>0?nominalOperations/(ms*1e6):null,
   timingBoundary:'Caller-provided host execution interval; not hardware kernel timing.'};
 }
 async verification(task,exec){
  if(!ArrayBuffer.isView(exec.result))throw new Error('QUAD_RESULT_MUST_BE_TYPED_ARRAY');
  const before=new Uint8Array(exec.result.buffer,exec.result.byteOffset,exec.result.byteLength).slice();
  const reference=await this.engines.verifier.verify(task,exec);
  const after=new Uint8Array(exec.result.buffer,exec.result.byteOffset,exec.result.byteLength);
  if(before.length!==after.length||before.some((v,i)=>v!==after[i]))throw new Error('QUAD_RESULT_MUTATED_DURING_VERIFICATION');
  if(reference?.valid!==true||typeof reference.method!=='string'||!reference.method)throw new Error('QUAD_PIPELINE_REFERENCE_MISMATCH');
  const digest=await crypto.subtle.digest('SHA-256',before);
  const sha256=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
  return {...reference,valid:true,status:'LOCAL_REFERENCE_CHECK_PASSED',checksum:'SHA256: '+sha256,
   evidenceScope:'Local supplied-reference check; not canonical Veritas or C3 acceptance.'};
 }
 async strategy(task,exec){return {insight:`Task ${task.id} completed with local reference verification. Formula routing and remote execution are not claimed.`,selectedRoute:null,formulaExecution:'NOT_EXECUTED_BY_THIS_PIPELINE'};}
 resolve([exec,opt,verify,strat]){
  if(verify.valid!==true)throw new Error('QUAD_PIPELINE_REFERENCE_MISMATCH');
  return {id:exec.id,execution:exec,optimization:opt,verification:verify,strategy:strat,insights:strat.insight};
 }
}
