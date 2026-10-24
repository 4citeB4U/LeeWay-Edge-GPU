/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.WDDM
TAG: LEEWAY_WDDM_NONINSTALLABLE_SOURCE_SAFETY_CHECK
WHO: LeeWay authorized release review. WHAT: Fail-closed bootstrap tests.
WHY: Never promote compiled stubs to an installed OS graphics driver.
WHERE: native/windows/wddm. WHEN: 2026-10-24.
HOW: Read source and assert unsupported device admission and no INF.
AUTHORITY: Source review only. LICENSE: LeeWay.
*/
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const src=readFileSync(join(root,'leeway-wddm-bootstrap.c'),'utf8');
const build=readFileSync(join(root,'build-bootstrap.ps1'),'utf8');
test('real WDK miniport ABI used instead of fake adapter types',()=>{
 assert.match(src,/#include <dispmprt\.h>/);
 for(const symbol of ['DRIVER_INITIALIZATION_DATA','DXGKDDI_INTERFACE_VERSION',
   'PDXGKDDI_ADD_DEVICE','PDXGKDDI_START_DEVICE','PDXGKDDI_STOP_DEVICE',
   'PDXGKDDI_REMOVE_DEVICE','PDXGKDDI_UNLOAD'])
   assert.ok(src.includes(symbol),symbol);
});
test('incomplete WDDM cannot register an adapter or call DxgkInitialize',()=>{
 assert.match(src,/\*miniportDeviceContext\s*=\s*NULL;/);
 assert.match(src,/return STATUS_NOT_SUPPORTED;/);
 const executable=src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');
 assert.doesNotMatch(executable,/\bDxgkInitialize\s*\(/);
 assert.equal(readdirSync(root).some(x=>x.endsWith('.inf')||x.endsWith('.sys')),false);
});
test('WDK build is source-only, not installation',()=>{
 assert.match(build,/\/kernel/);
 assert.match(build,/\/WX/);
 assert.doesNotMatch(build,/\bpnputil\b|\bsc\.exe\b|\bbcdedit\b|\bdevcon\b/i);
 assert.match(build,/driverCreated=false/);
});
