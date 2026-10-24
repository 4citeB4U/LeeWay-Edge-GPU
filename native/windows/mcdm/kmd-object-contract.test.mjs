/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.MCDM_TEST
 * TAG: REAL_KMD_COMPILER_SAFE_SOURCE_GUARDS
 * WHO: Owner-authorized LeeWay verification.
 * WHAT: Check real Microsoft KMD source build script; reject unsafe installer actions.
 * WHEN: 2026-10-24. WHERE: native/windows/mcdm.
 * WHY: Compiled .obj is not an OS-recognized GPU or safe-to-install .sys.
 * HOW: Static build-script verification. AUTHORITY: SOURCE_ONLY.
 * LICENSE: Existing LeeWay terms.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('./compile-kernel-objects.ps1',import.meta.url),'utf8');
test('real kernel compile uses installed MSVC and WDK with two actual MIT source units',()=>{
 assert.match(src,/CosKmdMetaCommand\.cpp/);
 assert.match(src,/CosKmdLogging\.cpp/);
 assert.match(src,/\/kernel/);
 assert.match(src,/\/c \/TP/);
 assert.match(src,/\/D_AMD64_/);
 assert.match(src,/\.obj/);
});
test('kernel compile script never installs, signs, registers, or links a device driver',()=>{
 const executable=src.replace(/^\s*#.*$/gm,'');
 assert.doesNotMatch(executable,/\b(?:pnputil|devcon|bcdedit|sc\.exe|signtool|inf2cat|Add-WindowsDriver|New-Service|SwDeviceCreate)\b/i);
 assert.match(src,/driverLinked=false driverSigned=false driverInstalled=false/);
});
