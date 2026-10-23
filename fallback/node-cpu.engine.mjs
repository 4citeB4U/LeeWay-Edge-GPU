import { Worker } from 'node:worker_threads';
import { snapshotTensor, TensorError, requireNotCancelled } from '../dispatch/tensor-contract.mjs';

function runNodeWorker(payload, { signal, timeoutMs = 30000, denyExternalProviders = false } = {}) {
  requireNotCancelled(signal);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) {
    throw new TensorError('CPU_TIMEOUT_INVALID');
  }
  return new Promise((resolve, reject) => {
    let done = false;
    let worker;
    let timer;
    const finish = (error, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      const settle = () => {
        if (error) reject(error);
        else if (signal?.aborted) reject(new TensorError('TENSOR_CANCELLED'));
        else resolve(value);
      };
      if (worker) worker.terminate().then(settle, () => reject(new TensorError('CPU_WORKER_TERMINATION_FAILED')));
      else settle();
    };
    const cancel = () => finish(new TensorError('TENSOR_CANCELLED'));
    try {
      worker = new Worker(new URL('./node-cpu.worker.mjs', import.meta.url), {
        workerData: { denyExternalProviders: denyExternalProviders === true },
      });
      timer = setTimeout(() => finish(new TensorError('CPU_EXECUTION_TIMEOUT')), timeoutMs);
      signal?.addEventListener('abort', cancel, { once: true });
      worker.on('message', message => {
        if (message?.kind !== 'result') return finish(new TensorError('CPU_RESPONSE_INVALID'));
        if (message.value?.error) return finish(new TensorError(message.value.code || 'CPU_EXECUTION_FAILED', message.value.error));
        finish(null, message.value);
      });
      worker.on('error', error => finish(new TensorError('CPU_EXECUTION_FAILED', error.message)));
      worker.on('messageerror', () => finish(new TensorError('CPU_RESPONSE_INVALID')));
      worker.on('exit', code => { if (!done) finish(new TensorError('CPU_EXECUTION_FAILED', `Worker exited before response (${code})`)); });
      if (signal?.aborted) return cancel();
      worker.postMessage(payload);
    } catch (error) {
      finish(error);
    }
  });
}

export function cpuTensorNode(input, options = {}) {
  requireNotCancelled(options.signal);
  return runNodeWorker({ op: 'TENSOR', input: snapshotTensor(input) }, options);
}

export function cpuMatMulNode(A, B, size, options = {}) {
  requireNotCancelled(options.signal);
  const validArray = value => value instanceof Float32Array && value.length === size * size &&
    !(globalThis.SharedArrayBuffer && value.buffer instanceof SharedArrayBuffer) && value.every(Number.isFinite);
  if (!Number.isSafeInteger(size) || size < 1 || size > 2048 || !validArray(A) || !validArray(B)) {
    throw new TensorError('CPU_MATRIX_INPUT_INVALID');
  }
  return runNodeWorker({ A: A.slice(), B: B.slice(), size }, options);
}
