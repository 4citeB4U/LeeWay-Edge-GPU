/*
REGION: LEEWAY.EDGE_GPU.APPLICATION_INTERFACE
TAG: LEEWAY.EDGE_GPU.INFERENCE_PROVIDER.V1
WHAT: Expose the existing LeeWay model graph to the existing GPU service.
WHY: Application clients share one qualified provider and never supply executors.
WHO: Trusted deployment startup. WHERE: Existing Edge GPU SDK.
HOW: Pin model plans, verify independent provider qualification, bind each client
to Runtime Fabric, run the existing graph, and retain correlated result evidence.
LICENSE: MIT. This module creates no signer, model server or voice provider.
*/
import {LEEWAY_GPU_PRODUCT, normalizeGpuPlatform} from '../contracts/gpu-platform-contract.mjs';
import {GgufTokenizer} from './gguf-tokenizer.mjs';
import {inspectTransformerPlan, runModel} from '../core/transformer-inference.mjs';
import {inferenceHash, isSha256, snapshotInferenceRequest} from '../core/inference-contract.mjs';
import {canonicalGpuSigningBytes} from './signing-json.mjs';

const identity = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,159}$/.test(value);
const fail = code => { throw Object.assign(new Error(code), {code}); };
function validateModelGraphTimings(value,{promptTokens,visibleOutputTokens}){
  const numeric=['modelLoadMs','prefillMs','modelGraphFirstTokenReadyMs','decodeMs','graphAfterLoadMs','modelLoadAndGraphMs'];
  if(value?.schema!=='leeway.gpu.model-graph-timings.v2'||
    value.scope!=='MODEL_GRAPH_AFTER_LOAD_EXCLUDES_AUTHORIZATION_POST_VERITAS_AND_CONTINUUM_COMMIT'||
    !['COLD_LOAD','WARM_CACHED'].includes(value.modelLoadState)||
    numeric.some(key=>!Number.isFinite(value[key])||value[key]<0||value[key]>600000)||
    value.clientTimeToFirstTokenMs!==null||
    value.clientTimeToFirstTokenStatus!=='NOT_MEASURED_NON_STREAMING_RESPONSE'||
    value.modelGraphFirstTokenReadyMs!==value.prefillMs||
    Math.abs(value.modelLoadAndGraphMs-(value.modelLoadMs+value.graphAfterLoadMs))>0.01||
    value.promptTokens!==promptTokens||value.visibleOutputTokens!==visibleOutputTokens||
    !Number.isSafeInteger(value.decodeModelSteps)||value.decodeModelSteps<0||value.decodeModelSteps>64||
    !Number.isSafeInteger(value.decodeVisibleTokens)||value.decodeVisibleTokens<0||value.decodeVisibleTokens>64||
    !Number.isSafeInteger(value.decodeStopTokens)||value.decodeStopTokens<0||value.decodeStopTokens>1||
    value.decodeModelSteps!==value.decodeVisibleTokens+value.decodeStopTokens||
    value.decodeVisibleTokens!==Math.max(0,visibleOutputTokens-1)||
    (value.decodeVisibleTokens===0?value.decodeTokensPerSecond!==null:
      !Number.isFinite(value.decodeTokensPerSecond)||value.decodeTokensPerSecond<=0||value.decodeTokensPerSecond>1000000)||
    !Array.isArray(value.tokenTimings)||value.tokenTimings.length!==promptTokens+value.decodeModelSteps||
    value.tokenTimings.some((item,index)=>!Number.isSafeInteger(item?.position)||item.position!==index||
      !Number.isSafeInteger(item?.commands)||item.commands<0||
      !Number.isFinite(item?.elapsedMs)||item.elapsedMs<0||item.elapsedMs>600000))
    fail('GPU_PROVIDER_PERFORMANCE_EVIDENCE_INCOMPLETE');
  return structuredClone(value);
}
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) {
  for (const child of Object.values(value)) freeze(child); Object.freeze(value);
} return value; };

export function createLeeWayGpuInferenceProvider({models = [], platform, deviceId,
  bindingProvider, deviceProvider, qualification, crypto = globalThis.crypto,
  clock = () => Date.now(), executeModel = runModel} = {}) {
  const target = normalizeGpuPlatform(platform);
  if (!identity(deviceId) || !Array.isArray(models) || models.length > 128 || typeof executeModel !== 'function')
    fail('GPU_PROVIDER_STARTUP_INVALID');
  const catalog = new Map(), clients = new Map();
  for (const model of models) {
    if (!identity(model.modelId) || catalog.has(model.modelId)) fail('GPU_PROVIDER_MODEL_ID_INVALID');
    const plan = structuredClone(model.plan);
    for (const key of ['modelSha256', 'tokenizerSha256', 'implementationSha256'])
      if (!isSha256(plan?.[key])) fail('GPU_PROVIDER_MODEL_IDENTITY_INVALID');
    // Per-request token state never participates in the reusable model plan.
    delete plan.inputTokens; delete plan.maxNewTokens;
    const inspected = inspectTransformerPlan(plan);
    const tokenizer = new GgufTokenizer(plan.metadata);
    catalog.set(model.modelId, Object.freeze({modelId: model.modelId, plan: freeze(plan), tokenizer,
      architecture: inspected.architecture, planHash: inferenceHash(plan)}));
  }
  const boundReadiness = bindingProvider?.readiness?.bind(bindingProvider);
  const bindClient = bindingProvider?.forClient?.bind(bindingProvider);
  const getDevice = deviceProvider?.getDevice?.bind(deviceProvider);
  const qualificationSnapshot = qualification ? structuredClone(qualification) : null;
  let selectedKey;

  async function qualifiedModels() {
    const q = qualificationSnapshot;
    if (!q || !crypto?.subtle || !(q.publicKeySpki instanceof Uint8Array) ||
        q.envelope?.schema !== 'leeway.gpu.provider-qualification.v1' ||
        !(q.envelope.signature instanceof Uint8Array)) fail('GPU_PROVIDER_QUALIFICATION_UNBOUND');
    selectedKey ??= crypto.subtle.importKey('spki', q.publicKeySpki, {name: 'Ed25519'}, false, ['verify']);
    const body = q.envelope.body;
    if (!await crypto.subtle.verify('Ed25519', await selectedKey, q.envelope.signature,
      canonicalGpuSigningBytes(body))) fail('GPU_PROVIDER_QUALIFICATION_SIGNATURE_INVALID');
    if (body.serviceId !== LEEWAY_GPU_PRODUCT.serviceId || body.platform !== target || body.deviceId !== deviceId ||
        !identity(body.receiptId) || !Number.isSafeInteger(body.expiresAtMs) || body.expiresAtMs <= clock() ||
        !Array.isArray(body.models) || body.models.length < 1) fail('GPU_PROVIDER_QUALIFICATION_SUBJECT_INVALID');
    const admitted = new Map();
    for (const item of body.models) {
      const model = catalog.get(item.modelId);
      if (!model || admitted.has(item.modelId) ||
          ['modelSha256', 'tokenizerSha256', 'implementationSha256'].some(key => item[key] !== model.plan[key]) ||
          item.planSha256 !== await model.planHash) fail('GPU_PROVIDER_QUALIFICATION_MODEL_MISMATCH');
      admitted.set(item.modelId, model);
    }
    return {models: admitted, receiptId: body.receiptId};
  }

  async function requireReady() {
    if (!boundReadiness || !bindClient || !getDevice) fail('GPU_PROVIDER_RUNTIME_UNBOUND');
    const readiness = await boundReadiness();
    if (readiness?.state !== 'BOUND') fail('GPU_PROVIDER_RUNTIME_UNAVAILABLE');
    return qualifiedModels();
  }
  function principal(client) {
    if (!identity(client?.clientId)) fail('GPU_PROVIDER_AUTHENTICATED_CLIENT_REQUIRED');
    return Object.freeze({clientId: client.clientId});
  }
  async function capabilities() {
    try {
      const approved = await requireReady();
      return {...LEEWAY_GPU_PRODUCT, schema: 'leeway.gpu.inference.v1', platform: target, deviceId,
        modelInference: true, gpuVerified: true, receiptId: approved.receiptId, models: [...approved.models.keys()],
        status: 'QUALIFIED_PROVIDER_REQUEST_AUTHORIZATION_REQUIRED', productionAccepted: false};
    } catch (error) {
      return {...LEEWAY_GPU_PRODUCT, schema: 'leeway.gpu.inference.v1', platform: target, deviceId,
        modelInference: catalog.size > 0, gpuVerified: false, receiptId: null, models: [],
        status: 'UNAVAILABLE', reason: error.code || 'GPU_PROVIDER_READINESS_FAILED', productionAccepted: false};
    }
  }
  async function activateModel(request, {client, signal} = {}) {
    const user = principal(client);
    if (!request || Object.keys(request).some(key => key !== 'modelId') || !identity(request.modelId))
      fail('GPU_PROVIDER_ACTIVATION_INVALID');
    if (signal?.aborted) fail('GPU_PROVIDER_CANCELLED');
    const approved = await requireReady();
    if (!approved.models.has(request.modelId)) fail('GPU_PROVIDER_MODEL_NOT_QUALIFIED');
    if (!clients.has(user.clientId) && clients.size >= 1024) fail('GPU_PROVIDER_CLIENT_LIMIT');
    clients.set(user.clientId, {modelId: request.modelId, sessionId: crypto.randomUUID()});
    return {modelId: request.modelId, activeModel: request.modelId, backend: 'LEEWAY_GPU',
      activation: 'SELECTED_NO_MODEL_EXECUTION', serviceId: LEEWAY_GPU_PRODUCT.serviceId};
  }
  async function generate(request, {client, signal} = {}) {
    const user = principal(client);
    const allowed = new Set(['modelId', 'prompt', 'requestId', 'sessionId', 'maxNewTokens']);
    if (!request || Object.keys(request).some(key => !allowed.has(key)) ||
        typeof request.prompt !== 'string' || !request.prompt.trim() || request.prompt.length > 4096)
      fail('GPU_PROVIDER_GENERATION_INVALID');
    const selected = clients.get(user.clientId);
    if (!selected || selected.modelId !== request.modelId) fail('GPU_PROVIDER_MODEL_NOT_ACTIVE');
    const approved = await requireReady();
    const model = approved.models.get(request.modelId);
    if (!model) fail('GPU_PROVIDER_MODEL_NOT_QUALIFIED');
    const requestId = request.requestId ?? crypto.randomUUID();
    const sessionId = request.sessionId ?? selected.sessionId;
    const maxNewTokens = request.maxNewTokens ?? Math.min(32, model.plan.contextLimit - 1);
    if (!identity(requestId) || !identity(sessionId) || !Number.isSafeInteger(maxNewTokens) ||
        maxNewTokens < 1 || maxNewTokens > 64) fail('GPU_PROVIDER_REQUEST_PROFILE_INVALID');
    if (signal?.aborted) fail('GPU_PROVIDER_CANCELLED');
    const inputTokens = model.tokenizer.encode(model.tokenizer.chatPrompt(request.prompt), {special: true});
    if (inputTokens.length + maxNewTokens > model.plan.contextLimit) fail('GPU_PROVIDER_CONTEXT_EXCEEDED');
    const binding = await bindClient(user);
    const device = await getDevice({platform: target, deviceId, signal});
    const plan = {...model.plan, inputTokens, maxNewTokens};
    const expectedRequestHash = await inferenceHash(snapshotInferenceRequest({type: 'AI_INFERENCE',
      requestId, sessionId, modelSha256: plan.modelSha256, tokenizerSha256: plan.tokenizerSha256,
      implementationSha256: plan.implementationSha256, contextLimit: plan.contextLimit,
      inputIds: inputTokens, maxNewTokens}));
    const result = await executeModel({device, plan, inferenceBinding: binding, requestId, sessionId, signal});
    if (signal?.aborted) fail('GPU_PROVIDER_CANCELLED');
    const e = result?.executionBinding;
    const evidenceKeys = ['requestHash', 'resultHash', 'formulaReceiptSha256', 'formulaReplaySha256',
      'ldWmdReceiptSha256', 'continuumReceiptSha256', 'postReceiptSha256', 'commitAttestationSha256',
      'receiptLedgerReceiptSha256', 'learningLedgerReceiptSha256'];
    if (result?.execution !== 'LEEWAY_QUANTIZED_WGSL_GRAPH' || result.externalModelEngine !== false || result.cpuNeuralMath !== false ||
        !Array.isArray(result.outputIds) || result.outputIds.length > maxNewTokens ||
        e?.requestId !== requestId || e?.sessionId !== sessionId || e?.requestHash !== expectedRequestHash ||
        ['modelSha256', 'tokenizerSha256', 'implementationSha256'].some(key => e?.[key] !== plan[key]) ||
        evidenceKeys.some(key => !isSha256(e?.[key]))) fail('GPU_PROVIDER_EXECUTION_EVIDENCE_INCOMPLETE');
    const {executionBinding, claimBoundary, selectedDispatcherPath, ...observed} = result;
    if (await inferenceHash(observed) !== e.resultHash) fail('GPU_PROVIDER_RESULT_HASH_MISMATCH');
    const modelGraphTimings=validateModelGraphTimings(result.modelGraphTimings,
      {promptTokens:inputTokens.length,visibleOutputTokens:result.outputIds.length});
    return {serviceId: LEEWAY_GPU_PRODUCT.serviceId, modelId: request.modelId, backend: 'LEEWAY_GPU',
      requestId, sessionId, text: model.tokenizer.decode(result.outputIds), executionBinding: {...executionBinding},
      execution: result.execution, modelGraphTimings, canonicalReceiptIssued: true};
  }
  return Object.freeze({capabilities, activateModel, generate});
}
