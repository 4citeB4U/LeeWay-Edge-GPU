# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.SECURITY.DIAGNOSTICS
# TAG: LEEWAY.G95.CODE_INTEGRITY_OWNERSHIP_AUDIT
# 5WH: WHAT = Summarize device enrollment and local Code Integrity policy evidence.
# WHY = Determine an authorized path before attempting debugger execution.
# WHO = Creator-directed read-only diagnostic engineering.
# WHERE = scripts/g95-policy-ownership-audit.py
# WHEN = 2026-10-23
# HOW = Parse locally captured policy metadata and enrollment results; never modify policy.
# LICENSE: MIT; AUTHORITY: Diagnostic only; not an authorization or policy exception.
import json,sys
data=json.load(open(sys.argv[1],encoding='utf-8-sig'))
pid='0283ac0f-fff1-49ae-ada1-8a933130cad6'
enrollment=data['enrollment']
present=any(pid in x.lower() for x in data['activePolicyNames'])
joined=any(enrollment.get(k,False) for k in ('azureAdJoined','enterpriseJoined','domainJoined','workplaceJoined'))
ok=present and not joined and data['verifiedAndReputablePolicyState']==1
print(json.dumps({'status':'G95_LOCAL_POLICY_EVIDENCE_VERIFIED' if ok else 'G95_EVIDENCE_INCOMPLETE','blockingPolicyPresent':present,'joinedToDomainOrEntraOrWorkplace':joined,'verifiedAndReputablePolicyState':data['verifiedAndReputablePolicyState'],'potentialSmartAppControlInvolvement':True,'policyOwnerProven':False,'authorizationEstablished':False,'securityPolicyChanged':False,'productionAccepted':False},indent=2))
if not ok:sys.exit(2)
