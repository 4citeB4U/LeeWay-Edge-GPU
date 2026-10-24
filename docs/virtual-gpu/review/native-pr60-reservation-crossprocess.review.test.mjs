// Process contention for PR49's existing file replay consumer, test-only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.LEEWAY_GPU_RUNTIME_ADAPTER_DIR;
if(!root||!isAbsolute(root))throw Error('OWNER_ADAPTER_SOURCE_DIRECTORY_REQUIRED');
const moduleUrl=pathToFileURL(join(root,'apple-gpu-file-replay-ledger.mjs')).href;
const fixture=t=>{const folder=mkdtempSync(join(tmpdir(),'gpu-crossprocess-replay-'));
 t.after(()=>rmSync(folder,{recursive:true,force:true}));return folder;};
const attempt=(directory,nonce,applicationId='leeway-gpu-apple')=>new Promise((resolve,reject)=>{
 const code=`import {createFileReplayConsumer} from ${JSON.stringify(moduleUrl)};
 const x=await createFileReplayConsumer({directory:process.argv[1]})({
  applicationId:process.argv[2],requestId:'test-only-request-1',
  nonce:process.argv[3],grantId:'test-only-admission-1'});
 process.stdout.write(x?'RESERVED':'DENIED');`;
 const child=spawn(process.execPath,['--input-type=module','-e',code,directory,applicationId,nonce],
  {stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 child.stdout.on('data',x=>stdout+=x);
 child.stderr.on('data',x=>stderr+=x);
 child.on('error',reject);
 child.on('close',code=>code===0?resolve(stdout):reject(Error('WORKER_FAIL '+code+' '+stderr)));
});
test('four independent processes racing one nonce admit at most one holder',async t=>{
 const directory=fixture(t),nonce='pr60-testonly-dispatch-reservation-unique-1';
 const results=await Promise.all(Array.from({length:4},()=>attempt(directory,nonce)));
 assert.equal(results.filter(x=>x==='RESERVED').length,1);
 assert.equal(results.filter(x=>x==='DENIED').length,3);
});
test('new process after reservation remains denied on same trusted volume',async t=>{
 const directory=fixture(t),nonce='pr60-testonly-dispatch-reservation-unique-2';
 assert.equal(await attempt(directory,nonce),'RESERVED');
 assert.equal(await attempt(directory,nonce),'DENIED');
});
test('test-only replay key is scoped by application ID and nonce, not native dispatch proof',async t=>{
 const directory=fixture(t),nonce='pr60-testonly-dispatch-reservation-unique-3';
 assert.equal(await attempt(directory,nonce,'leeway-gpu-apple'),'RESERVED');
 assert.equal(await attempt(directory,nonce,'vendor-another-application'),'RESERVED');
 assert.equal(await attempt(directory,nonce,'leeway-gpu-apple'),'DENIED');
});
