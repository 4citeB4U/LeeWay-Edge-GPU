/*
LEEWAY HEADER — DO NOT REMOVE
REGION: PLANNING
TAG: CORE.PLANNER
5WH:
  WHAT = Task decomposition and planning engine
  WHY = Breaks high-level intents into executable skill sequences
  WHO = LeeWay Innovations
*/

export interface Plan {
  steps: string[];
  confidence: number;
}

export class Planner {
  plan(intent: string): Plan {
    const lowercaseIntent = intent.toLowerCase();

    if (lowercaseIntent.includes("email")) {
      return {
        steps: [
          "email.detect",
          "email.draft",
          "email.send"
        ],
        confidence: 0.87
      };
    }

    if (lowercaseIntent.includes("call")) {
      return {
        steps: [
          "call.detect",
          "call.answer",
          "call.log"
        ],
        confidence: 0.91
      };
    }

    if (lowercaseIntent.includes("status") || lowercaseIntent.includes("report")) {
      return {
        steps: ["general.status", "general.report"],
        confidence: 0.85
      };
    }

    return {
      steps: ["general.respond"],
      confidence: 0.5
    };
  }
}
