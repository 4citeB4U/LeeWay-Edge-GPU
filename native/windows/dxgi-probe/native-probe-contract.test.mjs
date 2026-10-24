/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.DXGI_PNP
TAG: LEEWAY_OS_GFX_EXACT_LUID_OBSERVATION_TEST
WHO: Creator-authorized LeeWay engineering.
WHAT: Verify native OS adapter records correlate the identical PnP identity.
WHEN: 2026-10-24. WHERE: native/windows/dxgi-probe.
WHY: Prevent fake GPU recognition by name or wrong hardware adapter.
HOW: Native executable output structure and read-only safety checks.
AUTHORITY: Diagnostic evidence only; no driver registration or compute proof.
LICENSE: LeeWay.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const binary=process.env.LEEWAY_DXGI_PNP_PROBE;
test('native device correlation records exact Windows DXGI/PnP mappings', {skip:!binary},()=>{
 const raw=JSON.parse(execFileSync(binary,[],{encoding:'utf8',timeout:15000}));
 assert.equal(raw.schema,'leeway.native.dxgi-pnp.v1');
 assert.equal(raw.readOnly,true);
 assert.equal(raw.mappingMethod,'SetupDi+D3DKMT+DXGI_LUID');
 assert.ok(Array.isArray(raw.pnp));
 assert.ok(Array.isArray(raw.dxgi));
 assert.equal(raw.matchedDxgiAndPnPCount,raw.dxgi.length);
 for(const x of raw.dxgi){
  assert.equal(x.NativeMapping,true);
  assert.ok(x.AdapterLuid && x.Description && x.PNPDeviceID);
  assert.ok(raw.pnp.some(p=>p.InstanceId.toLowerCase()===x.PNPDeviceID.toLowerCase()));
 }
});
test('native probe cannot install drivers or fabricate PnP resources',()=>{
 const src=fs.readFileSync(new URL('./leeway-dxgi-pnp.cpp',import.meta.url),'utf8');
 for(const name of ['SetupDiGetDeviceInstanceIdW','D3DKMTOpenAdapterFromDeviceName',
  'D3DKMTCloseAdapter','CreateDXGIFactory1','luidEqual'])
  assert.ok(src.includes(name),name);
 for(const name of ['SetupDiInstallDevice','SetupDiCreateDeviceInfo','UpdateDriverForPlugAndPlayDevices','CM_Register_Device_Interface'])
  assert.ok(!src.includes(name),name);
});
