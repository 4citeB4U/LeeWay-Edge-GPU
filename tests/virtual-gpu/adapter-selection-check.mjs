/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.ADAPTER_SELECTION.G4
WHAT: Verify real WebGL/WebGPU adapter selection before app comparisons.
WHY: A power hint or command switch is not execution evidence.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS VERIFY.
WHERE: Installed Chrome, isolated profile, loopback only. WHEN: Explicit diagnostic.
HOW: Query actual renderer and adapter; submit/read a bounded GPU buffer; save hashes.
LICENSE: MIT. No global graphics setting or system driver change.
*/
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';
import crypto from 'node:crypto';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2),at=k=>args.indexOf(k),get=(k,d)=>at(k)>=0?args[at(k)+1]:d;
const config=JSON.parse(fs.readFileSync(get('--config'),'utf8').replace(/^\uFEFF/,''));
const maps=config.applications.find(a=>a.id==='maps');
const requireInstalled=createRequire(pathToFileURL(path.join(maps.source,'package.json')));
const {default:puppeteer}=await import(pathToFileURL(requireInstalled.resolve('puppeteer')).href);
const out=path.join(path.dirname(get('--config')),'adapter-checks',new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>LeeWay GPU adapter qualification</title><canvas id="c" width="64" height="64"></canvas>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={schema:'leeway.adapter-selection.g4',out,globalGraphicsSettingsChanged:false,results:[]};
try{
 const requested=get('--mode','all');if(!['all','software'].includes(requested))throw Error('PROBE_MODE_INVALID');
 for(const mode of (requested==='software'?['software']:['default','high-performance'])){
  const flags=mode==='software'?['--use-gl=angle','--use-angle=swiftshader','--use-webgpu-adapter=swiftshader']:mode==='high-performance'?['--force-high-performance-gpu']:[];let browser;
  try{
   browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false,
    userDataDir:path.join(out,'profile-'+mode),defaultViewport:{width:1280,height:720,deviceScaleFactor:1},args:[...flags,'--mute-audio','--no-first-run','--no-default-browser-check','--window-size=1320,820']});
   const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/');
   const native=await browser.target().createCDPSession();const system=(await native.send('SystemInfo.getInfo')).gpu;
   const actual=await page.evaluate(async()=>{
    const gl=document.querySelector('canvas').getContext('webgl2',{powerPreference:'high-performance'});const ext=gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null;
    const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});
    if(!adapter)return {renderer,webgpu:null};
    const info=adapter.info;const device=await adapter.requestDevice();
    let input,read;
    try{
     input=device.createBuffer({size:16,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});read=device.createBuffer({size:16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
     device.queue.writeBuffer(input,0,new Uint32Array([17,29,43,71]));const e=device.createCommandEncoder();e.copyBufferToBuffer(input,0,read,0,16);device.queue.submit([e.finish()]);
     await read.mapAsync(GPUMapMode.READ);const output=[...new Uint32Array(read.getMappedRange())];read.unmap();
     return {renderer,webgpu:{vendor:info.vendor,architecture:info.architecture,device:info.device,description:info.description,isFallbackAdapter:info.isFallbackAdapter},features:[...adapter.features],readback:output,readbackMatches:JSON.stringify(output)==='[17,29,43,71]'};
    }finally{input?.destroy();read?.destroy();device.destroy();}
   });
   const entry={mode,flags,actual,systemGpu:system,nvidiaVerified:!!actual.readbackMatches&&/nvidia/i.test(actual.renderer||'')&&/nvidia/i.test(actual.webgpu?.vendor||'')};
   report.results.push(entry);console.log(JSON.stringify({mode,actual,nvidiaVerified:entry.nvidiaVerified},null,2));
  }catch(error){report.results.push({mode,error:error.stack,nvidiaVerified:false});console.error(error.message);}
  finally{await browser?.close();}
 }
}finally{
 server.closeAllConnections();await new Promise(r=>server.close(r));
 const file=path.join(out,'adapter-results.json');fs.writeFileSync(file,JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
}
