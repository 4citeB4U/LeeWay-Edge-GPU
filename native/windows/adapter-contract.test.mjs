/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.ADAPTER_DISCOVERY
TAG: LEEWAY_WDDM_IDENTITY_NO_FRIENDLY_NAME_FALSE_POSITIVES
WHO: Creator-authorized LeeWay native adapter review.
WHAT: Distinguish OS device name, driver service, DXGI, and runtime proof.
WHERE: native/windows. WHEN: 2026-10-24.
WHY: Prevent diagnostic claims from turning into false OS GPU registration.
HOW: Strict negative cases and a synthetic structural correlation case.
AUTHORITY: Tests do not certify a live driver. LICENSE: LeeWay.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyWindowsAdapter,qualifyNativeCompute} from './adapter-contract.mjs';
const display={FriendlyName:'LeeWay Edge GPU',Status:'OK',InstanceId:'TEST-INSTANCE'};
const video={Name:'LeeWay Edge GPU',PNPDeviceID:'TEST-INSTANCE',DriverVersion:'1'};
const service={Name:'LeeWaySoftwareGpu',State:'Running',
 PathName:'C:\\Windows\\System32\\drivers\\leeway-gpu.sys',PNPDeviceID:'TEST-INSTANCE'};
const dxgi={Description:'LeeWay Edge GPU',PNPDeviceID:'TEST-INSTANCE',AdapterLuid:'0-AABB',NativeMapping:true};
const synthetic={pnp:[display],video:[video],services:[service],dxgi:[dxgi]};
test('empty system cannot claim Windows GPU',()=>{
 const r=classifyWindowsAdapter({pnp:[],video:[],services:[],dxgi:[]});
 assert.equal(r.nativeRecognized,false);
 assert.equal(r.diagnosticsNativeGpuEligible,false);
});
test('friendly name alone is not native graphics',()=>{
 assert.equal(classifyWindowsAdapter({pnp:[display]}).nativeRecognized,false);
});
test('unhealthy PnP device cannot claim native GPU',()=>{
 assert.equal(classifyWindowsAdapter({...synthetic,pnp:[{...display,Status:'Error'}]}).nativeRecognized,false);
});
test('PnP and video controller alone are not DXGI or driver qualification',()=>{
 const r=classifyWindowsAdapter({pnp:[display],video:[video]});
 assert.equal(r.nativeRecognized,false);
 assert.equal(r.correlatedVideo,1);
 assert.equal(r.classification,'WINDOWS_PNP_VIDEO_ONLY_NOT_DXGI');
});
test('DXGI-looking description with no running driver cannot claim GPU',()=>{
 assert.equal(classifyWindowsAdapter({...synthetic,services:[]}).nativeRecognized,false);
});
test('running service with no DXGI adapter cannot claim GPU',()=>{
 assert.equal(classifyWindowsAdapter({...synthetic,dxgi:[]}).nativeRecognized,false);
});
test('wrong-instance service or DXGI adapter does not cross-admit',()=>{
 assert.equal(classifyWindowsAdapter({...synthetic,services:[{...service,PNPDeviceID:'OTHER'}]}).nativeRecognized,false);
 assert.equal(classifyWindowsAdapter({...synthetic,dxgi:[{...dxgi,PNPDeviceID:'OTHER'}]}).nativeRecognized,false);
});
test('manually constructed DXGI observation with no native mapping is rejected',()=>{
 assert.equal(classifyWindowsAdapter({...synthetic,dxgi:[{...dxgi,NativeMapping:false}]}).nativeRecognized,false);
});
test('synthetic multi-source observation stays unqualified pending independent command proof',()=>{
 const r=classifyWindowsAdapter(synthetic);
 assert.equal(r.nativeRecognized,true);
 assert.equal(r.computeVerified,false);
 assert.equal(r.diagnosticsNativeGpuEligible,false);
 assert.equal(r.recognizedAdapterLuid,'0-AABB');
 assert.equal(qualifyNativeCompute(r,{source:'self',deviceInstanceId:'TEST-INSTANCE',
  dxgiInstanceId:'TEST-INSTANCE',adapterLuid:'0-AABB',
  commandSubmission:true,readbackMatchesReference:true}).qualified,false);
});
test('independent evidence from another adapter is rejected',()=>{
 const r=classifyWindowsAdapter(synthetic);
 assert.equal(qualifyNativeCompute(r,{source:'independent-native-runtime',
  deviceInstanceId:'TEST-INSTANCE',dxgiInstanceId:'TEST-INSTANCE',
  adapterLuid:'0-FFFF',commandSubmission:true,readbackMatchesReference:true}).qualified,false);
});
test('absence of native DXGI enumeration forbids command claim',()=>{
 assert.equal(qualifyNativeCompute(classifyWindowsAdapter({pnp:[],video:[],dxgi:[]}),{}).qualified,false);
});
