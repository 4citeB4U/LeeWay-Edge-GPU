/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.G40.MATH_PROVIDER_AUDIT.TEST
TAG: LEEWAY.G40.CESIUM_THREE_ORIGINAL_SOURCE_NO_FALSE_PRODUCTION
5WH:
WHAT = Qualify claims and numerical invariants in the existing LeeWay Cesium/Three source provider inventory.
WHY = A successful matrix worker must not erase geospatial and computational geometry mathematics.
WHO = Creator-authorized LeeWay engineering; source inventory not independent Veritas.
WHERE = tests/virtual-gpu/g40-math-provider-truth.test.mjs
WHEN = 2026-10-22
HOW = Read source evidence catalog, distinguish library tests from original provider call, enforce honest release gates.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const catalog=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../docs/virtual-gpu/G40-CESIUM-THREE-MATH-PROVIDER-CATALOG-20261022.json',import.meta.url)),'utf8'));
const matrix=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../docs/virtual-gpu/G39-PRODUCT-ACCEPTANCE-MATRIX-20261022.json',import.meta.url)),'utf8'));
test('G40 two original LeeWay mathematical providers explicitly recovered',()=>{
 assert.equal(catalog.providers.length,2);
 assert.equal(catalog.providers[0].library,'CesiumJS');
 assert.equal(catalog.providers[1].library,'Three.js');
 assert.ok(catalog.providers.every(p=>p.originalRepository.startsWith('4citeB4U/')));
 assert.ok(catalog.providers.every(p=>p.originalSourceOnGitHub===true || Array.isArray(p.sourcePaths)));
});
test('G40 real WGS84 Cesium numerical probe uses meters and correct reference frame',()=>{
 const p=catalog.providers[0];
 assert.ok(p.operations.includes('ENU_LOCAL_REFERENCE_TRANSFORM'));
 assert.ok(p.operations.includes('WGS84_ELLIPSOID_GEODESIC_DISTANCE'));
 assert.ok(p.currentDeviceMathProbe.surfaceDistanceMeters>111000);
 assert.ok(p.currentDeviceMathProbe.surfaceDistanceMeters<111500);
 assert.ok(p.currentDeviceMathProbe.slantDistanceMeters<p.currentDeviceMathProbe.surfaceDistanceMeters);
 assert.ok(p.currentDeviceMathProbe.eastOffsetMeters>111000);
 assert.equal(p.currentDeviceMathProbe.originalSourceEngineInvoked,false);
});
test('G40 actual Three.js library arithmetic tested but not original LeeWay production integration',()=>{
 const p=catalog.providers[1],proof=p.currentDeviceMathProbe;
 assert.deepEqual(proof.matrix4VectorOutput,[4,7,6]);
 assert.deepEqual(proof.boxMin,[0,1,2]);
 assert.deepEqual(proof.boxMax,[2,3,4]);
 assert.equal(proof.boxTriangleVertexCount,36);
 assert.equal(proof.surfaceSampleFinite,true);
 assert.equal(proof.originalAgentx23FunctionsInvoked,false);
 assert.equal(proof.productionAdmission,false);
});
test('G40 shadow spatial-context observations are not promoted into Golden Formula authority',()=>{
 assert.equal(catalog.formulaCanonicalWindow,'16x6');
 assert.equal(catalog.formulaCanonicalEngineMustRemainByteIdentical,true);
 assert.equal(catalog.relatedSeparateLane.policyAuthority,false);
 assert.equal(catalog.relatedSeparateLane.formulaExecutionState,'NOT_EXECUTED');
 assert.equal(catalog.relatedSeparateLane.realCompleteObservationsFromOct4Trace,0);
 assert.equal(catalog.relatedSeparateLane.notEquivalentToGpuMathProvider,true);
});
test('G40 new original geometry/spatial math gates are in product matrix and remain unqualified',()=>{
 const byId=Object.fromEntries(matrix.gates.map(x=>[x.id,x]));
 for(const id of ['M01','M02','M03']){
  assert.ok(byId[id],id+' absent from G39 release gate catalog');
  assert.notEqual(byId[id].status,'PRODUCTION_PASS');
 }
 assert.equal(matrix.productProductionReady,false);
 assert.equal(matrix.apiExecutionProductionReady,false);
 assert.equal(catalog.featureClaims.combinedCesiumAndThreeProductionKernelImplemented,false);
 assert.equal(catalog.featureClaims.realSoftwareGpuProtectedIssuerAdmitted,false);
});
test('G40 no library result can impersonate hardware GPU, signed service or protected policy',()=>{
 assert.equal(catalog.claimsProductionMathProviderIntegrated,false);
 assert.equal(catalog.featureClaims.standaloneGpuMathFeatureProductionReady,false);
 assert.equal(catalog.featureClaims.originalLeeWayProviderFunctionsExecutedTogether,false);
 assert.equal(catalog.relatedSeparateLane.policyAuthority,false);
 assert.ok(catalog.requiredGlue.includes('LDWMD_HOST_RAM_LEASE_AND_ACTUAL_OPERATION_EXECUTION'));
 assert.ok(catalog.requiredGlue.includes('CONTINUUM_EXACT_BYTES_READBACK_VERITAS_POST_RECEIPT_LEARNING_AUDIT_TRIAD'));
});
