/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PERCEPTIONBUS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = PerceptionBus module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\runtime\core\PerceptionBus.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { UnifiedExecutionLayer } from './UnifiedExecutionLayer';

export class PerceptionBus {
  private static instance: PerceptionBus;
  private isProcessing: boolean = false;
  private queue: Array<{rawIntent: any, owner: string}> = [];

  private constructor() {}

  public static getInstance(): PerceptionBus {
    if (!PerceptionBus.instance) {
      PerceptionBus.instance = new PerceptionBus();
    }
    return PerceptionBus.instance;
  }

  /**
   * Intakes an intent and adds it to the synchronous processing queue.
   */
  public push(rawIntent: any, owner: string = 'SYSTEM'): void {
    const timestampedIntent = {
      ...rawIntent,
      timestamp: rawIntent.timestamp || Date.now()
    };
    this.queue.push({ rawIntent: timestampedIntent, owner });
    this.processQueue();
  }

  /**
   * Serializes environment interaction deterministically.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const item = this.queue.shift();

    if (item) {
      try {
        await UnifiedExecutionLayer.getInstance().execute(item.rawIntent, item.owner);
      } catch (error) {
        console.error(`[PerceptionBus] Intent processing failed for owner ${item.owner}.`, error);
      }
    }

    this.isProcessing = false;
    
    // Process next item recursively
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }
}
