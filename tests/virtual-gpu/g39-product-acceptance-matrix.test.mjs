/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.PRODUCT_RELEASE_GOVERNANCE.TEST
TAG: LEEWAY.G39.STANDALONE_API_DRIVER_PLATFORM_AND_BENCHMARK_TRUTH
5WH:
WHAT = Enforce one cross-PR GPU product acceptance matrix and prohibit false readiness.
WHY = Partial software math or healthy ledgers cannot ship an unqualified GPU service/driver.
WHO = Creator-authorized LeeWay engineering; no production or independent signer authority.
WHERE = LeeWay-Edge-GPU/tests/virtual-gpu/g39-product-acceptance-matrix.test.mjs
WHEN = 2026-10-22
HOW = Validate source-controlled release gates, API denials, distinct OS adapters and benchmarks.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const json=fileURLToPath(new URL('../../docs/virtual-gpu/G39-PRODUCT-ACCEPTANCE-MATRIX-20261022.json',import.meta.url));
const m=JSON.parse(fs.readFileSync(json,'utf8'));
const byId=Object.fromEntries(m.gates.map(x=>[x.id,x]));
test('G39 reconciles original three draft PRs and separate Learning readback',()=>{
 assert.equal(m.prReconciliation.length,3);
 assert.deepEqual(m.prReconciliation.map(p=>p.number),[11,77,78]);
 assert.ok(m.prReconciliation.every(x=>x.state==='DRAFT_PARTIAL'));
 assert.equal(m.additionalEvidence.number,76);
 assert.equal(m.additionalEvidence.state,'DRAFT_NOT_NEW_GPU_ADMISSION');
});
test('G39 every unique gate demands concrete acceptance and evidence',()=>{
 assert.equal(Object.keys(byId).length,m.gates.length);
 assert.ok(m.gates.length>=14);
 for(const g of m.gates){
  assert.match(g.id,/^[A-Z][0-9]{2}$/);
  assert.ok(g.layer&&g.name&&g.status&&g.passRequires.length>=40);
  assert.ok(g.evidence.length>0);
 }
});
test('G39 bounded v1 standalone target requires original software compute',()=>{
 assert.equal(m.v1Target,'STANDALONE_LEEWAY_GPU_APPLICATION_AND_OPT_IN_SDK');
 assert.equal(m.v1Backend,'LEEWAY_SOFTWARE_HOST_CPU');
 assert.equal(m.defaultExternalGpuProviderRequired,false);
 assert.equal(m.candidateApi.leeWaySoftwareHostCpuIsRealComputeEngine,true);
 assert.equal(m.candidateApi.noUndocumentedAutomaticFallback,true);
});
test('G39 SDK exists as discovery but execution API remains denied',()=>{
 assert.ok(m.candidateApi.existingReadOnly.includes('GET /v1/status'));
 assert.ok(m.candidateApi.existingReadOnly.includes('GET /v1/manifest'));
 assert.equal(m.candidateApi.existingWriteState,'EXPLICIT_DENY_PENDING_CANONICAL_ADMISSION');
 assert.ok(m.candidateApi.planned.some(p=>p.route==='POST /v1/execute'));
 assert.equal(m.claims.usableThirdPartyComputeApi,'NOT_QUALIFIED');
});
test('G39 production cannot pass until actual protected authority and same-request outcome',()=>{
 assert.equal(m.productProductionReady,false);
 assert.equal(m.apiExecutionProductionReady,false);
 assert.equal(byId.A01.status,'BLOCKED');
 assert.equal(byId.A02.status,'PARTIAL_MEASURED_UNAPPROVED');
 assert.equal(byId.C03.status,'BLOCKED');
 assert.equal(m.claims.signedSoftwareOnlyProtectedAuthority,'BLOCKED_NOT_INSTALLED');
 assert.equal(m.claims.fullSameRequestProductionChain,'BLOCKED_NOT_VERIFIED');
});
test('G39 original LDWMD host RAM cannot be relabelled physical VRAM',()=>{
 assert.match(byId.C02.passRequires,/worker internal copies/);
 assert.equal(byId.C02.status,'LAB_PASS_PRODUCTION_LEASE_MISSING');
 assert.equal(m.candidateApi.backendDescriptorFields.includes('hardwareGpuUsed'),true);
 assert.equal(m.candidateApi.backendDescriptorFields.includes('resourceKind'),true);
});
test('G39 OS-native WDDM and third-party automatic interception are distinct',()=>{
 assert.equal(m.nativeOsGpuEnumerationRequiredForV1,false);
 assert.equal(m.nativeOsGpuEnumerationIndependentGate,true);
 assert.equal(byId.W01.status,'BLOCKED_SEPARATE');
 assert.equal(m.releasePolicy.doNotClaimAllAppsSupported,true);
 assert.equal(m.claims.windowsOsEnumeratedLeeWayGpu,'NOT_QUALIFIED');
});
test('G39 Android debug service deployment cannot prove Vulkan CI binary phone execution',()=>{
 assert.equal(byId.D01.status,'PARTIAL_INSTALLED_DIAGNOSTIC');
 assert.ok(byId.D01.evidence.some(x=>x.includes('Vulkan_CI_artifact_NOT_PHONE_DEPLOYED')));
 assert.equal(byId.I01.status,'SOURCE_STAGED');
 assert.equal(byId.L01.status,'SHELL_SCRIPT_ONLY');
});
test('G39 retention of failed dense matrix comparison prevents an invented speedup',()=>{
 assert.equal(m.performanceEvidence.dimension,2048);
 assert.equal(m.performanceEvidence.leeWayCpuMedianMs,7598.0897);
 assert.equal(m.performanceEvidence.nvidiaRtx5060MedianMs,10.1847);
 assert.equal(m.performanceEvidence.numericalMismatches,0);
 assert.equal(m.performanceEvidence.leeWayOutperformedNvidia,false);
 assert.equal(m.claims.fasterThanNvidiaGeneralClaim,'NOT_PROVED');
});
test('G39 release fails whenever any mandatory approval is not proven',()=>{
 const necessary=m.releasePolicy.allRequiredGatesMustPass;
 assert.ok(necessary.every(x=>byId[x]));
 assert.ok(necessary.includes('P02')&&necessary.includes('C03')&&necessary.includes('A01'));
 const blockers=necessary.filter(x=>byId[x].status!=='PRODUCTION_PASS');
 assert.ok(blockers.length>0);
 assert.equal(m.releasePolicy.anyBlockedReleaseGateMeansNoProduction,true);
 assert.equal(m.productProductionReady,false);
});
