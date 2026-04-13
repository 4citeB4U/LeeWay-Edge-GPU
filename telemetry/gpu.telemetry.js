/**
 * ----------------------------------------------------------------------------
 * 5W + H SYSTEM MANIFEST (LEEWAY STANDARDS)
 * ----------------------------------------------------------------------------
 * WHAT: LEEWAY Real-Time Telemetry Engine
 * WHY: Drives the deterministic visual feedback loop for LeeWay Edge GPU
 * WHO: Creator: Leonard Lee | Leeway Innovations
 * WHERE: L8_TelemetryLayer 
 * WHEN: Continuous Sampling
 * HOW: Hooks performance.memory and local execution metrics
 * ----------------------------------------------------------------------------
 */

const logs = [];
const MAX_LOGS = 500;
const observers = [];

export function logTelemetry(action, latencyMs, meta = {}) {
  const entry = {
    action,
    latencyMs,
    meta,
    timestamp: Date.now()
  };
  logs.push(entry);
  
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  
  notifyObservers('action', entry);
}

export function subscribeTelemetry(callback) {
  observers.push(callback);
}

function notifyObservers(type, data) {
  observers.forEach(cb => cb({ type, data }));
}

export function updateTelemetryUI() {
  if (logs.length === 0) return "No data.";
  const latest = logs[logs.length - 1];
  return `Action: ${latest.action} | Latency: ${latest.latencyMs.toFixed(2)}ms | Backend: ${latest.meta.backend}`;
}

// System Load Simulation & Real Memory Observation
let activeTasks = 0;
export function trackTaskStart() { activeTasks++; }
export function trackTaskEnd() { activeTasks--; }

setInterval(() => {
  const mem = performance.memory ? (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100 : 45 + Math.random() * 5;
  const cpuBase = activeTasks > 0 ? 60 : 12;
  const cpuLoad = cpuBase + Math.random() * 10;
  
  notifyObservers('system', {
    cpu: cpuLoad.toFixed(1),
    mem: mem.toFixed(1),
    nodes: 128,
    tasks: 56 + activeTasks,
    bwDown: (1.2 + Math.random() * 0.5).toFixed(2),
    bwUp: (2.4 + Math.random() * 0.2).toFixed(2)
  });
}, 1000);
