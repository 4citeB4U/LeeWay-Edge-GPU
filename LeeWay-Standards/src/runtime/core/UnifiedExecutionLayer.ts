/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.UNIFIEDEXECUTIONLAYER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = UnifiedExecutionLayer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\runtime\core\UnifiedExecutionLayer.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { Intent, ExecutionTrace, ValidatorSignature } from '../consensus/ExecutionTrace';
import { HiveConsensus } from '../consensus/HiveConsensus';
import { HiveState } from '../consensus/HiveState';
import { IntentSanitizer } from '../security/IntentSanitizer';

export class UnifiedExecutionLayer {
  private static instance: UnifiedExecutionLayer;

  private constructor() {}

  public static getInstance(): UnifiedExecutionLayer {
    if (!UnifiedExecutionLayer.instance) {
      UnifiedExecutionLayer.instance = new UnifiedExecutionLayer();
    }
    return UnifiedExecutionLayer.instance;
  }

  /**
   * Primary entry point for executing an intent.
   * Enforces zero-bypass rules and consensus blocks.
   */
  public async execute(rawIntent: any, owner: string): Promise<any> {
    const state = HiveState.getInstance();
    const cleanIntent = IntentSanitizer.sanitize(rawIntent);

    // Deep clone state snapshot for potential rollback
    const stateSnapshot = JSON.parse(JSON.stringify(state.getSnapshot()));

    try {
      // Obtain Consensus Votes
      const validators: ValidatorSignature[] = await HiveConsensus.vote(cleanIntent);

      // Construct Execution Trace
      const trace = new ExecutionTrace({
        traceId: `TRACE-${Date.now()}`,
        intent: cleanIntent,
        owner,
        validators
      });

      // Verify Consensus
      if (!trace.isFullyValidated) {
        throw new Error(`Consensus failed for Intent ${cleanIntent.id}. Rejecting execution.`);
      }

      // Proceed with authorized execution mutations
      const result = await this.performMutation(cleanIntent);
      
      // Metrics dispatch could be done here
      console.log(`[UnifiedExecutionLayer] Intent ${cleanIntent.id} successfully executed.`);
      return result;

    } catch (error) {
      console.error(`[UnifiedExecutionLayer] Execution failed. Rolling back state.`, error);
      // Rollback via deep-cloned snapshot
      state.restoreSnapshot(stateSnapshot);
      throw error;
    }
  }

  /**
   * The actual action dispatcher that mutates state.
   */
  private async performMutation(intent: Intent): Promise<any> {
    const state = HiveState.getInstance();
    switch (intent.action) {
      case 'UPDATE_THREAT_LEVEL':
        state.updateGlobalContext({ activeThreatLevel: intent.payload.level });
        return { success: true, updatedThreatLevel: intent.payload.level };
      case 'REGISTER_TASK':
        state.registerTask({
          taskId: intent.payload.taskId || `TASK-${Date.now()}`,
          intentId: intent.id,
          status: 'PENDING'
        });
        return { success: true };
      default:
        // No-Op for unknown actions
        return { success: false, reason: 'unrecognized action' };
    }
  }
}
