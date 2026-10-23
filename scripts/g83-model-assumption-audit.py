# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G83.MODEL_ASSUMPTIONS_AUDIT
# 5WH: WHAT = Validate G78 hardcoded Qwen3 RoPE and GQA assumptions against actual GGUF metadata.
# WHY = Establish model-specific constants before changing attention or KV math.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g83-model-assumption-audit.py
# WHEN = 2026-10-23
# HOW = Parse GGUF metadata using established G60 inspector and inspect source assumptions.
# LICENSE: MIT; AUTHORITY: Read-only diagnostics; no production admission.
import os,sys,json,importlib.util,inspect
here=os.path.dirname(__file__)
spec=importlib.util.spec_from_file_location('g60',os.path.join(here,'g60-gguf-inspect.py'))
g60=importlib.util.module_from_spec(spec);spec.loader.exec_module(g60)
report=g60.inspect(sys.argv[1])
meta=report['metadata']
expected={'qwen3.block_count':36,'qwen3.embedding_length':2560,'qwen3.attention.head_count':32,'qwen3.attention.head_count_kv':8,'qwen3.attention.key_length':128,'qwen3.attention.value_length':128,'qwen3.rope.freq_base':1000000}
observed={k:meta.get(k) for k in expected}
failed=[k for k,v in expected.items() if observed[k]!=v]
eps=meta.get('qwen3.attention.layer_norm_rms_epsilon')
if not isinstance(eps,(float,int)) or abs(eps-1e-6)>1e-10:failed.append('qwen3.attention.layer_norm_rms_epsilon')
print(json.dumps({'status':'G83_MODEL_CONSTANTS_PASS' if not failed else 'G83_MODEL_CONSTANTS_FAIL','ggufSha256':report['sha256'],'verifiedGGUFParameters':observed,'epsilon':eps,'violations':failed,'RoPELayoutComparedToLlamaCpp':False,'llamaCppSecondTokenMismatchResolved':False,'productionAccepted':False},indent=2))
if failed:sys.exit(1)
