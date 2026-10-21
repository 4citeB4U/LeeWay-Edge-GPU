import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyModelCandidate as classify,proposeRoute as route} from './g19-multi-device-model-catalog.mjs';
const base={deviceId:'fold6',deviceKind:'ANDROID',source:'DEVICE_LOCAL',modelId:'test-model',modelSha256:'ab'.repeat(32),backend:'local-engine',localWeightsObserved:true,entrypointVerified:true,accessAuthorized:true};
test('paired-PC inventory cannot become Samsung local runnable',()=>{const a=classify({...base,source:'PAIRED_PC'});assert.equal(a.deviceLocalRunnable,false);assert.equal(a.locality,'PAIRED_PC_REMOTE')});
test('restricted system model is not an accessible local entrypoint',()=>{const a=classify({...base,source:'SYSTEM_COMPONENT'});assert.equal(a.deviceLocalRunnable,false)});
test('model weight hash is mandatory',()=>{const a=classify({...base,modelSha256:null});assert.equal(a.deviceLocalRunnable,false)});
test('private model lacking authorized entrypoint cannot execute',()=>{const a=classify({...base,entrypointVerified:false});assert.equal(a.deviceLocalRunnable,false)});
test('local candidate never declares GPU inference from inventory alone',()=>{const a=classify(base);assert.equal(a.deviceLocalRunnable,true);assert.equal(a.physicalGpuModelInferenceQualified,false)});
test('cross-device route rejects unavailable authority',()=>{const a=classify(base);assert.equal(route({fromDeviceId:'windows',target:a}).admitted,false)});
test('cross-device candidate stays noncanonical even when permitted',()=>{const a=classify(base);const x=route({fromDeviceId:'windows',target:a,ownerGrant:{requestScopedVerified:true,targetDeviceId:'fold6'}});assert.equal(x.remoteExecution,true);assert.equal(x.canonicalInferenceAccepted,false);assert.equal(x.voiceIdentity,'UNMODIFIED')});
test('invalid device identity fails',()=>assert.throws(()=>classify({...base,deviceId:''}),/UNBOUND/));

test('caller metadata cannot assert physical GPU inference qualification',()=>{
 const r=classify({...base,physicalGpuExecutionVerified:true});
 assert.equal(r.physicalGpuModelInferenceQualified,false);
});
test('fabricated paired PC record and owner grant cannot admit a route',()=>{
 const target={deviceId:'fold6',source:'PAIRED_PC',locality:'DEVICE_LOCAL_CANDIDATE',deviceLocalRunnable:true};
 assert.equal(route({fromDeviceId:'windows',target,ownerGrant:{requestScopedVerified:true,targetDeviceId:'fold6'}}).admitted,false);
});
test('even classified candidate plus self-reported owner grant is not executable authority',()=>{
 const target=classify(base);
 const r=route({fromDeviceId:'windows',target,ownerGrant:{requestScopedVerified:true,targetDeviceId:'fold6'}});
 assert.equal(r.admitted,false);
 assert.equal(r.proposalEligible,true);
 assert.equal(r.canonicalInferenceAccepted,false);
});
