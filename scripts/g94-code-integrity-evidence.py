# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.SECURITY.DIAGNOSTICS
# TAG: LEEWAY.G94.WINDOWS_CODE_INTEGRITY_POLICY_EVIDENCE
# 5WH: WHAT = Preserve observed Windows Code Integrity block on llama-debug.
# WHY = Establish the actual security gate without changing device policy.
# WHO = Creator-directed read-only diagnostic engineering.
# WHERE = scripts/g94-code-integrity-evidence.py
# WHEN = 2026-10-23
# HOW = Parse a read-only PowerShell exported Code Integrity event JSON.
# LICENSE: MIT; AUTHORITY: Diagnostic only, not signing or policy authorization.
import json,sys
data=json.load(open(sys.argv[1],encoding='utf-8-sig'))
events=[x for x in data if x.get('id') in [3033,3077] and 'llama-debug.exe' in x.get('message','').lower()]
policy='0283ac0f-fff1-49ae-ada1-8a933130cad6'
match=any(policy in e['message'].lower() for e in events)
print(json.dumps({'status':'G94_SIGNING_POLICY_BLOCK_CONFIRMED' if match else 'G94_EVIDENCE_INSUFFICIENT','eventsFound':len(events),'ids':sorted(set(e['id'] for e in events)),'policyId':policy if match else None,'authorizedAllowRuleEstablished':False,'policyOwnerIdentified':False,'securityBypassAttempted':False,'productionAccepted':False},indent=2))
if not match:sys.exit(2)
