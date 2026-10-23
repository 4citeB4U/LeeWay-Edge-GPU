/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.LOCAL_ACCEPTANCE.G0
WHAT: Real-browser tests of canonical GPU modules. WHY: Measured failure and GPU readback evidence.
WHO: Creator-authorized Agent Lee. WHERE: Local source checkout; isolated test profile.
WHEN: Explicit invocation. HOW: Loopback server, Chromium, CDP, assertions. LICENSE: MIT
*/
import {runLdWmdHardwareCheck} from './ldwmd-hardware-check.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const args=process.argv.slice(2);
const arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const baseline=args.includes('--baseline');
const evidence=path.resolve(arg('--evidence',path.join(root,'qualification','g0-'+Date.now())));
fs.mkdirSync(evidence,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=arg('--browser',process.env.LEEWAY_BROWSER_PATH||[
 'C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(p=>fs.existsSync(p)));
if(!browser||!fs.existsSync(browser))throw Error('BLOCKED: select an installed Chromium browser.');
const allowed=/^\/(core|buffers|pipeline|dispatch|shaders|fallback|control|tests\/virtual-gpu)\/[A-Za-z0-9_./-]+\.(js|mjs)$/;
const html='<!doctype html><html><head><meta charset="utf-8"><title>LeeWay local GPU qualification</title></head><body><h1>LeeWay virtual GPU - local qualification</h1><p>Actual browser execution. Not an installed operating-system driver.</p><pre id="result">Executing bounded tests...</pre></body></html>';
const server=http.createServer((req,res)=>{
 try{
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(p==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);}
  if(!allowed.test(p)||p.split('/').some(s=>s==='..'||s==='.'||s.startsWith('.'))){res.writeHead(403);return res.end('Denied');}
  const target=path.resolve(root,'.'+p);
  if(!target.startsWith(root+path.sep)||!fs.statSync(target).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(fs.readFileSync(target));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const url='http://127.0.0.1:'+server.address().port+'/';
const profile=path.join(evidence,'browser-profile');
const child=spawn(browser,[
 '--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',
 '--user-data-dir='+profile,'--no-first-run','--no-default-browser-check',
 '--disable-background-networking','--disable-component-update','--disable-sync',
 '--disable-default-apps','--window-size=1100,800',url
],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let browserLog='';child.stdout.on('data',b=>{browserLog+=b;});child.stderr.on('data',b=>{browserLog+=b;});
let spawnError=null;child.once('error',e=>{spawnError=e;});
class CDP{
 constructor(socket){this.ws=socket;this.next=0;this.pending=new Map();socket.addEventListener('message',event=>{
  const m=JSON.parse(event.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;
  this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);
 });}
 static async connect(url){const ws=new WebSocket(url);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});return new CDP(ws);}
 send(method,params={},timeout=45000){const id=++this.next;return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout: '+method));},timeout);
  this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));
 });}
 close(){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('CDP closed'));}this.pending.clear();this.ws.close();}
}
let cdp,browserCdp,report;
try{
 let portData;
 for(let i=0;i<150;i++){
  if(spawnError)throw spawnError;
  if(child.exitCode!==null)throw Error('Browser exited: '+child.exitCode+' '+browserLog.slice(-1500));
  try{portData=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').trim().split(/\r?\n/);break;}catch{await sleep(100);}
 }
 if(!portData)throw Error('Browser debugging endpoint unavailable.');
 const debug='http://127.0.0.1:'+portData[0];
 browserCdp=await CDP.connect('ws://127.0.0.1:'+portData[0]+portData[1]);
 const systemInfo=await browserCdp.send('SystemInfo.getInfo').catch(error=>({error:error.message}));
 const targets=await fetch(debug+'/json/list').then(r=>r.json());
 const target=targets.find(t=>t.type==='page'&&t.url===url)||targets.find(t=>t.type==='page');
 if(!target)throw Error('No isolated test page.');
 cdp=await CDP.connect(target.webSocketDebuggerUrl);await cdp.send('Runtime.enable');
 await cdp.send('Page.enable');await cdp.send('Page.navigate',{url});
 let pageReady=false;
 for(let i=0;i<100;i++){
  const ready=await cdp.send('Runtime.evaluate',{expression:'location.href === '+JSON.stringify(url)+' && document.readyState === "complete"',returnByValue:true});
  if(ready.result?.value===true){pageReady=true;break;}await sleep(100);
 }
 if(!pageReady)throw Error('Isolated qualification page did not become ready.');
 const run=await cdp.send('Runtime.evaluate',{
  expression:`(async()=>{const m=await import('/tests/virtual-gpu/browser-tests.js');const r=await m.runTests({baseline:${baseline}});document.getElementById('result').textContent=JSON.stringify(r,null,2);return r;})()`,
  awaitPromise:true,returnByValue:true
 },90000);
 if(run.exceptionDetails)throw Error(run.exceptionDetails.exception?.description||JSON.stringify(run.exceptionDetails));
 report={schema:'leeway.gpu.local-acceptance.v1',observedAt:new Date().toISOString(),mode:baseline?'BASELINE':'REPAIRED',
  classification:'LOCAL_COMPONENT_ACCEPTANCE_NOT_C3',hostPlatform:process.platform,node:process.version,
  browser,gitHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  systemGpu:systemInfo.gpu,browserTests:run.result.value,
  formulaExecution:'NOT_EXECUTED_BY_GPU_TEST',ldwmdBinding:'UNVERIFIED',driverInstalled:false,
  cloudUsed:false,learningLedger:'NOT_UPDATED'};
 const ldRoot=arg('--ldwmd-root',null);
 if(ldRoot){
  const regressionFile=arg('--ldwmd-regression',null);if(!regressionFile)throw Error('LDWMD_REGRESSION_EVIDENCE_REQUIRED');
  report.ldwmdHardware=await runLdWmdHardwareCheck({cdp,sourceRoot:ldRoot,regressionFile});
  report.ldwmdBinding='LOCAL_DIAGNOSTIC_CALLBACKS_ONLY';
 }
 const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(path.join(evidence,'qualification.png'),Buffer.from(shot.data,'base64'));
 const directories=['core','buffers','pipeline','dispatch','shaders','fallback','control','tests/virtual-gpu'];
 const files=directories.flatMap(dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true})
  .filter(f=>f.isFile()&&/\.(?:mjs|js)$/.test(f.name)).map(f=>dir+'/'+f.name));
 report.sourceHashes=Object.fromEntries(files.filter(p=>fs.existsSync(path.join(root,p))).map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]));
 const failed=report.browserTests.tests.filter(t=>t.status!=='PASS');
 report.outcome=failed.length?'FAIL':'PASS_LOCAL_COMPONENT_TESTS';
 report.passCount=report.browserTests.tests.length-failed.length;report.testCount=report.browserTests.tests.length;
 console.log(JSON.stringify({outcome:report.outcome,pass:report.passCount,total:report.testCount,adapter:report.browserTests.adapter,failures:failed,evidence},null,2));
 if(failed.length)process.exitCode=1;
}catch(error){report={outcome:'BLOCKED_OR_FAILED',error:error.stack,driverInstalled:false,cloudUsed:false,learningLedger:'NOT_UPDATED'};console.error(error.stack);process.exitCode=1;}
finally{
 fs.writeFileSync(path.join(evidence,'acceptance.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(evidence,'browser.log'),browserLog);
 try{await browserCdp?.send('Browser.close',{},3000);}catch{}
 cdp?.close();browserCdp?.close();
 await sleep(200);if(child.exitCode===null)child.kill();
 server.closeAllConnections();await new Promise(r=>server.close(r));
}
