# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.REFERENCE
# TAG: LEEWAY.G93.DEBUG_APPLICATION_CONTROL_GATE
# 5WH: WHAT = Verify a built independent debugger is actually executable.
# WHY = Successful compilation does not imply Windows Application Control approval.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g93-debug-execution-gate.py
# WHEN = 2026-10-23
# HOW = SHA256 binary identity and no-bypass subprocess help probe.
# LICENSE: MIT; AUTHORITY: Diagnostic only; respect OS application control.
import hashlib,json,subprocess,sys,pathlib
binary=pathlib.Path(sys.argv[1])
if not binary.is_file():raise FileNotFoundError(binary)
with binary.open('rb') as f:digest=hashlib.file_digest(f,'sha256').hexdigest()
try:
 run=subprocess.run([str(binary),'--help'],capture_output=True,text=True,timeout=20)
 ok=run.returncode==0
 reason='EXECUTABLE_RETURNED_'+str(run.returncode)
except (OSError,subprocess.TimeoutExpired) as exc:
 ok=False;reason=type(exc).__name__+': '+str(exc)[:250]
print(json.dumps({'status':'G93_REFERENCE_DEBUGGER_EXECUTABLE' if ok else 'G93_REFERENCE_DEBUGGER_EXECUTION_BLOCKED','builtBinarySha256':digest,'executableHelpPassed':ok,'failure':None if ok else reason,'referenceIntermediateTensorsCaptured':False,'productionAccepted':False},indent=2))
if not ok:sys.exit(2)
