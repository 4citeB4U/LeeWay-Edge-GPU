/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.EDGE_GPU.WINDOWS.COMPUTE_DRIVER_SOURCE
 * TAG: LEEWAY_MCDM_MICROSOFT_MIT_SOURCE_CUSTODY_V1
 * WHO: Owner-authorized LeeWay GPU driver engineering.
 * WHAT: Verify exact upstream sample files, MIT license and no executable driver.
 * WHY: Reuse before build, without rebranding or auto-installing unqualified KMD.
 * WHERE: native/windows/mcdm. WHEN: 2026-10-24.
 * HOW: Source SHA-256, DDI interface review, old-INF rejection.
 * AUTHORITY: SOURCE_ONLY; no driver signing, install or production admission.
 * LICENSE: Original upstream MIT copyright retained; LeeWay source governs tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../third_party/microsoft-graphics-driver-samples');
const refs=new Map([
 ['license.txt','06ce9969082147ee4593605f37203cd0f5b3aee84f1c4a75f181d57c124b4cda'],
 ['compute-only-sample/coskmd/CosKmdSoftAdapter.cpp','41bf2f89e412f969e25f627becf286e6c38c799f17d449f6f6f404f11245d515'],
 ['compute-only-sample/coskmd/CosKmdDdi.cpp','029f9a959b2de97f5f738063633656f5ff614d0b1e44b5d0377eef6d15d3225b'],
 ['compute-only-sample/cosumd12/CosUmd12.cpp','f63c0c7962a1a372a9f2f91f3d1d3bddf7b8095a090a64eb27fa14d3940bf5b0'],
 ['compute-only-sample/cosumd12/CosUmd12Adapter.cpp','b087b2ca8d0bef371945527fc95ac8d43f3f34bef23a831e6bca8eb67fcdf653'],
 ['compute-only-sample/cosdriver/cos.inf','31bdc358bc352494f8c22403a08732f218fccf75246795902bd5d66c0dde7ee3']
]);
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function walk(dir){
 const result=[];
 for(const name of readdirSync(dir)){
  const abs=join(dir,name);
  if(statSync(abs).isDirectory())result.push(...walk(abs));else result.push(abs);
 }
 return result;
}
test('Microsoft source reference and MIT license match pinned originals',()=>{
 for(const [file,wanted] of refs)
  assert.equal(sha(join(root,file)),wanted,file);
 assert.match(readFileSync(join(root,'license.txt'),'utf8'),/MIT License/);
});
test('reference provides real kernel and Direct3D12 user-mode driver source',()=>{
 const k=readFileSync(join(root,'compute-only-sample/coskmd/CosKmdDdi.cpp'),'utf8');
 const soft=readFileSync(join(root,'compute-only-sample/coskmd/CosKmdSoftAdapter.cpp'),'utf8');
 const umd=readFileSync(join(root,'compute-only-sample/cosumd12/CosUmd12.cpp'),'utf8');
 assert.match(k,/CosKmd|DxgkDdi/i);
 assert.match(soft,/ProcessRenderBuffer/);
 assert.match(umd,/OpenAdapter12|OpenAdapter10_2|CosUmd/);
});
test('sample INF targets Microsoft ACPI example and cannot be LeeWay installation proof',()=>{
 const inf=readFileSync(join(root,'compute-only-sample/cosdriver/cos.inf'),'utf8');
 assert.match(inf,/ACPI\\COMPUTEONLYSAMPLE/i);
 assert.match(inf,/coskmd\.sys/i);
 assert.doesNotMatch(inf,/LEEWAY_GPU_SOFTWARE|LeeWay Edge GPU/i);
});
test('vendor reference contains source only, no installable binary or private keys',()=>{
 const items=walk(root);
 const prohibited=items.filter(p=>/\.(?:exe|sys|dll|pfx|pem|key|pdb|snk)$/i.test(p));
 assert.deepEqual(prohibited,[]);
 assert.ok(items.length>=120);
});
test('reference requires driver modernization rather than false production certificate',()=>{
 const k=readFileSync(join(root,'compute-only-sample/coskmd/CosKmd.vcxproj'),'utf8');
 const u=readFileSync(join(root,'compute-only-sample/cosumd12/cosumd12.vcxproj'),'utf8');
 assert.match(k,/WindowsKernelModeDriver10\.0/);
 assert.match(u,/WindowsUserModeDriver10\.0/);
 assert.match(u,/10\.0\.18298\.0/);
});
