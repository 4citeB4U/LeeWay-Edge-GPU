/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.EDGE_GPU.WINDOWS.MCDM_COMPLETE_KERNEL_COMPILATION
 * TAG: LEEWAY_ORIGINAL_WDDM_KMD_ELEVEN_TRANSLATION_UNITS_WPP_V1
 * WHO: Creator-authorized LeeWay driver engineering.
 * WHAT: Test full WDDM kernel source compiler harness.
 * WHY: Count every real translation unit without fake driver registration.
 * WHEN: 2026-10-24. WHERE: native/windows/mcdm.
 * HOW: Validate original source inventory, Microsoft ETW constants and no installer.
 * AUTHORITY: COMPILE_ONLY. LICENSE: Existing LeeWay terms.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const script=readFileSync(new URL('./compile-kernel-all-objects.ps1',import.meta.url),'utf8');
const shim=readFileSync(new URL('./trace-compile-compat.h',import.meta.url),'utf8');
test('all original Microsoft kernel source files, WPP tracing and count are compiled',()=>{
 const path=new URL('../../../third_party/microsoft-graphics-driver-samples/compute-only-sample/coskmd/',import.meta.url);
 const files=readdirSync(path).filter(f=>f.endsWith('.cpp'));
 assert.equal(files.length,11);
 for(const required of ['CosKmdAdapter.cpp','CosKmdGlobal.cpp','CosKmdDdi.cpp','CosKmdSoftAdapter.cpp'])
  assert.ok(files.includes(required));
 for(const token of ['tracewpp.exe','-DENABLE_WPP_RECORDER=1','/DWPP_TRACE_OPTIONS=43',
  '/DENABLE_WPP_RECORDER=1','/kernel /Zl','LEEWAY_KMD_ELEVEN_OBJECTS_PASS'])
  assert.ok(script.includes(token)||token==='/kernel /Zl'&&script.includes('/kernel /Zl'),token);
});
test('ETW shim uses documented WPP logger/level macros and event values, not disabled logging',()=>{
 assert.match(shim,/#include <evntrace\.h>/);
 assert.match(shim,/#define EVENT_CONTROL_CODE_DISABLE_PROVIDER 0/);
 assert.match(shim,/#define EVENT_CONTROL_CODE_ENABLE_PROVIDER 1/);
 assert.match(shim,/#define TRACE_LEVEL_ERROR 2/);
 assert.match(shim,/#define WPP_LEVEL_FLAGS_LOGGER\(lvl,flags\) WPP_LEVEL_LOGGER\(flags\)/);
 assert.match(shim,/#define WPP_LEVEL_FLAGS_ENABLED\(lvl,flags\)/);
 assert.doesNotMatch(shim,/#define WPP_LEVEL_FLAGS_ENABLED.*\bTRUE\b/);
});
test('complete object compiler has no PnP, boot, sign or installer actions',()=>{
 const runnable=script.replace(/^\s*#.*$/gm,'');
 assert.doesNotMatch(runnable,/\b(?:pnputil|devcon|bcdedit|signtool|inf2cat|SwDeviceCreate|Start-Service|New-Service)\b/i);
 assert.match(script,/linked=false signed=false installed=false/);
});
