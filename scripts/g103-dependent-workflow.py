# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MULTITASK.EXECUTION
# TAG: LEEWAY.G103.DEPENDENT_WORKFLOW
# 5WH: WHAT = Run genuine LeeWay LDWMD model projection and dependent media-task baseline.
# WHY = Exercise real tool subprocesses, input validation, and fail-closed nested task execution.
# WHO = Creator-directed LeeWay diagnostic workflow.
# WHERE = scripts/g103-dependent-workflow.py
# WHEN = 2026-10-23
# HOW = Stage gates with subprocess timeouts, real outputs, numerical assertions, and receipts.
# LICENSE: MIT; AUTHORITY: Isolated lab-only experiment; no production admission.
import os,sys,json,time,subprocess,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parent
source=pathlib.Path(sys.argv[1])
runtime=pathlib.Path(sys.argv[2])
cuda_python=pathlib.Path(sys.argv[3])
def stage(name,command,env=None):
 t=time.perf_counter()
 p=subprocess.run(command,capture_output=True,text=True,timeout=180,env=env)
 if p.returncode:raise RuntimeError(name+' EXIT_'+str(p.returncode)+' '+p.stderr[-1500:])
 try:result=json.loads(p.stdout)
 except Exception as e:raise RuntimeError(name+' BAD_JSON '+p.stdout[-1000:]) from e
 return {'stage':name,'elapsedWallMs':round(1000*(time.perf_counter()-t),3),'result':result}
env=os.environ.copy();env['LEEWAY_LDWMD_SOURCE_ROOT']=str(runtime)
parts=[]
parts.append(stage('leeway_model_weight_projection',['node',str(root/'g70-ldwmd-worker-matvec.mjs'),str(source)],env))
a=parts[-1]['result']
if a['status']!='G70_LDWMD_MATVEC_PASS' or a['tiles']!=40 or a['memoryLeasesZeroized']!=120 or a['mismatches']:raise RuntimeError('LEEWAY_MODEL_GATE_REJECT')
parts.append(stage('dependent_media_workflow',[str(cuda_python),str(root/'g102-multitask-media-benchmark.py')]))
b=parts[-1]['result']
if b['status']!='G102_MULTITASK_PARITY_PASS' or b['taskCount']!=8 or b['maxCpuGpuOutputError']>=1e-4:raise RuntimeError('MEDIA_GATE_REJECT')
receipt={'status':'G103_DEPENDENT_LAB_WORKFLOW_PASS','stages':[{'name':p['stage'],'wallMs':p['elapsedWallMs'],'status':p['result']['status']} for p in parts],'totalToolInvocations':2,'mediaTasks':8,'modelTiles':40,'modelMemoryLeasesZeroized':120,'nvidiaGpu':b['hardware'],'mediaCpuMs':b['CPU']['endToEndMs'],'mediaCudaMs':b['NVIDIA']['endToEndMs'],'mediaCpuVsCudaRatio':b['CPUvsNvidiaRatio'],'mediaMaxError':b['maxCpuGpuOutputError'],'realImageGeneration':False,'realVideoGeneration':False,'autonomousLLMToolCalling':False,'fullAgentLeeRuntimeExecuted':False,'productionAccepted':False}
print(json.dumps(receipt,indent=2))
