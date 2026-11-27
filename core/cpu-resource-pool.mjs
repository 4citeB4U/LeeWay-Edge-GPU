/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.CPU_RESOURCE_POOL
TAG: LEEWAY.EDGE_GPU.CPU_RESOURCE_POOL.V1
WHAT: Admit and run bounded simultaneous CPU work through the existing governed scheduler and canonical CPU worker.
WHY: Unified CPU-backed execution needs measured resources, explicit authorization and truthful states, not synthetic GPU capacity.
WHO: OpenCode authorized Runtime/backend implementation contributor; existing controller, LDWMD and worker owners retain authority.
WHERE: core/cpu-resource-pool.mjs in 4citeB4U/LeeWay-Edge-GPU.
WHEN: 2026-11-27
HOW: Consume executeGPU() for admission, an injected LDWMD memory owner for leases, and the existing node-cpu worker for arithmetic.
AUTHORITY: SOURCE_CANDIDATE_CONSUMER. This module creates no GPU, engine, provider, queue, permission or Veritas decision.
LICENSE: Existing repository terms.
*/
import { createHash } from 'node:crypto';
import os from 'node:os';
import { executeGPU } from '../control/gpu.controller.bridge.js';

export const CPU_RESOURCE_POOL_SCHEMA = 'leeway.edge-gpu.cpu-resource-pool.v1';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const CAPABILITIES = Object.freeze(['LEEWAY_CPU_COMPUTE', 'LEEWAY_CPU_TENSOR']);
const denied = (state, reason, extra = {}) => Object.freeze({ state, reason, executed: false, verified: false, ...extra });
const valid = value => typeof value === 'string' && ID.test(value);

/** Real host measurement. No synthetic GPU capacity is derived here. */
export function measureHostResources(osModule = os) {
  const cpus = Array.isArray(osModule?.cpus?.()) ? osModule.cpus() : [];
  const totalBytes = Number(osModule?.totalmem?.());
  const freeBytes = Number(osModule?.freemem?.());
  if (cpus.length < 1 || !Number.isFinite(totalBytes) || totalBytes <= 0 ||
      !Number.isFinite(freeBytes) || freeBytes < 0 || freeBytes > totalBytes) {
    return Object.freeze({ state: 'UNAVAILABLE', reason: 'HOST_RESOURCE_MEASUREMENT_INVALID', logicalCpus: 0, totalBytes: 0, freeBytes: 0 });
  }
  return Object.freeze({
    state: 'MEASURED',
    reason: null,
    logicalCpus: cpus.length,
    totalBytes,
    freeBytes,
    model: String(cpus[0]?.model || ''),
    source: 'HOST_OS_MEASUREMENT'
  });
}

/**
 * Production worker factory. It runs the EXISTING canonical worker source; it
 * does not add a second arithmetic engine. Tests inject their own factory.
 */
export function createNodeCpuWorkerFactory({
  WorkerCtor = null,
  workerFile = new URL('../fallback/node-cpu.worker.mjs', import.meta.url),
  timeoutMs = 30000
} = {}) {
  return Object.freeze({
    schema: 'leeway.edge-gpu.cpu-worker-factory.v1',
    async run(task) {
      if (typeof WorkerCtor !== 'function') throw Object.assign(new Error('CPU_WORKER_CONSTRUCTOR_UNBOUND'), { code: 'CPU_WORKER_CONSTRUCTOR_UNBOUND' });
      const worker = new WorkerCtor(workerFile, { workerData: { denyExternalProviders: true } });
      try {
        return await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(Object.assign(new Error('CPU_WORKER_TIMEOUT'), { code: 'CPU_WORKER_TIMEOUT' })), timeoutMs);
          worker.once('message', message => {
            clearTimeout(timer);
            if (message?.kind === 'result') { resolve(message.value); return; }
            reject(Object.assign(new Error('CPU_WORKER_INVALID_MESSAGE'), { code: 'CPU_WORKER_INVALID_MESSAGE' }));
          });
          worker.once('error', error => { clearTimeout(timer); reject(error); });
          worker.postMessage(task);
        });
      } finally {
        await worker.terminate?.();
      }
    }
  });
}

function validateAuthorization(authorization, resource) {
  if (!authorization || typeof authorization !== 'object') return denied('BLOCKED', 'AUTHORIZATION_REQUIRED');
  for (const field of ['subjectRef', 'tenantRef', 'approvalRef', 'correlationId']) {
    if (!valid(authorization[field])) return denied('BLOCKED', `AUTHORIZATION_${field.toUpperCase()}_INVALID`);
  }
  if (!CAPABILITIES.includes(authorization.capability)) return denied('BLOCKED', 'CAPABILITY_NOT_AUTHORIZED');
  if (!resource || typeof resource !== 'object') return denied('BLOCKED', 'RESOURCE_REQUEST_REQUIRED');
  if (resource.resourceClass !== 'CPU') return denied('BLOCKED', 'NON_CPU_RESOURCE_REJECTED');
  if (!Number.isSafeInteger(resource.logicalWorkers) || resource.logicalWorkers < 1) return denied('BLOCKED', 'LOGICAL_WORKERS_INVALID');
  if (!Number.isSafeInteger(resource.bytes) || resource.bytes < 1) return denied('BLOCKED', 'RESOURCE_BYTES_INVALID');
  return null;
}

/**
 * Bounded simultaneous CPU execution. Every task must be individually
 * authorized and admitted by the existing controller before it can run.
 */
export function createCpuResourcePool({
  controller = null,
  workerFactory = null,
  memoryOwner = null,
  resourceProbe = measureHostResources,
  limits = {},
  now = () => new Date().toISOString()
} = {}) {
  const maxConcurrent = Number.isSafeInteger(limits.maxConcurrent) && limits.maxConcurrent > 0 ? limits.maxConcurrent : 4;
  const reserveRatio = Number.isFinite(limits.reserveRatio) && limits.reserveRatio > 0 && limits.reserveRatio < 1 ? limits.reserveRatio : 0.5;
  const maxBytes = Number.isSafeInteger(limits.maxBytes) && limits.maxBytes > 0 ? limits.maxBytes : 512 * 1024 * 1024;
  let active = 0;
  let completed = 0;
  let failed = 0;

  function status() {
    const missing = [];
    if (!controller || typeof controller.approve !== 'function') missing.push('controller.approve');
    if (!workerFactory || typeof workerFactory.run !== 'function') missing.push('workerFactory.run');
    if (!memoryOwner || typeof memoryOwner.acquire !== 'function' || typeof memoryOwner.release !== 'function') missing.push('ldwmd.memoryOwner');
    if (typeof resourceProbe !== 'function') missing.push('resourceProbe');
    const measurement = typeof resourceProbe === 'function' ? resourceProbe() : null;
    if (!measurement || measurement.state !== 'MEASURED') missing.push('measuredResources');
    return Object.freeze({
      schema: CPU_RESOURCE_POOL_SCHEMA,
      state: missing.length === 0 ? 'CONFIGURED' : 'BLOCKED',
      missing: Object.freeze(missing),
      measurement: measurement || null,
      active,
      maxConcurrent,
      completed,
      failed,
      physicalGpu: 'NOT_EXECUTED',
      veritas: 'NOT_EXECUTED'
    });
  }

  async function submit({ authorization = null, task = null, resource = null } = {}) {
    const binding = status();
    if (binding.state !== 'CONFIGURED') return denied('BLOCKED', 'CPU_RESOURCE_POOL_UNBOUND', { missing: binding.missing.slice() });
    const invalid = validateAuthorization(authorization, resource);
    if (invalid) return invalid;
    if (!task || typeof task !== 'object') return denied('BLOCKED', 'TASK_REQUIRED');

    const measurement = binding.measurement;
    if (resource.logicalWorkers > measurement.logicalCpus) return denied('BLOCKED', 'LOGICAL_WORKERS_EXCEED_MEASURED_CAPACITY', { logicalCpus: measurement.logicalCpus });
    if (resource.logicalWorkers > maxConcurrent) return denied('BLOCKED', 'CONCURRENCY_LIMIT_EXCEEDED', { maxConcurrent });
    if (resource.bytes > maxBytes || resource.bytes > Math.floor(measurement.freeBytes * reserveRatio)) {
      return denied('BLOCKED', 'MEMORY_BUDGET_EXCEEDED', { maxBytes, freeBytes: measurement.freeBytes, reserveRatio });
    }
    if (active >= maxConcurrent) return denied('BLOCKED', 'CONCURRENCY_LIMIT_REACHED', { active, maxConcurrent });

    active += 1;
    let lease = null;
    try {
      lease = await memoryOwner.acquire({ authorization, resource, at: now() });
      if (!lease || !valid(lease.leaseRef) || !Number.isSafeInteger(lease.bytes) || lease.bytes < resource.bytes) {
        return denied('BLOCKED', 'LDWMD_LEASE_UNCONFIRMED');
      }
      const admittedTask = Object.freeze({
        TAG: 'LEEWAY.COMPUTE.CPU_POOL.EXEC',
        metadata: {
          schema: CPU_RESOURCE_POOL_SCHEMA,
          subjectRef: authorization.subjectRef,
          tenantRef: authorization.tenantRef,
          capability: authorization.capability,
          correlationId: authorization.correlationId,
          logicalWorkers: resource.logicalWorkers,
          bytes: resource.bytes,
          leaseRef: lease.leaseRef
        },
        // The existing controller bridge admits a task by calling run().
        // Delegate only to the canonical CPU worker factory; no new engine.
        run: () => workerFactory.run(task)
      });
      // Existing governed scheduler is the sole admission authority.
      const output = await executeGPU(admittedTask, controller);
      const digest = createHash('sha256').update(JSON.stringify(output ?? null)).digest('hex');
      completed += 1;
      return Object.freeze({
        state: 'EXECUTED_UNVERIFIED',
        reason: 'CANONICAL_VERITAS_NOT_EXECUTED',
        executed: true,
        verified: false,
        schema: CPU_RESOURCE_POOL_SCHEMA,
        correlationId: authorization.correlationId,
        leaseRef: lease.leaseRef,
        output,
        outputSha256: digest,
        executionClass: 'MEASURED_CPU_ONLY',
        physicalGpu: 'NOT_EXECUTED',
        observedAt: now()
      });
    } catch (error) {
      failed += 1;
      return denied('FAILED', error?.code || error?.message || 'CPU_EXECUTION_FAILED', { correlationId: authorization.correlationId });
    } finally {
      if (lease) {
        try { await memoryOwner.release({ leaseRef: lease.leaseRef, at: now() }); }
        catch { failed += 1; }
      }
      active -= 1;
    }
  }

  return Object.freeze({ schema: CPU_RESOURCE_POOL_SCHEMA, capabilities: Object.freeze([...CAPABILITIES]), status, submit });
}
