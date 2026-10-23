import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyWindowsAdapter,qualifyNativeCompute} from './adapter-contract.mjs';
test('empty enumeration cannot claim native GPU',()=>{const x=classifyWindowsAdapter({pnp:[],video:[]});assert.equal(x.nativeRecognized,false);assert.equal(x.diagnosticsNativeGpuEligible,false);});
test('friendly name alone cannot claim native GPU',()=>{const x=classifyWindowsAdapter({pnp:[{FriendlyName:'LeeWay GPU',Status:'OK',InstanceId:'TEST'}],video:[]});assert.equal(x.nativeRecognized,false);});
test('unhealthy device cannot claim native GPU',()=>{const x=classifyWindowsAdapter({pnp:[{FriendlyName:'LeeWay GPU',Status:'Error',InstanceId:'TEST'}],video:[{Name:'LeeWay GPU',PNPDeviceID:'TEST',DriverVersion:'1'}]});assert.equal(x.nativeRecognized,false);});
test('correlated enumeration is not compute qualification',()=>{const x=classifyWindowsAdapter({pnp:[{FriendlyName:'LeeWay GPU',Status:'OK',InstanceId:'TEST'}],video:[{Name:'LeeWay GPU',PNPDeviceID:'TEST',DriverVersion:'1'}]});assert.equal(x.nativeRecognized,true);assert.equal(x.computeVerified,false);assert.equal(x.diagnosticsNativeGpuEligible,false);});
test('no self-attested runtime proof',()=>{const x=classifyWindowsAdapter({pnp:[{FriendlyName:'LeeWay GPU',Status:'OK',InstanceId:'TEST'}],video:[{Name:'LeeWay GPU',PNPDeviceID:'TEST',DriverVersion:'1'}]});assert.equal(qualifyNativeCompute(x,{source:'self',deviceInstanceId:'TEST',dxgiInstanceId:'TEST',commandSubmission:true,readbackMatchesReference:true}).qualified,false);});
test('missing actual native discovery blocks compute claim',()=>{assert.equal(qualifyNativeCompute(classifyWindowsAdapter({pnp:[],video:[]}),{}).qualified,false);});
