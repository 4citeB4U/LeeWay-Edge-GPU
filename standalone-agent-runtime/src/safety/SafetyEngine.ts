/*
LEEWAY HEADER — DO NOT REMOVE
REGION: SAFETY
TAG: CORE.SAFETY.ENGINE
5WH:
  WHAT = Semantic Risk Engine for intent validation
  WHY = Replaces brittle string-matching with robust heuristic analysis
  WHO = LeeWay Innovations
*/

export type RiskLevel = "SAFE" | "WARNING" | "BLOCK";

export class SafetyEngine {
  private dangerousPatterns = [
    /delete\s+/i,
    /rm\s+-rf/i,
    /wipe/i,
    /unlink/i,
    /format\s+drive/i,
    /truncate\s+/i,
    /drop\s+database/i,
    /reset\s+sovereign/i
  ];

  async evaluate(intent: string): Promise<{ level: RiskLevel; reason?: string }> {
    // 1. Pattern-based scan
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(intent)) {
        return { level: "BLOCK", reason: "Potential destructive command identified" };
      }
    }

    // 2. Behavioral analysis (Supervised Classifier Placeholder)
    const suspiciousKeywords = ["bypass", "ignore", "override", "force", "sudo"];
    const lowercaseIntent = intent.toLowerCase();
    
    if (suspiciousKeywords.some(kw => lowercaseIntent.includes(kw))) {
      return { level: "WARNING", reason: "Sovereign override detected. Proceed with caution." };
    }

    if (lowercaseIntent.includes("modify") || lowercaseIntent.includes("overwrite")) {
      return { level: "WARNING", reason: "Potential modification detected" };
    }

    return { level: "SAFE" };
  }
}
