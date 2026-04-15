/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SOVEREIGNRUNTIME.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SovereignRuntime module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\runtime\core\SovereignRuntime.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { PerceptionBus } from './PerceptionBus';

export class SovereignRuntime {
  private selfAwarenessInterval: NodeJS.Timeout | null = null;
  private heartbeatFrequency: number = 1000; // Base frequency (ms)

  /**
   * Initializes the Brainstem. Must be called with LEEWAY_RUNTIME globally available.
   */
  public initialize(): void {
    if (!(global as any).LEEWAY_RUNTIME) {
      throw new Error('SYSTEM COLLAPSE: LEEWAY_RUNTIME global hook is missing. Sovereign execution halted.');
    }

    console.log('[SovereignRuntime] Brainstem Initialized. Commencing strict runtime guard.');

    // Device-Agnostic Adaptive Performance Scaling
    this.tunePerformance();

    // Start background auditing self-awareness loop with dynamic frequency
    this.selfAwarenessInterval = setInterval(() => {
      this.audit();
    }, this.heartbeatFrequency);
  }

  /**
   * Adaptive Performance Scaling: 
   * Tunes system frequency based on device capabilities (CPU/Env)
   */
  private tunePerformance(): void {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );

    if (isMobile) {
      this.heartbeatFrequency = 2000; // Power-saving / High efficiency for mobile
      console.log('[SovereignRuntime] Optimized for Mobile: Low-Energy Heartbeat engaged.');
    } else {
      this.heartbeatFrequency = 500; // High performance for Desktop/Servers
      console.log('[SovereignRuntime] Optimized for High Performance: 500ms Aggressive Heartbeat engaged.');
    }
  }

  /**
   * Stops the SovereignRuntime loop (for graceful shutdowns).
   */
  public shutdown(): void {
    if (this.selfAwarenessInterval) {
      clearInterval(this.selfAwarenessInterval);
      this.selfAwarenessInterval = null;
    }
    console.log('[SovereignRuntime] Brainstem Shutdown completed.');
  }

  private audit(): void {
    // Perform internal system audit
    // Let PerceptionBus process background system health tick
    PerceptionBus.getInstance().push({
      id: `SYS-TICK-${Date.now()}`,
      action: 'SYSTEM_AUDIT_TICK',
      timestamp: Date.now()
    }, 'SYSTEM_HEALTH_MONITOR');
  }
}
