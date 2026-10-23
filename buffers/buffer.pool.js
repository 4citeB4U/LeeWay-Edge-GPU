/*
REGION: LEEWAY.EDGE_GPU.BUFFERS
TAG: LEEWAY.EDGE_GPU.BUFFER_POOL.G0
WHAT: Device-scoped leases for existing GPU buffers. WHY: Prevent cross-device reuse and leaks.
WHO: Creator-authorized Agent Lee. WHERE: Existing Edge GPU buffer pool, not LDWMD authority.
WHEN: Buffer acquisition/release. HOW: Weak device ownership, bounded idle retention. LICENSE: MIT
*/
const devices=new WeakMap();
const owners=new WeakMap();
const DEFAULT_IDLE_BYTES=32*1024*1024;
function stateFor(device){
 if(!device||typeof device.createBuffer!=='function')throw new TypeError('GPU_DEVICE_REQUIRED');
 let state=devices.get(device);
 if(!state){
  state={entries:new Set(),lost:false};devices.set(device,state);
  if(device.lost?.then)device.lost.then(()=>{state.lost=true;clearBufferPool(device);});
 }
 if(state.lost)throw new Error('GPU_DEVICE_LOST');
 return state;
}
export function getBuffer(device,size,usageFlags){
 if(!Number.isSafeInteger(size)||size<=0||size%4!==0)throw new RangeError('GPU_BUFFER_SIZE_INVALID');
 if(!Number.isSafeInteger(usageFlags)||usageFlags<=0)throw new RangeError('GPU_BUFFER_USAGE_INVALID');
 const state=stateFor(device);
 const entry=[...state.entries].find(b=>!b.inUse&&b.size===size&&b.usage===usageFlags);
 if(entry){entry.inUse=true;return entry.buffer;}
 const buffer=device.createBuffer({size,usage:usageFlags});
 const created={buffer,size,usage:usageFlags,inUse:true,state};state.entries.add(created);owners.set(buffer,created);
 return buffer;
}
export function releaseBuffer(buffer){
 const entry=owners.get(buffer);if(!entry)return false;
 entry.inUse=false;
 const idle=[...entry.state.entries].filter(x=>!x.inUse).reduce((n,x)=>n+x.size,0);
 if(entry.state.lost||idle>DEFAULT_IDLE_BYTES)discardBuffer(buffer);
 return true;
}
export function discardBuffer(buffer){
 const entry=owners.get(buffer);if(entry){entry.state.entries.delete(entry);owners.delete(buffer);}
 buffer?.destroy();
}
export function clearBufferPool(device){
 const state=devices.get(device);if(!state)return;
 for(const entry of [...state.entries])discardBuffer(entry.buffer);
}
export function getBufferPoolStats(device){
 const entries=[...(devices.get(device)?.entries||[])];
 return {buffers:entries.length,allocatedBytes:entries.reduce((n,x)=>n+x.size,0),leasedBytes:entries.filter(x=>x.inUse).reduce((n,x)=>n+x.size,0),idleBytes:entries.filter(x=>!x.inUse).reduce((n,x)=>n+x.size,0)};
}
