export async function getGPUCapabilities(adapter) {
  const features = [];
  adapter.features.forEach(f => features.push(f));
  return {
    name: adapter.name || "Unknown Adapter",
    limits: adapter.limits,
    features: features
  };
}
