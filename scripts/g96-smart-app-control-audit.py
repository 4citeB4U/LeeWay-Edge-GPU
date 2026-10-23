# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.SECURITY.DIAGNOSTICS
# TAG: LEEWAY.G96.SMART_APP_CONTROL_ENFORCEMENT
# 5WH: WHAT = Establish the precise Windows Smart App Control enforcement gate.
# WHY = Avoid weakening Windows security while pursuing independent Qwen3 tensor verification.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g96-smart-app-control-audit.py
# WHEN = 2026-10-23
# HOW = Parse previously captured read-only Windows policy and Code Integrity records.
# LICENSE: MIT; AUTHORITY: Diagnostic only; no policy modification or waiver.
import json,sys
policy=json.load(open(sys.argv[1],encoding='utf-8-sig'))
events=json.load(open(sys.argv[2],encoding='utf-8-sig'))
guid='0283ac0f-fff1-49ae-ada1-8a933130cad6'
state=policy.get('verifiedAndReputablePolicyState')
active=any(guid in x.lower() for x in policy.get('activePolicyNames',[]))
blocks=[e for e in events if e.get('id')==3077 and guid in e.get('message','').lower() and 'llama-debug.exe' in e.get('message','').lower()]
confirmed=state==1 and active and len(blocks)>0
print(json.dumps({'status':'G96_SMART_APP_CONTROL_ENFORCEMENT_CONFIRMED' if confirmed else 'G96_EVIDENCE_INSUFFICIENT','policyName':'VerifiedAndReputableDesktop','policyGuid':guid,'registryState':state,'activePolicyFilePresent':active,'matchingBlockEvents':len(blocks),'compliantPath':'trusted signed or reputation-authorized executable; no local unsigned allow exception assumed','installedLlamaServerIntermediateTensorApiVerified':False,'securitySettingsChanged':False,'productionAccepted':False},indent=2))
if not confirmed:sys.exit(2)
