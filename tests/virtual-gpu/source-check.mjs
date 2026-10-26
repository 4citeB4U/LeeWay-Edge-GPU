/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.SOURCE_CHECK.G2
WHAT: Parse the execution and qualification files actually changed in this build.
WHY: Source syntax is a distinct gate, not native-driver compilation or GPU proof.
WHO: Agent Lee. WHERE: Existing Edge GPU source. WHEN: npm run build.
HOW: Installed Node parser with explicit module input; no package installation. LICENSE: MIT
*/
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const files=['app.js','buffers/buffer.pool.js','control/gpu.controller.bridge.js','core/quad.pipeline.js',
 'core/hybrid.dispatcher.js','core/state-window-statistics.mjs','dispatch/compute.dispatch.js',
 'dispatch/tensor-contract.mjs','dispatch/tensor.dispatch.mjs','pipeline/pipeline.cache.js',
 'shaders/matmul.wgsl.js','shaders/tensor-gemm.wgsl.js','fallback/cpu.engine.js','fallback/cpu.worker.js','fallback/tensor-reference.mjs',
 'tests/virtual-gpu/browser-tests.js','tests/virtual-gpu/local-acceptance.mjs','tests/virtual-gpu/formula-binding-check.mjs',
 'tests/virtual-gpu/source-check.mjs','tests/virtual-gpu/tensor-browser-tests.js','tests/virtual-gpu/tensor-unit.test.mjs',
 'tests/virtual-gpu/state-statistics-check.mjs','tests/virtual-gpu/ldwmd-hardware-check.mjs'];
let failed=0;
for(const file of files){
 const r=spawnSync(process.execPath,['--input-type=module','--check'],{encoding:'utf8',input:fs.readFileSync(path.join(root,file),'utf8')});
 if(r.status!==0){failed++;console.error(file,r.stderr||r.error);}else console.log('SYNTAX_PASS '+file);
}
console.log(JSON.stringify({scope:'SOURCE_SYNTAX_ONLY',checked:files.length,failed,nativeDriverCompiled:false,gpuExecution:false}));
process.exitCode=failed?1:0;
