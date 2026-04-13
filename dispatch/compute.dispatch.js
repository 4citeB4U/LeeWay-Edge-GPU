/**
 * ----------------------------------------------------------------------------
 * 5W + H SYSTEM MANIFEST (LEEWAY STANDARDS)
 * ----------------------------------------------------------------------------
 * WHAT: LEEWAY WebGPU Compute Dispatcher
 * WHY: Marshals and dispatches workgroups natively to the edge GPU hardware
 * WHO: Creator: Leonard Lee | Leeway Innovations | A Leeway Industries Creation
 * WHERE: L7_ExecutionFabric / WebGPU Runtime
 * WHEN: Active Execution Phase
 * HOW: Maps shaders, bindings, and tensor layouts securely
 * ----------------------------------------------------------------------------
 */

import { getPipeline } from '../pipeline/pipeline.cache.js';
import { getBuffer, releaseBuffer } from '../buffers/buffer.pool.js';
import { matmulWGSL } from '../shaders/matmul.wgsl.js';

export function prepareMatWuTask(device, matA, matB, size) {
  return {
    TAG: "LEEWAY.COMPUTE.MATMUL.EXEC",
    REGION: "L7_EXECUTION_FABRIC",
    DISCOVERY_PIPELINE: ["Intent", "Routing", "Execution", "Verification"],
    run: async () => {
      const byteSize = size * size * Float32Array.BYTES_PER_ELEMENT;
      const usageStorage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;

      const gpuBufA = getBuffer(device, byteSize, usageStorage);
      const gpuBufB = getBuffer(device, byteSize, usageStorage);
      const gpuBufC = getBuffer(device, byteSize, usageStorage);
      
      // PHASE 1 VALIDATION LAW: Guarding math correctness
      console.assert(gpuBufA !== gpuBufB, "FATAL ERROR ALIASING: gpuBufA === gpuBufB");
      console.assert(gpuBufB !== gpuBufC, "FATAL ERROR ALIASING: gpuBufB === gpuBufC");
      console.assert(gpuBufA !== gpuBufC, "FATAL ERROR ALIASING: gpuBufA === gpuBufC");
      
      // PHASE 5: Uniform Buffer for parameterizing exact tensor bounds safely
      const uniformBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      device.queue.writeBuffer(uniformBuffer, 0, new Uint32Array([size]));
      
      device.queue.writeBuffer(gpuBufA, 0, matA);
      device.queue.writeBuffer(gpuBufB, 0, matB);
      
      const pipeline = getPipeline(device, 'matmul_512', matmulWGSL);
      
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: gpuBufA } },
          { binding: 1, resource: { buffer: gpuBufB } },
          { binding: 2, resource: { buffer: gpuBufC } },
          { binding: 3, resource: { buffer: uniformBuffer } }
        ]
      });
      
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      
      const workgroupSize = 8;
      const dispatchX = Math.ceil(size / workgroupSize);
      const dispatchY = Math.ceil(size / workgroupSize);
      pass.dispatchWorkgroups(dispatchX, dispatchY);
      
      pass.end();
      
      // buffer for reading back
      const readUsage = GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ;
      const readBuffer = device.createBuffer({ size: byteSize, usage: readUsage });
      
      encoder.copyBufferToBuffer(gpuBufC, 0, readBuffer, 0, byteSize);
      device.queue.submit([encoder.finish()]);
      
      await readBuffer.mapAsync(GPUMapMode.READ);
      const hostArr = new Float32Array(readBuffer.getMappedRange());
      const result = new Float32Array(hostArr); // copy out synchronously
      readBuffer.unmap();
      
      // PHASE 3: Annihilate temporary read buffer or leak system VRAM.
      readBuffer.destroy();
      // Annihilate uniform buffer
      uniformBuffer.destroy();
      
      // PHASE 1: Return buffers to available pool
      releaseBuffer(gpuBufA);
      releaseBuffer(gpuBufB);
      releaseBuffer(gpuBufC);
      
      return result;
    }
  };
}
export { prepareMatWuTask as prepareMatMulTask };
