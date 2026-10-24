/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.EDGE_GPU.WINDOWS.COMPUTE_SOURCE_GUARDS
 * TAG: LEEWAY_GENUINE_31_KERNEL_UMD_COMPILE_SCRIPT_VALIDATION
 * WHO: Creator-authorized engineering. WHAT: Source/compile safety guards.
 * WHY: Verify exact modules without fabricated OS device registration.
 * WHEN: 2026-10-24. WHERE: native/windows/mcdm.
 * HOW: Read build scripts and pinned source enumerations.
 * AUTHORITY: COMPILE_ONLY; no driver installation or certification.
 * LICENSE: LeeWay terms.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const kernel=read('./compile-kernel-five-objects.ps1');
const user=read('./compile-umd26-objects.ps1');
test('kernel source script compiles real WPP, DDI, and software command modules',()=>{
 for(const n of ['CosKmdMetaCommand.cpp','CosKmdLogging.cpp','CosKmdAcpi.cpp',
   'CosKmdDdi.cpp','CosKmdSoftAdapter.cpp'])assert.ok(kernel.includes(n),n);
 for(const v of ['tracewpp.exe','/kernel','/c','/DWPP_TRACE_OPTIONS=43',
   'LEEWAY_KMD_FIVE_OBJECTS_PASS'])assert.ok(kernel.includes(v),v);
});
test('all 26 original UMD translation units remain discoverable without generated binaries',()=>{
 const dir=new URL('../../../third_party/microsoft-graphics-driver-samples/compute-only-sample/cosumd12/',import.meta.url);
 const originals=readdirSync(dir).filter(x=>x.endsWith('.cpp'));
 assert.equal(originals.length,26);
 for(const v of ['CosUmd12.cpp','CosUmd12DeviceDDI.cpp','CosUmd12Shader.cpp'])
  assert.ok(originals.includes(v));
 assert.match(user,/files\.Count -ne 26/);
 assert.match(user,/LEEWAY_UMD_26_OBJECTS_PASS/);
});
test('source compiler scripts cannot install, register, sign or start a kernel driver',()=>{
 for(const script of [kernel,user]){
  const commands=script.replace(/^\s*#.*$/gm,'');
  assert.doesNotMatch(commands,/\b(?:pnputil|devcon|bcdedit|signtool|inf2cat|Start-Service|New-Service|SwDeviceCreate)\b/i);
  assert.match(commands,/\/c/);
  assert.match(commands,/linked=false signed=false installed=false/);
 }
});
