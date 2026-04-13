import crypto from "crypto";
import { GovernanceGate } from "../core/GovernanceGate";

export type SkillExecutionStatus =
  | "pending"
  | "running"
  | "validated"
  | "failed"
  | "rolled_back";

export type SkillStepResult = {
  stepId: string;
  ok: boolean;
  data?: any;
  error?: string;
  startedAt: number;
  endedAt: number;
};

export type SkillStep = {
  id: string;
  action: string;
  args?: Record<string, any>;
  validate?: string[];
  retryable?: boolean;
};

export type SkillDefinition = {
  id: string;
  version: string;
  purpose: string;
  requires?: string[];
  preconditions?: string[];
  workflow: SkillStep[];
  outputs?: string[];
};

export type SkillExecutionRecord = {
  executionId: string;
  skillId: string;
  input: Record<string, any>;
  status: SkillExecutionStatus;
  stepResults: SkillStepResult[];
  startedAt: number;
  endedAt?: number;
  finalOutput?: any;
  failureReason?: string;
};

export interface AdapterRegistry {
  get(name: string): any;
}

export interface AuditLogger {
  write(record: SkillExecutionRecord): Promise<void>;
}

export interface MemoryStore {
  storeExecution(record: SkillExecutionRecord): Promise<void>;
}

export interface EnvironmentInspector {
  hasRequirement(req: string): Promise<boolean>;
  evaluateCondition(cond: string, input: any): Promise<boolean>;
  validateRule(rule: string, data: any, input: any): Promise<boolean>;
}

export type ExecutionContext = {
  adapters: AdapterRegistry;
  logger: AuditLogger;
  memory: MemoryStore;
  env: EnvironmentInspector;
};

export class SkillExecutionEngine {
  constructor(private ctx: ExecutionContext) {}

  async run(
    skill: SkillDefinition,
    input: Record<string, any>
  ): Promise<SkillExecutionRecord> {
    // 1. Enforce Resilience Protocols
    GovernanceGate.verifyArchitecturalIntegrity();
    
    const tier = GovernanceGate.getAccessTier();
    const activeAgents = GovernanceGate.filterAgents([skill.id]); // Check if this skill is allowed

    if (tier === 'DEGRADED_PILOT' && activeAgents.length === 0) {
      throw new Error("ACCESS_DENIED: Skill restricted under current DEGRADED_PILOT tier. Fresh Permission Gate required.");
    }

    const record: SkillExecutionRecord = {
      executionId: crypto.randomUUID(),
      skillId: skill.id,
      input,
      status: "running",
      stepResults: [],
      startedAt: Date.now(),
    };

    try {
      await this.checkRequirements(skill);
      await this.checkPreconditions(skill, input);

      for (const step of skill.workflow) {
        const result = await this.runStep(step, input);
        record.stepResults.push(result);

        if (!result.ok) {
          if (step.retryable) {
            const retry = await this.runStep(step, input);
            record.stepResults.push(retry);
            if (!retry.ok) {
              throw new Error(retry.error || `Step failed: ${step.id}`);
            }
          } else {
            throw new Error(result.error || `Step failed: ${step.id}`);
          }
        }
      }

      record.status = "validated";
      record.finalOutput = this.buildOutput(record);
      record.endedAt = Date.now();

      await this.ctx.logger.write(record);
      await this.ctx.memory.storeExecution(record);

      return record;
    } catch (err: any) {
      record.status = "failed";
      record.failureReason = err.message;
      record.endedAt = Date.now();
      await this.ctx.logger.write(record);
      return record;
    }
  }

  private async checkRequirements(skill: SkillDefinition) {
    for (const req of skill.requires || []) {
      const ok = await this.ctx.env.hasRequirement(req);
      if (!ok) throw new Error(`Missing requirement: ${req}`);
    }
  }

  private async checkPreconditions(skill: SkillDefinition, input: any) {
    for (const cond of skill.preconditions || []) {
      const ok = await this.ctx.env.evaluateCondition(cond, input);
      if (!ok) throw new Error(`Precondition failed: ${cond}`);
    }
  }

  private async runStep(
    step: SkillStep,
    input: Record<string, any>
  ): Promise<SkillStepResult> {
    const startedAt = Date.now();
    try {
      const [adapterName, methodName] = step.action.split(".");
      const adapter = this.ctx.adapters.get(adapterName);
      if (!adapter) throw new Error(`Adapter not found: ${adapterName}`);

      const method = adapter[methodName];
      if (typeof method !== "function") {
        throw new Error(`Method not found: ${step.action}`);
      }

      const data = await method.call(adapter, {
        input,
        args: step.args || {},
      });

      if (step.validate?.length) {
        for (const rule of step.validate) {
          const ok = await this.ctx.env.validateRule(rule, data, input);
          if (!ok) throw new Error(`Validation failed: ${rule}`);
        }
      }

      return {
        stepId: step.id,
        ok: true,
        data,
        startedAt,
        endedAt: Date.now(),
      };
    } catch (err: any) {
      return {
        stepId: step.id,
        ok: false,
        error: err.message,
        startedAt,
        endedAt: Date.now(),
      };
    }
  }

  private buildOutput(record: SkillExecutionRecord) {
    return {
      skillId: record.skillId,
      successfulSteps: record.stepResults.filter((s) => s.ok).length,
      failedSteps: record.stepResults.filter((s) => !s.ok).length,
      lastStep: record.stepResults.at(-1)?.stepId ?? null,
    };
  }
}
