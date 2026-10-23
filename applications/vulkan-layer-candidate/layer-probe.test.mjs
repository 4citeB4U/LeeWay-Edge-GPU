import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const folder=join(root,'build');
const dll=join(folder,'leeway_gpu_layer.dll');
const json=join(folder,'VK_LAYER_LEEWAY_gpu_optin.json');
const loader=process.env.LEEWAY_GPU_VULKANINFO||'vulkaninfo.exe';
const run=enabled=>{
 const env={...process.env};
 delete env.VK_LAYER_PATH;delete env.VK_INSTANCE_LAYERS;delete env.VK_LOADER_DEBUG;
 if(enabled){env.VK_LAYER_PATH=folder;env.VK_INSTANCE_LAYERS='VK_LAYER_LEEWAY_gpu_optin';env.VK_LOADER_DEBUG='layer';}
 return spawnSync(loader,['--summary'],{env,encoding:'utf8',timeout:20000,maxBuffer:4*1024*1024});
};
test('baseline native Vulkan GPUs remain available',()=>{
 const result=run(false);assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/deviceName/);
});
test('explicit LeeWay layer loads only for this process and preserves both GPUs',()=>{
 assert.ok(existsSync(dll)&&existsSync(json),'build-layer.ps1 required');
 const result=run(true);const output=result.stdout+result.stderr;
 assert.equal(result.status,0,output.slice(-1500));
 assert.match(output,/VK_LAYER_LEEWAY_gpu_optin/);
 assert.match(output,/Intel\(R\) Graphics/);
 assert.match(output,/NVIDIA GeForce RTX 5060 Laptop GPU/);
});
