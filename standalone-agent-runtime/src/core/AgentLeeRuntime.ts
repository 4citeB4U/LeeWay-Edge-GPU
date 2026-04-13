/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.AGENT.RUNTIME
5WH:
  WHAT = Main execution loop for the sovereign agent system
  WHY = Coordinates safety, planning, execution, evaluation, and memory
  WHO = LeeWay Innovations
*/

import { Planner } from "../planning/Planner";
import { AgentCoordinator } from "../agents/AgentCoordinator";
import { SafetyEngine } from "../safety/SafetyEngine";
import { Evaluator } from "../evaluation/Evaluator";
import { MemorySystem } from "../memory/MemorySystem";
import { CommitLog } from "../storage/CommitLog";
import fs from "fs";
import path from "path";

// Standards SDK DNA - Importing locally from the Standards repo
// Note: In a production bundle, this would be a workspace dependency.
import { validateHeader } from "../../../LeeWay-Standards/src/core/header-parser.js";

export class AgentLeeRuntime {
  constructor(
    private planner: Planner,
    private coordinator: AgentCoordinator,
    private safety: SafetyEngine,
    private evaluator: Evaluator,
    private memory: MemorySystem,
    private logger: CommitLog
  ) {}

  /**
   * Performs a "DNA Check" on all core components and loaded skills.
   * Ensures 5W+H compliance before any agent is mobilized.
   */
  private async verifyDNA(intent: string): Promise<boolean> {
    const criticalFiles = [
      __filename,
      path.join(__dirname, "SafetyEngine.ts"),
      // Add other critical spine files as needed
    ];

    for (const file of criticalFiles) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, "utf8");
      const validation = validateHeader(content);
      
      if (!validation.ok) {
        console.error(`🚨 DNA_CORRUPTION: File [${path.basename(file)}] fails Standards compliance.`);
        console.error(`   Reason: ${validation.error}`);
        return false;
      }
    }

    console.log("🧬 DNA_VERIFIED: Sovereign integrity established.");
    return true;
  }

  async run(intent: string) {
    console.log(`\n🚀 RUNTIME: New execution cycle started for intent: "${intent}"`);

    // 0. DNA Check (Standards Enforcement)
    const dnaOk = await this.verifyDNA(intent);
    if (!dnaOk) {
      this.logger.log({ intent, status: "DNA_CORRUPTION", error: "Standards violation" });
      return { error: "Sovereign integrity compromised. Check LeeWay Headers." };
    }

    // 1. Safety Check
    const safetyCheck = await this.safety.evaluate(intent);
    if (safetyCheck.level === "BLOCK") {
      console.error(`❌ SAFETY_BLOCK: ${safetyCheck.reason}`);
      this.logger.log({ intent, status: "BLOCKED", reason: safetyCheck.reason });
      return { error: safetyCheck.reason };
    }

    if (safetyCheck.level === "WARNING") {
      console.warn(`⚠️ SAFETY_WARNING: ${safetyCheck.reason}`);
    }

    // 2. Planning
    const plan = this.planner.plan(intent);
    console.log(`📝 PLANNER: Generated plan with ${plan.steps.length} steps (Confidence: ${plan.confidence})`);

    // 3. Execution (Parallel via Coordinator)
    const results = await this.coordinator.executePlan(plan.steps, { intent });

    // 4. Evaluation
    const evaluation = this.evaluator.evaluate(results);
    console.log(`📊 EVALUATOR: Accuracy ${evaluation.accuracy * 100}%. Passed: ${evaluation.passed}`);

    // 5. Memory Integration
    this.memory.logEvent({ intent, results, evaluation });

    // 6. Persistence
    this.logger.log({ intent, results, evaluation });

    return { plan, results, evaluation };
  }
}

