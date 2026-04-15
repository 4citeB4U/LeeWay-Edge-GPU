/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.EXECUTION
TAG: CORE.CYCLE.CONTRACT
5WH: 
  WHAT = Centralized Execution Cycle Contract
  WHY = Enforces governance, traceability, and replayability for all agent actions
  WHO = Agent Lee (Sovereign Architect)
  HOW = Hardened state machine for Perception -> Plan -> Action -> Eval
*/

import crypto from 'crypto';

/**
 * ExecutionCycle defines the non-negotiable lifecycle of any intent.
 */
export class ExecutionCycle {
  constructor(intent) {
    this.id = crypto.randomUUID();
    this.intent = intent;
    this.ts = Date.now();
    
    this.perception = {
      raw: intent,
      classifiedIntent: null,
      context: {}
    };

    this.plan = {
      steps: [],
      prediction: {
        expectedOutcome: '',
        risks: [],
        confidence: 0
      }
    };

    this.actions = []; // { id, type, payload, status: 'pending'|'executed'|'failed' }
    this.evaluations = []; // { accuracy, safety, relevance, reasoning }
    this.memoryTransactions = []; // { key, value, type: 'commit'|'rollback' }
    
    this.status = 'pending'; // pending | executing | validated | failed
    this.logs = [];
    this.response = ''; // Final user-facing output
  }

  log(msg) {
    this.logs.push(`[${new Date().toISOString()}] ${msg}`);
  }

  isAuthorized() {
    // Safety Gate logic: Check for destructive actions
    const hasDestructive = this.plan.steps.some(s => s.isDestructive);
    const hasHighRisk = this.plan.prediction.risks.length > 0;
    return !(hasDestructive && hasHighRisk);
  }
}

/**
 * MemoryTransaction ensures state changes are only committed after validation.
 */
export class MemoryBlock {
  constructor(summary, importance = 1) {
    this.id = crypto.randomUUID();
    this.summary = summary;
    this.importance = importance;
    this.decayScore = 1.0;
    this.ts = Date.now();
  }
}
