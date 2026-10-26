// Node host shim for the existing browser CPU worker. Arithmetic remains in
// cpu.worker.js and tensor-reference.mjs, the canonical existing sources.
import { parentPort, workerData } from 'node:worker_threads';

if (!parentPort) throw new Error('CPU_WORKER_PORT_REQUIRED');

if (workerData?.denyExternalProviders === true) {
  const denied = () => { throw new Error('EXTERNAL_PROVIDER_DENIED'); };
  globalThis.fetch = denied;
  globalThis.WebSocket = denied;
  // The CPU worker does not access navigator. If present, prevent WebGPU use.
  const navigatorValue = globalThis.navigator;
  if (navigatorValue) {
    if (!Object.isExtensible(navigatorValue)) throw new Error('WEBGPU_GUARD_UNAVAILABLE');
    Object.defineProperty(navigatorValue, 'gpu', { configurable: true, get: denied });
  } else {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: Object.defineProperty({}, 'gpu', { get: denied }) });
  }
}

globalThis.self = {
  postMessage(value) { parentPort.postMessage({ kind: 'result', value }); },
};

// Register the listener only after import completes; parentPort queues messages
// until it has a listener, so early submissions are not dropped.
await import('./cpu.worker.js');
if (typeof globalThis.self.onmessage !== 'function') throw new Error('CPU_WORKER_HANDLER_MISSING');
parentPort.on('message', data => globalThis.self.onmessage({ data }));
