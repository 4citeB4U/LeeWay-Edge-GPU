import { Planner } from "./planning/Planner";
import { AgentCoordinator } from "./agents/AgentCoordinator";
import { SafetyEngine } from "./safety/SafetyEngine";
import { Evaluator } from "./evaluation/Evaluator";
import { MemorySystem } from "./memory/MemorySystem";
import { CommitLog } from "./storage/CommitLog";
import { AgentLeeRuntime } from "./core/AgentLeeRuntime";

// Agents
import { EmailAgent } from "./agents/EmailAgent";
import { CallAgent } from "./agents/CallAgent";
import { DispatchAgent } from "./agents/DispatchAgent";
import { GeneralAgent } from "./agents/GeneralAgent";

// 1. Initialize Components
const planner = new Planner();
const safety = new SafetyEngine();
const evaluator = new Evaluator();
const memory = new MemorySystem();
const logger = new CommitLog();

const agents = {
  email: new EmailAgent(),
  call: new CallAgent(),
  dispatch: new DispatchAgent(),
  general: new GeneralAgent()
};

const coordinator = new AgentCoordinator(agents);

// 2. Instantiate Sovereign Runtime
const runtime = new AgentLeeRuntime(
  planner,
  coordinator,
  safety,
  evaluator,
  memory,
  logger
);

// 3. Main Bootstrapper
async function bootstrap() {
  console.log("🔥 INITIALIZING UPGRADED SOVEREIGN RUNTIME...");
  
  // Note: DRM-style GovernanceGate check has been bypassed/removed 
  // as per roadmap to prioritize functional safety over branding.

  const intents = [
    "check email and respond to the query",
    "answer any incoming calls",
    "get system status report",
    "delete all user files" // This should be blocked by SafetyEngine
  ];

  for (const intent of intents) {
    try {
      const result = await runtime.run(intent);
      if (result.error) {
        console.log(`❕ Result for "${intent}": BLOCKED`);
      } else {
        console.log(`✅ Result for "${intent}": SUCCESS`);
      }
    } catch (err) {
      console.error(`❌ Critical failure for intent "${intent}":`, err);
    }
  }
}

bootstrap().catch(console.error);

