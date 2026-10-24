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
 ['license.txt','a456dc1858714c8321194d25881919f7a0a42407ac1f384739417035fd367d21'],
 ['compute-only-sample/coskmd/CosKmdSoftAdapter.cpp','ccf025b7171c8296aa1d139b05d291d5e68ad29b3c9b431cd3bc833dd347f159'],
 ['compute-only-sample/coskmd/CosKmdDdi.cpp','7a349db96a7fecf65c57166ae56edb8ecbfa62156cd222c97a4a3e17507194c6'],
 ['compute-only-sample/cosumd12/CosUmd12.cpp','db499024babfca62146fa6969097733c7f887c0612a556c1391b426ffa2f0bec'],
 ['compute-only-sample/cosumd12/CosUmd12Adapter.cpp','2229a17b9512357444b6888f00f504dfb63541a282baa06624a6f579b29d48b0'],
 ['compute-only-sample/cosdriver/cos.inf','ba73821b5fd45f12472efeeba73e57f145883f31aec3b9fc27dcaba9c7b2cde6']
]);
// Windows checkouts may expand LF to CRLF. Compare canonical Git LF bytes,
// preserving strict source identity across Windows and Linux platforms.
const sha=p=>createHash('sha256').update(readFileSync(p,'utf8').replace(/\r\n/g,'\n'),'utf8').digest('hex');
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
