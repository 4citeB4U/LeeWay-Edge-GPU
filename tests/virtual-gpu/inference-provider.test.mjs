// Diagnostic fixtures validate SDK routing; no model inference or production qualification occurs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLeeWayGpuInferenceProvider} from '../../sdk/inference-provider.mjs';
import {inferenceHash, snapshotInferenceRequest} from '../../core/inference-contract.mjs';
import {initGPU} from '../../core/gpu.bootstrap.js';
import {canonicalGpuSigningBytes} from '../../sdk/signing-json.mjs';

const H = '1'.repeat(64), J = '2'.repeat(64), K = '3'.repeat(64);
import {syntheticModelPlan as plan} from '../fixtures/portable-model-plan.mjs';
async function fixture({readiness = 'BOUND', qualificationChange, resultChange, execution} = {}) {
  const modelPlan = plan(); const principalCalls = []; let calls = 0;
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const body = {serviceId: 'leeway.gpu.service', deviceId: 'diagnostic-device', platform: 'LINUX',
    receiptId: 'diagnostic-fixture-only', expiresAtMs: Date.now() + 60000,
    models: [{modelId: 'fixture-model', modelSha256: H, tokenizerSha256: J,
      implementationSha256: K, planSha256: await inferenceHash(modelPlan)}]};
  qualificationChange?.(body);
  const qualification = {publicKeySpki: new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey)),
    envelope: {schema: 'leeway.gpu.provider-qualification.v1', body,
      signature: new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, canonicalGpuSigningBytes(body)))}};
  const provider = createLeeWayGpuInferenceProvider({models: [{modelId: 'fixture-model', plan: modelPlan}],
    platform: 'linux', deviceId: 'diagnostic-device', qualification,
    bindingProvider: {readiness: async () => ({state: readiness}), forClient(client) { principalCalls.push(client); return {fixtureOnly: true}; }},
    deviceProvider: {getDevice: async () => ({fixtureOnly: true})},
    executeModel: async input => {
      calls++;
      if (execution) return execution(input);
      const observed = {execution: 'LEEWAY_QUANTIZED_WGSL_GRAPH', externalModelEngine: false,
        cpuNeuralMath: false, outputIds: [modelPlan.metadata['tokenizer.ggml.tokens'].indexOf('4')]};
      const requestHash = await inferenceHash(snapshotInferenceRequest({type: 'AI_INFERENCE',
        requestId: input.requestId, sessionId: input.sessionId, modelSha256: H, tokenizerSha256: J,
        implementationSha256: K, contextLimit: input.plan.contextLimit, maxNewTokens: input.plan.maxNewTokens,
        inputIds: input.plan.inputTokens}));
      const result = {...observed, executionBinding: {requestId: input.requestId, sessionId: input.sessionId,
        modelSha256: H, tokenizerSha256: J, implementationSha256: K, requestHash, resultHash: await inferenceHash(observed),
        formulaReceiptSha256: H, formulaReplaySha256: H, ldWmdReceiptSha256: H, continuumReceiptSha256: H,
        postReceiptSha256: H, commitAttestationSha256: H, receiptLedgerReceiptSha256: H, learningLedgerReceiptSha256: H}};
      resultChange?.(result); return result;
    }});
  return {provider, principalCalls, modelPlan, calls: () => calls};
}
const options = {client: {clientId: 'registered-client'}};
const activate = f => f.provider.activateModel({modelId: 'fixture-model'}, options);
const generate = (f, extra = {}, opts = options) => f.provider.generate({modelId: 'fixture-model', prompt: 'a', maxNewTokens: 1, ...extra}, opts);

test('bootstrap without a browser returns unavailable instead of ReferenceError or CPU', async () => {
  assert.equal(await initGPU({provider: null}), null);
});
test('qualification signing bytes are independent of JSON object insertion order', () => {
  assert.deepEqual(canonicalGpuSigningBytes({z: 1, a: {y: true, b: [1, 2]}}),
    canonicalGpuSigningBytes({a: {b: [1, 2], y: true}, z: 1}));
  for (const value of [{value: undefined}, {value: Infinity}, {value: 1.5}, [undefined], new Uint8Array([1])])
    assert.throws(() => canonicalGpuSigningBytes(value), /SIGNING_JSON_INVALID/);
});
test('bootstrap uses the explicitly supplied host device provider', async () => {
  const device = {queue: {}}, calls = [];
  const provider = {async requestAdapter(value) { calls.push(value); return {async requestDevice(profile) { calls.push(profile); return device; }}; }};
  const found = await initGPU({provider, adapterOptions: {powerPreference: 'high-performance'}, requiredFeatures: ['shader-f16']});
  assert.equal(found.device, device); assert.equal(found.executionApi, 'WEBGPU');
  assert.deepEqual(calls[1].requiredFeatures, ['shader-f16']);
});
test('missing production startup binding exposes an unavailable capability', async () => {
  const provider = createLeeWayGpuInferenceProvider({platform: 'iphone', deviceId: 'phone'});
  const result = await provider.capabilities();
  assert.equal(result.platform, 'IOS'); assert.equal(result.gpuVerified, false); assert.equal(result.productionAccepted, false);
});
test('expired or cross-device qualification cannot expose an executable model', async () => {
  for (const qualificationChange of [body => body.expiresAtMs = 1, body => body.deviceId = 'other-device',
    body => body.models[0].planSha256 = J, body => body.platform = 'WINDOWS']) {
    const f = await fixture({qualificationChange});
    assert.equal((await f.provider.capabilities()).gpuVerified, false);
    await assert.rejects(activate(f)); assert.equal(f.calls(), 0);
  }
});
test('runtime unavailable denies activation and starts no model', async () => {
  const f = await fixture({readiness: 'UNAVAILABLE'});
  await assert.rejects(activate(f), /RUNTIME_UNAVAILABLE/); assert.equal(f.calls(), 0);
});
test('authenticated client selection reaches existing graph and carries final audit evidence', async () => {
  const f = await fixture(); await activate(f); const answer = await generate(f);
  assert.equal(answer.text, '4'); assert.equal(answer.backend, 'LEEWAY_GPU');
  assert.equal(answer.canonicalReceiptIssued, true); assert.equal(f.calls(), 1);
  assert.deepEqual(f.principalCalls, [{clientId: 'registered-client'}]);
});
test('client sessions persist across requests and remain isolated across clients', async () => {
  const f = await fixture(); await activate(f);
  const first = await generate(f), second = await generate(f);
  assert.equal(first.sessionId, second.sessionId); assert.notEqual(first.requestId, second.requestId);
  const other = {client: {clientId: 'other-client'}};
  await f.provider.activateModel({modelId: 'fixture-model'}, other);
  const third = await generate(f, {}, other); assert.notEqual(first.sessionId, third.sessionId);
});
test('request cannot inject provider URLs, executors or authority', async () => {
  const f = await fixture(); await activate(f);
  for (const extra of [{provider: 'caller'}, {rangeBaseUrl: 'http://127.0.0.1/'}, {authority: {approved: true}}])
    await assert.rejects(generate(f, extra), /GENERATION_INVALID/);
  assert.equal(f.calls(), 0);
});
test('missing ledger or altered source identity withholds the response', async () => {
  for (const resultChange of [result => delete result.executionBinding.learningLedgerReceiptSha256,
    result => result.executionBinding.modelSha256 = K, result => result.executionBinding.requestHash = K,
    result => result.outputIds = [0]]) {
    const f = await fixture({resultChange}); await activate(f); await assert.rejects(generate(f), /EVIDENCE_INCOMPLETE|RESULT_HASH_MISMATCH/);
  }
});
test('one client cannot generate through another client activation', async () => {
  const f = await fixture(); await activate(f);
  await assert.rejects(generate(f, {}, {client: {clientId: 'stranger'}}), /MODEL_NOT_ACTIVE/);
  assert.equal(f.calls(), 0);
});
test('request cancellation withholds even an executor fixture that ignores cancellation', async () => {
  const controller = new AbortController();
  const f = await fixture({execution: async () => { controller.abort(); return {}; }}); await activate(f);
  await assert.rejects(generate(f, {}, {...options, signal: controller.signal}), /CANCELLED/);
});
