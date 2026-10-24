/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.D3D11_UMD
TAG: LEEWAY_UMD_ACTUAL_ABI_NO_FAKE_ADMISSION
WHO: Owner-authorized LeeWay engineering. WHAT: Block false D3D claims.
WHEN: 2026-10-24. WHERE: native/windows/d3d11-umd.
WHY: OpenAdapter must not claim working GPU without full driver stack.
HOW: Source guard; real native DLL test is separate.
AUTHORITY: Source-only. LICENSE: LeeWay.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const dir=dirname(fileURLToPath(import.meta.url));
const src=readFileSync(join(dir,'leeway-d3d11-umd.cpp'),'utf8');
test('actual Windows SDK UMD driver types and ABI export',()=>{
 assert.match(src,/#include <d3d10umddi\.h>/);
 assert.match(src,/OpenAdapter10_2\(D3D10DDIARG_OPENADAPTER\*/);
 assert.match(src,/PFND3D10DDI_OPENADAPTER/);
});
test('UMD does not advertise an unsupported D3D device',()=>{
 assert.match(src,/return DXGI_ERROR_UNSUPPORTED;/);
 assert.doesNotMatch(src,/pAdapterFuncs_2\s*=|CreateDevice\s*\(/);
 assert.ok(!readdirSync(dir).some(x=>/\.(inf|sys|pfx)$/i.test(x)));
});
