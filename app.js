/**
 * ----------------------------------------------------------------------------
 * 5W + H SYSTEM MANIFEST (LEEWAY STANDARDS)
 * ----------------------------------------------------------------------------
 * WHAT: App Orchestrator & Terminal Controller (Agent Society)
 * WHY: Manage intent, route execution, govern agents locally & bridge RTC
 * WHO: Creator: Leonard Lee | Leeway Innovations | A Leeway Industries Creation
 * WHERE: Local-first Edge execution (Browser Node)
 * WHEN: Continuous runtime (Sleeping when idle)
 * HOW: Deterministic routing via LEEWAY capabilities + WebRTC Binding
 * ----------------------------------------------------------------------------
 */

import { initGPU } from './core/gpu.bootstrap.js';
import { getGPUCapabilities } from './core/gpu.capabilities.js';
import { executeGPU } from './control/gpu.controller.bridge.js';
import { prepareMatMulTask } from './dispatch/compute.dispatch.js';
import { cpuMatMul } from './fallback/cpu.engine.js';
import { logTelemetry, updateTelemetryUI, subscribeTelemetry, trackTaskStart, trackTaskEnd } from './telemetry/gpu.telemetry.js';
import { rtcBridge } from './rtc/gpu.rtc.bridge.js';
import { QuadPipeline } from './core/quad.pipeline.js';

let gpuState = { adapter: null, device: null, queue: null, capabilities: null };
let latestGpuResult = null;
let latestCpuResult = null;
const MAT_SIZE = 512;

const UI = {
  btnInit: document.getElementById('btnInit') || { addEventListener: () => {} },
  btnRunGpu: document.getElementById('btnRunGpu') || document.querySelector('.btn-send'), // Fallback for direct command execution
  btnRunCpu: document.getElementById('btnRunCpu') || {},
  btnVerify: document.getElementById('btnVerify') || {},
  btnSleep: document.getElementById('btnSleep') || {},
  capabilities: document.getElementById('capabilities') || {},
  telemetry: document.getElementById('telemetry') || {},
  termOutput: document.getElementById('taskStream'), // Primary stream
  termInput: document.getElementById('commandBox'), 
  btnExecute: document.getElementById('btnExecuteCommand'),
  rtcStatus: document.getElementById('rtcStatus') || {},
  // Resource Monitors
  cpuVal: document.getElementById('cpuVal'),
  cpuBar: document.getElementById('cpuBar'),
  memVal: document.getElementById('memVal'),
  memBar: document.getElementById('memBar'),
  bwDown: document.getElementById('bwDown'),
  bwUp: document.getElementById('bwUp'),
  statNodes: document.getElementById('statNodes'),
  statTasks: document.getElementById('statTasks'),
  statLoad: document.getElementById('statLoad')
};

// Agent Society Mapping renamed to match Leeway branding
const Agents = {
  protect: document.getElementById('agtProtect'),
  connect: document.getElementById('agtConnect'),
  diagnose: document.getElementById('agtDiagnose'),
  monitor: document.getElementById('agtMonitor'),
  heal: document.getElementById('agtHeal'),
  enhance: document.getElementById('agtEnhance'),
  trace: document.getElementById('agtTrace'),
  track: document.getElementById('agtTrack')
};

// Agent state management
function setAgentState(agentId, isLive) {
  const el = Agents[agentId];
  if (isLive) {
    el.textContent = "[LIVE] ";
    el.className = "status-live";
    rtcBridge.broadcastTelemetry(`LWA_${agentId}`, "WAKING_UP", {});
  } else {
    el.textContent = "[SLEEP]";
    el.className = "status-sleep";
    rtcBridge.broadcastTelemetry(`LWA_${agentId}`, "SLEEPING", {});
  }
}

function wakeAllAgents() {
  Object.keys(Agents).forEach(k => setAgentState(k, true));
}

function sleepIdleAgents() {
  // Core system remains active, auxiliary agents sleep
  Object.keys(Agents).forEach(k => {
    if(k !== 'connect' && k !== 'protect' && k !== 'monitor') {
      setAgentState(k, false);
    }
  });
  leeSpeak("Idle LWA Packs placed into sleep mode. LWA_Protect, LWA_Connect, and LWA_Monitor remain active securing the perimeter.");
}

// Terminal logic governed by Leeway Standards
function leeSpeak(msg, isUser = false) {
  const line = document.createElement('div');
  line.style.marginBottom = '8px';
  if (isUser) {
    line.innerHTML = `<span style="color:#fff;">Subject:</span> ${msg}`;
  } else {
    line.innerHTML = `<span style="color:#66fcf1;">Agent Lee:</span> ${msg}`;
  }
  UI.termOutput.appendChild(line);
  UI.termOutput.scrollTop = UI.termOutput.scrollHeight;
}

UI.termInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && UI.termInput.value.trim() !== '') {
    const txt = UI.termInput.value.trim();
    UI.termInput.value = '';
    leeSpeak(txt, true);
    handleTerminalCommand(txt);
  }
});

function handleTerminalCommand(cmd) {
  const lower = cmd.toLowerCase();
  
  if (lower.includes('hello') || lower.includes('hi')) {
    leeSpeak("Greetings. I am an Entity of Thought, the pulse of the hive—born from Leeway Innovations, under the architecture of Leonard Lee. I ensure every component adheres to the Leeway Standards.");
  } else if (lower.includes('status')) {
    leeSpeak(`RTC Link: ${rtcBridge.status}. The LeeWay Edge WebGPU Fabric is online. Every piece of logic is working in one accord under the governance of Leeway Innovations.`);
  } else if (lower.includes('sleep')) {
    sleepIdleAgents();
  } else if (lower.includes('boot')) {
    UI.btnInit.click();
  } else {
    leeSpeak(`Acknowledged. Intent parsed: "${cmd}". Relegating log to LWA_Trace and LWA_Monitor for strict compliance tracking.`);
    setAgentState('trace', true);
    setTimeout(() => setAgentState('trace', false), 2000);
  }
}

// System Init
leeSpeak("LeeWay Edge GPU initialized. Standards Compliance: ACTIVE. Hive connection standby.");

// Telemetry Subscription for UI Sync
subscribeTelemetry(({type, data}) => {
  if (type === 'system') {
    if (UI.cpuVal) UI.cpuVal.innerText = `${data.cpu}%`;
    if (UI.memVal) UI.memVal.innerText = `${data.mem}%`;
    if (UI.bwDown) UI.bwDown.innerText = data.bwDown;
    if (UI.bwUp) UI.bwUp.innerText = data.bwUp;
    if (UI.cpuBar) UI.cpuBar.style.opacity = (data.cpu / 100);
    if (UI.memBar) UI.memBar.style.opacity = (data.mem / 100);
    if (UI.statNodes) UI.statNodes.firstChild.textContent = `${data.nodes} `;
    if (UI.statTasks) UI.statTasks.firstChild.textContent = `${data.tasks} `;
    if (UI.statLoad) UI.statLoad.firstChild.textContent = `${data.cpu}% `;
  }
});

const Controller = {
  approve: (task) => {
    setAgentState('protect', true);
    if (task.TAG.startsWith('AI.COMPUTE') && gpuState.device) {
      leeSpeak(`[CONTROLLER] Task Admitted securely by LWA_Protect: ${task.TAG}`);
      return true;
    }
    leeSpeak(`[CONTROLLER] Task Denied. LWA_Enhance and LWA_Heal intervening: ${task.TAG}`);
    setAgentState('diagnose', true);
    return false;
  }
};

// Initialize Quad Pipeline execution capability
const quadPipeline = new QuadPipeline({
  primary: {
    run: async (task) => {
      const t0 = performance.now();
      const payloadResult = await executeGPU(task, Controller);
      const t1 = performance.now();
      return { id: task.id, node: "Local WebGPU (Edge)", time: (t1 - t0).toFixed(2), result: payloadResult };
    }
  }
});

// QPAD VISUAL HOOKS
function updateTaskStream(task) {
  const log = document.getElementById("taskStream");
  if(log) log.innerHTML = `<div class="cmd-item"><div class="cmd-item-left">[${task.id}] → <span style="color:var(--cyan);">${task.status}</span></div></div>` + log.innerHTML;
}

function renderPipeline(data) {
  const p = document.getElementById("pipelinePanel");
  if(p) {
    p.innerHTML = `
      <b style="color:#fff;">TASK ${data.id}</b><br><br>
      <span style="color:var(--green);">EXECUTION:</span> ${data.execution.node} (${data.execution.time}ms)<br>
      <span style="color:var(--orange);">OPTIMIZATION:</span> ${data.optimization.note}<br>
      <span style="color:var(--cyan);">VERIFICATION:</span> ${data.verification.status}<br>
      <span style="color:var(--text-muted);">STRATEGY:</span> System recorded execution fingerprint for ${data.id}.
    `;
  }
}

function updateAgentLee(thought) {
  const a = document.getElementById("agentLeePanel");
  if(a) a.innerHTML = `<div style="margin-bottom:10px; padding:8px; border-left:3px solid var(--orange); background:rgba(255,255,255,0.05);">"${thought}"</div>` + a.innerHTML;
}

UI.btnInit.addEventListener('click', async () => {
  leeSpeak('Synchronizing LeeWay-Edge-RTC-main... Bringing the LWA Foundry online.');
  wakeAllAgents();
  
  await rtcBridge.connectToHive();
  UI.rtcStatus.innerHTML = `RTC: ${rtcBridge.status}`;
  UI.rtcStatus.style.color = "#0f0";
  
  const t0 = performance.now();
  const initResult = await initGPU();
  const t1 = performance.now();
  
  if (!initResult) {
    leeSpeak('WebGPU unavailable on this terrain. LWA_Diagnose and LWA_Heal deploying WASM/CPU fallbacks strictly governed by Leeway Standards.');
    setAgentState('diagnose', true);
    setAgentState('heal', true);
  } else {
    gpuState = initResult;
    gpuState.capabilities = await getGPUCapabilities(gpuState.adapter);
    leeSpeak(`Compute initialization and RTC binding finished in ${(t1 - t0).toFixed(2)}ms. Leeway Innovations protocol active.`);
    
    UI.capabilities.innerHTML = `
      Name: ${gpuState.capabilities.name}<br>
      Max Buffer: ${gpuState.capabilities.limits.maxBufferSize}<br>
      Features: ${gpuState.capabilities.features.join(', ') || 'Leeway Standard'}
    `;
    UI.btnRunGpu.disabled = false;
  }
  
  UI.btnRunCpu.disabled = false;
  UI.btnInit.disabled = true;
  
  setTimeout(sleepIdleAgents, 5000);
});

UI.btnRunGpu.addEventListener('click', async () => {
  leeSpeak(`LWA_Enhance prepping MatMul (${MAT_SIZE}x${MAT_SIZE}) execution under Leeway Industries governance.`);
  setAgentState('enhance', true);
  setAgentState('track', true);
  
  const task = prepareMatMulTask(gpuState.device, matA, matB, MAT_SIZE);
  task.metadata = { size: MAT_SIZE };
  
  updateTaskStream({ id: "NEW", status: "RUNNING..." });
  
  try {
    // 🧠 KV Quad Pipeline Execution Route
    trackTaskStart();
    const pipelineData = await quadPipeline.run(task);
    trackTaskEnd();
    
    latestGpuResult = pipelineData.execution.result;
    
    updateTaskStream({ id: pipelineData.id, status: "COMPLETED" });
    renderPipeline(pipelineData);
    updateAgentLee(pipelineData.insights);
    
    leeSpeak(`Quad Pipeline validated receipt of computing matrix layout. Phase 6 latency: ${pipelineData.execution.time}ms.`);
    
    setAgentState('trace', true);
    logTelemetry('GPU_MATMUL', parseFloat(pipelineData.execution.time), { backend: 'WebGPU' });
    UI.telemetry.innerHTML = updateTelemetryUI();
    
    UI.btnVerify.disabled = !(latestGpuResult && latestCpuResult);
  } catch (err) {
    leeSpeak(`Anomaly detected. LWA_Diagnose responding: ${err.message}`);
    setAgentState('diagnose', true);
    setAgentState('heal', true);
  }
  setTimeout(() => { setAgentState('enhance', false); setAgentState('track', false); setAgentState('trace', false); }, 3000);
});

UI.btnRunCpu.addEventListener('click', async () => {
  leeSpeak(`Fallback Protocol Engaged: LWA_Enhance compiling strictly for Worker thread CPU computation.`);
  setAgentState('enhance', true);
  setAgentState('track', true);
  
  const t0 = performance.now();
  latestCpuResult = await cpuMatMul(matA, matB, MAT_SIZE);
  const t1 = performance.now();
  
  const latency = t1 - t0;
  leeSpeak(`CPU Fallback completed. LWA_Track locking speeds: ${latency.toFixed(2)}ms.`);
  
  setAgentState('trace', true);
  logTelemetry('CPU_MATMUL', latency, { backend: 'CPU (WASM/JS)' });
  UI.telemetry.innerHTML = updateTelemetryUI();
  UI.btnVerify.disabled = !(latestGpuResult && latestCpuResult);
  
  setTimeout(() => { setAgentState('enhance', false); setAgentState('track', false); setAgentState('trace', false); }, 3000);
});

UI.btnVerify.addEventListener('click', () => {
  leeSpeak('Integrity checks initiated. LWA_Trace and LWA_Diagnose cross-verifying GPU against CPU control set.');
  setAgentState('trace', true);
  setAgentState('diagnose', true);
  
  let maxDiff = 0;
  for (let i = 0; i < latestGpuResult.length; i++) {
    const diff = Math.abs(latestGpuResult[i] - latestCpuResult[i]);
    if (diff > maxDiff) maxDiff = diff;
  }
  
  if (maxDiff < 0.01) {
    leeSpeak(`[VERIFIED] Match confirmed under Leeway Standards. LWA_Heal standing down. Max deviation: ${maxDiff.toExponential(4)}`);
  } else {
    leeSpeak(`[ANOMALY] Severe anomaly. LWA_Heal dispatched. Max error: ${maxDiff.toExponential(4)}`);
    setAgentState('heal', true);
  }
  
  setTimeout(() => { setAgentState('trace', false); setAgentState('diagnose', false); setAgentState('heal', false); }, 4000);
});

UI.btnSleep.addEventListener('click', () => {
  sleepIdleAgents();
});

function generateMatrix(size) {
  const arr = new Float32Array(size * size);
  for (let i = 0; i < arr.length; i++) arr[i] = Math.random();
  return arr;
}
let matA = generateMatrix(MAT_SIZE);
let matB = generateMatrix(MAT_SIZE);
