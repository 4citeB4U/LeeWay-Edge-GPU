// The host supplies a qualified WebGPU provider. Other native adapters implement
// their own device initialization below the same LeeWay service contract.
export async function initGPU({provider = globalThis.navigator?.gpu, adapterOptions,
  requiredFeatures = [], requiredLimits = {}} = {}) {
  if (!provider || typeof provider.requestAdapter !== 'function') {
    return null;
  }
  const adapter = await provider.requestAdapter(adapterOptions);
  if (!adapter) {
    return null;
  }
  const device = await adapter.requestDevice({requiredFeatures, requiredLimits});
  return { adapter, device, queue: device.queue, executionApi: 'WEBGPU' };
}
