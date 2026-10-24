import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { cpuTensorNode, cpuMatMulNode } from '../../fallback/node-cpu.engine.mjs';
import { TENSOR_OPERATION } from '../../dispatch/tensor-contract.mjs';

test('original tensor worker returns known fused answer under external-provider guards', async () => {
  const actual = await cpuTensorNode({ operation: TENSOR_OPERATION, m:2,k:3,n:2,
    A:new Float32Array([1,2,3,4,5,6]), B:new Float32Array([1,2,3,4,5,6]),
    bias:new Float32Array([-30,1]), activation:'relu' }, { denyExternalProviders:true });
  assert.deepEqual([...actual],[0,29,19,65]);
});
test('original square worker returns independently known product', async () => {
  assert.deepEqual([...await cpuMatMulNode(new Float32Array([1,2,3,4]), new Float32Array([5,6,7,8]),2)], [19,22,43,50]);
});
test('square inputs are snapshotted before caller mutation', async () => {
  const A = new Float32Array([1,2,3,4]);
  const run = cpuMatMulNode(A,new Float32Array([1,0,0,1]),2); A.fill(99);
  assert.deepEqual([...await run], [1,2,3,4]);
});
test('pre-cancellation and invalid inputs fail before worker dispatch', () => {
  const controller = new AbortController(); controller.abort();
  assert.throws(() => cpuMatMulNode(new Float32Array(1),new Float32Array(1),1,{signal:controller.signal}), e => e.code === 'TENSOR_CANCELLED');
  assert.throws(() => cpuMatMulNode(new Float32Array([NaN]),new Float32Array([1]),1), e => e.code === 'CPU_MATRIX_INPUT_INVALID');
  assert.throws(() => cpuMatMulNode(new Float32Array([1]),new Float32Array([1]),1,{timeoutMs:0}), e => e.code === 'CPU_TIMEOUT_INVALID');
});
test('timeout terminates an unfinished worker before promise settlement', async () => {
  const size = 256;
  await assert.rejects(() => cpuMatMulNode(new Float32Array(size*size).fill(1),new Float32Array(size*size).fill(1),size,{timeoutMs:1}), e => e.code === 'CPU_EXECUTION_TIMEOUT');
});
test('cancellation after worker dispatch terminates before promise settlement', async () => {
  const controller = new AbortController(); const size = 256;
  const run = cpuMatMulNode(new Float32Array(size*size).fill(1),new Float32Array(size*size).fill(1),size,{signal:controller.signal});
  controller.abort(); await assert.rejects(run,e => e.code === 'TENSOR_CANCELLED');
});
test('worker termination failure cannot be reported as successful cleanup', async t => {
  const originalTerminate = Worker.prototype.terminate;
  // Stop the real worker first, then inject the cleanup failure; no orphan thread.
  t.mock.method(Worker.prototype, 'terminate', function () {
    return originalTerminate.call(this).then(() => { throw Error('INJECTED_TERMINATE_REJECTION'); });
  });
  await assert.rejects(() => cpuMatMulNode(new Float32Array([2]), new Float32Array([3]),1),
    e => e.code === 'CPU_WORKER_TERMINATION_FAILED');
});
test('cancellation after result arrival wins before termination settlement', async t => {
  const controller = new AbortController(); const originalTerminate = Worker.prototype.terminate;
  t.mock.method(Worker.prototype, 'terminate', function () {
    return originalTerminate.call(this).then(code => { controller.abort(); return code; });
  });
  await assert.rejects(() => cpuMatMulNode(new Float32Array([2]),new Float32Array([3]),1,{signal:controller.signal}),
    e => e.code === 'TENSOR_CANCELLED');
});
