const pipelineCache = new Map();

export function getPipeline(device, key, shaderCode) {
  if (pipelineCache.has(key)) {
    return pipelineCache.get(key);
  }

  const module = device.createShaderModule({ code: shaderCode });

  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module,
      entryPoint: "main"
    }
  });

  pipelineCache.set(key, pipeline);
  return pipeline;
}
