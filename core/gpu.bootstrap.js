export async function initGPU() {
  if (!navigator.gpu) {
    return null;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    return null;
  }
  const device = await adapter.requestDevice();
  return { adapter, device, queue: device.queue };
}
