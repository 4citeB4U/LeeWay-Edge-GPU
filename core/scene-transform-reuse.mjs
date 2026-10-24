/*
REGION: LEEWAY.EDGE_GPU.RENDER_CAPABILITY
TAG: LEEWAY.EDGE_GPU.SCENE_TRANSFORM_REUSE.G3
WHAT: Opt-in, reversible reuse of unchanged Three.js local transforms during one render call.
WHY: A scene with many unchanged objects should not repeat composition solely because another frame renders.
WHO: Creator-authorized local experiment. ROLES: EXECUTE VERIFY.
WHERE: Existing GPU candidate; caller supplies the real renderer scene. No other library or runtime authority.
WHEN: Explicit enablement; tested scene only. HOW: Exact transform/matrix comparisons; original computation on change; restore flags in finally.
LICENSE: MIT. No Formula routing, native-driver, or production compatibility claim.
*/
export function createSceneTransformReuse(scene,{maximumObjects=12000}={}){
 if(!scene?.isScene||typeof scene.traverse!=='function')throw Error('THREE_SCENE_REQUIRED');
 if(!Number.isInteger(maximumObjects)||maximumObjects<1||maximumObjects>20000)throw Error('OBJECT_BUDGET_INVALID');
 const nativeUpdate=scene.updateMatrix;const nativeWorldUpdate=scene.updateMatrixWorld;const records=[];
 scene.traverse(object=>{
  if(records.length>=maximumObjects)return;
  if(object.isCamera||object.isBone||object.isSkinnedMesh||object.updateMatrix!==nativeUpdate||object.updateMatrixWorld!==nativeWorldUpdate)return;
  if(!object.position||!object.quaternion||!object.scale||object.matrix?.elements?.length!==16)return;
  records.push({object,state:new Float64Array(10),matrix:new Float64Array(16),valid:false});
 });
 let enabled=false,closed=false;
 const totals={calls:0,reused:0,recomputed:0,bypassed:0};
 const same=(s,p,q,z)=>s[0]===p.x&&s[1]===p.y&&s[2]===p.z&&s[3]===q.x&&s[4]===q.y&&s[5]===q.z&&s[6]===q.w&&s[7]===z.x&&s[8]===z.y&&s[9]===z.z;
 return {
  setEnabled(value){if(closed)throw Error('REUSE_ADAPTER_CLOSED');enabled=value===true;},
  describe(){return {enabled,registeredObjects:records.length,...totals,formulaExecution:'NOT_EXECUTED',scope:'EXACT_TRANSFORM_REUSE_LOCAL_CANDIDATE'};},
  render(renderCall,renderScene){
   if(!enabled||closed||renderScene!==scene)return renderCall();
   const restore=[];totals.calls++;
   try{
    for(const record of records){
     const o=record.object;
     if(o.matrixAutoUpdate!==true||o.updateMatrix!==nativeUpdate||o.updateMatrixWorld!==nativeWorldUpdate){totals.bypassed++;continue;}
     let unchanged=record.valid&&same(record.state,o.position,o.quaternion,o.scale);
     if(unchanged){for(let i=0;i<16;i++)if(record.matrix[i]!==o.matrix.elements[i]){unchanged=false;break;}}
     if(unchanged)totals.reused++;
     else{
      // Call the exact original library operation, not a replacement matrix formula.
      nativeUpdate.call(o);const p=o.position,q=o.quaternion,s=o.scale;
      record.state.set([p.x,p.y,p.z,q.x,q.y,q.z,q.w,s.x,s.y,s.z]);record.matrix.set(o.matrix.elements);record.valid=true;totals.recomputed++;
     }
     o.matrixAutoUpdate=false;restore.push(o);
    }
    return renderCall();
   }finally{for(const o of restore)o.matrixAutoUpdate=true;}
  },
  dispose(){enabled=false;closed=true;records.length=0;}
 };
}
