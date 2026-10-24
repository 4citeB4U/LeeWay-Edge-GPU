/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.REAL_APPLICATION_BENCHMARK.G3
WHAT: Run the actual Leola and Maps pages in isolated local browsers and measure their existing render paths.
WHY: Kernel success alone cannot establish application improvement.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS EXECUTE VERIFY.
WHERE: Pinned existing application worktrees plus the existing GPU candidate.
WHEN: Explicit invocation only. HOW: Matched viewport, current renderer, application-derived data, preserved measurements.
LICENSE: MIT. No driver install, source replacement, paid service, or production mutation.
*/
import {createRequire} from 'node:module';
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';
import crypto from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2);const arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const configPath=arg('--config',null);if(!configPath)throw Error('CONFIG_REQUIRED');
const selection=arg('--gpu','default');if(!['default','nvidia','software'].includes(selection))throw Error('GPU_SELECTION_INVALID');
const launchFlags=selection==='software'?['--use-gl=angle','--use-angle=swiftshader','--use-webgpu-adapter=swiftshader']:selection==='nvidia'?['--force-high-performance-gpu']:[];
const config=JSON.parse(fs.readFileSync(configPath,'utf8').replace(/^\uFEFF/,''));
const gpuRoot=path.resolve(config.gpuRoot);const apps=config.applications;
const maps=apps.find(a=>a.id==='maps'),leola=apps.find(a=>a.id==='leola');
const runRoot=path.dirname(configPath);const out=path.join(runRoot,'runs','run-'+new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const deps=path.join(maps.source,'node_modules');
const requireInstalled=createRequire(pathToFileURL(path.join(maps.source,'package.json')));
const puppetModule=await import(pathToFileURL(requireInstalled.resolve('puppeteer')).href);
const puppeteer=puppetModule.default||puppetModule;
const {createServer}=await import(pathToFileURL(path.join(deps,'vite/dist/node/index.js')).href);
const {createBrowserViteConfig}=await import(pathToFileURL(path.join(maps.target,'build/vite.js')).href);
const requestedFiles=new Map();
const gpuAllowed=/^(core|dispatch|buffers|pipeline|shaders|fallback|control)\/[a-zA-Z0-9_.-]+\.(?:js|mjs)$/;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.woff2':'font/woff2','.mp4':'video/mp4'};
function respondFile(file,res){
 const stat=fs.statSync(file);if(!stat.isFile()||stat.size>64*1024*1024){res.writeHead(413);res.end('Bounded test asset limit');return;}
 const bytes=fs.readFileSync(file);requestedFiles.set(file,sha(bytes));
 res.setHeader('Content-Type',mime[path.extname(file).toLowerCase()]||'application/octet-stream');res.setHeader('Cache-Control','public,max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');res.end(bytes);
}
function gpuRequest(req,res,next){
 try{const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(p.startsWith('/__leeway/')){const rel=p.slice(10);if(!gpuAllowed.test(rel)){res.writeHead(403);return res.end('Denied');}return respondFile(path.join(gpuRoot,rel),res);}
  if(p==='/__stage/')return respondFile(path.join(gpuRoot,'tests/virtual-gpu/application-stage-attribution.mjs'),res);
  if(p==='/__bench/'){return respondFile(path.join(gpuRoot,'tests/virtual-gpu/application-exercise.mjs'),res);}
  return next();
 }catch{res.writeHead(404);res.end('Not found');}
}
let vite,server,browser;
const report={schema:'leeway.real-app-local-benchmark.g3',startedUtc:new Date().toISOString(),scope:'LOCAL_APPLICATION_BASELINES_AND_COMPONENT_FIT',
 browserMode:'HEADFUL_ISOLATED_PROFILE',viewport:{width:1280,height:720,deviceScaleFactor:1},applications:[],productionChanged:false,
 gpuSelectionRequested:selection,launchFlags,driverInstalled:false,canonicalFormulaUsedForRouting:false,learningLedger:'NOT_UPDATED'};
try{
 for(const app of apps){
  const origin=execFileSync('git',['-C',app.target,'remote','get-url','origin'],{encoding:'utf8'}).trim();
  const head=execFileSync('git',['-C',app.target,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(origin!==app.origin||head!==app.commit)throw Error('APP_SOURCE_IDENTITY_MISMATCH');
 }
 server=http.createServer((req,res)=>gpuRequest(req,res,()=>{
  try{
   if(req.method!=='GET'){res.writeHead(405);return res.end();}
   let p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);if(p==='/')p='/index.html';
   if(p.split('/').some(x=>x==='..'||x.startsWith('.'))){res.writeHead(403);return res.end();}
   const file=path.resolve(leola.target,'.'+p);if(!file.startsWith(leola.target+path.sep)){res.writeHead(403);return res.end();}
   respondFile(file,res);
  }catch{res.writeHead(404);res.end('Not found');}
 }));
 await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
 const localPlugin={name:'leeway-local-benchmark-boundary',configureServer(s){s.middlewares.use((req,res,next)=>gpuRequest(req,res,()=>{
  if(req.url.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Local graphics benchmark: live providers not enabled',dataState:'UNAVAILABLE_NOT_SIMULATED'}));}next();
 }));}};
 const emptyEnv=path.join(out,'empty-env');fs.mkdirSync(emptyEnv);
 process.chdir(maps.target);
 const base=createBrowserViteConfig({plugins:[localPlugin],host:'127.0.0.1',port:0,googleApiKey:undefined,cesiumToken:undefined,publicDir:path.join(maps.target,'public')});
 vite=await createServer({...base,root:maps.target,configFile:false,envDir:emptyEnv,cacheDir:path.join(out,'vite-cache'),
  server:{...base.server,host:'127.0.0.1',port:0,strictPort:false,fs:{...base.server.fs,allow:[maps.target,maps.source,gpuRoot]}}});
 await vite.listen();
 const urls={leola:'http://127.0.0.1:'+server.address().port+'/',maps:'http://127.0.0.1:'+vite.httpServer.address().port+'/'};
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false,
  userDataDir:path.join(out,'browser-profile'),defaultViewport:report.viewport,args:[...launchFlags,'--mute-audio','--no-first-run','--no-default-browser-check','--window-position=40,60','--window-size=1320,820']});
 const system=await browser.target().createCDPSession();report.systemGpu=(await system.send('SystemInfo.getInfo')).gpu;
 for(const app of apps){
  const onlyApp=arg('--app',null);if(onlyApp&&onlyApp!==app.id)continue;
  const page=await browser.newPage();const errors=[],failed=[],blocked=[];
  page.on('pageerror',e=>errors.push(String(e.message).slice(0,600)));
  page.on('requestfailed',r=>{try{failed.push({path:new URL(r.url()).pathname,error:r.failure()?.errorText});}catch{}});
  await page.setRequestInterception(true);page.on('request',r=>{
   const url=r.url();if(r.method()!=='GET'&&r.method()!=='HEAD'&&r.method()!=='OPTIONS')return r.abort();
   if(/\.(gguf|onnx|safetensors)(\?|$)|\/models\/.*\.bin(\?|$)/i.test(url)){blocked.push('MODEL_DOWNLOAD_NOT_IN_TEST_SCOPE');return r.abort();}
   return r.continue();
  });
  await page.evaluateOnNewDocument(()=>{
   let seed=71869;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  });
  const record={id:app.id,origin:app.origin,sourceCommit:app.commit,url:urls[app.id],errors,failedRequests:failed,blockedActions:blocked};
  try{
   console.log('OPEN_REAL_APP '+app.id+' '+urls[app.id]);
   await page.goto(urls[app.id],{waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(id=>id==='leola'?Boolean(window.__world3D?.renderer&&window.__world3D?.scene):Boolean(window.__godsEyeView?.viewer),{timeout:90000},app.id);
   await page.bringToFront();
   if(app.id==='leola'){
    const enter=await page.$('dialog[open] .player-enter');
    if(enter){await enter.click();await page.waitForFunction(()=>!document.querySelector('dialog[open] .player-enter'));}
    await page.click('[data-teleport="desk"]');
    await page.waitForFunction(()=>window.__world3D.phase==='inside',{timeout:15000});
    record.navigation={scenario:'GRAND_HALL_WITH_EXISTING_ANIMATIONS',actions:['Accept current default test character in isolated profile','Click existing Grand Hall navigation'],qualityChanged:false};
   }
   await sleep(6000);
   if(app.id==='maps'){
    record.cameraSetup=await page.evaluate(()=>{
     const v=window.__godsEyeView.viewer,c=v.camera;
     const before={position:{x:c.position.x,y:c.position.y,z:c.position.z},direction:{x:c.direction.x,y:c.direction.y,z:c.direction.z},height:c.positionCartographic.height,defaultRenderLoop:v.useDefaultRenderLoop};
     c.cancelFlight();v.resize();
     const Vec=c.position.constructor;
     c.setView({destination:Vec.fromDegrees(-87.9065,43.0389,2500000),orientation:{heading:0,pitch:-Math.PI/2,roll:0}});
     v.scene.requestRender();
     return {before,scenario:'FIXED_MILWAUKEE_EARTH_VIEW',longitude:-87.9065,latitude:43.0389,heightMeters:2500000,qualityChanged:false,setup:'CANCEL_PENDING_CAMERA_FLIGHT_AND_RESIZE_BEFORE_FIXED_VIEW'};
    });
    console.log('MAPS_CAMERA_SETUP '+JSON.stringify(record.cameraSetup));
    await page.waitForFunction(()=>{
     const viewer=window.__godsEyeView.viewer;
     viewer.scene.requestRender();
     return viewer.scene.globe?._surface?._tilesToRender?.length>0;
    },{timeout:25000,polling:100});
    await sleep(2000);
   }
   record.identity=await page.evaluate(async id=>{
    const canvas=id==='leola'?window.__world3D.renderer.domElement:window.__godsEyeView.viewer.scene.canvas;
    const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const debug=gl?.getExtension('WEBGL_debug_renderer_info');
    const common={title:document.title,readyState:document.readyState,visibility:document.visibilityState,canvas:{width:canvas.width,height:canvas.height},renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'NOT_EXPOSED'};
    if(id==='leola'){
     const w=window.__world3D;let meshes=0,vertices=0,triangles=0,largest=0,largestName='';
     w.scene.traverse(o=>{if(o.isMesh&&o.geometry?.attributes?.position){meshes++;const n=o.geometry.attributes.position.count;vertices+=n;triangles+=(o.geometry.index?.count||n)/3;if(n>largest){largest=n;largestName=o.name;}}});
     return {...common,meshes,vertices,geometryTriangles:triangles,largestVertexCount:largest,largestMeshName:largestName,phase:w.phase,renderInfo:JSON.parse(JSON.stringify(w.renderer.info.render)),memory:JSON.parse(JSON.stringify(w.renderer.info.memory))};
    }
    const v=window.__godsEyeView.viewer;
    return {...common,sceneMode:v.scene.mode,primitiveCount:v.scene.primitives.length,entityCount:v.entities.values.length,
     requestRenderMode:v.scene.requestRenderMode,globeShown:v.scene.globe.show,photorealTileset:!!window.__godsEyeView.tileset,
     globeTiles:v.scene.globe?._surface?._tilesToRender?.length??null,governor:window.__godsEyeView.getRenderGovernorDiagnostics?.()};
   },app.id);
   record.adapterGate=await page.evaluate(async expected=>{
    const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});if(!adapter){if(expected==='software')return {requested:expected,actual:null,softwareOnly:true};throw Error('WEBGPU_ADAPTER_UNAVAILABLE');}
    const info=adapter.info;
    return {requested:expected,actual:{vendor:info.vendor,architecture:info.architecture,description:info.description,isFallbackAdapter:info.isFallbackAdapter},timestampQueries:adapter.features.has('timestamp-query')};
   },selection);
   if(selection==='software'){
    if(!/SwiftShader/i.test(record.identity.renderer)||record.adapterGate.actual!==null)throw Error('SOFTWARE_ONLY_BOUNDARY_NOT_CONFIRMED');
    record.adapterGate.executionScope='SOFTWARE_WEBGL_AND_CPU_WORKER_NO_WEBGPU_DEVICE';
   }else{
    const wanted=selection==='nvidia'?'nvidia':'intel';
    if(!record.identity.renderer.toLowerCase().includes(wanted)||record.adapterGate.actual.vendor.toLowerCase()!==wanted||record.adapterGate.actual.isFallbackAdapter)throw Error('REQUESTED_ADAPTER_NOT_CONFIRMED');
   }
   console.log('ACTUAL_ADAPTER '+JSON.stringify({app:app.id,renderer:record.identity.renderer,webgpu:record.adapterGate.actual}));
   if(app.id==='maps'&&(record.identity.canvas.width<600||record.identity.globeTiles===0))throw Error('MAPS_RENDER_BASELINE_NOT_READY');
   if(args.includes('--profile')){
    const profiler=await page.createCDPSession();await profiler.send('Profiler.enable');await profiler.send('Profiler.setSamplingInterval',{interval:1000});
    await profiler.send('Profiler.start');await sleep(4000);const sampled=(await profiler.send('Profiler.stop')).profile;await profiler.detach();
    fs.writeFileSync(path.join(out,app.id+'-cpu-profile.json'),JSON.stringify(sampled));
    const totals=new Map(),nodes=new Map(sampled.nodes.map(n=>[n.id,n]));let total=0;
    for(let i=0;i<(sampled.samples||[]).length;i++){
     const duration=sampled.timeDeltas?.[i]||0;const node=nodes.get(sampled.samples[i]);if(!node)continue;total+=duration;
     const cf=node.callFrame,key=JSON.stringify([cf.functionName,cf.url,cf.lineNumber]);totals.set(key,(totals.get(key)||0)+duration);
    }
    record.cpuSampling={scope:'MAIN_THREAD_SAMPLE_ATTRIBUTION_NOT_GPU_TIME',sampledMicroseconds:total,
     topSelf: [...totals].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([key,time])=>{const [name,url,line]=JSON.parse(key);return {name,url,line,selfMs:time/1000,percent:100*time/total};})};
   }
   await page.screenshot({path:path.join(out,app.id+'-baseline.png')});
   record.exercise=await page.evaluate(async (id,attribution,softwareOnly)=>{const m=await import('/__bench/');return m.runApplicationExercise(id,{attribution,softwareOnly});},app.id,args.includes('--profile'),selection==='software');
   await page.screenshot({path:path.join(out,app.id+'-after.png')});
   record.outcome=record.exercise.componentFit?.outcome==='EXECUTED'?'EXECUTED_SEE_CLAIM_BOUNDARY':'PARTIAL_COMPONENT_TEST_BLOCKED';
  }catch(error){record.outcome='BLOCKED_OR_FAILED';record.error=error.message;try{record.visibleText=await page.evaluate(()=>document.body.innerText.slice(0,1500));await page.screenshot({path:path.join(out,app.id+'-failure.png')});}catch{}}
  report.applications.push(record);fs.writeFileSync(path.join(out,'application-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({app:app.id,outcome:record.outcome,identity:record.identity,error:record.error,exercise:record.exercise},null,2));
  await page.close();
 }
 report.outcome=report.applications.every(x=>x.outcome==='EXECUTED_SEE_CLAIM_BOUNDARY')?'APPLICATION_TESTS_EXECUTED_NOT_SPEEDUP_CERTIFICATION':'PARTIAL_OR_BLOCKED';
}catch(error){report.outcome='FAILED';report.error=error.stack;process.exitCode=1;}
finally{
 try{await browser?.close();}catch{}try{await vite?.close();}catch{}
 if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
 report.endedUtc=new Date().toISOString();report.requestedLocalFiles=[...requestedFiles].map(([file,sha256])=>({file,sha256}));
 report.benchmarkScriptSha256=sha(fs.readFileSync(fileURLToPath(import.meta.url)));
 report.exerciseScriptSha256=sha(fs.readFileSync(path.join(gpuRoot,'tests/virtual-gpu/application-exercise.mjs')));
 report.closure='OWN_BROWSER_AND_SERVERS_CLOSED';fs.writeFileSync(path.join(out,'application-results.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({outcome:report.outcome,out,reportSha256:sha(fs.readFileSync(path.join(out,'application-results.json')))},null,2));
}
