/*
LEEWAY.EDGE_GPU.GOVERNED_PERFORMANCE
Calls the existing authenticated LeeWay GPU application service over loopback.
The service/SDK/Runtime binding owns model execution and evidence; this harness
never imports runModel, launches a model server, or supplies authority.
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const evidenceDir = option('--evidence');
const serviceText = process.env.LEEWAY_GPU_BENCH_SERVICE_URL;
const authorization = process.env.LEEWAY_GPU_BENCH_AUTHORIZATION;
const modelId = process.env.LEEWAY_GPU_BENCH_MODEL_ID;
const runCount = Number(option('--runs') ?? process.env.LEEWAY_GPU_BENCH_RUNS ?? 10);
const maxNewTokens = Number(option('--max-new-tokens') ?? process.env.LEEWAY_GPU_BENCH_MAX_NEW_TOKENS ?? 8);
const prompt = option('--prompt') ?? process.env.LEEWAY_GPU_BENCH_PROMPT ??
  'What is 2 + 2? Reply with only the number.';
const expectedAnswer = option('--expected') ?? process.env.LEEWAY_GPU_BENCH_EXPECTED ?? '4';
const timeoutMs = Number(process.env.LEEWAY_GPU_BENCH_TIMEOUT_MS ?? 600000);
const digestPattern = /^[a-f0-9]{64}$/;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,159}$/;
const report = {
  schema: 'leeway.gpu.governed-performance.v1',
  startedAt: new Date().toISOString(),
  scope: 'LOCAL_LEEWAY_GPU_SERVICE_FULL_GOVERNED_PATH_NO_EXTERNAL_INFERENCE',
  externalModelProviderUsed: false,
  comparisonProviderUsed: false,
  voiceFabricChanged: false,
  productionAcceptanceClaimed: false,
  generationAttempted: false,
  runs: [],
  outcome: 'NOT_STARTED'
};
let base;

function requireValue(condition, code) {
  if (!condition) throw Object.assign(new Error(code), {code});
}
function loopbackHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}
function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)];
}
function summary(values) {
  if (!values.length) return {count: 0, min: null, median: null, p95: null, mean: null, max: null};
  return {
    count: values.length,
    min: Math.min(...values),
    median: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    max: Math.max(...values)
  };
}
async function request(route, {method = 'GET', body} = {}) {
  const response = await fetch(new URL(route, base), {
    method,
    headers: {
      ...(method === 'POST' ? {'content-type': 'application/json'} : {}),
      ...(method === 'POST' && authorization ? {authorization} : {})
    },
    ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'error'
  });
  const raw = await response.text();
  let payload;
  try { payload = raw ? JSON.parse(raw) : {}; }
  catch { throw Object.assign(new Error('GPU_SERVICE_RESPONSE_NOT_JSON'), {code: 'GPU_SERVICE_RESPONSE_NOT_JSON', status: response.status}); }
  if (!response.ok) {
    const code = /^[A-Z0-9_]+$/.test(payload?.code ?? '') ? payload.code : `GPU_SERVICE_HTTP_${response.status}`;
    throw Object.assign(new Error(code), {code, status: response.status});
  }
  return payload;
}
function validateExecution(result, requestId) {
  const evidence = result?.executionBinding;
  const requiredHashes = [
    'requestHash', 'resultHash', 'modelSha256', 'tokenizerSha256', 'implementationSha256',
    'formulaReceiptSha256', 'formulaReplaySha256', 'ldWmdReceiptSha256', 'continuumReceiptSha256',
    'postReceiptSha256', 'commitAttestationSha256', 'receiptLedgerReceiptSha256', 'learningLedgerReceiptSha256'
  ];
  requireValue(result?.serviceId === 'leeway.gpu.service', 'GPU_RESULT_SERVICE_IDENTITY_MISMATCH');
  requireValue(result?.backend === 'LEEWAY_GPU', 'GPU_RESULT_BACKEND_MISMATCH');
  requireValue(result?.execution === 'LEEWAY_QUANTIZED_WGSL_GRAPH', 'GPU_RESULT_EXECUTION_PATH_MISMATCH');
  requireValue(result?.canonicalReceiptIssued === true, 'GPU_RESULT_CANONICAL_RECEIPT_MISSING');
  requireValue(idPattern.test(result?.requestId ?? '') && result.requestId === requestId, 'GPU_RESULT_REQUEST_ID_MISMATCH');
  requireValue(idPattern.test(result?.sessionId ?? ''), 'GPU_RESULT_SESSION_ID_MISSING');
  requireValue(typeof result?.text === 'string' && result.text.length > 0, 'GPU_RESULT_TEXT_MISSING');
  requireValue(evidence?.requestId === requestId, 'GPU_EVIDENCE_REQUEST_ID_MISMATCH');
  requireValue(evidence?.sessionId === result.sessionId, 'GPU_EVIDENCE_SESSION_ID_MISMATCH');
  for (const key of requiredHashes) requireValue(digestPattern.test(evidence?.[key] ?? ''), `GPU_EVIDENCE_${key.toUpperCase()}_MISSING`);
  const timing = result?.modelGraphTimings;
  requireValue(timing?.schema === 'leeway.gpu.model-graph-timings.v2', 'GPU_TIMING_SCHEMA_MISSING');
  requireValue(['COLD_LOAD', 'WARM_CACHED'].includes(timing?.modelLoadState), 'GPU_LOAD_STATE_MISSING');
  requireValue(Number.isFinite(timing?.modelLoadAndGraphMs) && timing.modelLoadAndGraphMs >= 0, 'GPU_GRAPH_TIMING_MISSING');
  requireValue(Number.isFinite(timing?.graphAfterLoadMs) && timing.graphAfterLoadMs >= 0, 'GPU_GRAPH_TIMING_INVALID');
  for (const key of ['modelLoadMs', 'prefillMs', 'decodeMs'])
    requireValue(Number.isFinite(timing?.[key]) && timing[key] >= 0, `GPU_TIMING_${key.toUpperCase()}_MISSING`);
  requireValue(timing?.clientTimeToFirstTokenMs === null &&
    timing?.clientTimeToFirstTokenStatus === 'NOT_MEASURED_NON_STREAMING_RESPONSE', 'GPU_TTFT_SCOPE_INVALID');
  requireValue(Number.isSafeInteger(timing?.promptTokens) && timing.promptTokens > 0, 'GPU_PROMPT_TOKEN_COUNT_MISSING');
  requireValue(Number.isSafeInteger(timing?.visibleOutputTokens) && timing.visibleOutputTokens > 0, 'GPU_OUTPUT_TOKEN_COUNT_MISSING');
  requireValue(Number.isSafeInteger(timing?.decodeModelSteps) && timing.decodeModelSteps >= 0, 'GPU_DECODE_STEP_COUNT_MISSING');
  requireValue(Number.isSafeInteger(timing?.decodeVisibleTokens) && timing.decodeVisibleTokens >= 0 &&
    Number.isSafeInteger(timing?.decodeStopTokens) && timing.decodeStopTokens >= 0 &&
    timing.decodeModelSteps === timing.decodeVisibleTokens + timing.decodeStopTokens, 'GPU_DECODE_TOKEN_COUNTS_INVALID');
  requireValue(Array.isArray(timing?.tokenTimings) &&
    timing.tokenTimings.length === timing.promptTokens + timing.decodeModelSteps, 'GPU_TOKEN_TIMINGS_INCOMPLETE');
  requireValue(timing.decodeVisibleTokens === 0 ? timing.decodeTokensPerSecond === null :
    Number.isFinite(timing.decodeTokensPerSecond) && timing.decodeTokensPerSecond > 0, 'GPU_DECODE_RATE_INVALID');
  return {evidence, timing};
}

try {
  requireValue(typeof evidenceDir === 'string' && evidenceDir.length > 0, 'EVIDENCE_DIRECTORY_REQUIRED');
  requireValue(typeof serviceText === 'string' && typeof authorization === 'string' && authorization.length > 0,
    'LOCAL_SERVICE_AND_AUTHORIZATION_REQUIRED');
  requireValue(idPattern.test(modelId ?? ''), 'MODEL_ID_REQUIRED');
  requireValue(Number.isSafeInteger(runCount) && runCount >= 1 && runCount <= 100, 'RUN_COUNT_OUT_OF_RANGE');
  requireValue(Number.isSafeInteger(maxNewTokens) && maxNewTokens >= 1 && maxNewTokens <= 64, 'TOKEN_LIMIT_OUT_OF_RANGE');
  requireValue(Number.isSafeInteger(timeoutMs) && timeoutMs >= 1000 && timeoutMs <= 1800000, 'TIMEOUT_OUT_OF_RANGE');
  requireValue(typeof prompt === 'string' && prompt.trim().length > 0 && prompt.length <= 4096, 'PROMPT_INVALID');
  requireValue(typeof expectedAnswer === 'string' && expectedAnswer.length > 0 && expectedAnswer.length <= 128, 'EXPECTED_ANSWER_INVALID');
  requireValue(!/[\r\n]/.test(authorization), 'AUTHORIZATION_HEADER_INVALID');

  const serviceUrl = new URL(serviceText);
  requireValue(serviceUrl.protocol === 'http:' && loopbackHostname(serviceUrl.hostname), 'NON_LOOPBACK_SERVICE_REFUSED');
  requireValue(!serviceUrl.username && !serviceUrl.password && !serviceUrl.search && !serviceUrl.hash,
    'SERVICE_URL_CREDENTIALS_OR_QUERY_REFUSED');
  serviceUrl.pathname = serviceUrl.pathname.replace(/\/+$/, '') + '/';
  base = serviceUrl;
  report.serviceOrigin = serviceUrl.origin;
  report.modelId = modelId;
  report.profile = {runs: runCount, maxNewTokens, timeoutMs};
  report.promptSha256 = crypto.createHash('sha256').update(prompt).digest('hex');
  report.expectedAnswerCheck = 'EXACT_TRIMMED_TEXT_OR_TOKEN_BOUNDARY_MATCH';

  const status = await request('/v1/status');
  report.serviceStatus = {
    serviceId: status.serviceId,
    active: status.active,
    requestedEnabled: status.requestedEnabled,
    productionReady: status.productionReady,
    dispatchAllowed: status.dispatchAllowed,
    authorization: status.authorization,
    formula: status.formula,
    ldwmd: status.ldwmd,
    continuum: status.continuum,
    veritas: status.veritas,
    inference: status.inference ? {
      status: status.inference.status,
      modelInference: status.inference.modelInference,
      gpuVerified: status.inference.gpuVerified,
      receiptId: status.inference.receiptId,
      reason: status.inference.reason
    } : null
  };

  const capabilities = await request('/v1/capabilities');
  requireValue(capabilities?.schema === 'leeway.gpu.inference.v1' && capabilities.serviceId === 'leeway.gpu.service',
    'GPU_CAPABILITY_IDENTITY_MISMATCH');
  requireValue(capabilities?.gpuVerified === true && capabilities.models?.includes(modelId), 'GPU_MODEL_NOT_QUALIFIED');
  report.capabilities = {
    status: capabilities.status,
    gpuVerified: capabilities.gpuVerified,
    modelInference: capabilities.modelInference,
    models: capabilities.models,
    receiptId: capabilities.receiptId
  };

  requireValue(status?.serviceId === 'leeway.gpu.service' && status?.requestedEnabled === true &&
    status?.active === true && status?.inference?.gpuVerified === true &&
    status.inference.receiptId === capabilities.receiptId, 'GPU_SERVICE_NOT_ACTIVE');

  const activation = await request('/v1/models/activate', {method: 'POST', body: {modelId}});
  requireValue(activation?.serviceId === 'leeway.gpu.service' && activation.modelId === modelId &&
    activation.backend === 'LEEWAY_GPU' && activation.activation === 'SELECTED_NO_MODEL_EXECUTION',
    'GPU_MODEL_ACTIVATION_INVALID');

  let benchmarkModelIdentity;
  for (let index = 0; index < runCount; index += 1) {
    const requestId = `lee-bench-${crypto.randomUUID()}`;
    const started = performance.now();
    report.generationAttempted = true;
    const result = await request('/v1/generate', {method: 'POST', body: {modelId, prompt, requestId, maxNewTokens}});
    const fullRequestMs = performance.now() - started;
    const {evidence, timing} = validateExecution(result, requestId);
    const modelIdentity = Object.fromEntries(['modelSha256', 'tokenizerSha256', 'implementationSha256']
      .map(key => [key, evidence[key]]));
    if (benchmarkModelIdentity && Object.keys(modelIdentity).some(key => modelIdentity[key] !== benchmarkModelIdentity[key]))
      throw Object.assign(new Error('GPU_MODEL_IDENTITY_CHANGED_DURING_BENCHMARK'), {code: 'GPU_MODEL_IDENTITY_CHANGED_DURING_BENCHMARK'});
    benchmarkModelIdentity ??= modelIdentity;
    const exact = result.text.trim() === expectedAnswer;
    const tokenMatch = result.text.split(/[^A-Za-z0-9.+-]+/).includes(expectedAnswer);
    report.runs.push({
      index,
      requestId,
      fullRequestMs,
      modelLoadState: timing.modelLoadState,
      modelLoadMs: timing.modelLoadMs,
      prefillMs: timing.prefillMs,
      modelGraphFirstTokenReadyMs: timing.modelGraphFirstTokenReadyMs,
      clientTimeToFirstTokenMs: timing.clientTimeToFirstTokenMs,
      clientTimeToFirstTokenStatus: timing.clientTimeToFirstTokenStatus,
      decodeMs: timing.decodeMs,
      graphAfterLoadMs: timing.graphAfterLoadMs,
      modelLoadAndGraphMs: timing.modelLoadAndGraphMs,
      promptTokens: timing.promptTokens,
      visibleOutputTokens: timing.visibleOutputTokens,
      decodeModelSteps: timing.decodeModelSteps,
      decodeTokensPerSecond: timing.decodeTokensPerSecond,
      exactExpectedAnswer: exact,
      expectedAnswerObserved: exact || tokenMatch,
      responseText: result.text,
      sourceAndAuditHashes: Object.fromEntries(Object.entries(evidence).filter(([key]) => digestPattern.test(evidence[key]))),
      tokenTimingCount: Array.isArray(timing.tokenTimings) ? timing.tokenTimings.length : null
    });
  }

  const measured = report.runs;
  report.performance = {
    fullRequestMs: summary(measured.map(run => run.fullRequestMs)),
    modelLoadAndGraphMs: summary(measured.map(run => run.modelLoadAndGraphMs)),
    graphAfterLoadMs: summary(measured.map(run => run.graphAfterLoadMs)),
    prefillMs: summary(measured.map(run => run.prefillMs).filter(Number.isFinite)),
    decodeMs: summary(measured.map(run => run.decodeMs).filter(Number.isFinite)),
    decodeTokensPerSecond: summary(measured.map(run => run.decodeTokensPerSecond).filter(Number.isFinite)),
    coldLoadRuns: measured.filter(run => run.modelLoadState === 'COLD_LOAD').length,
    warmCachedRuns: measured.filter(run => run.modelLoadState === 'WARM_CACHED').length,
    clientTimeToFirstToken: 'NOT_MEASURED_BY_NON_STREAMING_SERVICE_RESPONSE'
  };
  report.correctness = {
    passed: measured.filter(run => run.expectedAnswerObserved).length,
    total: measured.length,
    allPassed: measured.every(run => run.expectedAnswerObserved),
    modelIdentity: benchmarkModelIdentity
  };
  report.outcome = report.correctness.allPassed ? 'LEEWAY_GOVERNED_PERFORMANCE_RECORDED' : 'OUTPUT_CORRECTNESS_GATE_FAILED';
} catch (error) {
  report.outcome = report.generationAttempted ? 'FAILED_OR_BLOCKED' : 'BLOCKED_BEFORE_INFERENCE';
  report.error = {code: error?.code || error?.message || 'UNKNOWN_ERROR', status: error?.status ?? null};
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  if (typeof evidenceDir === 'string' && evidenceDir.length > 0) {
    const target = path.resolve(evidenceDir);
    fs.mkdirSync(target, {recursive: true});
    const output = path.join(target, 'governed-performance.json');
    report.evidencePath = output;
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  }
  console.log(JSON.stringify({outcome: report.outcome, modelId: report.modelId ?? null,
    runs: report.runs.length, correctness: report.correctness ?? null,
    evidencePath: report.evidencePath ?? null, error: report.error ?? null}, null, 2));
  if (report.outcome !== 'LEEWAY_GOVERNED_PERFORMANCE_RECORDED') process.exitCode = 1;
}
