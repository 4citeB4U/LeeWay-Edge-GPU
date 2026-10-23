/*
REGION: LEEWAY.EDGE_GPU.CONTROL
TAG: LEEWAY.EDGE_GPU.CONTROLLER_BRIDGE.G0
WHAT: Await explicit task admission before execution. WHY: Promises/objects are not approval.
WHO: Creator-authorized Agent Lee. WHERE: Existing controller bridge. WHEN: Before each task.
HOW: Require valid controller and strict boolean true; never infer Formula execution. LICENSE: MIT
*/
export async function executeGPU(task,controller){
 if(!task||typeof task.run!=='function')throw new TypeError('GPU_TASK_REQUIRED');
 if(!controller||typeof controller.approve!=='function')throw new TypeError('GPU_CONTROLLER_REQUIRED');
 const approved=await controller.approve(task);
 if(approved!==true)throw new Error('GPU_EXECUTION_DENIED');
 return await task.run();
}
