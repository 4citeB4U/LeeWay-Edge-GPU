export function cpuMatMul(A, B, size) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./cpu.worker.js', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
    
    worker.postMessage({ A, B, size });
  });
}
