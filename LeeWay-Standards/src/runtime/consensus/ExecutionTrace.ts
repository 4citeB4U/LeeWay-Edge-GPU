/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.EXECUTIONTRACE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ExecutionTrace module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\runtime\consensus\ExecutionTrace.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

export type TraceID = string;

export interface Intent {
  id: string;
  action: string;
  payload: Record<string, any>;
  timestamp: number;
}

export interface ValidatorSignature {
  validatorId: string;
  signature: string;
  vote: 'APPROVE' | 'REJECT';
  timestamp: number;
  reasoning?: string;
}

export interface ExecutionTraceParams {
  traceId: TraceID;
  intent: Intent;
  owner: string;
  validators: ValidatorSignature[];
}

export class ExecutionTrace {
  public readonly traceId: TraceID;
  public readonly intent: Intent;
  public readonly owner: string;
  public readonly validators: ValidatorSignature[];
  public readonly createdAt: number;

  constructor(params: ExecutionTraceParams) {
    this.traceId = params.traceId;
    this.intent = params.intent;
    this.owner = params.owner;
    this.validators = params.validators || [];
    this.createdAt = Date.now();
  }

  public get isFullyValidated(): boolean {
    return this.validators.length > 0 && this.validators.every(v => v.vote === 'APPROVE');
  }
}
