/**
 * WORKER THREAD EXECUTION FABRIC
 * Offloads heavy execution to isolated background threads.
 */
export class WorkerManager {
  constructor() {
    this.workers = new Map();
  }

  getWorker(type) {
    if (!this.workers.has(type)) {
      const worker = new Worker(`./${type}.worker.js`, { type: "module" });
      this.workers.set(type, worker);
    }
    return this.workers.get(type);
  }

  run(type, payload) {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker(type);

      worker.onmessage = e => resolve(e.data);
      worker.onerror = err => reject(err);

      worker.postMessage(payload);
    });
  }
}
